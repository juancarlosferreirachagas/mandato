import { db } from '@/database/client';

/**
 * Consultas das abas do perfil. Sempre filtram por pessoa via mandato/pessoa_id.
 * Cada linha traz fonte_id quando existir, para exibir a fonte na UI.
 */
export interface LinhaAba {
  id: string;
  titulo: string;
  subtitulo?: string;
  data?: string | null;
  badge?: string | null;
  fonteId?: string | null;
}

const clean = <T>(r: { data: T[] | null; error: unknown }): T[] => {
  if (r.error) throw r.error;
  return r.data ?? [];
};

export const abasRepository = {
  async propostas(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db()
        .from('proposta_autores')
        .select('id, papel, fonte_id, proposta:propostas(tipo,numero,ano,ementa,situacao,data_apresentacao)')
        .eq('pessoa_id', pessoaId),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: `${r.proposta.tipo} ${r.proposta.numero ?? ''}/${r.proposta.ano ?? ''}`,
      subtitulo: r.proposta.ementa,
      data: r.proposta.data_apresentacao,
      badge: `${r.papel} · ${r.proposta.situacao ?? 'sem situação'}`,
      fonteId: r.fonte_id,
    }));
  },

  async votacoes(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db()
        .from('votos')
        .select('id, voto, fonte_id, votacao:votacoes(data,descricao,resultado), mandato:mandatos!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: r.votacao.descricao ?? 'Votação',
      subtitulo: r.votacao.resultado ? `Resultado: ${r.votacao.resultado}` : undefined,
      data: r.votacao.data,
      badge: `Voto: ${r.voto}`,
      fonteId: r.fonte_id,
    }));
  },

  async presencas(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db()
        .from('presencas')
        .select('id, data_sessao, tipo_sessao, situacao, justificativa, fonte_id, mandato:mandatos!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId)
        .order('data_sessao', { ascending: false })
        .limit(200),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: r.tipo_sessao ?? 'Sessão',
      subtitulo: r.justificativa ?? undefined,
      data: r.data_sessao,
      badge: r.situacao,
      fonteId: r.fonte_id,
    }));
  },

  async emendas(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db()
        .from('proposta_emendas')
        .select('id, tipo, numero, ementa, valor, situacao, data, fonte_id, mandato:mandatos!autor_mandato_id!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: `Emenda ${r.tipo} ${r.numero ?? ''}`.trim(),
      subtitulo: r.ementa,
      data: r.data,
      badge: r.valor != null ? `R$ ${Number(r.valor).toLocaleString('pt-BR')}` : r.situacao,
      fonteId: r.fonte_id,
    }));
  },

  async comissoes(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db()
        .from('membros_comissoes')
        .select('id, papel, inicio, fim, fonte_id, comissao:comissoes(nome,sigla), mandato:mandatos!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: r.comissao.nome,
      subtitulo: `${r.inicio ?? '?'} → ${r.fim ?? 'atual'}`,
      badge: r.papel,
      fonteId: r.fonte_id,
    }));
  },

  async promessas(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db()
        .from('promessas')
        .select('id, texto, contexto, data_declaracao, promessa_fontes(fonte_id), avaliacoes:promessa_avaliacoes(status,fonte_id)')
        .eq('pessoa_id', pessoaId),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: r.texto,
      subtitulo: r.contexto ?? undefined,
      data: r.data_declaracao,
      badge: r.avaliacoes?.[0]?.status ?? 'sem avaliação',
      fonteId: r.promessa_fontes?.[0]?.fonte_id ?? null,
    }));
  },

  async processos(pessoaId: string): Promise<LinhaAba[]> {
    const rows = clean(
      await db().from('processos').select('id, tribunal, numero, classe, situacao, posicao_declarada, fonte_id').eq('pessoa_id', pessoaId),
    ) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: `${r.classe ?? 'Processo'} ${r.numero ?? ''}`.trim(),
      subtitulo: [r.tribunal, r.posicao_declarada && `Posição declarada: ${r.posicao_declarada}`].filter(Boolean).join(' — '),
      badge: r.situacao,
      fonteId: r.fonte_id,
    }));
  },
};
