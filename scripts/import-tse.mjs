#!/usr/bin/env node
/**
 * Importador TSE -> Supabase (candidaturas, resultados, mandatos dos eleitos).
 *
 * Uso:
 *   node --env-file=.env.import scripts/import-tse.mjs \
 *     --uf SP --ano 2026 --turno 1 \
 *     --consulta data/consulta_cand_2026_SP.csv \
 *     --votacao  data/votacao_candidato_munzona_2026_SP.csv \
 *     --fonte-url https://dadosabertos.tse.jus.br/...  [--dry-run]
 *
 * Variáveis (.env.import, NUNCA commitar, NUNCA usar prefixo VITE_):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CPF_HASH_SECRET
 *
 * Princípios: não inventa nada; CPF nunca é gravado (apenas HMAC); toda linha aponta para a fonte.
 * Nomes de colunas seguem o layout histórico do TSE. Se faltar coluna, o script PARA e lista o que falta.
 */
import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { basename } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ---------- args ----------
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const need = (k) => {
  if (!args[k] || args[k] === true) throw new Error(`Falta --${k}`);
  return args[k];
};
const UF = need('uf').toUpperCase();
const ANO = Number(need('ano'));
const TURNO = Number(args.turno ?? 1);
const DRY = Boolean(args['dry-run']);
const FONTE_URL = need('fonte-url');

// ---------- constantes de domínio ----------
// Cargos suportados nesta etapa (DS_CARGO do TSE -> cargos.codigo)
const CARGOS = {
  GOVERNADOR: 'governador',
  SENADOR: 'senador',
  'DEPUTADO FEDERAL': 'deputado_federal',
  'DEPUTADO ESTADUAL': 'deputado_estadual',
};
// Início de mandato (regra constitucional/regimental) — VERIFICAR antes de produção.
const INICIO_MANDATO = {
  governador: `${ANO + 1}-01-01`,
  senador: `${ANO + 1}-02-01`,
  deputado_federal: `${ANO + 1}-02-01`,
  deputado_estadual: `${ANO + 1}-03-15`,
};
const FIM_MANDATO = { governador: `${ANO + 4}-12-31`, senador: `${ANO + 8}-01-31`, deputado_federal: `${ANO + 4}-01-31`, deputado_estadual: `${ANO + 4}-03-14` };

const RESULTADO = (s) => {
  const t = norm(s);
  if (t === 'ELEITO') return 'eleito';
  if (t === 'ELEITO POR QP') return 'eleito_por_qp';
  if (t === 'ELEITO POR MEDIA') return 'eleito_por_media';
  if (t.startsWith('SUPLENTE')) return 'suplente';
  if (t === 'NAO ELEITO') return 'nao_eleito';
  if (t.startsWith('2')) return 'segundo_turno';
  if (t.includes('NULO')) return 'anulado';
  return 'pendente';
};
const norm = (s = '') => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim();

// ---------- CSV ----------
async function readText(path) {
  const buf = await readFile(path);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('latin1').decode(buf);
  }
}
function parseCsv(text, sep = ';') {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map((h) => h.replace(/^\uFEFF/, '').trim());
  return { header, rows: rows.filter((r) => r.length === header.length) };
}
function table(text, required) {
  const { header, rows } = parseCsv(text);
  const missing = required.filter((c) => !header.includes(c));
  if (missing.length) throw new Error(`Colunas ausentes: ${missing.join(', ')}\nColunas encontradas: ${header.join(', ')}`);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return { idx, rows, header };
}

// ---------- main ----------
const REQ_CAND = ['SQ_CANDIDATO', 'NR_TURNO', 'SG_UF', 'DS_CARGO', 'NM_CANDIDATO', 'NM_URNA_CANDIDATO', 'NR_CPF_CANDIDATO',
  'SG_PARTIDO', 'NM_PARTIDO', 'NR_PARTIDO', 'NR_CANDIDATO', 'DS_SITUACAO_CANDIDATURA', 'DS_SIT_TOT_TURNO', 'DT_NASCIMENTO'];

const candText = await readText(need('consulta'));
const cand = table(candText, REQ_CAND);

const votos = new Map(); // `${sq}|${turno}` -> total
if (args.votacao && args.votacao !== true) {
  const vt = await readText(args.votacao);
  const parsed = parseCsv(vt);
  const col = parsed.header.includes('QT_VOTOS_NOMINAIS_VALIDOS') ? 'QT_VOTOS_NOMINAIS_VALIDOS' : 'QT_VOTOS_NOMINAIS';
  const v = table(vt, ['SQ_CANDIDATO', 'NR_TURNO', col]);
  for (const r of v.rows) {
    const k = `${r[v.idx.SQ_CANDIDATO]}|${r[v.idx.NR_TURNO]}`;
    votos.set(k, (votos.get(k) ?? 0) + Number(r[v.idx[col]] || 0));
  }
  console.log(`Votos agregados para ${votos.size} candidaturas (coluna ${col}).`);
}

const get = (r, c) => r[cand.idx[c]]?.trim();
const linhas = cand.rows
  .filter((r) => get(r, 'SG_UF') === UF && Number(get(r, 'NR_TURNO')) === TURNO && CARGOS[norm(get(r, 'DS_CARGO'))])
  .map((r) => ({
    sq: get(r, 'SQ_CANDIDATO'),
    cargo: CARGOS[norm(get(r, 'DS_CARGO'))],
    nome: get(r, 'NM_CANDIDATO'),
    urna: get(r, 'NM_URNA_CANDIDATO'),
    cpf: get(r, 'NR_CPF_CANDIDATO'),
    sigla: get(r, 'SG_PARTIDO'),
    partidoNome: get(r, 'NM_PARTIDO'),
    partidoNum: Number(get(r, 'NR_PARTIDO')) || null,
    numero: get(r, 'NR_CANDIDATO'),
    situacao: get(r, 'DS_SITUACAO_CANDIDATURA'),
    resultado: RESULTADO(get(r, 'DS_SIT_TOT_TURNO')),
    nasc: parseData(get(r, 'DT_NASCIMENTO')),
    votos: votos.get(`${get(r, 'SQ_CANDIDATO')}|${get(r, 'NR_TURNO')}`) ?? null,
  }));

function parseData(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

const eleitos = linhas.filter((l) => l.resultado.startsWith('eleito'));
console.log(`${UF} ${ANO} T${TURNO}: ${linhas.length} candidaturas, ${eleitos.length} eleitos.`);
for (const cargo of Object.values(CARGOS)) {
  console.log(`  ${cargo}: ${linhas.filter((l) => l.cargo === cargo).length} cand. / ${eleitos.filter((l) => l.cargo === cargo).length} eleitos`);
}
if (DRY) { console.log('--dry-run: nada gravado.'); process.exit(0); }

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CPF_HASH_SECRET } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CPF_HASH_SECRET) throw new Error('Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e CPF_HASH_SECRET.');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ok = (r, ctx) => { if (r.error) throw new Error(`${ctx}: ${r.error.message}`); return r.data; };
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const hashCpf = (cpf) => createHmac('sha256', CPF_HASH_SECRET).update(cpf.replace(/\D/g, '')).digest('hex');

// Fonte
const fonte = ok(await db.from('fontes').insert({
  tipo: 'dados_abertos', orgao: 'Tribunal Superior Eleitoral',
  titulo: `TSE — candidaturas e resultados ${ANO} (${UF})`, url: FONTE_URL,
  data_consulta: new Date().toISOString().slice(0, 10),
  identificador_externo: basename(need('consulta')),
  observacoes: 'Importado por scripts/import-tse.mjs. CPF não armazenado.',
}).select('id').single(), 'fonte');

// Referências
const eleicao = ok(await db.from('eleicoes').select('id').eq('ano', ANO).eq('tipo', 'geral').eq('turno', TURNO).maybeSingle(), 'eleicao');
if (!eleicao) throw new Error(`Eleição ${ANO} turno ${TURNO} não existe (rode o seed).`);
const uf = ok(await db.from('localidades').select('id').eq('tipo', 'estado').eq('sigla', UF).single(), 'uf');
const cargos = Object.fromEntries(ok(await db.from('cargos').select('id,codigo'), 'cargos').map((c) => [c.codigo, c.id]));
const orgaos = Object.fromEntries(ok(await db.from('orgaos').select('id,sigla'), 'orgaos').map((o) => [o.sigla, o.id]));
const ORGAO = { senador: 'SF', deputado_federal: 'CD', deputado_estadual: UF === 'SP' ? 'ALESP' : null, governador: null };

// Partidos
const partidos = [...new Map(linhas.map((l) => [l.sigla, l])).values()];
ok(await db.from('partidos').upsert(partidos.map((p) => ({ sigla: p.sigla, nome: p.partidoNome, numero: p.partidoNum, fonte_id: fonte.id })), { onConflict: 'sigla', ignoreDuplicates: true }), 'partidos');
const partidoId = Object.fromEntries(ok(await db.from('partidos').select('id,sigla'), 'partidos sel').map((p) => [p.sigla, p.id]));

// Pessoas (por cpf_hash)
const pessoaRows = linhas.map((l) => ({
  cpf_hash: hashCpf(l.cpf), nome_civil: l.nome, nome_politico: l.urna, data_nascimento: l.nasc,
  identificadores_externos: { tse_sq: { [ANO]: l.sq } }, fonte_id: fonte.id,
}));
const unique = [...new Map(pessoaRows.map((p) => [p.cpf_hash, p])).values()];
for (const part of chunk(unique, 300)) {
  // ignoreDuplicates: não sobrescreve pessoa existente (preserva foto e correções manuais)
  ok(await db.from('pessoas').upsert(part, { onConflict: 'cpf_hash', ignoreDuplicates: true }), 'pessoas');
}
const pessoaId = new Map();
for (const part of chunk(unique.map((p) => p.cpf_hash), 200)) {
  for (const p of ok(await db.from('pessoas').select('id,cpf_hash').in('cpf_hash', part), 'pessoas sel')) pessoaId.set(p.cpf_hash, p.id);
}

// Candidaturas
const candRows = linhas.map((l) => ({
  eleicao_id: eleicao.id, pessoa_id: pessoaId.get(hashCpf(l.cpf)), cargo_id: cargos[l.cargo], circunscricao_id: uf.id,
  partido_id: partidoId[l.sigla], numero_candidato: l.numero, nome_urna: l.urna, votos: l.votos,
  situacao: l.situacao, resultado: l.resultado, fonte_id: fonte.id,
}));
for (const part of chunk(candRows, 300)) ok(await db.from('candidaturas').upsert(part, { onConflict: 'eleicao_id,pessoa_id,cargo_id' }), 'candidaturas');

// Mandatos dos eleitos
const candIds = new Map();
for (const part of chunk(eleitos.map((l) => pessoaId.get(hashCpf(l.cpf))), 200)) {
  for (const c of ok(await db.from('candidaturas').select('id,pessoa_id,cargo_id').eq('eleicao_id', eleicao.id).in('pessoa_id', part), 'cand sel')) candIds.set(`${c.pessoa_id}|${c.cargo_id}`, c.id);
}
const mandatoRows = eleitos.map((l) => {
  const pid = pessoaId.get(hashCpf(l.cpf));
  return {
    pessoa_id: pid, cargo_id: cargos[l.cargo], orgao_id: orgaos[ORGAO[l.cargo]] ?? null, localidade_id: uf.id,
    candidatura_id: candIds.get(`${pid}|${cargos[l.cargo]}`), partido_id: partidoId[l.sigla],
    inicio: INICIO_MANDATO[l.cargo], fim: FIM_MANDATO[l.cargo], situacao: 'eleito_nao_empossado', fonte_id: fonte.id,
  };
});
for (const part of chunk(mandatoRows, 300)) ok(await db.from('mandatos').upsert(part, { onConflict: 'candidatura_id', ignoreDuplicates: true }), 'mandatos');

console.log(`OK. Fonte ${fonte.id}. ${unique.length} pessoas, ${candRows.length} candidaturas, ${mandatoRows.length} mandatos.`);
