import { db } from '@/database/client';
import { ELEITOS_GUARULHOS_TSE_2024 } from '@/database/contingenciaPoliticosGuarulhos';
import { ATOS_LEGISLATIVOS_RECENTES, LEIS_MUNICIPAIS_SANCIONADAS_REAIS } from '@/domain/diariosCatalogoReal';

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
  urlExterna?: string | null;
}

async function safeQuery<T>(fn: () => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const r = await fn();
    if (r.error) return [];
    return r.data ?? [];
  } catch {
    return [];
  }
}

function semAcento(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function criarPadroesAutoria(eleito: any): RegExp[] {
  if (eleito.cargoCodigo === 'prefeito') {
    return [/poder executivo/i];
  }
  if (eleito.cargoCodigo !== 'vereador') {
    return [];
  }

  const nomeUrna = semAcento(eleito.nome)
    .replace(/^(delegado|dr\.?|pr\.?|prof\.?|pastor)\s+/i, '')
    .trim();
  const partesCivil = semAcento(eleito.nomeCivil).split(' ').filter((p) => p.length > 2);
  const candidatos = new Set<string>();

  if (nomeUrna.length >= 4) candidatos.add(nomeUrna);
  // Trata casos como "daniel alves o capivara" -> "daniel alves"
  if (nomeUrna.includes(' o ')) {
    const base = nomeUrna.split(' o ')[0].trim();
    if (base.length >= 5) candidatos.add(base);
  }
  if (partesCivil.length >= 2) {
    candidatos.add(`${partesCivil[0]} ${partesCivil[1]}`);
    candidatos.add(`${partesCivil[0]} ${partesCivil[partesCivil.length - 1]}`);
  }

  return [...candidatos].map((termo) => {
    const esc = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${esc}\\b`, 'i');
  });
}

/**
 * Cruza o representante municipal com as Leis Sancionadas no DOM-GRU (2025–2026)
 * e com as proposições recentes protocoladas na Câmara Municipal de Guarulhos.
 */
export function obterAtosMunicipaisDoRepresentante(pessoaId: string): LinhaAba[] {
  const eleito = (ELEITOS_GUARULHOS_TSE_2024 as any[]).find((e) => e.pessoaId === pessoaId);
  if (!eleito) return [];

  const padroes = criarPadroesAutoria(eleito);
  if (padroes.length === 0) return [];

  const resultados: LinhaAba[] = [];

  for (const lei of LEIS_MUNICIPAIS_SANCIONADAS_REAIS) {
    const autNorm = semAcento(lei.autoria);
    if (padroes.some((re) => re.test(autNorm))) {
      resultados.push({
        id: `lei-mun-${lei.numero}`,
        titulo: `Projeto de Lei aprovado — Lei Municipal nº ${lei.numeroFmt} (${lei.dataBr})`,
        subtitulo: `${lei.ementa} (${lei.autoria})`,
        data: lei.dataIso,
        badge: `Lei sancionada · DOM #${lei.codigoDom}`,
        fonteId: null,
        urlExterna: lei.pdfUrl,
      });
    }
  }

  if (eleito.cargoCodigo === 'vereador') {
    for (let i = 0; i < ATOS_LEGISLATIVOS_RECENTES.length; i++) {
      const ato = ATOS_LEGISLATIVOS_RECENTES[i];
      const resNorm = semAcento(`${ato.titulo} ${ato.resumo}`);
      if (padroes.some((re) => re.test(resNorm))) {
        resultados.push({
          id: `ato-cmg-${ato.protocolo ?? i}`,
          titulo: `${ato.titulo} (${ato.dataBr})`,
          subtitulo: ato.resumo,
          data: ato.dataIso,
          badge: `Protocolado na Câmara · Prot. ${ato.protocolo ?? 'CMG'}`,
          fonteId: null,
          urlExterna: ato.url,
        });
      }
    }
  }

  return resultados;
}

export const abasRepository = {
  async propostas(pessoaId: string): Promise<LinhaAba[]> {
    const rows = (await safeQuery(() =>
      db()
        .from('proposta_autores')
        .select('id, papel, fonte_id, proposta:propostas(tipo,numero,ano,ementa,situacao,data_apresentacao,id_externo)')
        .eq('pessoa_id', pessoaId),
    )) as any[];
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        titulo: `${r.proposta.tipo} ${r.proposta.numero ?? ''}/${r.proposta.ano ?? ''}`,
        subtitulo: r.proposta.ementa,
        data: r.proposta.data_apresentacao,
        badge: `${r.papel} · ${r.proposta.situacao ?? 'sem situação'}`,
        fonteId: r.fonte_id,
        urlExterna: r.proposta.id_externo?.startsWith('http') ? r.proposta.id_externo : null,
      }));
    }
    return obterAtosMunicipaisDoRepresentante(pessoaId);
  },

  async votacoes(pessoaId: string): Promise<LinhaAba[]> {
    const rows = (await safeQuery(() =>
      db()
        .from('votos')
        .select('id, voto, fonte_id, votacao:votacoes(data,descricao,resultado), mandato:mandatos!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId),
    )) as any[];
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
    const rows = (await safeQuery(() =>
      db()
        .from('presencas')
        .select('id, data_sessao, tipo_sessao, situacao, justificativa, fonte_id, mandato:mandatos!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId)
        .order('data_sessao', { ascending: false })
        .limit(200),
    )) as any[];
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
    const rows = (await safeQuery(() =>
      db()
        .from('proposta_emendas')
        .select('id, tipo, numero, ementa, valor, situacao, data, fonte_id, mandato:mandatos!autor_mandato_id!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId),
    )) as any[];
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
    const rows = (await safeQuery(() =>
      db()
        .from('membros_comissoes')
        .select('id, papel, inicio, fim, fonte_id, comissao:comissoes(nome,sigla), mandato:mandatos!inner(pessoa_id)')
        .eq('mandato.pessoa_id', pessoaId),
    )) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: r.comissao.nome,
      subtitulo: `${r.inicio ?? '?'} → ${r.fim ?? 'atual'}`,
      badge: r.papel,
      fonteId: r.fonte_id,
    }));
  },

  async promessas(pessoaId: string): Promise<LinhaAba[]> {
    const rows = (await safeQuery(() =>
      db()
        .from('promessas')
        .select('id, texto, contexto, data_declaracao, promessa_fontes(fonte_id), avaliacoes:promessa_avaliacoes(status,fonte_id)')
        .eq('pessoa_id', pessoaId),
    )) as any[];
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
    const rows = (await safeQuery(() =>
      db().from('processos').select('id, tribunal, numero, classe, situacao, posicao_declarada, fonte_id').eq('pessoa_id', pessoaId),
    )) as any[];
    return rows.map((r) => ({
      id: r.id,
      titulo: `${r.classe ?? 'Processo'} ${r.numero ?? ''}`.trim(),
      subtitulo: [r.tribunal, r.posicao_declarada && `Posição declarada: ${r.posicao_declarada}`].filter(Boolean).join(' — '),
      badge: r.situacao,
      fonteId: r.fonte_id,
    }));
  },
};
