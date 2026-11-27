/**
 * ============================================================================
 * RESUMO INTEGRAL DE EMPRESAS, MODALIDADES E CONEXÕES DIÁRIO OFICIAL (2025–2026)
 * Gerado automaticamente a partir de:
 *   - 100% dos pagamentos TCE-SP (2025 completo + Jan–Set/2026)
 *   - 100% dos 222 PDFs oficiais do Diário Oficial (acervo-diarios/executivo/)
 * ============================================================================
 */

export interface ResumoModalidadeLicitacao {
  modalidade: string;
  total: number;
  qtdPagamentos: number;
  qtdEmpresas: number;
}

export const RESUMO_CONEXOES_OFICIAIS = {
  "geradoEm": "2026-11-27T00:43:48.659Z",
  "totalCredoresUnicos": 6741,
  "totalCredoresExternos": 6723,
  "totalPagamentos2025": 38874,
  "totalPagamentos2026": 27971,
  "totalConexoesDom": 1071,
  "totalEmpresasConectadasDom": 626,
  "tiposAtoDom": {
    "ATO_OFICIAL": 909,
    "CONTRATO": 133,
    "PORTARIA_FISCAL": 13,
    "DISPENSA": 12,
    "CONVENIO": 3,
    "ATA_RP": 1
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
  ]
} as const;
