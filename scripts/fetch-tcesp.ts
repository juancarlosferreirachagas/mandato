#!/usr/bin/env tsx
/**
 * MANDATO — Sincroniza as despesas PAGAS de Guarulhos (TCE-SP) com o Supabase.
 *
 * Fonte oficial: API de Dados Abertos do TCE-SP
 *   https://transparencia.tce.sp.gov.br/apis
 *   GET https://transparencia.tce.sp.gov.br/api/json/despesas/{municipio}/{exercicio}/{mes}
 *
 * A API devolve todos os eventos da despesa (Empenhado, Valor Liquidado, Valor Pago,
 * Reforço, Anulação). Este script guarda apenas "Valor Pago" — é o dinheiro que de
 * fato saiu do caixa — na tabela public.despesas_guarulhos, via upsert idempotente
 * (coluna chave_origem). Rodar várias vezes não duplica nada.
 *
 * Uso:
 *   npm run sync:tcesp                          # últimos 3 meses com dados publicados
 *   npm run sync:tcesp -- --meses=6             # últimos 6 meses com dados
 *   npm run sync:tcesp -- --ano=2025 --mes=3    # um mês específico
 *   npm run sync:tcesp -- --ano=2025            # o ano inteiro
 *   npm run sync:tcesp -- --dry-run             # baixa e trata, mas não grava no banco
 *   npm run sync:tcesp -- --dry-run --out=data/guarulhos.json   # salva o JSON tratado
 *
 * Variáveis de ambiente (lidas de .env.import, .env.local e .env, nesta ordem):
 *   SUPABASE_URL               (ou VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY  obrigatória para gravar (a anon key é bloqueada pela RLS)
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------
for (const file of ['.env.import', '.env.local', '.env']) loadEnv({ path: file, quiet: true });

const API_BASE = 'https://transparencia.tce.sp.gov.br/api/json';
const MUNICIPIO = 'guarulhos';
const TABELA = 'despesas_guarulhos';
const TIMEOUT_MS = 180_000;    // um mês de Guarulhos tem ~2 MB / ~7 mil linhas
const MAX_TENTATIVAS = 4;
const LOTE_UPSERT = 500;
const MAX_MESES_RETROATIVOS = 18; // o TCE-SP publica com atraso; procuramos até 18 meses para trás

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
/** Linha crua como vem da API do TCE-SP (todos os campos são string). */
interface TcespDespesa {
  orgao: string;
  mes: string;
  evento: string;
  nr_empenho: string;
  id_fornecedor: string;
  nm_fornecedor: string;
  dt_emissao_despesa: string; // dd/mm/aaaa
  vl_despesa: string;         // "14000,00" ou "5.294,16"
}

/** Linha pronta para public.despesas_guarulhos. */
interface DespesaRow {
  orgao: string;
  credor: string;
  cnpj_credor: string | null;
  valor_pago: number;
  data_pagamento: string; // ISO yyyy-mm-dd
  descricao: string;
  chave_origem: string;
  tipo_credor: 'PJ' | 'PF' | 'OUTRO';
  nr_empenho: string | null;
  exercicio: number;
  mes: number;
  fonte_url: string;
}

interface Periodo { ano: number; mes: number }

class TcespApiError extends Error {
  constructor(message: string, readonly status?: number, readonly url?: string) {
    super(message);
    this.name = 'TcespApiError';
  }
}

// ---------------------------------------------------------------------------
// Argumentos de linha de comando
// ---------------------------------------------------------------------------
function lerArgs() {
  const arg = (nome: string) =>
    process.argv.find((a) => a.startsWith(`--${nome}=`))?.split('=')[1];
  const num = (nome: string) => {
    const v = arg(nome);
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error(`--${nome} precisa ser um número inteiro (recebido: ${v})`);
    return n;
  };

  const ano = num('ano');
  const mes = num('mes');
  const meses = num('meses') ?? 3;
  if (mes !== undefined && (mes < 1 || mes > 12)) throw new Error('--mes deve estar entre 1 e 12');
  if (mes !== undefined && ano === undefined) throw new Error('--mes exige --ano');
  if (meses < 1 || meses > 36) throw new Error('--meses deve estar entre 1 e 36');

  return {
    ano, mes, meses,
    dryRun: process.argv.includes('--dry-run'),
    out: arg('out'),
  };
}

// ---------------------------------------------------------------------------
// Acesso à API do TCE-SP (fetch nativo com timeout + retentativas)
// ---------------------------------------------------------------------------
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function urlDespesas({ ano, mes }: Periodo) {
  return `${API_BASE}/despesas/${MUNICIPIO}/${ano}/${mes}`;
}

async function buscarJson(url: string): Promise<unknown> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'MANDATO-sync/1.0 (+https://mandato-flax.vercel.app)' },
        signal: ctrl.signal,
      });

      if (res.status === 404) return []; // período sem dados publicados
      if (res.status === 429 || res.status >= 500) {
        throw new TcespApiError(`TCE-SP respondeu ${res.status} ${res.statusText}`, res.status, url);
      }
      if (!res.ok) {
        // 4xx (exceto 404/429) não melhora com retentativa
        const corpo = (await res.text()).slice(0, 200);
        throw Object.assign(new TcespApiError(`TCE-SP respondeu ${res.status}: ${corpo}`, res.status, url), { fatal: true });
      }

      const texto = await res.text();
      if (!texto.trim()) return [];
      try {
        return JSON.parse(texto);
      } catch {
        throw new TcespApiError(`Resposta não é JSON válido (início: ${texto.slice(0, 80)}...)`, res.status, url);
      }
    } catch (err) {
      ultimoErro = err;
      if ((err as { fatal?: boolean }).fatal) throw err;
      const motivo = (err as Error).name === 'AbortError' ? `timeout de ${TIMEOUT_MS / 1000}s` : (err as Error).message;
      if (tentativa < MAX_TENTATIVAS) {
        const espera = 2 ** tentativa * 1000;
        console.warn(`  ! tentativa ${tentativa}/${MAX_TENTATIVAS} falhou (${motivo}); nova tentativa em ${espera / 1000}s`);
        await esperar(espera);
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw new TcespApiError(`Falha após ${MAX_TENTATIVAS} tentativas: ${(ultimoErro as Error)?.message}`, undefined, url);
}

function validarLinhas(dados: unknown, url: string): TcespDespesa[] {
  if (!Array.isArray(dados)) {
    throw new TcespApiError(`Formato inesperado: esperava uma lista, recebi ${typeof dados}`, undefined, url);
  }
  const campos: (keyof TcespDespesa)[] = ['orgao', 'evento', 'nm_fornecedor', 'dt_emissao_despesa', 'vl_despesa'];
  return dados.filter((d): d is TcespDespesa =>
    !!d && typeof d === 'object' && campos.every((c) => typeof (d as Record<string, unknown>)[c] === 'string'));
}

// ---------------------------------------------------------------------------
// Tratamento dos dados
// ---------------------------------------------------------------------------
const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const limpar = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

/** "5.294,16" -> 5294.16 ; "14000,00" -> 14000 */
function parseValor(v: string): number | null {
  const n = Number(v.trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** "28/01/2025" -> "2025-01-28" */
function parseData(v: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const [, d, mo, a] = m;
  const iso = `${a}-${mo}-${d}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/**
 * "CNPJ - PESSOA JURÍDICA - 02038232000164" -> PJ + CNPJ
 * "PESSOA FÍSICA - 493478"                  -> PF (CPF parcial NÃO é armazenado)
 * outros                                    -> OUTRO
 */
function parseFornecedor(id: string): { tipo: DespesaRow['tipo_credor']; cnpj: string | null } {
  const norm = semAcento(id).toUpperCase();
  if (norm.includes('CNPJ') || norm.includes('JURIDICA')) {
    const digitos = id.replace(/\D/g, '');
    return { tipo: 'PJ', cnpj: digitos.length >= 14 ? digitos.slice(-14) : null };
  }
  if (norm.includes('FISICA')) return { tipo: 'PF', cnpj: null };
  return { tipo: 'OUTRO', cnpj: null };
}

const ehPagamento = (evento: string) => semAcento(evento).toLowerCase().includes('pago');

function transformar(linhas: TcespDespesa[], periodo: Periodo): { rows: DespesaRow[]; descartadas: number } {
  const fonte = urlDespesas(periodo);
  const ocorrencias = new Map<string, number>();
  const rows: DespesaRow[] = [];
  let descartadas = 0;

  for (const l of linhas) {
    if (!ehPagamento(l.evento)) continue;

    const valor = parseValor(l.vl_despesa);
    const data = parseData(l.dt_emissao_despesa);
    const credor = limpar(l.nm_fornecedor);
    const orgao = limpar(l.orgao);
    if (valor === null || !data || !credor || !orgao) { descartadas++; continue; }

    const empenho = limpar(l.nr_empenho) || null;
    const { tipo, cnpj } = parseFornecedor(l.id_fornecedor ?? '');

    // A API não tem ID único por linha. Montamos uma chave determinística com os
    // campos de origem + nº da ocorrência (para pagamentos idênticos no mesmo mês).
    const base = [periodo.ano, periodo.mes, orgao, empenho, limpar(l.id_fornecedor), data, valor.toFixed(2)].join('|');
    const n = (ocorrencias.get(base) ?? 0) + 1;
    ocorrencias.set(base, n);
    const chave = createHash('sha256').update(`${base}|${n}`).digest('hex');

    rows.push({
      orgao,
      credor,
      cnpj_credor: cnpj,
      valor_pago: valor,
      data_pagamento: data,
      // Valores negativos aparecem na fonte como estornos (devolução/cancelamento de pagamento).
      descricao: `${valor < 0 ? 'Estorno de pagamento' : 'Pagamento'}${empenho ? ` do empenho nº ${empenho}` : ''} — ${orgao} (${MESES[periodo.mes - 1]}/${periodo.ano})`,
      chave_origem: chave,
      tipo_credor: tipo,
      nr_empenho: empenho,
      exercicio: periodo.ano,
      mes: periodo.mes,
      fonte_url: fonte,
    });
  }
  return { rows, descartadas };
}

// ---------------------------------------------------------------------------
// Gravação no Supabase
// ---------------------------------------------------------------------------
function criarCliente(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) no .env / .env.import.');
  if (!key) {
    throw new Error(
      'Defina SUPABASE_SERVICE_ROLE_KEY no arquivo .env.import (Supabase > Project Settings > API > service_role).\n' +
      '  A anon key não consegue gravar: a tabela tem RLS de leitura pública e escrita restrita.\n' +
      '  Para só testar a extração, use --dry-run.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function upsert(db: SupabaseClient, rows: DespesaRow[]): Promise<number> {
  let gravadas = 0;
  for (let i = 0; i < rows.length; i += LOTE_UPSERT) {
    const lote = rows.slice(i, i + LOTE_UPSERT);
    const { error } = await db.from(TABELA).upsert(lote, { onConflict: 'chave_origem' });
    if (error) {
      const dica = error.code === '42P01'
        ? ' (a tabela não existe — aplique supabase/migrations/20261008000001_despesas_guarulhos.sql)'
        : error.code === '42501' ? ' (permissão negada — confira se está usando a SERVICE_ROLE_KEY)' : '';
      throw new Error(`Erro no upsert (lote ${i / LOTE_UPSERT + 1}): ${error.message}${dica}`);
    }
    gravadas += lote.length;
  }
  return gravadas;
}

// ---------------------------------------------------------------------------
// Seleção de períodos
// ---------------------------------------------------------------------------
function* mesesParaTras(): Generator<Periodo> {
  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth() + 1;
  for (let i = 0; i < MAX_MESES_RETROATIVOS; i++) {
    yield { ano, mes };
    mes--;
    if (mes === 0) { mes = 12; ano--; }
  }
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
async function processarPeriodo(p: Periodo) {
  const url = urlDespesas(p);
  process.stdout.write(`→ ${MESES[p.mes - 1]}/${p.ano}: baixando... `);
  const inicio = Date.now();
  const brutas = validarLinhas(await buscarJson(url), url);
  const { rows, descartadas } = transformar(brutas, p);
  const total = rows.reduce((s, r) => s + r.valor_pago, 0);
  console.log(`${brutas.length} eventos, ${rows.length} pagamentos (${brl(total)})` +
    `${descartadas ? `, ${descartadas} descartados por dados inválidos` : ''} em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
  return rows;
}

async function main() {
  const args = lerArgs();
  const db = args.dryRun ? null : criarCliente();
  console.log(`MANDATO · sincronização TCE-SP → ${TABELA}${args.dryRun ? ' (dry-run, nada será gravado)' : ''}\n`);

  const todas: DespesaRow[] = [];
  let gravadas = 0;
  const falhas: string[] = [];

  const executar = async (p: Periodo) => {
    try {
      const rows = await processarPeriodo(p);
      todas.push(...rows);
      if (db && rows.length) gravadas += await upsert(db, rows);
      return rows.length;
    } catch (err) {
      const msg = `${MESES[p.mes - 1]}/${p.ano}: ${(err as Error).message}`;
      console.error(`\n  ✗ ${msg}`);
      falhas.push(msg);
      // Erro de banco não é transitório: interrompe tudo.
      if (!(err instanceof TcespApiError)) throw err;
      return 0;
    }
  };

  if (args.ano !== undefined && args.mes !== undefined) {
    await executar({ ano: args.ano, mes: args.mes });
  } else if (args.ano !== undefined) {
    for (let mes = 1; mes <= 12; mes++) await executar({ ano: args.ano, mes });
  } else {
    // "Recentes": os N meses mais novos que já têm dados publicados.
    let comDados = 0;
    for (const p of mesesParaTras()) {
      if ((await executar(p)) > 0) comDados++;
      if (comDados >= args.meses) break;
    }
    if (comDados === 0) console.warn(`Nenhum pagamento encontrado nos últimos ${MAX_MESES_RETROATIVOS} meses.`);
  }

  if (args.out) {
    await mkdir(dirname(args.out), { recursive: true });
    await writeFile(args.out, JSON.stringify(todas, null, 2), 'utf8');
    console.log(`\nJSON tratado salvo em ${args.out}`);
  }

  const total = todas.reduce((s, r) => s + r.valor_pago, 0);
  console.log(`\nResumo: ${todas.length} pagamentos, ${brl(total)}.` +
    (args.dryRun ? ' Nada gravado (dry-run).' : ` ${gravadas} linhas inseridas/atualizadas em ${TABELA}.`));

  if (falhas.length) {
    console.error(`\n${falhas.length} período(s) com falha na API do TCE-SP:\n  - ${falhas.join('\n  - ')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\nErro fatal: ${(err as Error).message}`);
  process.exit(1);
});
