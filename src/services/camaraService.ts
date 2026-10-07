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

export interface CamaraProposicao {
  id: number;
  uri: string;
  siglaTipo: string;
  codTipo: number;
  numero: number;
  ano: number;
  ementa: string;
  dataApresentacao?: string;
}

export interface CamaraOrgao {
  idOrgao: number;
  uriOrgao: string;
  siglaOrgao: string;
  nomeOrgao: string;
  nomePublicacao?: string | null;
  titulo: string; // Ex: "Membro", "Presidente", "Suplente", "Titular"
  dataInicio: string;
  dataFim: string | null;
}

export interface CamaraFrente {
  id: number;
  uri: string;
  titulo: string;
  idLegislatura: number;
}

export interface CamaraProfissao {
  dataHora: string;
  codTipoProfissao: number;
  titulo: string;
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
   * Obtém os projetos e proposições de autoria do deputado
   * Swagger: GET /proposicoes?idDeputadoAutor={id}
   */
  async getProposicoes(id: number): Promise<CamaraProposicao[]> {
    try {
      const res = await fetch(
        `${BASE_URL}/proposicoes?idDeputadoAutor=${id}&ordem=DESC&ordenarPor=ano&itens=50`,
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
      const res = await fetch(`${BASE_URL}/deputados/${id}/orgaos?ordem=DESC&ordenarPor=dataInicio&itens=50`, {
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
   * Obtém as frentes parlamentares que o deputado integra
   * Swagger: GET /deputados/{id}/frentes
   */
  async getFrentes(id: number): Promise<CamaraFrente[]> {
    try {
      const res = await fetch(`${BASE_URL}/deputados/${id}/frentes`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.dados ?? []) as CamaraFrente[];
    } catch {
      return [];
    }
  },

  /**
   * Obtém as profissões registradas do deputado
   * Swagger: GET /deputados/{id}/profissoes
   */
  async getProfissoes(id: number): Promise<CamaraProfissao[]> {
    try {
      const res = await fetch(`${BASE_URL}/deputados/${id}/profissoes`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.dados ?? []) as CamaraProfissao[];
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
        `${BASE_URL}/deputados/${id}/discursos?ordem=DESC&ordenarPor=dataHoraInicio&itens=20`,
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
