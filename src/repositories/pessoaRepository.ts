/**
 * ============================================================================
 * REPOSITÓRIO DE REPRESENTANTES ELEITOS (PREFEITO, VICE & 34 VEREADORES)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * ARQUITETURA DE ALTA DISPONIBILIDADE:
 * 1. Consulta o banco remoto Supabase (`mandatos`, `pessoas`, `candidaturas`).
 * 2. Caso o Supabase esteja inacessível (`Failed to fetch`), faz failover
 *    automático para `ELEITOS_GUARULHOS_TSE_2024` (extraído dos arquivos
 *    oficiais `data/consulta_cand_2024_SP.csv` e `data/votacao_candidato_munzona_2024_SP.csv`),
 *    garantindo que os 36 representantes de Guarulhos estejam sempre disponíveis.
 * ============================================================================
 */

import { db } from '@/database/client';
import { ELEITOS_GUARULHOS_TSE_2024 } from '@/database/contingenciaPoliticosGuarulhos';
import type { PerfilPolitico, Pessoa, PessoaResumo, Mandato, Candidatura, Filiacao } from '@/domain/types';

function dataBrParaIso(dt?: string | null): string | null {
  if (!dt) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dt.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function capitalizarFrase(s?: string | null): string | undefined {
  if (!s) return undefined;
  return s
    .toLowerCase()
    .replace(/(^|\s|\/|-)(\p{L})/gu, (_, sep, ch) => `${sep}${ch.toUpperCase()}`);
}

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
  cargoCodigo?: string;
  cargoNome?: string;
  votos: number | null;
  situacao: string;
  condicao?: string;
  mesaDiretora?: string | null;
  numeroUrna?: string | null;
  emailGabinete?: string | null;
}

export const pessoaRepository = {
  /** Eleitos/mandatos de um cargo numa localidade (ex.: GRU) ou todos se cargoCodigo for omitido/todos. */
  async listarEleitos(cargoCodigo?: string, localidadeSigla = 'GRU'): Promise<EleitoCard[]> {
    try {
      let query = db()
        .from('mandatos')
        .select(
          'id, situacao, condicao, cargo:cargos!inner(codigo,nome), localidade:localidades!inner(sigla), partido:partidos(sigla), pessoa:pessoas(id,nome_civil,nome_politico,foto_url,identificadores_externos), candidatura:candidaturas(votos,numero_candidato)',
        )
        .eq('localidade.sigla', localidadeSigla)
        .in('situacao', ['em_exercicio', 'eleito_nao_empossado', 'licenciado']);

      if (cargoCodigo && cargoCodigo !== 'todos') {
        query = query.eq('cargo.codigo', cargoCodigo);
      }

      const { data, error } = await query.limit(500);
      if (!error && data && data.length > 0) {
        return data
          .map((m: any) => {
            const ext = m.pessoa?.identificadores_externos ?? {};
            return {
              mandatoId: m.id,
              pessoaId: m.pessoa.id,
              nome: m.pessoa.nome_politico ?? m.pessoa.nome_civil,
              nomeCivil: m.pessoa.nome_civil,
              fotoUrl: m.pessoa.foto_url,
              partido: m.partido?.sigla ?? null,
              cargoCodigo: m.cargo?.codigo,
              cargoNome: m.cargo?.nome,
              votos: m.candidatura?.votos ?? null,
              situacao: m.situacao,
              condicao: m.condicao,
              mesaDiretora: ext.cargo_mesa_diretora ?? null,
              numeroUrna: m.candidatura?.numero_candidato ?? ext.numero_urna ?? null,
              emailGabinete: ext.email_gabinete ?? null,
            };
          })
          .sort((a, b) => {
            const sA = a.situacao === 'em_exercicio' ? 0 : 1;
            const sB = b.situacao === 'em_exercicio' ? 0 : 1;
            if (sA !== sB) return sA - sB;
            return (b.votos ?? -1) - (a.votos ?? -1) || a.nome.localeCompare(b.nome, 'pt-BR');
          });
      }
    } catch {
      // Failover silencioso para a base oficial TSE 2024 de Guarulhos
    }

    const base = ELEITOS_GUARULHOS_TSE_2024 as EleitoCard[];
    if (cargoCodigo && cargoCodigo !== 'todos') {
      return base.filter((e) => e.cargoCodigo === cargoCodigo);
    }
    return base;
  },

  /** Busca por nome político ou civil (ILIKE). */
  async search(term: string, limit = 20): Promise<PessoaResumo[]> {
    const t = term.trim().replace(/[%,()]/g, ' ');
    if (t.length < 2) return [];
    try {
      const { data, error } = await db()
        .from('pessoas')
        .select(
          'id, nome_civil, nome_politico, data_nascimento, foto_url, mandatos(situacao, inicio, cargo:cargos(nome), partido:partidos(sigla))',
        )
        .or(`nome_politico.ilike.%${t}%,nome_civil.ilike.%${t}%`)
        .limit(limit);
      if (!error && data) {
        return data.map((p: any) => {
          const ativo = [...(p.mandatos ?? [])].sort((a: any, b: any) => b.inicio.localeCompare(a.inicio))[0] ?? null;
          const { mandatos: _m, ...pessoa } = p;
          return { ...pessoa, mandato_atual: ativo } as PessoaResumo;
        });
      }
    } catch {
      // Failover local
    }

    const lower = t.toLowerCase();
    return (ELEITOS_GUARULHOS_TSE_2024 as any[])
      .filter((e) => e.nome.toLowerCase().includes(lower) || e.nomeCivil.toLowerCase().includes(lower))
      .slice(0, limit)
      .map((e) => ({
        id: e.pessoaId,
        nome_civil: e.nomeCivil,
        nome_politico: e.nome,
        data_nascimento: null,
        foto_url: e.fotoUrl,
        mandato_atual: {
          situacao: e.situacao,
          cargo: { nome: e.cargoNome },
          partido: { sigla: e.partido },
        },
      }));
  },

  async getPerfil(id: string): Promise<PerfilPolitico | null> {
    try {
      const client = db();
      const [pessoa, mandatos, candidaturas, filiacoes] = await Promise.all([
        client.from('pessoas').select('id, nome_civil, nome_politico, data_nascimento, foto_url, identificadores_externos').eq('id', id).maybeSingle(),
        client.from('mandatos').select(MANDATO_SELECT).eq('pessoa_id', id).order('inicio', { ascending: false }),
        client.from('candidaturas').select(CANDIDATURA_SELECT).eq('pessoa_id', id),
        client.from('filiacoes').select('id, inicio, fim, partido:partidos(sigla,nome)').eq('pessoa_id', id).order('inicio'),
      ]);
      if (!pessoa.error && pessoa.data) {
        return {
          pessoa: pessoa.data as Pessoa,
          mandatos: (mandatos.data ?? []) as unknown as Mandato[],
          candidaturas: (candidaturas.data ?? []) as unknown as Candidatura[],
          filiacoes: (filiacoes.data ?? []) as unknown as Filiacao[],
        };
      }
    } catch {
      // Failover local TSE 2024
    }

    const local = (ELEITOS_GUARULHOS_TSE_2024 as any[]).find((e) => e.pessoaId === id);
    if (!local) return null;

    const ocupacaoFmt = capitalizarFrase(local.ocupacao);
    const escolaridadeFmt = capitalizarFrase(local.escolaridade);
    const naturalidadeFmt = local.municipioNasc
      ? `${capitalizarFrase(local.municipioNasc)}${local.ufNasc ? `/${local.ufNasc}` : ''}`
      : null;

    const paragrafosBio = [
      `${local.nome.replace(/\s+/g, ' ')} (${local.nomeCivil}) exerce o mandato titular de ${local.cargoNome} de Guarulhos na 19ª Legislatura (2025–2028), eleito(a) pelo ${local.nomePartidoCompleto || local.partido}${local.votos > 0 ? ` com ${Number(local.votos).toLocaleString('pt-BR')} votos nominais registrados pelo Tribunal Superior Eleitoral (Circunscrição 64777 — Guarulhos)` : ' na chapa majoritária vencedora do 2º turno das Eleições Municipais de 2024'}.`,
      [
        naturalidadeFmt ? `Natural de ${naturalidadeFmt}` : null,
        ocupacaoFmt ? `ocupação declarada à Justiça Eleitoral: ${ocupacaoFmt}` : null,
        escolaridadeFmt ? `grau de instrução: ${escolaridadeFmt}` : null,
        local.coligacao && local.coligacao !== 'PARTIDO ISOLADO' ? `coligação/federação: ${local.coligacao}` : null,
      ]
        .filter(Boolean)
        .join(' · ') + '.',
    ].filter((p) => p.length > 3);

    return {
      pessoa: {
        id: local.pessoaId,
        nome_civil: local.nomeCivil,
        nome_politico: local.nome.replace(/\s+/g, ' '),
        data_nascimento: dataBrParaIso(local.nasc),
        foto_url: local.fotoUrl,
        identificadores_externos: {
          numero_urna: local.numeroUrna,
          ocupacao: ocupacaoFmt,
          escolaridade: escolaridadeFmt,
          cargo_mesa_diretora: local.mesaDiretora ?? undefined,
          email_gabinete: local.emailGabinete ?? undefined,
          comissoes: Array.isArray(local.comissoes) ? local.comissoes : undefined,
          url_tse_divulga:
            local.urlTseDivulga ||
            `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2024/2045202024/64777/${local.sq}`,
          camara_gru_url:
            local.camaraGruUrl ||
            (local.cargoCodigo === 'vereador'
              ? 'https://www.guarulhos.sp.leg.br/vereadores'
              : 'https://www.guarulhos.sp.gov.br'),
          biografia: paragrafosBio.join('\n\n'),
        },
      },
      mandatos: [
        {
          id: local.mandatoId,
          pessoa_id: local.pessoaId,
          inicio: '2025-01-01',
          fim: '2028-12-31',
          situacao: 'em_exercicio',
          condicao: 'titular',
          fonte_id: null,
          cargo: { codigo: local.cargoCodigo, nome: local.cargoNome },
          localidade: { nome: 'Guarulhos', sigla: 'GRU' },
          partido: { sigla: local.partido },
          orgao: {
            nome: local.cargoCodigo === 'vereador' ? 'Câmara Municipal de Guarulhos' : 'Prefeitura Municipal de Guarulhos',
            sigla: local.cargoCodigo === 'vereador' ? 'CMG' : 'PMG',
          },
        },
      ],
      candidaturas: [
        {
          id: `cand-${local.sq}`,
          votos: local.votos,
          resultado: 'eleito',
          situacao: 'Deferido',
          numero_candidato: local.numeroUrna,
          fonte_id: null,
          eleicao: { ano: 2024, turno: 1 },
          cargo: { nome: local.cargoNome },
          circunscricao: { nome: 'Guarulhos', sigla: 'GRU' },
          partido: { sigla: local.partido },
        },
      ],
      filiacoes: [
        {
          id: `fil-${local.sq}`,
          inicio: '2024-04-01',
          fim: null,
          partido: { sigla: local.partido, nome: local.partido },
        },
      ],
    };
  },
};
