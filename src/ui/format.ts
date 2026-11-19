const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const mesNome = (m: number) => MESES[m - 1] ?? String(m);
export const mesAbrev = (m: number) => (MESES[m - 1] ?? String(m)).slice(0, 3);

const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numFmt = new Intl.NumberFormat('pt-BR');

export const brl = (v: number) => brlFmt.format(v);
export const inteiro = (v: number) => numFmt.format(v);

/** R$ 4,28 bi · R$ 336,9 mi · R$ 12,3 mil · R$ 950 */
export function brlCompacto(v: number): string {
  const abs = Math.abs(v);
  const sinal = v < 0 ? '-' : '';
  const f = (n: number, d = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  if (abs >= 1e9) return `${sinal}R$ ${f(abs / 1e9)} bi`;
  if (abs >= 1e6) return `${sinal}R$ ${f(abs / 1e6, 1)} mi`;
  if (abs >= 1e4) return `${sinal}R$ ${f(abs / 1e3, 1)} mil`;
  return brl(v);
}

export function dataBr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function dataHoraBr(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

/** 46319000000745 -> 46.319.000/0007-45 */
export function formatarCnpj(c: string | null | undefined): string {
  if (!c || c.length !== 14) return c ?? '';
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

/** Nomes do TCE vêm em CAIXA ALTA: "SODEXO PASS DO BRASIL" -> "Sodexo Pass do Brasil" */
export function nomeLegivel(s: string): string {
  const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'para', 'por']);
  const siglas = new Set(['ltda', 'sa', 'me', 'epp', 'eireli', 'mei', 'cia', 'sp', 'ss', 'cnpj', 'iprem', 'sus', 'ti']);
  return s.toLowerCase().split(' ').map((p, i) => {
    if (siglas.has(p.replace(/[./-]/g, ''))) return p.toUpperCase();
    if (i > 0 && minusculas.has(p)) return p;
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
}

export function nomeOrgaoCurto(orgao: string): string {
  const o = orgao.toUpperCase();
  if (o.includes('PREFEITURA')) return 'Prefeitura';
  if (o.includes('CÂMARA') || o.includes('CAMARA')) return 'Câmara Municipal';
  if (o.includes('PREVID')) return 'Previdência (IPREM)';
  return nomeLegivel(orgao);
}
