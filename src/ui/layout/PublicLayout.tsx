/**
 * ============================================================================
 * LAYOUT PÚBLICO INSTITUCIONAL — FISCALIZA GUARULHOS
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * DIRETRIZES DE DESIGN SYSTEM (docs/03-DESIGN-SYSTEM-GUARULHOS.md):
 * - Paleta oficial da Bandeira de Guarulhos: Azul Institucional (#162b4d),
 *   Vermelho Cívico (#c5221f) e Dourado Heráldico (#d4a017).
 * - Zero emojis soltos na navegação: uso exclusivo de ícones vetoriais
 *   `lucide-react` para máxima sobriedade e padrão corporativo de auditoria.
 * - Faixa superior de telemetria em tempo real indicando o status das fontes
 *   (TCE-SP Audesp, Diário Oficial DOM-GRU, Câmara e TSE).
 * ============================================================================
 */

import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowRightLeft,
  Building2,
  Database,
  Landmark,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { SECOES, type Secao } from '../navigation';
import { StatusBanco } from '../components/StatusFontes';
import { isSupabaseConfigured } from '@/database/client';

/**
 * Renderiza o ícone vetorial Lucide correspondente a cada seção da plataforma.
 */
function renderIconeSecao(id: Secao['iconeId'], size = 15) {
  switch (id) {
    case 'home':
      return <LayoutDashboard size={size} />;
    case 'financas':
      return <TrendingUp size={size} />;
    case 'despesas':
      return <Building2 size={size} />;
    case 'decretos':
      return <ArrowRightLeft size={size} />;
    case 'politicos':
      return <Landmark size={size} />;
    case 'fontes':
      return <Database size={size} />;
    case 'privacidade':
      return <ShieldCheck size={size} />;
  }
}

export function PublicLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();

  // Fecha o drawer mobile automaticamente ao navegar para uma nova rota
  const fecharMenu = () => setMenuAberto(false);

  return (
    <div className="shell">
      {/* ====================================================================
          BARRA DE TELEMETRIA E STATUS DE AUDITORIA EM TEMPO REAL
          ==================================================================== */}
      <div className="fg-live-strip" role="region" aria-label="Status do banco de dados">
        <div className="container fg-live-strip__inner">
          <div className="fg-live-strip__left">
            <StatusBanco compacto />
            <span className="fg-live-strip__status">Fontes: TCE-SP Audesp · Câmara · TSE</span>
          </div>

          <div className="fg-live-strip__right">
            <Link to="/decretos" className="fg-live-strip__link">
              <ArrowRightLeft size={12} />
              <span>Decretos (demonstração)</span>
            </Link>
            <span className="fg-live-strip__sep">·</span>
            <Link to="/fontes" className="fg-live-strip__link">
              <Activity size={12} />
              <span>Status das fontes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CABEÇALHO PRINCIPAL (TOPBAR COM IDENTIDADE DE GUARULHOS)
          ==================================================================== */}
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand" onClick={fecharMenu} aria-label="Fiscaliza Guarulhos — Página inicial">
            <img
              src="/bandeira-guarulhos.png"
              alt="Bandeira Oficial de Guarulhos"
              className="brand__flag"
              width="36"
              height="24"
            />
            <span className="brand__name">
              FISCALIZA <b>GUARULHOS</b>
            </span>
            <span className="brand__tag">GRU</span>
          </Link>

          {/* Botão Menu Mobile */}
          <button
            type="button"
            className="fg-mobile-toggle"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu de navegação'}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? <X size={20} color="#ffffff" /> : <Menu size={20} color="#ffffff" />}
          </button>

          {/* Navegação Desktop com Ícones Vetoriais Lucide */}
          <div className="nav-wrapper fg-nav-desktop">
            <nav className="nav" aria-label="Navegação Principal">
              {SECOES.map((s) => (
                <NavLink
                  key={s.path}
                  to={`/${s.path}`}
                  end={s.path === ''}
                  className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
                >
                  <span className="nav__link-icon">{renderIconeSecao(s.iconeId, 14)}</span>
                  <span>{s.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Menu Drawer Mobile */}
        {menuAberto && (
          <div className="fg-mobile-menu" role="dialog" aria-label="Menu móvel">
            <nav className="fg-mobile-nav">
              {SECOES.map((s) => {
                const isActive =
                  s.path === '' ? location.pathname === '/' : location.pathname.startsWith(`/${s.path}`);
                return (
                  <Link
                    key={s.path}
                    to={`/${s.path}`}
                    onClick={fecharMenu}
                    className={`fg-mobile-link ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="fg-mobile-icon">{renderIconeSecao(s.iconeId, 18)}</span>
                    <div>
                      <div className="fg-mobile-title">{s.label}</div>
                      <div className="fg-mobile-desc">{s.descricao}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {!isSupabaseConfigured && (
        <div className="banner" role="status">
          Supabase não configurado — preencha as chaves no <code>.env</code>.
        </div>
      )}

      {/* Área Principal de Conteúdo */}
      <main className="container main">
        <Outlet />
      </main>

      {/* ====================================================================
          BARRA INFERIOR FIXA NO CELULAR (UX DE APLICATIVO NATIVO)
          ==================================================================== */}
      <nav className="fg-bottom-nav" aria-label="Navegação rápida móvel">
        {[
          { path: '', label: 'Início', icone: <LayoutDashboard size={18} /> },
          { path: 'financas', label: 'Finanças', icone: <TrendingUp size={18} /> },
          { path: 'despesas', label: 'Gastos', icone: <Building2 size={18} /> },
          { path: 'decretos', label: 'Decretos', icone: <ArrowRightLeft size={18} /> },
          { path: 'politicos', label: 'Câmara', icone: <Users size={18} /> },
        ].map((item) => {
          const isActive =
            item.path === ''
              ? location.pathname === '/'
              : location.pathname.startsWith(`/${item.path}`);
          return (
            <Link
              key={item.path}
              to={`/${item.path}`}
              onClick={fecharMenu}
              className={`fg-bottom-nav__item ${isActive ? 'is-active' : ''}`}
            >
              <span className="fg-bottom-nav__icon" aria-hidden>
                {item.icone}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ====================================================================
          RODAPÉ INSTITUCIONAL DE AUDITORIA CIDADÃ
          ==================================================================== */}
      <footer className="footer">
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div>
              <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                FISCALIZA GUARULHOS · AUDITORIA CIDADÃ &amp; TRANSPARÊNCIA ORÇAMENTÁRIA
              </strong>
              <p className="muted small" style={{ marginTop: 4 }}>
                Plataforma cívica independente de controle social, rastreabilidade de decretos e acompanhamento dos
                gastos públicos de Guarulhos (IBGE 3518800) · <strong>fiscalizaguarulhos.vercel.app</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.84rem', flexWrap: 'wrap' }}>
              <Link to="/despesas" className="fg-link">
                Fornecedores 2026
              </Link>
              <span>·</span>
              <Link to="/decretos" className="fg-link">
                Decretos (demonstração)
              </Link>
              <span>·</span>
              <Link to="/politicos" className="fg-link">
                34 Vereadores
              </Link>
              <span>·</span>
              <Link to="/fontes" className="fg-link">
                Status das Fontes
              </Link>
              <span>·</span>
              <Link to="/privacidade" className="fg-link">
                Segurança &amp; LGPD
              </Link>
              <span>·</span>
              <a
                href="https://www.guarulhos.sp.gov.br"
                target="_blank"
                rel="noreferrer noopener"
                className="fg-link"
              >
                Site da Prefeitura ↗
              </a>
            </div>
          </div>
          <p className="muted small" style={{ borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 12 }}>
            <strong>Princípio Editorial e Metodologia Contábil:</strong> FATO → FONTE → DADOS AUDITÁVEIS. Todas as
            informações financeiras e orçamentárias têm origem nas prestações de contas oficiais enviadas ao sistema
            AUDESP do Tribunal de Contas do Estado de São Paulo (TCE-SP) e nas edições publicadas no Diário Oficial do
            Município de Guarulhos (Lei Federal nº 4.320/1964, Lei Complementar nº 101/2000 - LRF, Lei nº 12.527/2011 -
            LAI e Lei nº 13.709/2018 - LGPD).
          </p>
        </div>
      </footer>
    </div>
  );
}
