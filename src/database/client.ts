import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export class NotConfiguredError extends Error {
  constructor() {
    super('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.');
    this.name = 'NotConfiguredError';
  }
}

const client: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

/** Único ponto de acesso ao cliente. Repositories dependem disto, a UI não. */
export function db(): SupabaseClient {
  if (!client) throw new NotConfiguredError();
  return client;
}
