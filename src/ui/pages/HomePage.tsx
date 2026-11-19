/**
 * ============================================================================
 * PÁGINA INICIAL — PAINEL EXECUTIVO DE AUDITORIA MUNICIPAL (HOME)
 * Rota: /
 * Projeto: Fiscaliza Guarulhos (Escopo 100% Municipal — IBGE 3518800)
 * ============================================================================
 *
 * ARQUITETURA E HIERARQUIA VISUAL (3 CAMADAS — docs/03-DESIGN-SYSTEM-GUARULHOS.md):
 * - Camada 1 (5 segundos): Hero com busca universal, status das fontes validadas
 *   em tempo real e 4 KPIs ao vivo do orçamento municipal.
 * - Camada 2 (30 segundos): Grade das 8 Áreas Temáticas (Saúde, Educação,
 *   Transporte, Limpeza Urbana, etc.) + Resumo dos Decretos Orçamentários
 *   extraídos do Diário Oficial ("De onde saiu -> Para onde foi").
 * - Camada 3 (Auditoria Profunda): Evolução mensal, unidades pagadoras e
 *   ranking dos maiores fornecedores externos com acesso direto às notas de empenho.
 * ============================================================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBanco } from '../components/StatusFontes';
import {
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { despesasRepository, type DespesaPorArea } from '@/repositories/despesasRepository';
import {
  DECRETOS_ORCAMENTARIOS_AUDITADOS,
} from '@/domain/decretosOrcamentarios';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox } from '../components/common';
import { BarrasMensais, BarraHorizontal } from '../components/Graficos';
import { AreaDetalheModal } from '../components/AreaDetalheModal';
import { brl, brlCompacto, dataBr, inteiro, nomeLegivel, nomeOrgaoCurto, mesNome } from '../format';

/** População oficial de Guarulhos segundo o Censo Demográfico do IBGE */
const POPULACAO_GUARULHOS = 1291771;

/**
 * Carrega em paralelo todas as agregações necessárias para a Home via RPCs do Supabase.
 */
async function carregar(anoSelecionado: number) {
  const todos = await despesasRepository.porMes({ ano: anoSelecionado });
  const ano = anoSelecionado;
  const [resumo, orgaos, areas, top] = await Promise.all([
    despesasRepository.resumo({ ano }),
    despesasRepository.porOrgao({ ano }),
    despesasRepository.porArea({ ano }),
    despesasRepository.ranking({ ano, somenteExternos: true, limite: 8 }),
  ]);
  return { ano, meses: todos.filter((m) => m.exercicio === ano), resumo, orgaos, areas, top };
}

function KpiSkeleton() {
  return (
    <div className="fg-kpis" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="fg-skeleton" style={{ height: 84 }} />
      ))}
    </div>
  );
}

export function HomePage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [anoHome, setAnoHome] = useState<2026 | 2025>(2026);
  const [areaSelecionada, setAreaSelecionada] = useState<DespesaPorArea | null>(null);
  const { data, loading, error } = useAsync(() => carregar(anoHome), [anoHome]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    nav(q.trim() ? `/despesas?q=${encodeURIComponent(q.trim())}&todos=1` : '/despesas');
  };

  const ultimoMes = data?.meses.length ? data.meses[data.meses.length - 1] : null;
  const maxTop = data ? Math.max(...data.top.map((t) => t.total_liquido), 1) : 1;
  const maxOrgao = data ? Math.max(...data.orgaos.map((o) => o.total_liquido), 1) : 1;
  const totalPago = data?.resumo.total_liquido ?? 0;
  const pagoPorMorador = totalPago > 0 ? Math.round(totalPago / POPULACAO_GUARULHOS) : 0;

  return (
    <>
      {/* ====================================================================
          CAMADA 1: HERO EXECUTIVO BENTO (BUSCA + 4 KPIS AO VIVO)
          ==================================================================== */}
      <section className="fg-hero" aria-labelledby="hero-titulo">
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                AUDITORIA CIDADÃ GUARULHOS · TCE-SP + DOM-GRU + CÂMARA + TSE
              </span>
              <StatusBanco />
            </div>

            <h1 id="hero-titulo" className="fg-hero__title">
              O orçamento, os decretos e a política de <span>Guarulhos</span> auditados para você.
            </h1>
            <p className="fg-hero__lead">
              Consulte cada pagamento da Prefeitura e da Câmara, rastreie os decretos do Diário Oficial (de onde saiu e
              para onde foi cada verba) e acompanhe o Prefeito e os 34 vereadores com fontes 100% validadas.
            </p>

            <form className="fg-search" onSubmit={buscar} role="search">
              <label htmlFor="busca-home" className="sr-only">
                Buscar empresa, hospital, construtora ou CNPJ
              </label>
              <input
                id="busca-home"
                className="fg-search__input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar empresa, hospital, viação, CNPJ ou nº de empenho…"
              />
              <button
                type="submit"
                className="fg-search__btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Search size={16} />
                <span>Auditar</span>
              </button>
            </form>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setAnoHome(2026)}
                className={anoHome === 2026 ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <span>Exercício 2026 (R$ 4,28 bi)</span>
              </button>
              <button
                type="button"
                onClick={() => setAnoHome(2025)}
                className={anoHome === 2025 ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <span>Exercício 2025 Completo (R$ 6,34 bi)</span>
              </button>
              <Link to="/decretos" className="fg-btn-audit-ghost">
                <ArrowRightLeft size={15} />
                <span>262 Decretos &amp; 212 Diários (PDF)</span>
              </Link>
              <Link to="/financas" className="fg-btn-audit-ghost">
                <TrendingUp size={15} />
                <span>Receitas × Gastos</span>
              </Link>
            </div>
          </div>

          {/* 4 KPIs Ao Vivo Dentro do Hero */}
          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Total Pago ({data?.ano ?? 2026})</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">
                {data ? brlCompacto(data.resumo.total_liquido) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">
                {data ? brl(data.resumo.total_liquido) : 'Carregando TCE-SP...'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Última Liquidação</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">
                {data ? dataBr(data.resumo.ultima_data) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">Data do pagamento mais recente no banco</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Pagamentos Auditados</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">
                {data ? inteiro(data.resumo.qtd_pagamentos) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">
                {data ? `${inteiro(data.resumo.qtd_credores)} fornecedores` : 'Audesp'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Gasto por Morador</div>
              <div className="fg-hero-kpi__val">
                {data ? `R$ ${inteiro(pagoPorMorador)}` : '...'}
              </div>
              <div className="fg-hero-kpi__sub">População: 1,29 mi (IBGE 3518800)</div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ marginTop: 14 }}>
          <ErrorBox error={error} />
        </div>
      )}

      {/* ====================================================================
          ATALHOS DOS 4 PILARES DE AUDITORIA (ÍCONES VETORIAIS LUCIDE)
          ==================================================================== */}
      <section className="fg-section" style={{ marginTop: 16 }}>
        <div className="fg-soon">
          <Link to="/decretos" className="fg-soon__item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fg-soon__icon-box">
                <ArrowRightLeft size={18} />
              </span>
              <span className="fg-badge fg-badge--emerald">262 Decretos · 212 Diários</span>
            </div>
            <div className="fg-soon__title">Decretos &amp; Diários Extraídos</div>
            <p className="fg-soon__desc">
              Rastreabilidade completa (2025 e 2026): de onde saiu (Redução R$) e para onde foi (Suplementação R$) com PDF oficial.
            </p>
          </Link>

          <Link to="/financas" className="fg-soon__item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fg-soon__icon-box">
                <TrendingUp size={18} />
              </span>
              <span className="fg-badge fg-badge--amber">R$ 12,55 bi (25–26)</span>
            </div>
            <div className="fg-soon__title">Receitas × Gastos (2025 &amp; 2026)</div>
            <p className="fg-soon__desc">
              Entenda de onde vem cada imposto (IPTU, ISS, ICMS, FUNDEB, SUS) em 2025 (R$ 7,24 bi) e 2026 (R$ 5,31 bi).
            </p>
          </Link>

          <Link to="/despesas" className="fg-soon__item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fg-soon__icon-box">
                <Building2 size={18} />
              </span>
              <span className="fg-badge fg-badge--navy">62.748 Pagamentos</span>
            </div>
            <div className="fg-soon__title">Ranking de Fornecedores</div>
            <p className="fg-soon__desc">
              Audite quais hospitais, viações de ônibus, empresas de limpeza e construtoras mais receberam em 2025 e 2026.
            </p>
          </Link>

          <Link to="/politicos" className="fg-soon__item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fg-soon__icon-box">
                <Landmark size={18} />
              </span>
              <span className="fg-badge fg-badge--blue">19ª Legislatura</span>
            </div>
            <div className="fg-soon__title">Prefeito &amp; 34 Vereadores</div>
            <p className="fg-soon__desc">
              Biografias completas, comissões, votos no TSE e 334 projetos com acompanhamento até o fim.
            </p>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          DESTAQUE EXECUTIVO: ÚLTIMOS DECRETOS EXTRAÍDOS DO DIÁRIO OFICIAL
          ("DE ONDE SAIU -> PARA ONDE FOI")
          ==================================================================== */}
      <section className="fg-section">
        <div className="fg-card">
          <div className="fg-section__head" style={{ marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span className="fg-badge fg-badge--navy">
                  <BookOpen size={12} />
                  IMPRENSA OFICIAL DE GUARULHOS · 212 EDIÇÕES (2025–2026)
                </span>
                <span className="fg-badge fg-badge--emerald">
                  <CheckCircle2 size={12} />
                  262 Decretos Suplementares Extraídos com PDF Oficial
                </span>
              </div>
              <h2 className="fg-h2">
                Rastreabilidade de Decretos Orçamentários: De Onde Saiu e Para Onde Foi
              </h2>
              <p className="fg-sub">
                Últimos decretos reais assinados no Diário Oficial de Guarulhos com códigos de Redução R$ e Suplementação R$:
              </p>
            </div>
            <Link to="/decretos" className="fg-btn fg-btn--primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FileCheck2 size={15} />
              <span>Auditar Todos os Decretos &amp; Diários</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="fg-home-decrees-list">
            {DECRETOS_ORCAMENTARIOS_AUDITADOS.slice(0, 3).map((dec) => (
              <div key={dec.id} className="fg-home-decree-row">
                <div className="fg-home-decree-row__meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#09152b', fontSize: '0.92rem' }}>{dec.numeroDecreto}</strong>
                    <span className="fg-badge fg-badge--blue">{dec.edicaoDiarioOficial}</span>
                    <span className="fg-badge fg-badge--amber">{dec.rotuloModalidade}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: 4, fontWeight: 600 }}>
                    {dec.tituloObjetivo}
                  </div>
                </div>

                <div className="fg-home-decree-row__flow">
                  <div className="fg-home-decree-row__pill fg-home-decree-row__pill--out">
                    <TrendingDown size={14} />
                    <span>
                      <strong>Saiu de:</strong> {dec.origens[0]?.orgaoOrigem}
                    </span>
                  </div>
                  <div className="fg-home-decree-row__pill fg-home-decree-row__pill--in">
                    <TrendingUp size={14} />
                    <span>
                      <strong>Foi para:</strong> {dec.destinos[0]?.orgaoDestino}
                    </span>
                  </div>
                </div>

                <div className="fg-home-decree-row__right">
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.98rem', color: '#09152b' }}>
                    {brlCompacto(dec.valorTotal)}
                  </div>
                  <Link to="/decretos" className="fg-link" style={{ fontSize: '0.78rem' }}>
                    Ver laudo →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading && !data ? (
        <KpiSkeleton />
      ) : (
        data && (
          <>
            {/* ==============================================================
                CAMADA 2: GRADE BENTO DE 8 ÁREAS TEMÁTICAS DO ORÇAMENTO
                ============================================================== */}
            <section className="fg-section">
              <div className="fg-section__head">
                <div>
                  <h2 className="fg-h2">Execução Orçamentária por Área da Cidade ({data.ano})</h2>
                  <p className="fg-sub">
                    Clique em qualquer área abaixo para auditar os maiores recebedores e notas de empenho dos{' '}
                    <strong>{brlCompacto(totalPago)}</strong> liquidados:
                  </p>
                </div>
                <Link to="/financas" className="fg-link">
                  Ver balanço completo →
                </Link>
              </div>

              <div className="fg-bento-areas">
                {data.areas.map((a) => {
                  const percentual = totalPago > 0 ? Math.round((a.total_liquido / totalPago) * 1000) / 10 : 0;
                  return (
                    <article
                      key={a.area}
                      className="fg-area-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => setAreaSelecionada(a)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setAreaSelecionada(a);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="fg-area-card__head">
                          <span className="fg-area-card__icon" aria-hidden>
                            {a.icone}
                          </span>
                          <span className="fg-area-card__pct">{percentual.toLocaleString('pt-BR')}% do total</span>
                        </div>
                        <h3 className="fg-area-card__title" style={{ marginTop: 8 }}>
                          {a.area}
                        </h3>
                        <div className="fg-area-card__val" style={{ marginTop: 4 }}>
                          {brlCompacto(a.total_liquido)}
                        </div>
                        <div className="fg-area-card__bar" style={{ marginTop: 6 }}>
                          <div
                            className="fg-area-card__fill"
                            style={{ width: `${Math.min(100, Math.max(4, percentual * 2.4))}%` }}
                          />
                        </div>
                        <p className="fg-area-card__desc" style={{ marginTop: 8 }}>
                          {a.explicacao_pratica}
                        </p>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div className="fg-area-card__meta">
                          <span>{inteiro(a.qtd_pagamentos)} pagamentos</span>
                          <span>{inteiro(a.qtd_credores)} credores</span>
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>Auditar recebedores desta área</span>
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ==============================================================
                CAMADA 3: EVOLUÇÃO MENSAL + MAIORES FORNECEDORES EXTERNOS
                ============================================================== */}
            <section className="fg-section fg-grid-2">
              <div className="fg-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="fg-section__head" style={{ marginBottom: 4 }}>
                    <div>
                      <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={18} color="#0284c7" />
                        <span>Desembolso Mensal Liquidado ({data.ano})</span>
                      </h2>
                      <p className="fg-sub">
                        Selecione uma barra para filtrar a competência
                        {ultimoMes ? ` · auditado até ${mesNome(ultimoMes.mes)}` : ''}
                      </p>
                    </div>
                    <Link to={`/despesas?ano=${data.ano}`} className="fg-link">
                      Detalhar →
                    </Link>
                  </div>
                  <BarrasMensais
                    pontos={data.meses}
                    onSelecionar={(m) => nav(`/despesas?ano=${data.ano}&mes=${m}`)}
                  />
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <h3
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Landmark size={16} color="#09152b" />
                    <span>Unidades Gestoras Pagadoras (Guarulhos)</span>
                  </h3>
                  {data.orgaos.map((o) => (
                    <BarraHorizontal
                      key={o.orgao}
                      nome={nomeOrgaoCurto(o.orgao)}
                      valor={o.total_liquido}
                      max={maxOrgao}
                      accent
                      meta={`${inteiro(o.qtd)} ordens bancárias · ${inteiro(o.qtd_credores)} credores`}
                      to={`/despesas?ano=${data.ano}&orgao=${encodeURIComponent(o.orgao)}`}
                    />
                  ))}
                </div>
              </div>

              <div className="fg-card">
                <div className="fg-section__head" style={{ marginBottom: 6 }}>
                  <div>
                    <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={18} color="#0284c7" />
                      <span>Maiores Fornecedores Externos ({data.ano})</span>
                    </h2>
                    <p className="fg-sub">
                      Empresas e organizações sociais com maior volume de pagamentos liquidados (excluídos repasses internos):
                    </p>
                  </div>
                  <Link to={`/despesas?ano=${data.ano}`} className="fg-link">
                    Ver ranking completo →
                  </Link>
                </div>
                {data.top.map((t, i) => (
                  <BarraHorizontal
                    key={t.chave}
                    nome={`${i + 1}. ${nomeLegivel(t.credor)}`}
                    valor={t.total_liquido}
                    max={maxTop}
                    meta={`${inteiro(t.qtd)} pagamentos${t.cnpj_credor ? '' : ' · pessoa física'}`}
                    to={`/despesas/credor/${t.chave}`}
                  />
                ))}
              </div>
            </section>
          </>
        )
      )}

      {areaSelecionada && data && (
        <AreaDetalheModal
          area={areaSelecionada}
          ano={data.ano}
          mes={null}
          onClose={() => setAreaSelecionada(null)}
        />
      )}

      <p className="fg-footer-note">
        <ShieldCheck size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
        <strong>Fato → Fonte → Transparência Cidadã.</strong> Dados auditáveis originários do TCE-SP (Audesp), Diário
        Oficial do Município de Guarulhos (DOM-GRU), Câmara Municipal e TSE.{' '}
        <Link to="/fontes" className="fg-link">
          Verificar telemetria das fontes em tempo real →
        </Link>
      </p>
    </>
  );
}
