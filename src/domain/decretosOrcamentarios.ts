/**
 * ============================================================================
 * MÓDULO DE DOMÍNIO: DECRETOS ORÇAMENTÁRIOS E DIÁRIOS OFICIAIS
 * Projeto: Fiscaliza Guarulhos (Escopo 100% Municipal — IBGE 3518800)
 * ============================================================================
 *
 * !!! ATENÇÃO — DADOS DE DEMONSTRAÇÃO !!!
 * Os decretos, edições, valores e fichas orçamentárias abaixo são um CONJUNTO
 * ILUSTRATIVO usado para validar o layout e o modelo de dados. Eles NÃO foram
 * extraídos do Diário Oficial real de Guarulhos e NÃO devem ser tomados como
 * fatos. A interface exibe um aviso permanente enquanto
 * `DECRETOS_SAO_DEMONSTRATIVOS` for `true`.
 * Para torná-los reais é preciso implementar a extração do DOM-GRU (scraper +
 * conferência manual com o PDF original) e então desligar a flag.
 *
 * OBJETIVO ARQUITETURAL:
 * Modelar decretos de alteração orçamentária (créditos adicionais) mostrando
 * DE ONDE SAIU e PARA ONDE FOI o recurso, conforme a Lei Federal nº 4.320/1964.
 *
 * FUNDAMENTAÇÃO CONTÁBIL E JURÍDICA (Lei Federal nº 4.320/1964 e LRF):
 * - Art. 40 a 46 da Lei 4.320/1964: Define os Créditos Adicionais (autorizações
 *   de despesa não computadas ou insuficientemente dotadas na Lei Orçamentária
 *   Anual - LOA).
 * - Art. 43, § 1º da Lei 4.320/1964: Exige que todo decreto de abertura de
 *   crédito suplementar ou especial indique obrigatoriamente a FONTE DE RECURSOS
 *   ("De onde saiu") que custeará a suplementação ("Para onde foi"):
 *     I   - Superávit Financeiro apurado em balanço patrimonial do exercício anterior;
 *     II  - Excesso de Arrecadação verificado na tendência do exercício;
 *     III - Anulação Parcial ou Total de dotações orçamentárias ou de créditos;
 *     IV  - Operações de Crédito autorizadas em lei.
 *
 * CONFORMIDADE EDITORIAL E LGPD:
 * - Princípio: FATO → FONTE → DADOS AUDITÁVEIS.
 * - Linguagem técnica, neutra e objetiva (padrão NBC TA / Normas Brasileiras de
 *   Contabilidade Aplicadas ao Setor Público - MCASP / TCE-SP).
 * ============================================================================
 */

/**
 * Enquanto `true`, toda a interface avisa que os decretos são ilustrativos.
 * Só desligar depois que a extração real do Diário Oficial estiver conferida.
 */
export const DECRETOS_SAO_DEMONSTRATIVOS = true;

/**
 * Modalidades legais de origem de recursos para abertura de créditos adicionais,
 * conforme tipificado no Art. 43, § 1º da Lei Federal nº 4.320/1964.
 */
export type TipoOrigemRecursoDecreto =
  | 'ANULACAO_DOTACAO'       // Art. 43, § 1º, III - Retirada de uma área/ficha para reforçar outra
  | 'EXCESSO_ARRECADACAO'    // Art. 43, § 1º, II  - Receita arrecadada acima do previsto na LOA
  | 'SUPERAVIT_FINANCEIRO'   // Art. 43, § 1º, I   - Saldo positivo em caixa do exercício anterior
  | 'REMANEJAMENTO_INTERNO'; // Art. 167, VI CF/88 - Realocação dentro do mesmo órgão/categoria

/**
 * Representa uma rubrica/dotação de ORIGEM ("De onde saiu o dinheiro").
 * Documenta a unidade orçamentária, a classificação funcional-programática,
 * a natureza da despesa (ou receita, no caso de excesso) e o valor deduzido.
 */
export interface MovimentoOrigemDecreto {
  /** Nome legível da Secretaria, Fundo ou Reserva de onde o recurso foi retirado */
  orgaoOrigem: string;
  /** Código da classificação funcional-programática ou rubrica contábil (padrão Audesp) */
  dotacaoCodigo: string;
  /** Descrição oficial da ação, projeto ou atividade que cedeu o recurso */
  acaoProgramatica: string;
  /** Elemento de despesa ou natureza contábil (ex.: 4.4.90.51.00 - Obras e Instalações) */
  elementoNatureza: string;
  /** Fonte de recurso vinculada ou livre (ex.: 01 - Tesouro Municipal, 02 - Transferências Estaduais, 05 - Federal) */
  fonteRecurso: string;
  /** Valor em Reais (R$) anulado ou utilizado como lastro financeiro */
  valor: number;
  /** Explicação em linguagem simples para o cidadão sobre o que significa essa retirada */
  impactoOrigemCidadao: string;
}

/**
 * Representa uma rubrica/dotação de DESTINO ("Para onde foi o dinheiro").
 * Documenta a unidade beneficiada, a ação suplementada e o vínculo com a execução real.
 */
export interface MovimentoDestinoDecreto {
  /** Nome da Secretaria, Autarquia ou Fundo que recebeu o reforço orçamentário */
  orgaoDestino: string;
  /** Área temática cidadã associada (ex.: Saúde, Transporte, Limpeza Urbana, Educação) */
  areaTematica: string;
  /** Código da classificação funcional-programática suplementada */
  dotacaoCodigo: string;
  /** Descrição oficial do programa/ação governamental reforçado */
  acaoProgramatica: string;
  /** Elemento de despesa reforçado (ex.: 3.3.90.39.00 - Outros Serviços de Terceiros - PJ) */
  elementoNatureza: string;
  /** Fonte de recurso (mantém a rastreabilidade do carimbo orçamentário) */
  fonteRecurso: string;
  /** Valor em Reais (R$) adicionado à dotação */
  valor: number;
  /** Explicação prática do que esse dinheiro paga na cidade */
  aplicacaoPraticaCidadao: string;
  /** Termo de filtro para cruzar diretamente com os pagamentos reais no módulo /despesas */
  filtroFornecedorRelacionado: string;
}

/**
 * Estrutura completa de um Decreto Orçamentário extraído do Diário Oficial de Guarulhos.
 * Inclui metadados de publicação, trilha de auditoria SHA-256, movimentos de
 * origem ("De onde saiu") e destino ("Para onde foi") e parecer técnico didático.
 */
export interface DecretoOrcamentarioAuditado {
  /** Identificador único interno do decreto para indexação e chaves React */
  id: string;
  /** Número oficial do Decreto Executivo Municipal (ex.: "Decreto nº 41.812/2026") */
  numeroDecreto: string;
  /** Data oficial de assinatura e publicação no Diário Oficial (formato ISO YYYY-MM-DD) */
  dataPublicacao: string;
  /** Número da edição do Diário Oficial do Município de Guarulhos (DOM-GRU) */
  edicaoDiarioOficial: string;
  /** Página(s) do caderno executivo onde o ato foi publicado */
  paginaDiario: string;
  /** Modalidade contábil da alteração segundo a Lei 4.320/1964 */
  tipoOrigem: TipoOrigemRecursoDecreto;
  /** Rótulo resumido da modalidade para exibição em badges executivos */
  rotuloModalidade: string;
  /** Base legal invocada no preâmbulo do decreto (LOA + Lei 4.320/64) */
  baseLegal: string;
  /** Valor total movimentado pelo decreto em Reais (R$) */
  valorTotal: number;
  /** Título executivo direto resumindo a movimentação ("De X para Y") */
  tituloObjetivo: string;
  /** Explicação completa em linguagem cidadã ("Sem Economês") */
  resumoExplicativo: string;
  /** Nota técnica de auditoria padrão mercado (TCE-SP / NBC TA) */
  parecerAuditoriaTecnica: string;
  /** Lista de dotações ou fontes de onde o recurso saiu (Origem / Anulação) */
  origens: MovimentoOrigemDecreto[];
  /** Lista de dotações para onde o recurso foi direcionado (Destino / Suplementação) */
  destinos: MovimentoDestinoDecreto[];
  /** Identificador de referência ou hash de trilha de auditoria */
  hashIntegridadeSha256?: string;
  /** URL oficial do portal do Diário Oficial de Guarulhos para conferência pública */
  urlDiarioOficial: string;
}

/**
 * Estrutura que representa uma Edição Extraída do Diário Oficial do Município
 * de Guarulhos (DOM-GRU), garantindo rastreabilidade documental completa.
 */
export interface EdicaoDiarioExtraido {
  /** Identificador da edição */
  id: string;
  /** Número da edição oficial da Imprensa Oficial de Guarulhos */
  numeroEdicao: string;
  /** Data de circulação oficial (ISO YYYY-MM-DD) */
  dataPublicacao: string;
  /** Caderno / Seção do Diário Oficial */
  caderno: string;
  /** Quantidade total de páginas da edição analisada pelo pipeline ETL */
  totalPaginas: number;
  /** Quantidade de decretos orçamentários, portarias e extratos contratuais extraídos */
  atosExtraidos: number;
  /** Código de referência da coleta/lote */
  checksumArquivo?: string;
  /** Destaques objetivos do que foi publicado naquela edição */
  destaquesEdicao: string[];
  /** Link direto para consulta da edição no portal oficial da Prefeitura de Guarulhos */
  urlPortalDom: string;
}

/**
 * Catálogo das Edições Extraídas do Diário Oficial do Município de Guarulhos (DOM-GRU)
 * no exercício corrente, com validação cruzada junto ao TCE-SP.
 */
export const DIARIOS_OFICIAIS_EXTRAIDOS: EdicaoDiarioExtraido[] = [
  {
    id: 'dom-gru-2026-08-28',
    numeroEdicao: 'Edição nº 2.948 — Ano XXV',
    dataPublicacao: '2026-08-28',
    caderno: 'Caderno Executivo I — Atos do Prefeito & Secretaria da Fazenda',
    totalPaginas: 42,
    atosExtraidos: 14,
    destaquesEdicao: [
      'Decreto nº 41.894/2026 — Suplementação de R$ 28,4 milhões para Gestão Hospitalar e UPAs (Saúde)',
      'Extratos de Empenho do Fundo Municipal de Saúde concilados com o lote 08/2026 do TCE-SP',
      'Demonstrativo Bimestral do RREO (Relatório Resumido da Execução Orçamentária - LRF)',
    ],
    urlPortalDom: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dom-gru-2026-07-31',
    numeroEdicao: 'Edição nº 2.927 — Ano XXV',
    dataPublicacao: '2026-07-31',
    caderno: 'Caderno Executivo I — Finanças, Mobilidade e Limpeza Urbana',
    totalPaginas: 38,
    atosExtraidos: 11,
    destaquesEdicao: [
      'Decreto nº 41.840/2026 — Remanejamento de R$ 19,6 milhões para Coleta de Resíduos e Limpeza Urbana',
      'Decreto nº 41.835/2026 — Crédito Suplementar de R$ 15,2 milhões para Subsídio Tarifário do Transporte Coletivo',
      'Portarias de designação de fiscais de contrato (Lei Federal nº 14.133/2021)',
    ],
    urlPortalDom: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dom-gru-2026-06-26',
    numeroEdicao: 'Edição nº 2.902 — Ano XXV',
    dataPublicacao: '2026-06-26',
    caderno: 'Caderno Executivo I — Educação (FUNDEB) e Infraestrutura',
    totalPaginas: 54,
    atosExtraidos: 19,
    destaquesEdicao: [
      'Decreto nº 41.788/2026 — Aplicação de Superávit do FUNDEB e Alimentação Escolar (R$ 24,8 milhões)',
      'Termos de Homologação de Pregões Eletrônicos de Manutenção Escolar e Uniformes',
    ],
    urlPortalDom: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dom-gru-2026-05-29',
    numeroEdicao: 'Edição nº 2.881 — Ano XXV',
    dataPublicacao: '2026-05-29',
    caderno: 'Caderno Executivo I — Obras Viárias, Drenagem e Previdência (IPREM)',
    totalPaginas: 36,
    atosExtraidos: 9,
    destaquesEdicao: [
      'Decreto nº 41.721/2026 — Crédito Adicional por Excesso de Arrecadação para Drenagem e Pavimentação (R$ 16,5 milhões)',
      'Decreto nº 41.710/2026 — Adequação de Dotação Intra-Orçamentária para Encargos Previdenciários (IPREM - R$ 31,0 milhões)',
    ],
    urlPortalDom: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dom-gru-2026-03-27',
    numeroEdicao: 'Edição nº 2.839 — Ano XXV',
    dataPublicacao: '2026-03-27',
    caderno: 'Caderno Executivo I — Programação Financeira e Cronograma Mensal de Desembolso',
    totalPaginas: 48,
    atosExtraidos: 16,
    destaquesEdicao: [
      'Decreto nº 41.615/2026 — Abertura de Crédito Suplementar para Tecnologia, Semáforos e Segurança Viária (R$ 9,4 milhões)',
      'Balanço Orçamentário do 1º Bimestre enviado ao Sistema AUDESP do TCE-SP',
    ],
    urlPortalDom: 'https://www.guarulhos.sp.gov.br',
  },
];

/**
 * Base consolidada e comentada dos Decretos Orçamentários de Guarulhos.
 * Cada registro detalha com precisão cirúrgica:
 *   1. DE ONDE SAIU (Unidade, Dotação, Elemento, Fonte e Valor deduzido)
 *   2. PARA ONDE FOI (Unidade, Dotação, Elemento, Fonte, Valor acrescido e Fornecedores relacionados)
 *   3. PARECER DE AUDITORIA (Conformidade com a Lei 4.320/1964 e impacto prático).
 */
export const DECRETOS_ORCAMENTARIOS_AUDITADOS: DecretoOrcamentarioAuditado[] = [
  {
    id: 'dec-41894-2026',
    numeroDecreto: 'Decreto Executivo nº 41.894/2026',
    dataPublicacao: '2026-08-28',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.948',
    paginaDiario: 'Págs. 3 a 5',
    tipoOrigem: 'ANULACAO_DOTACAO',
    rotuloModalidade: 'Suplementação por Anulação (Art. 43, §1º, III)',
    baseLegal: 'Lei Federal nº 4.320/1964 (Art. 43, § 1º, Inciso III) c/c Lei Orçamentária Anual de Guarulhos (LOA 2026)',
    valorTotal: 28400000,
    tituloObjetivo: 'Retirada de Reserva Administrativa e Obras Não Iniciadas → Reforço para Hospitais Municipais e UPAs',
    resumoExplicativo:
      'Este decreto remanejou R$ 28,4 milhões do orçamento municipal. O recurso saiu de dotações de obras administrativas ainda em fase de licitação e de reserva operacional da Administração Geral e foi transferido para o Fundo Municipal de Saúde, garantindo o pagamento de contratos de gestão hospitalar (HMU, HMC e UPAs) e aquisição de insumos médicos.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo: A anulação parcial de dotações de investimentos não iniciados para custeio de serviços essenciais de saúde de caráter contínuo respeita o equilíbrio orçamentário entre fontes do Tesouro Municipal (Fonte 01). Os empenhos subsequentes aparecem liquidados no TCE-SP na função 10 (Saúde).',
    origens: [
      {
        orgaoOrigem: 'Secretaria Municipal de Obras e Infraestrutura',
        dotacaoCodigo: '15.451.0012.1042 — Ficha Orçamentária 418',
        acaoProgramatica: 'Reforma e Modernização de Prédios Administrativos Municipais',
        elementoNatureza: '4.4.90.51.00 — Obras e Instalações',
        fonteRecurso: '01 — Tesouro Municipal (Recursos Próprios Livres)',
        valor: 18900000,
        impactoOrigemCidadao:
          'Saldo de obras prediais administrativas cujo cronograma físico-financeiro não seria executado neste trimestre.',
      },
      {
        orgaoOrigem: 'Secretaria Municipal de Administração e Modernização',
        dotacaoCodigo: '04.122.0002.2008 — Ficha Orçamentária 112',
        acaoProgramatica: 'Suporte Operacional e Locação de Equipamentos Administrativos',
        elementoNatureza: '3.3.90.39.00 — Outros Serviços de Terceiros (Pessoa Jurídica)',
        fonteRecurso: '01 — Tesouro Municipal (Recursos Próprios Livres)',
        valor: 9500000,
        impactoOrigemCidadao:
          'Economia contratual obtida em pregões de custeio administrativo interno dos prédios da Prefeitura.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'Secretaria Municipal da Saúde (Fundo Municipal de Saúde)',
        areaTematica: 'Saúde & Hospitais',
        dotacaoCodigo: '10.302.0004.2018 — Ficha Orçamentária 604',
        acaoProgramatica: 'Manutenção da Assistência Hospitalar e Urgência/Emergência (HMU, HMC, Policlínicas e UPAs)',
        elementoNatureza: '3.3.90.39.00 / 3.3.50.85.00 — Contratos de Gestão e Serviços Médico-Hospitalares',
        fonteRecurso: '01 — Tesouro Municipal (Vinculação Constitucional Saúde - Art. 198 CF/88)',
        valor: 22000000,
        aplicacaoPraticaCidadao:
          'Custeio de plantões médicos, enfermagem, exames e funcionamento 24h dos hospitais municipais e unidades de pronto atendimento.',
        filtroFornecedorRelacionado: 'SAUDE',
      },
      {
        orgaoDestino: 'Secretaria Municipal da Saúde (Fundo Municipal de Saúde)',
        areaTematica: 'Saúde & Medicamentos',
        dotacaoCodigo: '10.303.0004.2022 — Ficha Orçamentária 629',
        acaoProgramatica: 'Assistência Farmacêutica e Insumos Estratégicos da Rede Básica (UBS)',
        elementoNatureza: '3.3.90.30.00 — Material de Consumo (Medicamentos e Insumos)',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 6400000,
        aplicacaoPraticaCidadao:
          'Compra de medicamentos distribuídos gratuitamente nas farmácias das 69 UBS de Guarulhos.',
        filtroFornecedorRelacionado: 'FARMAC',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dec-41840-2026',
    numeroDecreto: 'Decreto Executivo nº 41.840/2026',
    dataPublicacao: '2026-07-31',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.927',
    paginaDiario: 'Págs. 2 a 4',
    tipoOrigem: 'ANULACAO_DOTACAO',
    rotuloModalidade: 'Suplementação por Anulação (Art. 43, §1º, III)',
    baseLegal: 'Lei Federal nº 4.320/1964 (Art. 43, § 1º, Inciso III) c/c Autorização da LOA Guarulhos 2026',
    valorTotal: 19600000,
    tituloObjetivo: 'Anulação de Reserva de Contingência e Estudos Técnicos → Coleta de Lixo, Varrição e Limpeza Urbana',
    resumoExplicativo:
      'Movimentação de R$ 19,6 milhões retirada de dotações de consultorias/estudos técnicos não contratados e reserva operacional para reforçar a dotação de Manejo de Resíduos Sólidos da Secretaria de Serviços Públicos, cobrindo medições mensais de coleta domiciliar de lixo, operação de ecopontos e destinação em aterro sanitário.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo: Contratos de limpeza urbana e coleta de resíduos estão entre os maiores desembolsos contínuos do município (Função 15 - Urbanismo / Subfunção 452 - Serviços Urbanos). A suplementação garante lastro orçamentário para os empenhos liquidados em favor das concessionárias de limpeza.',
    origens: [
      {
        orgaoOrigem: 'Encargos Gerais do Município / Reserva Operacional',
        dotacaoCodigo: '99.999.0099.9999 — Ficha Orçamentária 980',
        acaoProgramatica: 'Reserva de Contingência e Ajustes de Programação Financeira',
        elementoNatureza: '9.9.99.99.00 — Reserva de Contingência / Dotação Global',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 14200000,
        impactoOrigemCidadao:
          'Fundo de reserva orçamentária previsto na LOA justamente para cobrir variações de contratos contínuos.',
      },
      {
        orgaoOrigem: 'Secretaria Municipal de Desenvolvimento Urbano',
        dotacaoCodigo: '15.121.0010.2051 — Ficha Orçamentária 340',
        acaoProgramatica: 'Estudos, Projetos Executivos e Consultorias Urbanísticas',
        elementoNatureza: '3.3.90.35.00 — Serviços de Consultoria',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 5400000,
        impactoOrigemCidadao:
          'Verba originalmente prevista para contratação de estudos externos que foram adiados pela administração.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'Secretaria Municipal de Serviços Públicos (Limpeza Urbana)',
        areaTematica: 'Limpeza Urbana & Zeladoria',
        dotacaoCodigo: '15.452.0014.2064 — Ficha Orçamentária 512',
        acaoProgramatica: 'Coleta, Transporte, Tratamento e Destinação Final de Resíduos Sólidos Domiciliares',
        elementoNatureza: '3.3.90.39.00 — Outros Serviços de Terceiros (Pessoa Jurídica)',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 19600000,
        aplicacaoPraticaCidadao:
          'Pagamento dos caminhões coletores de lixo que passam nos bairros, varrição de ruas e operação dos Ecopontos.',
        filtroFornecedorRelacionado: 'SUSTENTARE',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dec-41835-2026',
    numeroDecreto: 'Decreto Executivo nº 41.835/2026',
    dataPublicacao: '2026-07-31',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.927',
    paginaDiario: 'Págs. 6 e 7',
    tipoOrigem: 'EXCESSO_ARRECADACAO',
    rotuloModalidade: 'Excesso de Arrecadação (Art. 43, §1º, II)',
    baseLegal: 'Lei Federal nº 4.320/1964 (Art. 43, § 1º, Inciso II e § 3º) — Excesso de Arrecadação de ISS e Rendimentos',
    valorTotal: 15200000,
    tituloObjetivo: 'Excesso de Arrecadação de ISS e Receita Patrimonial → Subsídio das Linhas Municipais de Ônibus',
    resumoExplicativo:
      'Como a arrecadação municipal de ISS (Imposto Sobre Serviços) e rendimentos bancários superou a estimativa inicial da lei orçamentária no semestre, a Prefeitura abriu crédito adicional de R$ 15,2 milhões utilizando esse excesso de arrecadação para custear a compensação tarifária (subsídio) às empresas concessionárias de ônibus municipais.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo: O Art. 43, § 3º da Lei 4.320/64 exige a demonstração da tendência de excesso de arrecadação no exercício. Os valores suplementados foram integralmente direcionados à Função 26 (Transporte), refletindo nos pagamentos auditados das viações urbanas de Guarulhos.',
    origens: [
      {
        orgaoOrigem: 'Tesouro Municipal — Excesso de Arrecadação Tributária (ISSQN)',
        dotacaoCodigo: 'Receita 1.1.1.8.02.3.1 — ISSQN e Receita Patrimonial 1.3.2.1.01',
        acaoProgramatica: 'Arrecadação Efetiva Acima da Estimativa da LOA no 1º Semestre de 2026',
        elementoNatureza: 'Receita Corrente Tributária e Patrimonial (Superávit de Execução)',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 15200000,
        impactoOrigemCidadao:
          'Dinheiro novo que entrou no caixa da Prefeitura acima do planejado graças ao movimento econômico de serviços na cidade.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'Secretaria Municipal de Mobilidade e Transportes (STMU)',
        areaTematica: 'Transporte & Mobilidade',
        dotacaoCodigo: '26.453.0018.2089 — Ficha Orçamentária 741',
        acaoProgramatica: 'Subvenção Econômica e Equilíbrio Tarifário do Sistema de Transporte Coletivo Municipal',
        elementoNatureza: '3.3.60.45.00 — Subvenções Econômicas / Concessões de Transporte',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 15200000,
        aplicacaoPraticaCidadao:
          'Cobre a diferença entre o custo operacional dos ônibus municipais e o valor da passagem paga pelo passageiro (gratuidades de idosos, estudantes e integração).',
        filtroFornecedorRelacionado: 'VIACAO',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dec-41788-2026',
    numeroDecreto: 'Decreto Executivo nº 41.788/2026',
    dataPublicacao: '2026-06-26',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.902',
    paginaDiario: 'Págs. 1 a 3',
    tipoOrigem: 'SUPERAVIT_FINANCEIRO',
    rotuloModalidade: 'Superávit Financeiro Vinculado (Art. 43, §1º, I)',
    baseLegal: 'Lei Federal nº 4.320/1964 (Art. 43, § 1º, Inciso I) c/c Lei Federal nº 14.113/2020 (Novo FUNDEB)',
    valorTotal: 24800000,
    tituloObjetivo: 'Superávit Financeiro Carimbado da Educação → Alimentação Escolar (Merenda) e Reforma de Escolas/Creches',
    resumoExplicativo:
      'Utilização de R$ 24,8 milhões que sobraram em conta bancária específica da Educação e transferências do FNDE/FUNDEB na virada do exercício. Por lei federal, esse dinheiro é "carimbado" e só pode ser gasto na Educação: foi alocado em alimentação escolar (merenda das EPGs) e manutenção predial de creches e escolas.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo — vinculação constitucional (Art. 212 CF/88): Recursos das Fontes 02 (Transferências Estaduais Vinculadas) e 05 (Transferências Federais - FNDE/PNAE) possuem destinação exclusiva. A auditoria confirma que 100% do crédito aberto permaneceu na Função 12 (Educação).',
    origens: [
      {
        orgaoOrigem: 'Fundo Municipal de Educação — Superávit em Conta Vinculada (Balanço Anterior)',
        dotacaoCodigo: 'Ativo Financeiro Vinculado — Fontes 02 e 05 (FUNDEB / Salário-Educação / PNAE)',
        acaoProgramatica: 'Saldo Financeiro Positivo Apurado em Balanço Patrimonial da Educação',
        elementoNatureza: 'Superávit Financeiro de Transferências Constitucionais da Educação',
        fonteRecurso: '02 / 05 — Transferências Vinculadas da Educação (FUNDEB e FNDE)',
        valor: 24800000,
        impactoOrigemCidadao:
          'Saldo que já estava guardado nas contas bancárias exclusivas da Educação Municipal aguardando incorporação ao orçamento de 2026.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'Secretaria Municipal de Educação',
        areaTematica: 'Educação & Merenda Escolar',
        dotacaoCodigo: '12.306.0006.2034 — Ficha Orçamentária 278',
        acaoProgramatica: 'Fornecimento de Alimentação Escolar e Nutrição para a Rede Municipal de Ensino',
        elementoNatureza: '3.3.90.30.00 / 3.3.90.39.00 — Gêneros Alimentícios e Logística de Merenda',
        fonteRecurso: '05 — Transferências Federais Vinculadas (PNAE / Salário-Educação)',
        valor: 14500000,
        aplicacaoPraticaCidadao:
          'Compra de alimentos, proteínas, hortifrúti e preparo da merenda servida diariamente aos mais de 115 mil alunos das escolas da Prefeitura.',
        filtroFornecedorRelacionado: 'ALIMENT',
      },
      {
        orgaoDestino: 'Secretaria Municipal de Educação',
        areaTematica: 'Educação & Infraestrutura Escolar',
        dotacaoCodigo: '12.365.0006.1015 — Ficha Orçamentária 245',
        acaoProgramatica: 'Reforma, Ampliação e Manutenção Preventiva de Creches e Escolas Municipais (EPGs)',
        elementoNatureza: '4.4.90.51.00 — Obras e Instalações Escolares',
        fonteRecurso: '02 — Transferências Estaduais / Quota Municipal FUNDEB',
        valor: 10300000,
        aplicacaoPraticaCidadao:
          'Conserto de telhados, revisão elétrica, pintura e acessibilidade nas escolas e creches municipais.',
        filtroFornecedorRelacionado: 'CONSTRU',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dec-41721-2026',
    numeroDecreto: 'Decreto Executivo nº 41.721/2026',
    dataPublicacao: '2026-05-29',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.881',
    paginaDiario: 'Págs. 4 e 5',
    tipoOrigem: 'EXCESSO_ARRECADACAO',
    rotuloModalidade: 'Excesso de Arrecadação & Repasses (Art. 43, §1º, II)',
    baseLegal: 'Lei Federal nº 4.320/1964 (Art. 43, § 1º, Inciso II) — Transferências de Capital e Tributos Imobiliários',
    valorTotal: 16500000,
    tituloObjetivo: 'Repasses de Convênios e Arrecadação de IPTU/ITBI → Obras Contra Enchentes, Drenagem e Recapeamento',
    resumoExplicativo:
      'Abertura de crédito suplementar de R$ 16,5 milhões financiado por repasses de convênios de infraestrutura e arrecadação imobiliária acima da meta trimestral. O valor foi destinado diretamente para obras de macrodrenagem (combate a enchentes em córregos da cidade) e recapeamento asfáltico de corredores viários.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo: Diferentemente de despesas correntes de custeio, este decreto amplia o ativo de infraestrutura urbana (Elemento 4.4.90.51 - Obras e Instalações). Recomenda-se o cruzamento com as medições das construtoras contratadas na aba Fornecedores.',
    origens: [
      {
        orgaoOrigem: 'Tesouro Municipal & Transferências de Convênios de Infraestrutura',
        dotacaoCodigo: 'Receita 1.1.1.8.01.1.1 (IPTU/ITBI) e 2.4.1.8.10 (Transferências de Convênios)',
        acaoProgramatica: 'Ingresso Efetivo de Recursos de Convênios e Tributos Patrimoniais',
        elementoNatureza: 'Receita de Capital e Tributária Vinculada a Investimentos',
        fonteRecurso: '01 — Tesouro Municipal / 02 — Convênios Estaduais',
        valor: 16500000,
        impactoOrigemCidadao:
          'Recursos vindos de convênios para obras e da arrecadação de IPTU/ITBI do primeiro quadrimestre.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'Secretaria Municipal de Obras / Serviços Públicos',
        areaTematica: 'Obras, Asfalto & Drenagem',
        dotacaoCodigo: '15.451.0012.1028 — Ficha Orçamentária 409',
        acaoProgramatica: 'Pavimentação, Recapeamento Viário e Obras de Macrodrenagem Urbana',
        elementoNatureza: '4.4.90.51.00 — Obras e Instalações de Infraestrutura',
        fonteRecurso: '01 / 02 — Tesouro e Convênios de Infraestrutura',
        valor: 16500000,
        aplicacaoPraticaCidadao:
          'Obras de canalização/desassoreamento de córregos contra alagamentos e recapeamento de avenidas de grande circulação.',
        filtroFornecedorRelacionado: 'ENGENHARIA',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dec-41710-2026',
    numeroDecreto: 'Decreto Executivo nº 41.710/2026',
    dataPublicacao: '2026-05-29',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.881',
    paginaDiario: 'Págs. 8 e 9',
    tipoOrigem: 'REMANEJAMENTO_INTERNO',
    rotuloModalidade: 'Remanejamento Intra-Orçamentário (Previdência)',
    baseLegal: 'Lei Federal nº 4.320/1964 c/c Portaria STN/SOF nº 163/2001 (Operações Intra-Orçamentárias - Modalidade 91)',
    valorTotal: 31000000,
    tituloObjetivo: 'Ajuste de Dotações de Pessoal entre Secretarias → Pagamento de Aposentadorias e Pensões do IPREM',
    resumoExplicativo:
      'Movimentação interna de R$ 31,0 milhões entre fichas de encargos patronais das secretarias municipais e o Instituto de Previdência dos Funcionários Públicos Municipais de Guarulhos (IPREM). Não altera o total do orçamento da cidade: apenas transfere a cota patronal obrigatória para garantir o pagamento em dia dos servidores municipais aposentados e pensionistas.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo: No painel de Despesas do Fiscaliza Guarulhos, este fluxo é corretamente classificado como "Repasse Interno (Órgão Público)" para evitar dupla contagem com os pagamentos feitos a fornecedores privados externos.',
    origens: [
      {
        orgaoOrigem: 'Secretarias Municipais Diversas (Administração, Educação e Saúde)',
        dotacaoCodigo: '04.122.0002.2001 / 12.361.0006.2030 — Encargos Patronais',
        acaoProgramatica: 'Contribuição Patronal Previdenciária ao Regime Próprio (RPPS)',
        elementoNatureza: '3.1.91.13.00 — Obrigações Patronais Intra-Orçamentárias',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 31000000,
        impactoOrigemCidadao:
          'Parcela obrigatória que a Prefeitura recolhe mensalmente sobre a folha de pagamento dos servidores ativos.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'IPREM — Instituto de Previdência dos Funcionários Públicos Municipais de Guarulhos',
        areaTematica: 'Previdência Municipal (IPREM)',
        dotacaoCodigo: '09.272.0020.2105 — Ficha Orçamentária 890',
        acaoProgramatica: 'Pagamento de Proventos de Aposentadorias e Pensões do Regime Próprio Municipal',
        elementoNatureza: '3.1.90.01.00 / 3.1.90.03.00 — Aposentadorias e Pensões',
        fonteRecurso: '04 — Recursos Próprios da Administração Indireta / RPPS',
        valor: 31000000,
        aplicacaoPraticaCidadao:
          'Garante o pagamento mensal dos professores, médicos, guardas e demais servidores aposentados da Prefeitura de Guarulhos.',
        filtroFornecedorRelacionado: 'INSTITUTO DE PREVID',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
  {
    id: 'dec-41615-2026',
    numeroDecreto: 'Decreto Executivo nº 41.615/2026',
    dataPublicacao: '2026-03-27',
    edicaoDiarioOficial: 'DOM-GRU Edição nº 2.839',
    paginaDiario: 'Págs. 11 e 12',
    tipoOrigem: 'ANULACAO_DOTACAO',
    rotuloModalidade: 'Suplementação por Anulação (Art. 43, §1º, III)',
    baseLegal: 'Lei Federal nº 4.320/1964 (Art. 43, § 1º, Inciso III) c/c Lei Municipal de Diretrizes Orçamentárias (LDO)',
    valorTotal: 9400000,
    tituloObjetivo: 'Anulação de Eventos e Publicidade Institucional → Semáforos Inteligentes, Fiscalização e Vale-Alimentação',
    resumoExplicativo:
      'Redução de R$ 9,4 milhões nas dotações de eventos institucionais, comunicação e serviços gráficos para reforçar contratos de manutenção semafórica/sinalização viária da cidade e a cobertura do benefício de auxílio-alimentação dos servidores operacionais.',
    parecerAuditoriaTecnica:
      'Texto ilustrativo: A realocação de despesas discricionárias de comunicação/eventos para manutenção viária e benefícios obrigatórios de recursos humanos apresenta alta aderência ao princípio da economicidade (Art. 70 da Constituição Federal).',
    origens: [
      {
        orgaoOrigem: 'Secretaria Municipal de Comunicação e Eventos Institucionais',
        dotacaoCodigo: '04.131.0003.2014 — Ficha Orçamentária 165',
        acaoProgramatica: 'Divulgação Institucional, Serviços Gráficos e Apoio a Eventos',
        elementoNatureza: '3.3.90.39.00 — Outros Serviços de Terceiros (Pessoa Jurídica)',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 9400000,
        impactoOrigemCidadao:
          'Corte em verbas de eventos, impressos e divulgação institucional da Prefeitura.',
      },
    ],
    destinos: [
      {
        orgaoDestino: 'Secretaria Municipal de Mobilidade e Transportes (Trânsito)',
        areaTematica: 'Trânsito & Sinalização',
        dotacaoCodigo: '15.452.0018.2084 — Ficha Orçamentária 718',
        acaoProgramatica: 'Operação, Manutenção Semafórica e Sinalização Horizontal/Vertical de Vias',
        elementoNatureza: '3.3.90.39.00 — Serviços de Engenharia de Tráfego',
        fonteRecurso: '01 / 03 — Tesouro e Fundo Municipal de Trânsito',
        valor: 5100000,
        aplicacaoPraticaCidadao:
          'Manutenção dos semáforos nos cruzamentos, pintura de faixas de pedestres e placas de trânsito.',
        filtroFornecedorRelacionado: 'SINAL',
      },
      {
        orgaoDestino: 'Secretaria Municipal de Gestão e Recursos Humanos',
        areaTematica: 'Servidores & Benefícios',
        dotacaoCodigo: '04.122.0002.2005 — Ficha Orçamentária 104',
        acaoProgramatica: 'Concessão de Auxílio-Alimentação e Cesta Básica aos Servidores Municipais',
        elementoNatureza: '3.3.90.46.00 — Auxílio-Alimentação',
        fonteRecurso: '01 — Tesouro Municipal',
        valor: 4300000,
        aplicacaoPraticaCidadao:
          'Recarga do cartão de vale-alimentação utilizado pelos servidores públicos municipais.',
        filtroFornecedorRelacionado: 'SODEXO',
      },
    ],
    urlDiarioOficial: 'https://www.guarulhos.sp.gov.br',
  },
];

/**
 * Helper puro de domínio que calcula métricas agregadas de todos os decretos
 * auditados para exibição em KPIs executivos.
 */
export function calcularResumoDecretos(lista: DecretoOrcamentarioAuditado[]) {
  const totalMovimentado = lista.reduce((acc, d) => acc + d.valorTotal, 0);
  const porAnulacao = lista
    .filter((d) => d.tipoOrigem === 'ANULACAO_DOTACAO')
    .reduce((acc, d) => acc + d.valorTotal, 0);
  const porExcessoOuSuperavit = lista
    .filter((d) => d.tipoOrigem === 'EXCESSO_ARRECADACAO' || d.tipoOrigem === 'SUPERAVIT_FINANCEIRO')
    .reduce((acc, d) => acc + d.valorTotal, 0);
  const porRemanejamentoIntra = lista
    .filter((d) => d.tipoOrigem === 'REMANEJAMENTO_INTERNO')
    .reduce((acc, d) => acc + d.valorTotal, 0);

  return {
    quantidadeDecretos: lista.length,
    totalMovimentado,
    porAnulacao,
    porExcessoOuSuperavit,
    porRemanejamentoIntra,
  };
}

