import { useEffect, useState } from 'react';
import { authRepository } from '@/repositories/adminRepositories';
import { isSupabaseConfigured } from '@/database/client';
import type { PapelUsuario } from '@/domain/types';

export interface AuthState {
  loading: boolean;
  papel: PapelUsuario | null;
  logged: boolean;
  isStaff: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: isSupabaseConfigured, papel: null, logged: false, isStaff: false });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    const refresh = async () => {
      try {
        const session = await authRepository.session();
        const papel = session ? await authRepository.papel() : null;
        if (alive) setState({ loading: false, papel, logged: Boolean(session), isStaff: papel === 'editor' || papel === 'admin' });
      } catch {
        if (alive) setState({ loading: false, papel: null, logged: false, isStaff: false });
      }
    };
    void refresh();
    const off = authRepository.onChange(() => void refresh());
    return () => {
      alive = false;
      off();
    };
  }, []);

  return state;
}
