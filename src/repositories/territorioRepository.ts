import { db } from '@/database/client';
import { obterAtosMunicipaisDoRepresentante } from '@/repositories/abasRepository';
import type { VagaCargo, MetricasMandato } from '@/domain/types';

export const territorioRepository = {
  /** Vagas estruturais por cargo para uma UF (tabela vagas_cargo). */
  async vagasPorUf(sigla: string): Promise<VagaCargo[]> {
    const { data, error } = await db()
      .from('vagas_cargo')
      .select('quantidade, cargo:cargos(codigo,nome), localidade:localidades!inner(sigla,tipo)')
      .eq('localidade.sigla', sigla)
      .eq('localidade.tipo', 'estado');
    if (error) throw error;
    return (data ?? []).map((v: any) => ({
      cargo_codigo: v.cargo.codigo,
      cargo_nome: v.cargo.nome,
      quantidade: v.quantidade,
    }));
  },

  /** Mandatos efetivamente cadastrados por cargo numa UF. */
  async mandatosCadastradosPorUf(sigla: string): Promise<Record<string, number>> {
    const { data, error } = await db()
      .from('v_mandatos_vigentes_por_cargo')
      .select('cargo_codigo, total, localidade:localidades!inner(sigla)')
      .eq('localidade.sigla', sigla);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r: any) => [r.cargo_codigo, Number(r.total)]));
  },
};

export const metricasRepository = {
  async porMandato(mandatoId: string, inicio?: string, fim?: string): Promise<MetricasMandato | null> {
    try {
      const { data, error } = await db().rpc('metricas_mandato', {
        p_mandato_id: mandatoId,
        p_inicio: inicio ?? null,
        p_fim: fim ?? null,
      });
      if (!error) {
        const row = (data as any[] | null)?.[0];
        if (row) return row as MetricasMandato;
      }
    } catch {
      // Failover local calculado a partir das leis e proposições oficiais mapeadas
    }

    if (mandatoId.startsWith('mand-gru-')) {
      const pessoaId = mandatoId.replace('mand-gru-', 'pess-gru-');
      const atos = obterAtosMunicipaisDoRepresentante(pessoaId);
      const aprovados = atos.filter((a) => (a.badge ?? '').toLowerCase().includes('sancionada')).length;
      return {
        periodo_inicio: inicio ?? '2025-01-01',
        periodo_fim: fim ?? '2028-12-31',
        projetos_apresentados: atos.length,
        projetos_aprovados: aprovados,
        votacoes_registradas: 0,
        votos_computados: 0,
        sessoes_registradas: 0,
        sessoes_presente: 0,
        relatorias: 0,
        emendas: 0,
      };
    }

    return null;
  },
};
