import { Navigate } from 'react-router-dom';
import { isSupabaseConfigured } from '@/database/client';
import { useAuth } from '../hooks/useAuth';
import { EmptyState, Loading } from '../components/common';

/** Guard de UX. A segurança real é a RLS no banco (is_staff()). */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!isSupabaseConfigured) return <div className="container main"><EmptyState title="Supabase não configurado" /></div>;
  if (auth.loading) return <div className="container main"><Loading /></div>;
  if (!auth.logged) return <Navigate to="/admin/login" replace />;
  if (!auth.isStaff) {
    return (
      <div className="container main">
        <EmptyState title="Acesso negado">Sua conta não possui papel de editor/admin. Peça a um administrador para ajustar sua linha em <code>perfis</code>.</EmptyState>
      </div>
    );
  }
  return <>{children}</>;
}
