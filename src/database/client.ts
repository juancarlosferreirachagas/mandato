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

/**
 * Circuit-breaker rápido para evitar atrasos e dezenas de erros de rede no navegador
 * quando o cluster remoto Supabase estiver pausado ou sem resolução DNS.
 * Na primeira falha de rede, marca offline por 5 minutos e responde em 0 ms,
 * acionando imediatamente os snapshots locais oficiais validados.
 */
let offlineAteTimestamp = 0;
const COOLDOWN_OFFLINE_MS = 5 * 60 * 1000;
const TIMEOUT_PRIMEIRA_CHAMADA_MS = 2200;

const fetchComCircuitBreaker: typeof fetch = async (input, init) => {
  if (Date.now() < offlineAteTimestamp) {
    throw new TypeError('Failed to fetch (contingência local ativa)');
  }

  const ctrl = new AbortController();
  const timer = globalThis.setTimeout(() => ctrl.abort(), TIMEOUT_PRIMEIRA_CHAMADA_MS);
  try {
    return await globalThis.fetch(input, {
      ...init,
      signal: init?.signal ?? ctrl.signal,
    });
  } catch (err) {
    offlineAteTimestamp = Date.now() + COOLDOWN_OFFLINE_MS;
    throw err;
  } finally {
    globalThis.clearTimeout(timer);
  }
};

const client: SupabaseClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchComCircuitBreaker },
});

/** Único ponto de acesso ao cliente. Repositories dependem disto, a UI não. */
export function db(): SupabaseClient {
  return client;
}

export function mensagemErroConsulta(nome: string, causa: unknown): string {
  const texto = causa instanceof Error ? `${causa.name}: ${causa.message}` : String(causa);
  if (/failed to fetch|networkerror|load failed|fetch failed|abort/i.test(texto)) {
    return `Sem conexão com o banco remoto (consulta ${nome}). Contingência local acionada.`;
  }
  return `Falha ao consultar ${nome}: ${texto}`;
}
