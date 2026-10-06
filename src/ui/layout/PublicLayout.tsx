import { Link, NavLink, Outlet } from 'react-router-dom';
import { SECOES } from '../navigation';
import { isSupabaseConfigured } from '@/database/client';

export function PublicLayout() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand" aria-label="MANDATO — página inicial">
            <span className="brand__mark" aria-hidden>M</span>
            <span className="brand__name">MANDATO</span>
          </Link>
          <nav className="nav" aria-label="Principal">
            {SECOES.map((s) => (
              <NavLink key={s.path} to={`/${s.path}`} className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}>
                {s.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/admin" className="btn btn--ghost">Admin</Link>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <div className="banner" role="status">
          Supabase não configurado — copie <code>.env.example</code> para <code>.env</code> e preencha as chaves. Nenhum dado é simulado.
        </div>
      )}

      <main className="container main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <strong>MANDATO</strong> — plataforma independente. Fato → Fonte → Interpretação. Nenhum político é classificado, rotulado ou
          julgado pela plataforma.
        </div>
      </footer>
    </div>
  );
}
