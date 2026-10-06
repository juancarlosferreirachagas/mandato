import { db } from '@/database/client';
import type { Fonte, NovaFonte, LinhaAuditoria, PapelUsuario } from '@/domain/types';

export const fonteRepository = {
  async list(limit = 100): Promise<Fonte[]> {
    const { data, error } = await db().from('fontes').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Fonte[];
  },
  async getMany(ids: string[]): Promise<Fonte[]> {
    if (ids.length === 0) return [];
    const { data, error } = await db().from('fontes').select('*').in('id', ids);
    if (error) throw error;
    return (data ?? []) as Fonte[];
  },
  async create(f: NovaFonte): Promise<Fonte> {
    const { data, error } = await db().from('fontes').insert(f).select().single();
    if (error) throw error;
    return data as Fonte;
  },
};

export const auditoriaRepository = {
  async recentes(limit = 100): Promise<LinhaAuditoria[]> {
    const { data, error } = await db().from('audit_log').select('*').order('alterado_em', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as LinhaAuditoria[];
  },
};

export const authRepository = {
  async signIn(email: string, password: string) {
    const { error } = await db().auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() {
    await db().auth.signOut();
  },
  async session() {
    const { data } = await db().auth.getSession();
    return data.session;
  },
  onChange(cb: () => void) {
    const { data } = db().auth.onAuthStateChange(() => cb());
    return () => data.subscription.unsubscribe();
  },
  async papel(): Promise<PapelUsuario | null> {
    const s = await this.session();
    if (!s) return null;
    const { data, error } = await db().from('perfis').select('papel').eq('user_id', s.user.id).maybeSingle();
    if (error) throw error;
    return (data?.papel as PapelUsuario) ?? 'leitor';
  },
};
