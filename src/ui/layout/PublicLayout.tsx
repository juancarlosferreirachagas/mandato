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
            <span className="brand__tag">SP</span>
          </Link>

          <div className="nav-wrapper">
            <nav className="nav" aria-label="Navegação Principal">
              {SECOES.map((s) => (
                <NavLink
                  key={s.path}
                  to={`/${s.path}`}
                  className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
                >
                  {s.label}
                </NavLink>
              ))}
            </nav>
            <Link to="/admin" className="btn btn--ghost" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              ⚙️ Admin
            </Link>
          </div>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <div className="banner" role="status">
          Supabase não configurado — preencha as chaves no <code>.env</code>.
        </div>
      )}

      <main className="container main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <p style={{ marginBottom: '8px' }}>
            <strong>MANDATO</strong> — Observatório Político Factual e Independente.
          </p>
          <p className="muted small">
            Fato → Fonte → Interpretação. Todos os dados e fotos provêm dos portais oficiais de transparência da Câmara dos Deputados, ALESP, Senado Federal e TSE.
          </p>
        </div>
      </footer>
    </div>
  );
}
