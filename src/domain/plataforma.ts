/**
 * ============================================================================
 * FATOS CONSOLIDADOS DA PLATAFORMA — FISCALIZA GUARULHOS
 * ============================================================================
 *
 * Fonte única de verdade para números e links que aparecem em várias telas
 * (menu, rodapé, Home, Decretos & Diários, Fontes…). Todos os contadores são
 * calculados diretamente dos catálogos oficiais validados.
 * ============================================================================
 */

import {
  ACERVO_DIARIOS_EXECUTIVO,
  ACERVO_DIARIOS_LEGISLATIVO,
  CATALOGO_DECRETOS_SUPLEMENTARES_REAIS,
  DOCS_INSTITUCIONAIS_LEGISLATIVO,
  EXTRATOS_CONTRATOS_DOM_REAIS,
  LEIS_MUNICIPAIS_SANCIONADAS_REAIS,
  RESUMO_VALIDACAO_ACERVO,
} from './diariosCatalogoReal';

export const PLATAFORMA = {
  nome: 'Fiscaliza Guarulhos',
  municipio: 'Guarulhos',
  ibge: '3518800',
  /** Censo IBGE — usado nas contas "por morador" */
  populacao: 1_291_771,
  populacaoRotulo: '1,29 milhão',
  vereadores: 34,
  siteUrl: 'https://fiscalizaguarulhos.vercel.app',
  siteHost: 'fiscalizaguarulhos.vercel.app',
} as const;

/** Quantidades reais calculadas diretamente do acervo validado (2025 e 2026). */
export const QTD_DECRETOS = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.length;
export const QTD_DECRETOS_SUPLEMENTARES = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter(
  (d) => (d.modalidade ?? 'SUPLEMENTAR') === 'SUPLEMENTAR'
).length;
export const QTD_DECRETOS_REMANEJAMENTO = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter(
  (d) => d.modalidade === 'REMANEJAMENTO'
).length;
export const QTD_DIARIOS_EXECUTIVO = ACERVO_DIARIOS_EXECUTIVO.length;
export const QTD_PDFS_EXECUTIVO = RESUMO_VALIDACAO_ACERVO.executivo.qtdArquivosPdf;
export const QTD_DIARIOS_LEGISLATIVO = ACERVO_DIARIOS_LEGISLATIVO.length;
export const QTD_DIARIOS = QTD_DIARIOS_EXECUTIVO + QTD_DIARIOS_LEGISLATIVO;
export const QTD_LEIS_SANCIONADAS = LEIS_MUNICIPAIS_SANCIONADAS_REAIS.length;
export const QTD_EXTRATOS_CONTRATOS = EXTRATOS_CONTRATOS_DOM_REAIS.length;
export const QTD_DOCS_INSTITUCIONAIS_LEG = DOCS_INSTITUCIONAIS_LEGISLATIVO.length;
export const TAMANHO_ACERVO_MB = RESUMO_VALIDACAO_ACERVO.executivo.tamanhoTotalMb;
export const PAGINAS_EXECUTIVO_TOTAL = RESUMO_VALIDACAO_ACERVO.executivo.totalPaginas;

/** Links oficiais externos (sempre abrir em nova aba com rel="noopener"). */
export const LINKS_OFICIAIS = {
  tce: 'https://transparencia.tce.sp.gov.br/municipio/guarulhos',
  diarioOficial: 'https://www.guarulhos.sp.gov.br/diario-oficial/pesquisar_diario.php',
  diarioExecutivoCalendario: 'https://diariooficial.guarulhos.sp.gov.br/index.php',
  diarioLegislativo: 'https://www.guarulhos.sp.leg.br/dol',
  prefeitura: 'https://www.guarulhos.sp.gov.br',
  camara: 'https://www.guarulhos.sp.leg.br/vereadores',
  camaraAtividade: 'https://www.guarulhos.sp.leg.br/documentos/tipo:legislativo-2/subtipo:projeto-de-lei-20',
  tse: 'https://divulgacandcontas.tse.jus.br/divulga/#/municipios/2024/2045202024/64777/candidatos',
  ibge: 'https://cidades.ibge.gov.br/brasil/sp/guarulhos/panorama',
} as const;

/** Monta o link oficial da Receita Federal para consulta pública do CNPJ. */
export function urlConsultaCnpj(cnpj?: string | null): string | null {
  const limpo = (cnpj ?? '').replace(/\D/g, '');
  if (limpo.length !== 14) return null;
  return `https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp?cnpj=${limpo}`;
}
