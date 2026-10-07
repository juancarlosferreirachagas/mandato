/**
 * Registro factual e neutro das principais votações e propostas legislativas de impacto em SP e no Brasil.
 * Princípio: Fato → Fonte. Linguagem simples e explicativa para o cidadão comum.
 */

export interface VotacaoExplicada {
  id: string;
  codigoOficial: string;
  ano: number;
  tituloAmigavel: string;
  resumoCidadao: string;
  categoria: 'Economia' | 'Segurança' | 'Saúde' | 'Educação' | 'Trabalho' | 'Meio Ambiente' | 'Administração';
  orgao: 'Câmara dos Deputados' | 'ALESP' | 'Senado Federal';
  resultadoFinal: 'Aprovado' | 'Rejeitado' | 'Em tramitação' | 'Promulgado';
  dataVotacao: string;
  fonteOficialUrl: string;
  /** Mapa de votos por partido ou posição conhecida */
  orientacaoGeral?: string;
}

export interface PropostaExplicada {
  id: string;
  numero: string;
  ano: number;
  tituloAmigavel: string;
  textoExplicativo: string;
  oQueMuda: string;
  status: 'Aprovado' | 'Em análise na Comissão' | 'Aguardando Votação' | 'Vetado' | 'Sancionado';
  data: string;
  orgao: string;
  autores?: string[];
  linkOficial: string;
}

export const VOTACOES_IMPORTANTES: VotacaoExplicada[] = [
  {
    id: 'vot-reforma-tributaria',
    codigoOficial: 'PEC 45/2019 (Reforma Tributária)',
    ano: 2023,
    tituloAmigavel: 'Reforma Tributária sobre o Consumo',
    resumoCidadao: 'Unifica 5 impostos (PIS, Cofins, IPI, ICMS e ISS) em dois tributos sobre valor agregado (IBS e CBS) e cria a cesta básica nacional isenta de impostos.',
    categoria: 'Economia',
    orgao: 'Câmara dos Deputados',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-12-15',
    fonteOficialUrl: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2196833',
  },
  {
    id: 'vot-marco-fiscal',
    codigoOficial: 'PLP 93/2023 (Arcabouço Fiscal)',
    ano: 2023,
    tituloAmigavel: 'Novo Regime Fiscal Sustentável',
    resumoCidadao: 'Define novas regras para os gastos públicos do Governo Federal, limitando o crescimento das despesas a uma porcentagem do crescimento das receitas.',
    categoria: 'Economia',
    orgao: 'Câmara dos Deputados',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-08-22',
    fonteOficialUrl: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2358045',
  },
  {
    id: 'vot-marco-temporal',
    codigoOficial: 'PL 490/2007 (Marco Temporal de Terras Indígenas)',
    ano: 2023,
    tituloAmigavel: 'Marco Temporal para Demarcação de Terras',
    resumoCidadao: 'Estabelece que apenas terras ocupadas por povos indígenas até a data de 5 de outubro de 1988 (promulgação da Constituição) podem ser demarcadas.',
    categoria: 'Meio Ambiente',
    orgao: 'Câmara dos Deputados',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-05-30',
    fonteOficialUrl: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=345311',
  },
  {
    id: 'vot-igualdade-salarial',
    codigoOficial: 'PL 1085/2023 (Igualdade Salarial entre Mulheres e Homens)',
    ano: 2023,
    tituloAmigavel: 'Igualdade Salarial entre Homens e Mulheres',
    resumoCidadao: 'Obriga empresas com mais de 100 empregados a terem transparência salarial e estabelece multas severas para discriminação de gênero em funções idênticas.',
    categoria: 'Trabalho',
    orgao: 'Câmara dos Deputados',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-05-04',
    fonteOficialUrl: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2353496',
  },
  {
    id: 'vot-piso-enfermagem',
    codigoOficial: 'PLN 5/2023 (Recursos para o Piso da Enfermagem)',
    ano: 2023,
    tituloAmigavel: 'Liberação de Recursos para o Piso da Enfermagem',
    resumoCidadao: 'Destina R$ 7,3 bilhões do orçamento da União para viabilizar o pagamento do piso nacional salarial dos enfermeiros, técnicos e auxiliares nos estados e municípios.',
    categoria: 'Saúde',
    orgao: 'Câmara dos Deputados',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-04-26',
    fonteOficialUrl: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2356502',
  },
  {
    id: 'vot-privatizacao-sabesp',
    codigoOficial: 'PL 1501/2023 (Desestatização da SABESP - ALESP)',
    ano: 2023,
    tituloAmigavel: 'Desestatização e Concessão da SABESP em SP',
    resumoCidadao: 'Autorizou o Governo do Estado de São Paulo a alienar ações e transferir o controle acionário da Companhia de Saneamento Básico do Estado de São Paulo.',
    categoria: 'Administração',
    orgao: 'ALESP',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-12-06',
    fonteOficialUrl: 'https://www.al.sp.gov.br/propositura/?id=1000510523',
  },
  {
    id: 'vot-orcamento-sp-2024',
    codigoOficial: 'PL 1449/2023 (Orçamento Estadual de SP 2024 - ALESP)',
    ano: 2023,
    tituloAmigavel: 'Orçamento do Estado de São Paulo para 2024',
    resumoCidadao: 'Fixa a receita e despesas públicas do Estado de SP no valor recorde de R$ 328 bilhões para saúde, educação, segurança e infraestrutura.',
    categoria: 'Economia',
    orgao: 'ALESP',
    resultadoFinal: 'Aprovado',
    dataVotacao: '2023-12-20',
    fonteOficialUrl: 'https://www.al.sp.gov.br/propositura/?id=1000508912',
  },
];
