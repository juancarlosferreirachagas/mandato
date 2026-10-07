/**
 * Serviço de Integração com a API Oficial de Dados Abertos da Câmara dos Deputados
 * Documentação Swagger: https://dadosabertos.camara.leg.br/swagger/api.html
 * Base URL: https://dadosabertos.camara.leg.br/api/v2
 */

const BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2';

export interface CamaraDeputadoDetalhe {
  id: number;
  uri: string;
  nomeCivil: string;
  ultimoStatus: {
    id: number;
    nome: string;
    siglaPartido: string;
    uriPartido: string;
    siglaUf: string;
    idLegislatura: number;
    urlFoto: string;
    email: string | null;
    situacao: string;
    condicaoEleitoral: string;
    gabinete: {
      nome: string;
      predio: string;
      sala: string;
      andar: string;
      telefone: string;
      email: string;
    } | null;
  };
  cpf?: string;
  sexo: string;
  urlWebsite?: string | null;
  redeSocial?: string[];
  dataNascimento: string;
  dataFalecimento?: string | null;
  ufNascimento: string;
  municipioNascimento: string;
  escolaridade: string;
}

export interface CamaraDespesa {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string | null;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
}

export interface CamaraProposicao {
  id: number;
  uri: string;
  siglaTipo: string;
  codTipo: number;
  numero: number;
  ano: number;
  ementa: string;
}

export interface CamaraVotacao {
  id: string;
  uri: string;
  dataHoraRegistro: string;
  siglaOrgao: string;
  uriOrgao: string;
  proposicaoObjeto: string;
  voto: string; // "Sim", "Não", "Abstenção", "Artigo 17", "Obstrução"
}

export interface CamaraOrgao {
  idOrgao: number;
  uriOrgao: string;
  siglaOrgao: string;
  nomeOrgao: string;
  titulo: string; // Ex: "Membro", "Presidente", "Suplente"
  dataInicio: string;
  dataFim: string | null;
}

export interface CamaraDiscurso {
  dataHoraInicio: string;
  dataHoraFim: string;
  uriEvento: string;
  faseEvento: string;
  tipoDiscurso: string;
  sumario: string;
  transcricao: string;
}

export const camaraService = {
  /**
   * Obtém os detalhes oficiais completos de um deputado federal
   * Swagger: GET /deputados/{id}
   */
  async getDeputado(id: number): Promise<CamaraDeputadoDetalhe | null> {
    try {
      const res = await fetch(`${BASE_URL}/deputados/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.dados as CamaraDeputadoDetalhe;
    } catch {
      return null;
    }
  },

  /**
   * Obtém as despesas e cota parlamentar mais recentes do deputado
   * Swagger: GET /deputados/{id}/despesas
   */
  async getDespesas(id: number, ano?: number): Promise<CamaraDespesa[]> {
    try {
      const anoConsulta = ano || new Date().getFullYear();
      const res = await fetch(
        `${BASE_URL}/deputados/${id}/despesas?ano=${anoConsulta}&ordem=DESC&ordenarPor=dataDocumento&itens=25`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.dados ?? []) as CamaraDespesa[];
    } catch {
      return [];
    }
  },

  /**
   * Obtém os projetos e proposições de autoria do deputado
   * Swagger: GET /proposicoes?idDeputadoAutor={id}
   */
  async getProposicoes(id: number): Promise<CamaraProposicao[]> {
    try {
      const res = await fetch(
        `${BASE_URL}/proposicoes?idDeputadoAutor=${id}&ordem=DESC&ordenarPor=ano&itens=25`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.dados ?? []) as CamaraProposicao[];
    } catch {
      return [];
    }
  },

  /**
   * Obtém os órgãos e comissões que o deputado integra
   * Swagger: GET /deputados/{id}/orgaos
   */
  async getOrgaos(id: number): Promise<CamaraOrgao[]> {
    try {
      const res = await fetch(`${BASE_URL}/deputados/${id}/orgaos?ordem=DESC&ordenarPor=dataInicio&itens=25`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.dados ?? []) as CamaraOrgao[];
    } catch {
      return [];
    }
  },

  /**
   * Obtém os discursos e pronunciamentos mais recentes em plenário
   * Swagger: GET /deputados/{id}/discursos
   */
  async getDiscursos(id: number): Promise<CamaraDiscurso[]> {
    try {
      const res = await fetch(
        `${BASE_URL}/deputados/${id}/discursos?ordem=DESC&ordenarPor=dataHoraInicio&itens=15`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.dados ?? []) as CamaraDiscurso[];
    } catch {
      return [];
    }
  },
};
