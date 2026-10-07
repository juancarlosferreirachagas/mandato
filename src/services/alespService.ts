/**
 * Serviço de Integração com os Dados Abertos da ALESP (Assembleia Legislativa do Estado de São Paulo)
 * Base URL: https://www.al.sp.gov.br/repositorioDados
 */

export interface AlespDeputadoDetalhe {
  id: string;
  nomeParlamentar: string;
  nomeCompleto: string;
  partido: string;
  fotoUrl: string;
  email: string;
  gabinete: string;
  telefone: string;
  sala: string;
  biografia?: string;
}

export const alespService = {
  getFotoUrl(alespId: string): string {
    return `https://www.al.sp.gov.br/repositorio/deputados/fotos/${alespId}.jpg`;
  },

  getPaginaOficialUrl(alespId: string): string {
    return `https://www.al.sp.gov.br/deputado/?matricula=${alespId}`;
  },
};
