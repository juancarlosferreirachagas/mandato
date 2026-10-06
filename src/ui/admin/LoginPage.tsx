import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authRepository } from '@/repositories/adminRepositories';
import { isSupabaseConfigured } from '@/database/client';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.logged) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authRepository.signIn(email, password);
      nav('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="card login__card" onSubmit={submit}>
        <h1 className="page-title">Admin MANDATO</h1>
        {!isSupabaseConfigured && <div className="alert alert--error">Supabase não configurado.</div>}
        <label>E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label>Senha<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <button className="btn" disabled={busy || !isSupabaseConfigured}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}
