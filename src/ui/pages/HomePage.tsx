/**
 * ============================================================================
 * PÁGINA INICIAL — "PARA ONDE VAI O DINHEIRO PÚBLICO DE GUARULHOS?"
 * Rota: /
 * ============================================================================
 *
 * Leitura em 3 camadas:
 * 1. 5 segundos  — pergunta central, busca e 4 números-chave.
 * 2. 30 segundos — atalhos por assunto, últimas mudanças no orçamento e as
 *                  áreas da cidade que mais gastam.
 * 3. Aprofundar  — gasto mês a mês, quem paga e quem mais recebeu.
 *
 * Suporta 2026, 2025 e a visão consolidada 2025–2026 ('todos').
 * ============================================================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  Building2,
  Calendar,
  Landmark,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StatusBanco } from '../components/StatusFontes';
import { despesasRepository, type DespesaPorArea } from '@/repositories/despesasRepository';
import { DECRETOS_ORCAMENTARIOS_AUDITADOS } from '@/domain/decretosOrcamentarios';
import {
  PLATAFORMA,
  QTD_DECRETOS,
  QTD_DIARIOS,
  QTD_DIARIOS_EXECUTIVO,
  QTD_DIARIOS_LEGISLATIVO,
  QTD_LEIS_SANCIONADAS,
} from '@/domain/plataforma';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox } from '../components/common';
import { BarrasMensais, BarraHorizontal } from '../components/Graficos';
import { AreaDetalheModal } from '../components/AreaDetalheModal';
import { GradeAreas } from '../components/AreasOrcamento';
import { brl, brlCompacto, dataBr, inteiro, nomeLegivel, nomeOrgaoCurto, mesNome } from '../format';

type AnoHome = 2026 | 2025 | 'todos';

const OPCOES_ANO: { id: AnoHome; rotulo: string }[] = [
  { id: 2026, rotulo: '2026' },
  { id: 2025, rotulo: '2025' },
  { id: 'todos', rotulo: '2025–2026' },
];

/** Carrega em paralelo tudo que a Home precisa. */
async function carregar(anoSel: AnoHome) {
  const ano = anoSel === 'todos' ? null : anoSel;
  const [meses, resumo, orgaos, areas, top] = await Promise.all([
    despesasRepository.porMes({ ano }),
    despesasRepository.resumo({ ano }),
    despesasRepository.porOrgao({ ano }),
    despesasRepository.porArea({ ano }),
    despesasRepository.ranking({ ano, somenteExternos: true, limite: 8 }),
  ]);
  return {
    ano,
    anoSel,
    meses: ano ? meses.filter((m) => m.exercicio === ano) : meses,
    resumo,
    orgaos,
    areas,
    top,
  };
}

const ATALHOS = [
  {
    to: '/despesas',
    Icone: Building2,
    titulo: 'Quem recebe o dinheiro',
    texto: 'Ranking de empresas e entidades pagas pela Prefeitura e pela Câmara.',
  },
  {
    to: '/financas',
    Icone: TrendingUp,
    titulo: 'De onde vem e para onde vai',
    texto: 'Os impostos que a cidade arrecada e o que foi gasto com eles.',
  },
  {
    to: '/decretos',
    Icone: ArrowRightLeft,
    titulo: 'Diários, leis e decretos',
    texto: `${QTD_DIARIOS} diários (Executivo + Legislativo), ${QTD_LEIS_SANCIONADAS} leis e ${QTD_DECRETOS} decretos cruzados com os pagamentos.`,
  },
  {
    to: '/politicos',
    Icone: Users,
    titulo: 'Prefeito e vereadores',
    texto: 'Quem são, quantos votos tiveram, em quais comissões atuam e que projetos apresentaram.',
  },
] as const;

function SkeletonSecoes() {
  return (
    <div className="fg-section" aria-hidden>
      <div className="fg-skeleton" style={{ height: 26, width: '55%', marginBottom: 12 }} />
      <div className="fg-bento-areas">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="fg-skeleton" style={{ height: 190 }} />
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [anoHome, setAnoHome] = useState<AnoHome>(2026);
  const [areaSelecionada, setAreaSelecionada] = useState<DespesaPorArea | null>(null);
  const { data, loading, error } = useAsync(() => carregar(anoHome), [anoHome]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const anoParam = anoHome === 'todos' ? 'todos' : String(anoHome);
    nav(q.trim() ? `/despesas?ano=${anoParam}&q=${encodeURIComponent(q.trim())}&todos=1` : `/despesas?ano=${anoParam}`);
  };

  const ultimoMes = data?.meses.length ? data.meses[data.meses.length - 1] : null;
  const maxTop = data ? Math.max(...data.top.map((t) => t.total_liquido), 1) : 1;
  const maxOrgao = data ? Math.max(...data.orgaos.map((o) => o.total_liquido), 1) : 1;
  const totalPago = data?.resumo.total_liquido ?? 0;
  const pagoPorMorador = totalPago > 0 ? Math.round(totalPago / PLATAFORMA.populacao) : 0;

  const anoQuery = anoHome === 'todos' ? 'todos' : String(anoHome);
  const rotuloAno = anoHome === 'todos' ? '2025–2026' : String(anoHome);

  return (
    <>
      {/* =====================================================================
          CAMADA 1 — PERGUNTA CENTRAL, BUSCA E NÚMEROS-CHAVE
          ===================================================================== */}
      <section className="fg-hero" aria-labelledby="hero-titulo">
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                Dados oficiais de {PLATAFORMA.municipio}
              </span>
              <StatusBanco />
            </div>

            <h1 id="hero-titulo" className="fg-hero__title">
              Para onde vai o dinheiro público de <span>{PLATAFORMA.municipio}</span>?
            </h1>
            <p className="fg-hero__lead">
              Veja quanto a Prefeitura e a Câmara pagaram, para quem pagaram e quais mudanças foram feitas no orçamento.
              Tudo com fonte oficial e link para você conferir.
            </p>

            <form className="fg-search" onSubmit={buscar} role="search">
              <label htmlFor="busca-home" className="sr-only">
                Buscar empresa, hospital ou CNPJ
              </label>
              <input
                id="busca-home"
                className="fg-search__input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque uma empresa, hospital ou CNPJ"
                autoComplete="off"
                enterKeyHint="search"
              />
              <button type="submit" className="fg-search__btn">
                <Search size={17} aria-hidden />
                <span>Buscar</span>
              </button>
            </form>

            <div className="fg-hero__actions">
              <div className="fg-seg" role="group" aria-label="Escolha o período">
                {OPCOES_ANO.map((op) => (
                  <button
                    key={String(op.id)}
                    type="button"
                    className={`fg-seg__btn${anoHome === op.id ? ' is-active' : ''}`}
                    aria-pressed={anoHome === op.id}
                    onClick={() => setAnoHome(op.id)}
                  >
                    {op.rotulo}
                  </button>
                ))}
              </div>
              <span className="fg-hero__hint">
                {anoHome === 2026
                  ? 'Ano em andamento'
                  : anoHome === 2025
                  ? 'Ano completo'
                  : 'Consolidado (2025 + 2026)'}
                {data?.resumo.ultima_data ? ` · dados até ${dataBr(data.resumo.ultima_data)}` : ''}
              </span>
            </div>
          </div>

          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">
                {anoHome === 'todos' ? 'Total pago (2025–2026)' : `Total pago em ${anoHome}`}
              </div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">{data ? brlCompacto(totalPago) : '…'}</div>
              <div className="fg-hero-kpi__sub">{data ? brl(totalPago) : 'Carregando…'}</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Pagamentos feitos</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">
                {data ? inteiro(data.resumo.qtd_pagamentos) : '…'}
              </div>
              <div className="fg-hero-kpi__sub">
                {data ? `${anoHome === 'todos' ? 'até ' : 'para '}${inteiro(data.resumo.qtd_credores)} fornecedores` : 'Carregando…'}
              </div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Gasto por morador</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">
                {data ? `R$ ${inteiro(pagoPorMorador)}` : '…'}
              </div>
              <div className="fg-hero-kpi__sub">Total ÷ {PLATAFORMA.populacaoRotulo} de habitantes</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Último pagamento</div>
              <div className="fg-hero-kpi__val">{data ? dataBr(data.resumo.ultima_data) : '…'}</div>
              <div className="fg-hero-kpi__sub">Data mais recente registrada</div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ marginTop: 14 }}>
          <ErrorBox error={error} />
        </div>
      )}

      {/* =====================================================================
          CAMADA 2 — ATALHOS POR ASSUNTO
          ===================================================================== */}
      <section className="fg-section" aria-labelledby="atalhos-titulo">
        <div className="fg-section__head">
          <div>
            <h2 id="atalhos-titulo" className="fg-h2">
              O que você quer saber?
            </h2>
            <p className="fg-sub">Escolha um assunto para começar.</p>
          </div>
        </div>
        <div className="fg-quick">
          {ATALHOS.map(({ to, Icone, titulo, texto }) => (
            <Link key={to} to={to} className="fg-quick__item">
              <span className="fg-quick__icon">
                <Icone size={22} aria-hidden />
              </span>
              <span className="fg-quick__text">
                <span className="fg-quick__title">{titulo}</span>
                <span className="fg-quick__desc" style={{ display: 'block' }}>
                  {texto}
                </span>
              </span>
              <ArrowRight size={18} className="fg-quick__go" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================================
          ÚLTIMAS MUDANÇAS NO ORÇAMENTO (DECRETOS)
          ===================================================================== */}
      <section className="fg-section" aria-labelledby="decretos-titulo">
        <div className="fg-card">
          <div className="fg-section__head" style={{ marginBottom: 6 }}>
            <div>
              <h2 id="decretos-titulo" className="fg-h2">
                Últimas mudanças no orçamento
              </h2>
              <p className="fg-sub">
                Quando a Prefeitura move verba de um lugar para outro, publica um decreto no Diário Oficial. Veja de onde
                o dinheiro saiu e para onde foi.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/decretos?aba=quebra-cabeca" className="fg-link">
                Abrir quebra-cabeça →
              </Link>
              <Link to="/decretos?aba=decretos" className="fg-link">
                Ver os {QTD_DECRETOS} decretos →
              </Link>
            </div>
          </div>

          <div className="fg-home-decrees-list">
            {DECRETOS_ORCAMENTARIOS_AUDITADOS.slice(0, 3).map((dec) => (
              <div key={dec.id} className="fg-home-decree-row">
                <div className="fg-home-decree-row__meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#09152b', fontSize: '0.92rem' }}>{dec.numeroDecreto}</strong>
                    <span className="fg-badge fg-badge--blue">{dataBr(dec.dataPublicacao)}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: 4, fontWeight: 600, lineHeight: 1.4 }}>
                    {dec.tituloObjetivo}
                  </div>
                </div>

                <div className="fg-home-decree-row__flow">
                  <div className="fg-home-decree-row__pill fg-home-decree-row__pill--out">
                    <TrendingDown size={14} aria-hidden />
                    <span>
                      <strong>Saiu de:</strong> {dec.origens[0]?.orgaoOrigem}
                    </span>
                  </div>
                  <div className="fg-home-decree-row__pill fg-home-decree-row__pill--in">
                    <TrendingUp size={14} aria-hidden />
                    <span>
                      <strong>Foi para:</strong> {dec.destinos[0]?.orgaoDestino}
                    </span>
                  </div>
                </div>

                <div className="fg-home-decree-row__right">
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.98rem', color: '#09152b' }}>
                    {brlCompacto(dec.valorTotal)}
                  </div>
                  <Link to={`/decretos?decreto=${encodeURIComponent(dec.id)}`} className="fg-link" style={{ fontSize: '0.78rem' }}>
                    Ver detalhes →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading && !data ? (
        <SkeletonSecoes />
      ) : (
        data && (
          <>
            {/* ===============================================================
                EM QUE A CIDADE GASTA (ÁREAS)
                =============================================================== */}
            <section className="fg-section" aria-labelledby="areas-titulo">
              <div className="fg-section__head">
                <div>
                  <h2 id="areas-titulo" className="fg-h2">
                    Em que a cidade gasta ({rotuloAno})
                  </h2>
                  <p className="fg-sub">
                    Do total de <strong>{brlCompacto(totalPago)}</strong> pagos, veja quanto foi para cada área. Toque em
                    uma para ver quem mais recebeu.
                  </p>
                </div>
                <Link to={`/financas?ano=${anoQuery}`} className="fg-link">
                  Ver receitas e gastos →
                </Link>
              </div>

              <GradeAreas areas={data.areas} totalBase={totalPago} onSelecionar={setAreaSelecionada} />
            </section>

            {/* ===============================================================
                GASTO POR MÊS + QUEM PAGA + QUEM MAIS RECEBEU
                =============================================================== */}
            <section className="fg-section fg-grid-2">
              <div className="fg-card">
                <div className="fg-section__head" style={{ marginBottom: 4 }}>
                  <div>
                    <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={18} color="#1e5fa8" aria-hidden />
                      <span>Quanto foi pago a cada mês</span>
                    </h2>
                    <p className="fg-sub">
                      Toque em um mês para ver os pagamentos
                      {ultimoMes ? ` · até ${mesNome(ultimoMes.mes)}/${ultimoMes.exercicio}` : ''}
                    </p>
                  </div>
                  <Link to={`/despesas?ano=${anoQuery}`} className="fg-link">
                    Detalhar →
                  </Link>
                </div>
                <BarrasMensais
                  pontos={data.meses}
                  onSelecionar={(m, ex) => nav(`/despesas?ano=${ex ?? (data.ano ?? 2026)}&mes=${m}`)}
                />

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #edf2f7' }}>
                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Landmark size={16} color="#09152b" aria-hidden />
                    <span>Quem faz os pagamentos</span>
                  </h3>
                  {data.orgaos.map((o) => (
                    <BarraHorizontal
                      key={o.orgao}
                      nome={nomeOrgaoCurto(o.orgao)}
                      valor={o.total_liquido}
                      max={maxOrgao}
                      accent
                      meta={`${inteiro(o.qtd)} pagamentos · ${inteiro(o.qtd_credores)} fornecedores`}
                      to={`/despesas?ano=${anoQuery}&orgao=${encodeURIComponent(o.orgao)}`}
                    />
                  ))}
                </div>
              </div>

              <div className="fg-card">
                <div className="fg-section__head" style={{ marginBottom: 6 }}>
                  <div>
                    <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={18} color="#1e5fa8" aria-hidden />
                      <span>Quem mais recebeu ({rotuloAno})</span>
                    </h2>
                    <p className="fg-sub">
                      Empresas e entidades com maior valor pago, sem contar repasses entre órgãos públicos.
                    </p>
                  </div>
                  <Link to={`/despesas?ano=${anoQuery}`} className="fg-link">
                    Ranking completo →
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
        <ShieldCheck size={16} aria-hidden />
        <span>
          <strong>Como confiar nos números:</strong> tudo vem de bases públicas oficiais — TCE-SP (Audesp até Set/2026),
          Diário Oficial do Executivo ({QTD_DIARIOS_EXECUTIVO} edições validadas com SHA-256), Diário Oficial do
          Legislativo ({QTD_DIARIOS_LEGISLATIVO} edições da Câmara) e TSE.{' '}
          <Link to="/fontes" className="fg-link">
            Ver as fontes →
          </Link>
        </span>
      </p>
    </>
  );
}
