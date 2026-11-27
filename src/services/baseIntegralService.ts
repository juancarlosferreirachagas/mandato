/**
 * ============================================================================
 * SERVIÇO DA BASE INTEGRAL SHARDEADA (BAIXÍSSIMA LATÊNCIA E BANDA NO CELULAR)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * - Carrega `credores-completo.json` com índice de busca pré-normalizado (<4ms).
 * - Carrega pagamentos sob demanda por shard hexadecimal (`pags/0..f.json`),
 *   reduzindo em ~95% o consumo de dados no celular ao abrir uma empresa.
 * - Exporta CSV com proteção OWASP contra Formula Injection.
 * ============================================================================
 */

import { sanitizarCelulaCsv, shardHexDaChave } from '@/domain/seguranca';

export interface CredorIntegral {
  chave: string;
  credor: string;
  cnpj: string | null;
  tipo: 'PJ' | 'PF' | 'OUTRO';
  area: string;
  repasseInterno: boolean;
  orgaoPrincipal: string;
  total2025: number;
  qtd2025: number;
  total2026: number;
  qtd2026: number;
  totalConsolidado: number;
  qtdConsolidado: number;
  maiorPagamento: number;
  primeiroPagamento: string | null;
  ultimoPagamento: string | null;
  meses2025: number[];
  meses2026: number[];
  orgaos: { orgao: string; val25: number; qtd25: number; val26: number; qtd26: number }[];
  modalidadePrincipal: string | null;
  contratosRef: string[];
  qtdConexoesDom: number;
  ultimoDomData: string | null;
  ultimoDomCod: number | null;
  ultimoDomUrl: string | null;
  /** Índice textual pré-normalizado (sem acento, minúsculo) para busca em <4ms */
  searchIndex: string;
}

export type TipoAtoConexaoDom =
  | 'CONTRATO'
  | 'ADITIVO'
  | 'ATA_RP'
  | 'HOMOLOGACAO'
  | 'DISPENSA'
  | 'CONVENIO'
  | 'PORTARIA_FISCAL'
  | 'ATO_OFICIAL';

export interface ConexaoEmpresaDom {
  id: string;
  chave: string;
  credor: string;
  cnpj: string;
  area: string;
  tipoAto: TipoAtoConexaoDom;
  dataIso: string;
  dataBr: string;
  ano: number;
  mes: number;
  codigoDom: number;
  pagina: number;
  valorMencionado: number | null;
  totalPagoTce: number;
  pago2025: number;
  pago2026: number;
  qtdPagamentosTce: number;
  trecho: string;
  pdfUrl: string;
  sha256Pdf: string | null;
}

export interface PagamentoIntegral {
  id: string;
  chave: string;
  ano: 2025 | 2026;
  mes: number;
  data_pagamento: string;
  orgao: string;
  valor_pago: number;
  nr_empenho: string | null;
  descricao: string;
  modalidade_lic: string | null;
  elemento: string | null;
  fonte_url: string;
}

export const ROTULOS_TIPO_ATO_DOM: Record<TipoAtoConexaoDom, string> = {
  CONTRATO: 'Contrato / Extrato',
  ADITIVO: 'Termo Aditivo',
  ATA_RP: 'Ata de Registro de Preços',
  HOMOLOGACAO: 'Homologação / Adjudicação',
  DISPENSA: 'Dispensa / Inexigibilidade',
  CONVENIO: 'Convênio / Gestão',
  PORTARIA_FISCAL: 'Gestor / Fiscal de Contrato',
  ATO_OFICIAL: 'Publicação Oficial no DOM',
};

const ZEROS_12 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const ZEROS_9 = [0, 0, 0, 0, 0, 0, 0, 0, 0];

function normRapido(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

let cacheCredores: Promise<CredorIntegral[]> | null = null;
let cacheCredoresMapa: Map<string, CredorIntegral> | null = null;
let cacheConexoesDom: Promise<ConexaoEmpresaDom[]> | null = null;
const cacheShardsPag = new Map<string, Promise<{ orgaos: string[]; byKey: Record<string, any[][]> }>>();

export async function carregarCredoresCompletos(): Promise<CredorIntegral[]> {
  if (!cacheCredores) {
    cacheCredores = fetch('/dados/credores-completo.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: { orgaos: string[]; itens: any[] }) => {
        const orgaos = json.orgaos || [
          'PREFEITURA MUNICIPAL DE GUARULHOS',
          'CÂMARA MUNICIPAL DE GUARULHOS',
          'INSTITUTO DE PREVID.FUNC.PÚBL.MUNICIPAIS DE GUARULHOS',
        ];
        const lista: CredorIntegral[] = (json.itens || []).map((it) => {
          const ogArr = Array.isArray(it.og)
            ? it.og.map((v: number[]) =>
                v.length === 5
                  ? {
                      orgao: orgaos[v[0]] || orgaos[0],
                      val25: Number(v[1] || 0),
                      qtd25: Number(v[2] || 0),
                      val26: Number(v[3] || 0),
                      qtd26: Number(v[4] || 0),
                    }
                  : {
                      orgao: orgaos[0],
                      val25: Number(v[0] || 0),
                      qtd25: Number(v[1] || 0),
                      val26: Number(v[2] || 0),
                      qtd26: Number(v[3] || 0),
                    }
              )
            : [];

          const t25 = Number(it.t25 || 0);
          const t26 = Number(it.t26 || 0);
          const area = it.a ?? 'Administração, Finanças & Legislativo';
          const mod = it.ml ?? null;
          const contratosRef: string[] = Array.isArray(it.cr) ? it.cr : [];

          return {
            chave: it.k,
            credor: it.n,
            cnpj: it.c ?? null,
            tipo: it.t ?? 'OUTRO',
            area,
            repasseInterno: Boolean(it.r),
            orgaoPrincipal: orgaos[it.o ?? 0] || orgaos[0],
            total2025: t25,
            qtd2025: Number(it.q25 || 0),
            total2026: t26,
            qtd2026: Number(it.q26 || 0),
            totalConsolidado: Math.round((t25 + t26) * 100) / 100,
            qtdConsolidado: Number(it.q25 || 0) + Number(it.q26 || 0),
            maiorPagamento: Number(it.mx || 0),
            primeiroPagamento: it.p1 ?? null,
            ultimoPagamento: it.p2 ?? null,
            meses2025: Array.isArray(it.m25) ? it.m25 : ZEROS_12,
            meses2026: Array.isArray(it.m26) ? it.m26 : ZEROS_9,
            orgaos: ogAtivosValidos(ogArr),
            modalidadePrincipal: mod,
            contratosRef,
            qtdConexoesDom: Number(it.dom || 0),
            ultimoDomData: it.domD ?? null,
            ultimoDomCod: it.domC ?? null,
            ultimoDomUrl: it.domU ?? null,
            searchIndex: normRapido(
              `${it.n} ${it.c ?? ''} ${area} ${mod ?? ''} ${contratosRef.join(' ')}`
            ),
          };
        });
        cacheCredoresMapa = new Map(lista.map((c) => [c.chave, c]));
        return lista;
      })
      .catch((err) => {
        cacheCredores = null;
        throw err;
      });
  }
  return cacheCredores;
}

function ogAtivosValidos(
  arr: { orgao: string; val25: number; qtd25: number; val26: number; qtd26: number }[]
) {
  return arr.filter((x) => x.val25 !== 0 || x.val26 !== 0 || x.qtd25 > 0 || x.qtd26 > 0);
}

export async function obterCredorIntegralPorChave(chave: string): Promise<CredorIntegral | null> {
  await carregarCredoresCompletos();
  return cacheCredoresMapa?.get(chave) ?? null;
}

export async function carregarConexoesDom(): Promise<ConexaoEmpresaDom[]> {
  if (!cacheConexoesDom) {
    cacheConexoesDom = fetch('/dados/conexoes-empresas-dom.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ConexaoEmpresaDom[]>;
      })
      .catch((err) => {
        cacheConexoesDom = null;
        throw err;
      });
  }
  return cacheConexoesDom;
}

export async function obterConexoesDomDoCredor(chave: string): Promise<ConexaoEmpresaDom[]> {
  const todas = await carregarConexoesDom();
  return todas.filter((c) => c.chave === chave);
}

function carregarShardPagamentos(hex: string) {
  let prom = cacheShardsPag.get(hex);
  if (!prom) {
    prom = fetch(`/dados/pags/${hex}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        cacheShardsPag.delete(hex);
        throw err;
      });
    cacheShardsPag.set(hex, prom);
  }
  return prom;
}

/** Carrega 100% dos pagamentos de uma empresa baixando APENAS o shard ~120KB correspondente. */
export async function carregarPagamentosDoCredor(
  chave: string,
  anoFiltro?: 2025 | 2026 | null
): Promise<PagamentoIntegral[]> {
  const hex = shardHexDaChave(chave);
  const shard = await carregarShardPagamentos(hex);
  const orgaos = shard.orgaos || ['PREFEITURA MUNICIPAL DE GUARULHOS'];
  const rows = shard.byKey?.[chave] ?? [];

  const lista: PagamentoIntegral[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ano: 2025 | 2026 = r[0] === 25 ? 2025 : 2026;
    if (anoFiltro && ano !== anoFiltro) continue;
    const dataIso = String(r[1] || `${ano}-01-01`);
    const mes = Number(dataIso.slice(5, 7)) || 1;
    lista.push({
      id: `${ano}-${hex}-${i + 1}`,
      chave,
      ano,
      mes,
      data_pagamento: dataIso,
      orgao: orgaos[r[2]] || orgaos[0],
      valor_pago: Number(r[3] || 0),
      nr_empenho: r[4] || null,
      descricao:
        r[5] || `Pagamento liquidado registrado no TCE-SP (Empenho ${r[4] || 'oficial'} · ${ano})`,
      modalidade_lic: r[6] || null,
      elemento: r[7] || null,
      fonte_url: 'https://transparencia.tce.sp.gov.br/municipio/guarulhos',
    });
  }
  return lista;
}

/** Exporta planilha CSV compatível com Excel (UTF-8 com BOM) e blindada contra Formula Injection. */
export function exportarCsvPlanilha(
  nomeArquivo: string,
  cabecalhos: string[],
  linhas: (string | number | null | undefined)[][]
): void {
  const corpo = [
    cabecalhos.map(sanitizarCelulaCsv).join(';'),
    ...linhas.map((l) => l.map(sanitizarCelulaCsv).join(';')),
  ].join('\r\n');
  const blob = new Blob(['\uFEFF' + corpo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
