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
