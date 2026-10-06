/**
 * Camada de abstração de importação.
 *
 * Fluxo: ImportProvider (lê/parseia fonte externa) -> staging (import_lotes/import_itens)
 *        -> revisão humana no admin -> aplicação (próxima etapa).
 *
 * NENHUM provedor real (TSE, Câmara, Senado, ALESP) está implementado ainda.
 * Eles serão adicionados em src/imports/providers/ implementando ImportProvider.
 */

export type EntidadeImportavel =
  | 'pessoas' | 'partidos' | 'candidaturas' | 'mandatos' | 'propostas' | 'votacoes' | 'votos' | 'presencas';

export interface ItemImportado {
  /** Linha normalizada, já no formato esperado pela tabela alvo. */
  payload: Record<string, unknown>;
  erros?: string[];
}

export interface ImportProvider {
  /** Identificador estável, ex.: 'tse.candidaturas', 'manual.json'. */
  readonly id: string;
  readonly entidade: EntidadeImportavel;
  readonly descricao: string;
  /** Converte a entrada bruta (arquivo/texto) em itens normalizados. Não grava nada. */
  parse(input: string): Promise<ItemImportado[]> | ItemImportado[];
}

export class ImportProviderRegistry {
  private providers = new Map<string, ImportProvider>();
  register(p: ImportProvider) {
    if (this.providers.has(p.id)) throw new Error(`Provedor duplicado: ${p.id}`);
    this.providers.set(p.id, p);
  }
  get(id: string) {
    return this.providers.get(id);
  }
  list() {
    return [...this.providers.values()];
  }
}
