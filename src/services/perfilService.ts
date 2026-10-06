import { pessoaRepository } from '@/repositories/pessoaRepository';
import { metricasRepository } from '@/repositories/territorioRepository';
import { mandatoAtual, type EventoTimeline } from '@/domain/rules';
import type { MetricasMandato, PerfilPolitico, Mandato } from '@/domain/types';

export interface PerfilCompleto extends PerfilPolitico {
  mandatoAtual: Mandato | null;
  timeline: EventoTimeline[];
}

/** Monta a timeline a partir dos fatos armazenados. Nada é inferido. */
export function montarTimeline(p: PerfilPolitico): EventoTimeline[] {
  const eventos: EventoTimeline[] = [];
  for (const c of p.candidaturas) {
    if (!c.eleicao) continue;
    eventos.push({
      data: `${c.eleicao.ano}-10-01`, // aproximação só para ordenação; exibimos apenas o ano
      tipo: 'eleicao',
      titulo: `Eleição ${c.eleicao.ano} (${c.eleicao.turno}º turno) — ${c.cargo?.nome ?? 'cargo'}`,
      detalhe: [c.circunscricao?.nome, c.partido?.sigla, c.votos != null ? `${c.votos.toLocaleString('pt-BR')} votos` : null, c.resultado]
        .filter(Boolean)
        .join(' · '),
      fonteId: c.fonte_id,
    });
  }
  for (const m of p.mandatos) {
    eventos.push({
      data: m.inicio,
      tipo: 'mandato',
      titulo: `${m.cargo?.nome ?? 'Mandato'}${m.localidade?.sigla ? ` — ${m.localidade.sigla}` : ''}`,
      detalhe: `${m.inicio.slice(0, 4)} → ${m.fim ? m.fim.slice(0, 4) : 'atual'} · ${m.situacao}`,
      fonteId: m.fonte_id,
    });
  }
  for (const f of p.filiacoes) {
    if (!f.inicio) continue;
    eventos.push({ data: f.inicio, tipo: 'filiacao', titulo: `Filiação: ${f.partido?.sigla ?? '?'}`, detalhe: f.partido?.nome });
  }
  return eventos.sort((a, b) => b.data.localeCompare(a.data));
}

export const perfilService = {
  async carregar(id: string): Promise<PerfilCompleto | null> {
    const perfil = await pessoaRepository.getPerfil(id);
    if (!perfil) return null;
    return { ...perfil, mandatoAtual: mandatoAtual(perfil.mandatos), timeline: montarTimeline(perfil) };
  },

  /** Métricas por mandato, cada uma com o período analisado devolvido pelo banco. */
  async metricas(mandatos: Mandato[]): Promise<{ mandato: Mandato; metricas: MetricasMandato | null }[]> {
    return Promise.all(mandatos.map(async (mandato) => ({ mandato, metricas: await metricasRepository.porMandato(mandato.id) })));
  },
};
