/**
 * ============================================================================
 * LAYOUT PÚBLICO — FISCALIZA GUARULHOS
 * ============================================================================
 *
 * - Computador: cabeçalho fixo com menu horizontal.
 * - Celular/tablet: botão de menu abre uma gaveta lateral (com fundo escurecido,
 *   fecha com Esc, toque fora ou ao trocar de página) + barra inferior de
 *   acesso rápido, no estilo de aplicativo.
 * - Todos os links vêm de `navigation.ts` e `plataforma.ts` (fonte única).
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowRightLeft,
  Building2,
  Database,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  SECOES,
  SECOES_BARRA_INFERIOR,
  rotaDaSecao,
  secaoAtiva,
  type IconeSecaoId,
} from '../navigation';
import { StatusBanco } from '../components/StatusFontes';
import { isSupabaseConfigured } from '@/database/client';
import {
  LINKS_OFICIAIS,
  PLATAFORMA,
  QTD_DECRETOS,
  QTD_DIARIOS,
  QTD_DIARIOS_EXECUTIVO,
  QTD_DIARIOS_LEGISLATIVO,
} from '@/domain/plataforma';

function IconeSecao({ id, size = 16 }: { id: IconeSecaoId; size?: number }) {
  switch (id) {
    case 'home':
      return <LayoutDashboard size={size} aria-hidden />;
    case 'financas':
      return <TrendingUp size={size} aria-hidden />;
    case 'despesas':
      return <Building2 size={size} aria-hidden />;
    case 'decretos':
      return <ArrowRightLeft size={size} aria-hidden />;
    case 'politicos':
      return <Users size={size} aria-hidden />;
    case 'fontes':
      return <Database size={size} aria-hidden />;
    case 'privacidade':
      return <ShieldCheck size={size} aria-hidden />;
  }
}

/** Volta ao topo a cada troca de página (o React Router não faz isso sozinho). */
function RolarParaOTopo() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function Marca({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="brand" onClick={onClick} aria-label="Fiscaliza Guarulhos — página inicial">
      <img
        src="/bandeira-guarulhos.png"
        alt=""
        className="brand__flag"
        width="36"
        height="24"
      />
      <span className="brand__name">
        Fiscaliza <b>Guarulhos</b>
      </span>
    </Link>
  );
}

export function PublicLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();
  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const botaoFecharRef = useRef<HTMLButtonElement>(null);

  const fecharMenu = () => setMenuAberto(false);

  // Fecha a gaveta ao navegar
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // Gaveta aberta: trava a rolagem do fundo, aceita Esc e devolve o foco ao fechar
  useEffect(() => {
    if (!menuAberto) return;
    document.body.classList.add('fg-lock');
    botaoFecharRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    const botaoMenu = botaoMenuRef.current;
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
      botaoMenu?.focus({ preventScroll: true });
    };
  }, [menuAberto]);

  // Se a janela crescer para o layout de computador, a gaveta não deve ficar "presa" aberta
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1080px)');
    const aoMudar = () => mq.matches && setMenuAberto(false);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);

  const secoesBarra = SECOES.filter((s) => SECOES_BARRA_INFERIOR.includes(s.iconeId));

  return (
    <div className="shell">
      <RolarParaOTopo />
      <a href="#conteudo" className="fg-skip">
        Pular para o conteúdo
      </a>

      {/* Faixa de status: mostra que os dados estão carregando de fontes oficiais */}
      <div className="fg-live-strip" role="region" aria-label="Status dos dados">
        <div className="container fg-live-strip__inner">
          <div className="fg-live-strip__left">
            <StatusBanco compacto />
            <span className="fg-live-strip__sources">Dados oficiais: TCE-SP · Diário Oficial · Câmara · TSE</span>
          </div>
          <div className="fg-live-strip__right">
            <Link to="/decretos" className="fg-live-strip__link fg-live-strip__link--wide">
              <ArrowRightLeft size={12} aria-hidden />
              <span>
                {QTD_DECRETOS} decretos · {QTD_DIARIOS} diários
              </span>
            </Link>
            <Link to="/fontes" className="fg-live-strip__link">
              <Activity size={12} aria-hidden />
              <span>Ver fontes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cabeçalho */}
      <header className="topbar">
        <div className="container topbar__inner">
          <Marca onClick={fecharMenu} />

          <nav className="nav fg-nav-desktop" aria-label="Navegação principal">
            {SECOES.map((s) => (
              <NavLink
                key={s.path}
                to={rotaDaSecao(s)}
                end={s.path === ''}
                className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
              >
                <span className="nav__link-icon">
                  <IconeSecao id={s.iconeId} size={15} />
                </span>
                <span>{s.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="topbar__actions">
            <Link to="/despesas" className="topbar__icon-btn" aria-label="Buscar empresa ou fornecedor">
              <Search size={19} aria-hidden />
            </Link>
            <button
              ref={botaoMenuRef}
              type="button"
              className="topbar__icon-btn fg-mobile-toggle"
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              aria-controls="menu-lateral"
              onClick={() => setMenuAberto(true)}
            >
              <Menu size={21} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Gaveta lateral (celular e tablet) */}
      <div className={`fg-drawer${menuAberto ? ' is-open' : ''}`}>
        <button type="button" className="fg-drawer__backdrop" tabIndex={-1} aria-label="Fechar menu" onClick={fecharMenu} />
        <aside id="menu-lateral" className="fg-drawer__panel" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div className="fg-drawer__head">
            <Marca onClick={fecharMenu} />
            <button ref={botaoFecharRef} type="button" className="topbar__icon-btn" aria-label="Fechar menu" onClick={fecharMenu}>
              <X size={21} aria-hidden />
            </button>
          </div>

          <nav className="fg-drawer__nav" aria-label="Todas as seções">
            {SECOES.map((s) => (
              <Link
                key={s.path}
                to={rotaDaSecao(s)}
                onClick={fecharMenu}
                className={`fg-drawer__link${secaoAtiva(s, pathname) ? ' is-active' : ''}`}
                aria-current={secaoAtiva(s, pathname) ? 'page' : undefined}
              >
                <span className="fg-drawer__icon">
                  <IconeSecao id={s.iconeId} size={19} />
                </span>
                <span className="fg-drawer__text">
                  <span className="fg-drawer__title">{s.label}</span>
                  <span className="fg-drawer__desc">{s.descricao}</span>
                </span>
              </Link>
            ))}
          </nav>

          <div className="fg-drawer__foot">
            <StatusBanco compacto />
            <a href={LINKS_OFICIAIS.prefeitura} target="_blank" rel="noreferrer noopener" className="fg-drawer__ext">
              Site da Prefeitura <ExternalLink size={13} aria-hidden />
            </a>
          </div>
        </aside>
      </div>

      {!isSupabaseConfigured && (
        <div className="banner" role="status">
          Banco de dados não configurado — preencha as chaves no <code>.env</code>.
        </div>
      )}

      <main id="conteudo" className="container main">
        <Outlet />
      </main>

      {/* Barra inferior (somente celular) */}
      <nav className="fg-tabbar" aria-label="Acesso rápido">
        {secoesBarra.map((s) => {
          const ativa = secaoAtiva(s, pathname);
          return (
            <Link
              key={s.path}
              to={rotaDaSecao(s)}
              className={`fg-tabbar__item${ativa ? ' is-active' : ''}`}
              aria-current={ativa ? 'page' : undefined}
            >
              <IconeSecao id={s.iconeId} size={20} />
              <span>{s.labelCurto}</span>
            </Link>
          );
        })}
        <button type="button" className="fg-tabbar__item" onClick={() => setMenuAberto(true)} aria-label="Abrir menu com todas as seções">
          <Menu size={20} aria-hidden />
          <span>Mais</span>
        </button>
      </nav>

      {/* Rodapé */}
      <footer className="footer">
        <div className="container">
          <div className="fg-footer__grid">
            <div className="fg-footer__about">
              <Marca />
              <p>
                Plataforma cívica independente que reúne, em linguagem simples, os gastos públicos, os decretos e os
                representantes de {PLATAFORMA.municipio}. Todo número tem fonte oficial e link para você conferir.
              </p>
            </div>

            <nav className="fg-footer__col" aria-label="Seções do site">
              <h3>Navegue</h3>
              <ul>
                {SECOES.filter((s) => s.path !== '').map((s) => (
                  <li key={s.path}>
                    <Link to={rotaDaSecao(s)}>{s.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="fg-footer__col" aria-label="Fontes oficiais">
              <h3>Fontes oficiais</h3>
              <ul>
                <li>
                  <a href={LINKS_OFICIAIS.tce} target="_blank" rel="noreferrer noopener">
                    TCE-SP · Transparência <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
                <li>
                  <a href={LINKS_OFICIAIS.diarioExecutivoCalendario} target="_blank" rel="noreferrer noopener">
                    Diário do Executivo ({QTD_DIARIOS_EXECUTIVO}) <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
                <li>
                  <a href={LINKS_OFICIAIS.diarioLegislativo} target="_blank" rel="noreferrer noopener">
                    Diário do Legislativo ({QTD_DIARIOS_LEGISLATIVO}) <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
                <li>
                  <a href={LINKS_OFICIAIS.prefeitura} target="_blank" rel="noreferrer noopener">
                    Prefeitura <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
                <li>
                  <a href={LINKS_OFICIAIS.camara} target="_blank" rel="noreferrer noopener">
                    Câmara Municipal <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
                <li>
                  <a href={LINKS_OFICIAIS.tse} target="_blank" rel="noreferrer noopener">
                    TSE · Candidaturas <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <p className="fg-footer__legal">
            <strong>Como trabalhamos:</strong> fato → fonte → dado conferível. As informações vêm das prestações de
            contas enviadas ao TCE-SP (Audesp) e das edições do Diário Oficial de {PLATAFORMA.municipio}, seguindo a Lei
            4.320/1964, a Lei de Responsabilidade Fiscal, a Lei de Acesso à Informação e a LGPD.
          </p>
          <p className="fg-footer__copy">
            © {new Date().getFullYear()} {PLATAFORMA.nome} · {PLATAFORMA.siteHost}
          </p>
        </div>
      </footer>
    </div>
  );
}
