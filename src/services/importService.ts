import { db } from '@/database/client';
import { importRegistry } from '@/imports/registry';

/** Grava itens parseados em staging. Não toca nas tabelas finais. */
export const importService = {
  providers: () => importRegistry.list(),

  async stage(providerId: string, input: string, fonteId: string, descricao?: string) {
    const provider = importRegistry.get(providerId);
    if (!provider) throw new Error(`Provedor desconhecido: ${providerId}`);
    if (!fonteId) throw new Error('Todo lote de importação precisa de uma fonte cadastrada.');

    const itens = await provider.parse(input);
    const client = db();
    const { data: userData } = await client.auth.getUser();

    const { data: lote, error } = await client
      .from('import_lotes')
      .insert({
        provedor: provider.id,
        entidade: provider.entidade,
        descricao: descricao ?? null,
        fonte_id: fonteId,
        total_itens: itens.length,
        criado_por: userData.user?.id ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;

    const CHUNK = 500;
    for (let i = 0; i < itens.length; i += CHUNK) {
      const rows = itens.slice(i, i + CHUNK).map((it, j) => ({
        lote_id: lote.id,
        indice: i + j,
        payload: it.payload,
        status: it.erros?.length ? 'invalido' : 'pendente',
        erros: it.erros ?? null,
      }));
      const { error: e2 } = await client.from('import_itens').insert(rows);
      if (e2) throw e2;
    }
    return { loteId: lote.id as string, total: itens.length };
  },

  async lotes(limit = 50) {
    const { data, error } = await db().from('import_lotes').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
