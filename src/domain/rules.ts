import type { MetricasMandato, Mandato } from './types';

/** Regras puras de domínio (sem I/O, sem React). */

/** Percentual de presença sobre as sessões registradas; null se não há dados. */
export function percentualPresenca(m: MetricasMandato): number | null {
  if (m.sessoes_registradas === 0) return null;
  return (m.sessoes_presente / m.sessoes_registradas) * 100;
}

export function formatarPeriodo(inicio: string, fim: string): string {
  return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const SITUACAO_LABEL: Record<string, string> = {
  eleito_nao_empossado: 'Eleito (não empossado)',
  em_exercicio: 'Em exercício',
  licenciado: 'Licenciado',
  afastado: 'Afastado',
  encerrado: 'Encerrado',
  cassado: 'Cassado',
  renunciou: 'Renunciou',
};
export const rotuloSituacao = (s: string) => SITUACAO_LABEL[s] ?? s;

const RESULTADO_LABEL: Record<string, string> = {
  eleito: 'Eleito',
  eleito_por_media: 'Eleito por média',
  eleito_por_qp: 'Eleito por QP',
  suplente: 'Suplente',
  nao_eleito: 'Não eleito',
  segundo_turno: '2º turno',
  anulado: 'Anulado',
  pendente: 'Pendente',
};
export const rotuloResultado = (s: string | null) => (s ? RESULTADO_LABEL[s] ?? s : '—');

/** Mandato vigente: sem data de fim passada e situação ativa. */
export function mandatoAtual(mandatos: Mandato[], hoje = new Date()): Mandato | null {
  const iso = hoje.toISOString().slice(0, 10);
  const ativos = mandatos.filter(
    (m) =>
      ['em_exercicio', 'licenciado', 'afastado', 'eleito_nao_empossado'].includes(m.situacao) &&
      (!m.fim || m.fim >= iso),
  );
  ativos.sort((a, b) => b.inicio.localeCompare(a.inicio));
  return ativos[0] ?? null;
}

export type EventoTimeline = {
  data: string;
  tipo: 'eleicao' | 'mandato' | 'filiacao';
  titulo: string;
  detalhe?: string;
  fonteId?: string | null;
};
