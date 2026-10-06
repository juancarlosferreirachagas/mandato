import { ImportProviderRegistry, type ImportProvider, type ItemImportado } from './provider';

/**
 * Provedor genérico: recebe um JSON array de linhas já no formato da tabela alvo.
 * Serve para o primeiro carregamento oficial manual (ex.: CSV do TSE convertido).
 * Não contém dados — apenas valida a forma.
 */
export function jsonProvider(entidade: ImportProvider['entidade']): ImportProvider {
  return {
    id: `manual.json.${entidade}`,
    entidade,
    descricao: `Array JSON de ${entidade} (formato da tabela alvo)`,
    parse(input: string): ItemImportado[] {
      let data: unknown;
      try {
        data = JSON.parse(input);
      } catch {
        throw new Error('JSON inválido.');
      }
      if (!Array.isArray(data)) throw new Error('O JSON deve ser um array de objetos.');
      return data.map((row) =>
        row && typeof row === 'object' && !Array.isArray(row)
          ? { payload: row as Record<string, unknown> }
          : { payload: {}, erros: ['Linha não é um objeto.'] },
      );
    },
  };
}

export const importRegistry = new ImportProviderRegistry();
(['pessoas', 'partidos', 'candidaturas', 'mandatos'] as const).forEach((e) => importRegistry.register(jsonProvider(e)));
