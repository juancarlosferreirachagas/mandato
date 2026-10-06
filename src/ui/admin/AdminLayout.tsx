import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authRepository } from '@/repositories/adminRepositories';

export function AdminLayout() {
  const nav = useNavigate();
  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/admin" className="brand"><span className="brand__mark">M</span><span className="brand__name">MANDATO · Admin</span></Link>
          <nav className="nav">
            <NavLink end to="/admin" className="nav__link">Início</NavLink>
            <NavLink to="/admin/fontes" className="nav__link">Fontes</NavLink>
            <NavLink to="/admin/importacoes" className="nav__link">Importações</NavLink>
            <NavLink to="/admin/auditoria" className="nav__link">Auditoria</NavLink>
          </nav>
          <button className="btn btn--ghost" onClick={async () => { await authRepository.signOut(); nav('/'); }}>Sair</button>
        </div>
      </header>
      <main className="container main"><Outlet /></main>
    </div>
  );
}
