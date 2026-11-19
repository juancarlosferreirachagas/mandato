#!/usr/bin/env node
/**
 * FISCALIZA GUARULHOS — Baixa as despesas oficiais de Guarulhos (TCE-SP) e salva em CSV.
 *
 * Fonte: https://transparencia.tce.sp.gov.br/api/json/despesas/guarulhos/{ano}/{mes}
 * (a API do TCE-SP não oferece formato CSV; convertemos o JSON oficial linha a linha,
 *  sem filtrar nem alterar nenhum valor — o CSV é o dado bruto completo, todos os eventos:
 *  Empenhado, Liquidado, Pago, Reforço, Anulação).
 *
 * Uso:
 *   node scripts/baixar-csv-tce.mjs                 # ano atual, todos os meses
 *   node scripts/baixar-csv-tce.mjs --ano=2026
 *   node scripts/baixar-csv-tce.mjs --ano=2026 --mes=3
 *   node scripts/baixar-csv-tce.mjs --ano=2026 --force   # rebaixa mesmo se já existir
 *
 * Saída: ./TCE-<ano>/despesas-guarulhos-<ano>-<mm>.csv  (UTF-8 com BOM, separador ";",
 * abre direto no Excel em português).
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const ano = Number(arg('ano') ?? new Date().getFullYear());
const mesUnico = arg('mes') ? Number(arg('mes')) : null;
const force = process.argv.includes('--force');
const dir = `TCE-${ano}`;
const TIMEOUT_MS = 240_000;
const SEP = ';';
const mm = (m) => String(m).padStart(2, '0');

const existe = async (p) => !!(await stat(p).catch(() => null));

const celula = (v) => {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').trim();
  return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function paraCsv(linhas) {
  const colunas = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
  const corpo = linhas.map((l) => colunas.map((c) => celula(l[c])).join(SEP));
  return '\uFEFF' + [colunas.join(SEP), ...corpo].join('\r\n') + '\r\n';
}

async function buscarJson(url) {
  for (let t = 1; t <= 4; t++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'FiscalizaGuarulhos/1.0', accept: 'application/json' } });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      return txt.trim() ? JSON.parse(txt) : [];
    } catch (e) {
      console.warn(`  ! tentativa ${t}/4: ${e.message}`);
      if (t < 4) await new Promise((r) => setTimeout(r, 2 ** t * 1000));
    } finally { clearTimeout(timer); }
  }
  throw new Error('falha após 4 tentativas');
}

async function baixar(mes) {
  const rotulo = `${mm(mes)}/${ano}`;
  const arquivo = `${dir}/despesas-guarulhos-${ano}-${mm(mes)}.csv`;
  if (!force && (await existe(arquivo))) {
    console.log(`= ${rotulo}: já existe, pulando (use --force para rebaixar)`);
    return 'pulado';
  }
  try {
    const dados = await buscarJson(`https://transparencia.tce.sp.gov.br/api/json/despesas/guarulhos/${ano}/${mes}`);
    if (!Array.isArray(dados) || dados.length === 0) {
      console.log(`- ${rotulo}: sem dados publicados ainda`);
      return 'vazio';
    }
    await writeFile(arquivo, paraCsv(dados), 'utf8');
    console.log(`✓ ${rotulo}: ${dados.length} linhas → ${arquivo}`);
    return 'ok';
  } catch (e) {
    console.error(`✗ ${rotulo}: ${e.message}`);
    return 'erro';
  }
}

await mkdir(dir, { recursive: true });
const meses = mesUnico ? [mesUnico] : Array.from({ length: 12 }, (_, i) => i + 1);
const resumo = {};
for (const m of meses) { const r = await baixar(m); resumo[r] = (resumo[r] ?? 0) + 1; }
console.log('\nResumo:', resumo);
if (resumo.erro) process.exitCode = 1;
