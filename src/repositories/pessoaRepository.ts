import { db } from '@/database/client';
import type { PerfilPolitico, Pessoa, PessoaResumo, Mandato, Candidatura, Filiacao } from '@/domain/types';

const MANDATO_SELECT =
  'id, pessoa_id, inicio, fim, situacao, condicao, fonte_id, cargo:cargos(codigo,nome), localidade:localidades(nome,sigla), partido:partidos(sigla), orgao:orgaos(nome,sigla)';
const CANDIDATURA_SELECT =
  'id, votos, resultado, situacao, numero_candidato, fonte_id, eleicao:eleicoes(ano,turno), cargo:cargos(nome), circunscricao:localidades!circunscricao_id(nome,sigla), partido:partidos(sigla)';

export interface EleitoCard {
  mandatoId: string;
  pessoaId: string;
  nome: string;
  nomeCivil: string;
  fotoUrl: string | null;
  partido: string | null;
  votos: number | null;
  situacao: string;
}

export const pessoaRepository = {
  /** Eleitos/mandatos de um cargo numa UF. Ordenados por votos (desc). */
  async listarEleitos(cargoCodigo: string, uf: string): Promise<EleitoCard[]> {
    const { data, error } = await db()
      .from('mandatos')
      .select(
        'id, situacao, cargo:cargos!inner(codigo), localidade:localidades!inner(sigla), partido:partidos(sigla), pessoa:pessoas(id,nome_civil,nome_politico,foto_url), candidatura:candidaturas(votos)',
      )
      .eq('cargo.codigo', cargoCodigo)
      .eq('localidade.sigla', uf)
      .limit(300);
    if (error) throw error;
    return (data ?? [])
      .map((m: any) => ({
        mandatoId: m.id,
        pessoaId: m.pessoa.id,
        nome: m.pessoa.nome_politico ?? m.pessoa.nome_civil,
        nomeCivil: m.pessoa.nome_civil,
        fotoUrl: m.pessoa.foto_url,
        partido: m.partido?.sigla ?? null,
        votos: m.candidatura?.votos ?? null,
        situacao: m.situacao,
      }))
      .sort((a, b) => (b.votos ?? -1) - (a.votos ?? -1) || a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  /** Busca por nome político ou civil (ILIKE). Para volume maior, trocar por RPC com pg_trgm. */
  async search(term: string, limit = 20): Promise<PessoaResumo[]> {
    const t = term.trim().replace(/[%,()]/g, ' ');
    if (t.length < 2) return [];
    const { data, error } = await db()
      .from('pessoas')
      .select(
        'id, nome_civil, nome_politico, data_nascimento, foto_url, mandatos(situacao, inicio, cargo:cargos(nome), partido:partidos(sigla))',
      )
      .or(`nome_politico.ilike.%${t}%,nome_civil.ilike.%${t}%`)
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((p: any) => {
      const ativo = [...(p.mandatos ?? [])].sort((a: any, b: any) => b.inicio.localeCompare(a.inicio))[0] ?? null;
      const { mandatos: _m, ...pessoa } = p;
      return { ...pessoa, mandato_atual: ativo } as PessoaResumo;
    });
  },

  async getPerfil(id: string): Promise<PerfilPolitico | null> {
    const client = db();
    const [pessoa, mandatos, candidaturas, filiacoes] = await Promise.all([
      client.from('pessoas').select('id, nome_civil, nome_politico, data_nascimento, foto_url').eq('id', id).maybeSingle(),
      client.from('mandatos').select(MANDATO_SELECT).eq('pessoa_id', id).order('inicio', { ascending: false }),
      client.from('candidaturas').select(CANDIDATURA_SELECT).eq('pessoa_id', id),
      client.from('filiacoes').select('id, inicio, fim, partido:partidos(sigla,nome)').eq('pessoa_id', id).order('inicio'),
    ]);
    for (const r of [pessoa, mandatos, candidaturas, filiacoes]) if (r.error) throw r.error;
    if (!pessoa.data) return null;
    return {
      pessoa: pessoa.data as Pessoa,
      mandatos: (mandatos.data ?? []) as unknown as Mandato[],
      candidaturas: (candidaturas.data ?? []) as unknown as Candidatura[],
      filiacoes: (filiacoes.data ?? []) as unknown as Filiacao[],
    };
  },
};
