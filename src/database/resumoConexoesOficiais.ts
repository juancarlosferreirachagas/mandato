/**
 * ============================================================================
 * RESUMO INTEGRAL DE EMPRESAS, INDICADORES DE AUDITORIA E CONEXÕES DOM
 * ============================================================================
 */

export interface ResumoModalidadeLicitacao {
  modalidade: string;
  total: number;
  qtdPagamentos: number;
  qtdEmpresas: number;
}

export const RESUMO_CONEXOES_OFICIAIS = {
  "geradoEm": "2026-11-27T01:59:28.910Z",
  "totalCredoresUnicos": 6741,
  "totalCredoresExternos": 6723,
  "totalPagamentos2025": 38874,
  "totalPagamentos2026": 27971,
  "totalConexoesDom": 1071,
  "totalEmpresasConectadasDom": 626,
  "tiposAtoDom": {
    "CONTRATO": 22,
    "CONVENIO": 18,
    "ATO_OFICIAL": 258,
    "PORTARIA_FISCAL": 734,
    "ADITIVO": 19,
    "DISPENSA": 12,
    "HOMOLOGACAO": 5,
    "ATA_RP": 3
  },
  "modalidadesLicitacao2026": [
    {
      "modalidade": "Não aplicável / Outros",
      "total": 1459483950.21,
      "qtdPagamentos": 13088,
      "qtdEmpresas": 2709
    },
    {
      "modalidade": "Pregão",
      "total": 867479113,
      "qtdPagamentos": 4593,
      "qtdEmpresas": 567
    },
    {
      "modalidade": "Concorrência",
      "total": 428520416.69,
      "qtdPagamentos": 366,
      "qtdEmpresas": 43
    },
    {
      "modalidade": "CONCURSO",
      "total": 117033066.17,
      "qtdPagamentos": 3996,
      "qtdEmpresas": 497
    },
    {
      "modalidade": "INEXIGÍVEL",
      "total": 62015293.8,
      "qtdPagamentos": 1756,
      "qtdEmpresas": 309
    },
    {
      "modalidade": "Dispensa de Licitação",
      "total": 50328551.01,
      "qtdPagamentos": 1867,
      "qtdEmpresas": 246
    }
  ],
  "indicadoresAuditoria": {
    "totalPagoExternosConsolidado": 6718285247.08,
    "top10Valor": 2482157711.03,
    "top10Percentual": 36.9,
    "top50Valor": 4725814681.98,
    "top50Percentual": 70.3,
    "contratacoesDiretas2026Valor": 112343844.81,
    "contratacoesDiretas2026Empresas": 555,
    "totalMovimentadoDecretos": 2828779855.07,
    "topSecretariasSuplementadas": [
      {
        "orgao": "Secretaria de Educação",
        "valor": 691029552.21,
        "qtd": 95
      },
      {
        "orgao": "Secretaria da Saúde",
        "valor": 566405837.12,
        "qtd": 172
      },
      {
        "orgao": "Transporte e Mobilidade Urbana",
        "valor": 341683844.83,
        "qtd": 30
      },
      {
        "orgao": "Encargos Gerais e Precatórios",
        "valor": 290699620.35,
        "qtd": 21
      },
      {
        "orgao": "Obras e Infraestrutura",
        "valor": 198755653.64,
        "qtd": 66
      },
      {
        "orgao": "Zeladoria e Administrações Regionais",
        "valor": 108853790.18,
        "qtd": 23
      }
    ],
    "topSecretariasCedentes": [
      {
        "orgao": "Encargos Gerais e Precatórios",
        "valor": 621404149,
        "qtd": 52
      },
      {
        "orgao": "Secretaria de Educação",
        "valor": 314191642.54,
        "qtd": 72
      },
      {
        "orgao": "Secretaria da Saúde",
        "valor": 197024780.86,
        "qtd": 45
      },
      {
        "orgao": "Transporte e Mobilidade Urbana",
        "valor": 76985715.62,
        "qtd": 20
      },
      {
        "orgao": "Zeladoria e Administrações Regionais",
        "valor": 55413303.09,
        "qtd": 14
      },
      {
        "orgao": "Gestão e Recursos Humanos",
        "valor": 46848684.01,
        "qtd": 14
      }
    ]
  }
} as const;
