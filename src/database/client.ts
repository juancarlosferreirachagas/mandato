import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://yusuaphkgbytgplfrddf.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3VhcGhrZ2J5dGdwbGZyZGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTcxNzgsImV4cCI6MjEwNjg5MzE3OH0.NE7GpCZgxWN3rCv5TKCd20MGI5zs900iXygP4q2m2wo';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export class NotConfiguredError extends Error {
  constructor() {
    super('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.');
    this.name = 'NotConfiguredError';
  }
}

const client: SupabaseClient = createClient(url, anonKey);

/** Único ponto de acesso ao cliente. Repositories dependem disto, a UI não. */
export function db(): SupabaseClient {
  return client;
}

/**
 * Traduz erros crus do fetch/Supabase em mensagens acionáveis.
 * "TypeError: Failed to fetch" significa que o navegador nem chegou ao servidor
 * (DNS, projeto Supabase pausado/removido, rede offline ou bloqueio de CORS) —
 * não é erro de SQL nem da função consultada.
 */
export function mensagemErroConsulta(nome: string, causa: unknown): string {
  const texto = causa instanceof Error ? `${causa.name}: ${causa.message}` : String(causa);
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(texto)) {
    return `Sem conexão com o banco de dados (consulta ${nome}). O servidor não respondeu: verifique sua internet ou se o projeto Supabase está ativo.`;
  }
  return `Falha ao consultar ${nome}: ${texto}`;
}
