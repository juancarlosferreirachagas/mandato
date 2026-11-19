/**
 * ============================================================================
 * PÁGINA: BALANÇO ORÇAMENTÁRIO — RECEITAS ARRECADADAS × DESPESAS LIQUIDADAS
 * Rota: /financas
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * ARQUITETURA E PADRÃO CONTÁBIL (MCASP / STN & TCE-SP AUDESP):
 * 1. Demonstrativo de Execução Orçamentária:
 *    Compara a Receita Efetivamente Arrecadada (Tributos Municipais, Transferências
 *    Constitucionais ICMS/IPVA/FUNDEB/SUS e Operações de Crédito) com a Despesa
 *    Liquidada e Paga no mesmo período.
 *
 * 2. Classificação por Natureza de Receita e Fonte de Recurso ("Carimbo"):
 *    Traduz a árvore contábil do AUDESP (Categorias Econômicas 1, 2, 7 e 8)
 *    para linguagem acessível ao cidadão e ao auditor.
 *
 * 3. Integração com Alterações Orçamentárias (/decretos):
 *    Conecta o superávit/excesso de arrecadação diretamente aos Decretos
 *    Executivos extraídos do Diário Oficial de Guarulhos (Lei 4.320/64, Art. 43).
 * ============================================================================
 */

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBanco } from '../components/StatusFontes';
import {
  ArrowRightLeft,
  ArrowUpRight,
  Building2,
  Landmark,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { despesasRepository, type DespesaPorArea } from '@/repositories/despesasRepository';
import { receitasRepository, type ReceitaLinha } from '@/repositories/receitasRepository';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox } from '../components/common';
import { BarraHorizontal } from '../components/Graficos';
import { AreaDetalheModal } from '../components/AreaDetalheModal';
import { brl, brlCompacto, inteiro, mesAbrev, mesNome, nomeLegivel, nomeOrgaoCurto } from '../format';

/** Abas analíticas do painel de Finanças */
type Aba = 'geral' | 'receitas' | 'despesas';
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'geral', rotulo: 'Visão Geral & Balanço' },
  { id: 'receitas', rotulo: 'De Onde Vem (Receitas)' },
  { id: 'despesas', rotulo: 'Para Onde Vai (Despesas)' },
];

const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);
const pctTxt = (v: number, total: number) => `${pct(v, total).toLocaleString('pt-BR')}%`;

/** População oficial de Guarulhos (Censo IBGE) para cálculo per capita */
const POPULACAO_GUARULHOS = 1291771;

/**
 * Executa a carga paralela das agregações de Receitas e Despesas via RPCs no Supabase.
 */
async function carregar(ano: number, mes: number | null) {
  const [recMeses, despMeses] = await Promise.all([
    receitasRepository.porMes(ano),
    despesasRepository.porMes({ ano }),
  ]);
  const [recResumo, despResumo, arvore, fontes, orgaos, areas, top] = await Promise.all([
    receitasRepository.resumo(ano, mes),
    despesasRepository.resumo({ ano, mes }),
    receitasRepository.arvore(ano, mes),
    receitasRepository.porFonte(ano, mes),
    despesasRepository.porOrgao({ ano, mes }),
    despesasRepository.porArea({ ano, mes }),
    despesasRepository.ranking({ ano, mes, somenteExternos: true, limite: 10 }),
  ]);
  return { recMeses, despMeses, recResumo, despResumo, arvore, fontes, orgaos, areas, top };
}

/**
 * Gráfico comparativo Receita × Despesa mês a mês com suporte a filtro interativo.
 */
function Comparativo({
  rec,
  desp,
  mesSel,
  onMes,
}: {
  rec: { mes: number; v: number }[];
  desp: { mes: number; v: number }[];
  mesSel: number | null;
  onMes: (m: number | null) => void;
}) {
  const meses = Array.from(new Set([...rec.map((r) => r.mes), ...desp.map((d) => d.mes)])).sort((a, b) => a - b);
  const max = Math.max(...rec.map((r) => r.v), ...desp.map((d) => d.v), 1);
  const get = (arr: { mes: number; v: number }[], m: number) => arr.find((x) => x.mes === m)?.v ?? 0;

  return (
    <div className="fin-comp" role="img" aria-label="Comparativo mensal entre receita arrecadada e despesa paga">
      {meses.map((m) => (
        <button
          key={m}
          type="button"
          className={`fin-comp__col${mesSel === m ? ' is-sel' : ''}`}
          onClick={() => onMes(mesSel === m ? null : m)}
          aria-pressed={mesSel === m}
          title={`${mesNome(m)}: arrecadou ${brl(get(rec, m))} · pagou ${brl(get(desp, m))}`}
        >
          <span className="fin-comp__bars">
            <i className="fin-comp__b fin-comp__b--rec" style={{ height: `${Math.max((get(rec, m) / max) * 100, 2)}%` }} />
            <i
              className="fin-comp__b fin-comp__b--desp"
              style={{ height: `${Math.max((Math.max(get(desp, m), 0) / max) * 100, 2)}%` }}
            />
          </span>
          <span className="fin-comp__lbl">{mesAbrev(m)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Traduz a nomenclatura contábil do Plano de Contas (MCASP) para linguagem cidadã.
 */
function explicarGrupoReceita(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('transferências correntes')) {
    return 'Repasses constitucionais obrigatórios da União e do Estado de SP para Guarulhos (ICMS, IPVA, FPM, FUNDEB para Educação e SUS para Saúde).';
  }
  if (n.includes('impostos, taxas')) {
    return 'Tributos arrecadados diretamente em Guarulhos (IPTU dos imóveis, ISS das empresas e serviços, ITBI e taxas de fiscalização).';
  }
  if (n.includes('contribuições')) {
    return 'Contribuições previdenciárias para o IPREM e custeio da iluminação pública (CIP/COSIP).';
  }
  if (n.includes('patrimonial')) {
    return 'Rendimentos financeiros das aplicações de caixa do Tesouro Municipal, dividendos e permissões de uso.';
  }
  if (n.includes('operações de crédito')) {
    return 'Financiamentos contratados junto a bancos públicos/multilaterais para obras estruturantes.';
  }
  if (n.includes('transferências de capital')) {
    return 'Convênios federais e estaduais exclusivos para obras e aquisição de equipamentos permanentes.';
  }
  return 'Receitas públicas contabilizadas pelo Tesouro Municipal de Guarulhos no sistema AUDESP.';
}

/**
 * Árvore hierárquica de Receitas (Categoria > Subcategoria/Origem > Rubrica)
 * com expansão progressiva para auditoria detalhada.
 */
function ArvoreReceitas({ linhas }: { linhas: ReceitaLinha[] }) {
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const total = linhas.reduce((s, l) => s + l.total, 0);

  const grupos = useMemo(() => {
    const porSub = new Map<string, { nome: string; categoria: string; total: number; rubricas: ReceitaLinha[] }>();
    for (const l of linhas) {
      const k = `${l.categoria}|${l.subcategoria}`;
      const g = porSub.get(k) ?? { nome: l.subcategoria, categoria: l.categoria, total: 0, rubricas: [] };
      g.total += l.total;
      g.rubricas.push(l);
      porSub.set(k, g);
    }
    return [...porSub.values()].sort((a, b) => b.total - a.total);
  }, [linhas]);

  if (!grupos.length) return <p className="muted">Sem receitas registradas no período selecionado.</p>;

  return (
    <div className="fin-acc">
      {grupos.map((g, idx) => {
        const chave = `${g.categoria}|${g.nome}`;
        const mostrarTodas = Boolean(expandidos[chave]);
        const visiveis = mostrarTodas ? g.rubricas : g.rubricas.slice(0, 12);
        return (
          <details key={chave} className="fin-acc__item" open={idx === 0}>
            <summary className="fin-acc__sum">
              <span className="fin-acc__name">
                {g.nome}
                <small>
                  {g.categoria} · {explicarGrupoReceita(g.nome)}
                </small>
              </span>
              <span className="fin-acc__val" style={{ fontFamily: 'var(--font-mono)' }}>
                {brlCompacto(g.total)}
                <small style={{ fontFamily: 'var(--font-sans)' }}>{pctTxt(g.total, total)} do total</small>
              </span>
            </summary>
            <ul className="fin-acc__list">
              {visiveis.map((r) => (
                <li key={r.rubrica} className="fin-acc__row">
                  <span>{r.rubrica}</span>
                  <b title={brl(r.total)} style={{ fontFamily: 'var(--font-mono)' }}>
                    {brl(r.total)}
                  </b>
                </li>
              ))}
              {g.rubricas.length > 12 && (
                <li className="fin-acc__more" style={{ listStyle: 'none', marginTop: 6 }}>
                  <button
                    type="button"
                    className="fg-btn"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', width: '100%' }}
                    onClick={() => setExpandidos((ant) => ({ ...ant, [chave]: !mostrarTodas }))}
                  >
                    {mostrarTodas
                      ? 'Recolher lista de rubricas ↑'
                      : `Exibir todas as ${g.rubricas.length} rubricas auditadas (+${g.rubricas.length - 12} itens) ↓`}
                  </button>
                </li>
              )}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

export function FinancasPage() {
  const [params, setParams] = useSearchParams();
  const ano = Number(params.get('ano')) || new Date().getFullYear();
  const mes = params.get('mes') ? Number(params.get('mes')) : null;
  const [aba, setAba] = useState<Aba>('geral');
  const [areaSelecionada, setAreaSelecionada] = useState<DespesaPorArea | null>(null);

  const { data, loading, error } = useAsync(() => carregar(ano, mes), [ano, mes]);
  const setMes = (m: number | null) => {
    const p = new URLSearchParams(params);
    if (m) p.set('mes', String(m));
    else p.delete('mes');
    setParams(p, { replace: true });
  };

  const rec = data?.recResumo.total_arrecadado ?? 0;
  const desp = data?.despResumo.total_liquido ?? 0;
  const saldo = rec - desp;
  const recMeses = data?.recMeses.map((r) => ({ mes: r.mes, v: r.total_liquido })) ?? [];
  const despMeses =
    data?.despMeses.filter((d) => d.exercicio === ano).map((d) => ({ mes: d.mes, v: d.total_liquido })) ?? [];
  const periodo = mes ? `${mesNome(mes)} de ${ano}` : `${ano} (acumulado até ${mesNome(data?.recResumo.ultimo_mes ?? 8)})`;
  const maxOrgao = Math.max(...(data?.orgaos.map((o) => o.total_liquido) ?? [1]), 1);
  const maxTop = Math.max(...(data?.top.map((t) => t.total_liquido) ?? [1]), 1);
  const maxFonte = Math.max(...(data?.fontes.map((f) => f.total) ?? [1]), 1);
  const recPorMorador = rec > 0 ? Math.round(rec / POPULACAO_GUARULHOS) : 0;
  const despPorMorador = desp > 0 ? Math.round(desp / POPULACAO_GUARULHOS) : 0;

  return (
    <div className="fg-page-container">
      {/* ====================================================================
          CABEÇALHO EXECUTIVO DO BALANÇO ORÇAMENTÁRIO
          ==================================================================== */}
      <header className="fg-hero" style={{ marginBottom: 18, padding: '22px 24px' }}>
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                BALANÇO ORÇAMENTÁRIO · RECEITAS × DESPESAS · TCE-SP AUDESP
              </span>
              <StatusBanco />
            </div>

            <h1 className="fg-hero__title" style={{ marginTop: 8, marginBottom: 6 }}>
              Receitas e Gastos de <span>Guarulhos</span> Explicados
            </h1>
            <p className="fg-hero__lead">
              Acompanhe quanto dinheiro entra no Tesouro Municipal, de qual tributo ou transferência ele vem e para qual
              serviço público ele vai em {periodo}.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <Link to="/decretos" className="fg-btn-audit-live" style={{ textDecoration: 'none' }}>
                <ArrowRightLeft size={15} />
                <span>Auditar Decretos de Suplementação (De Onde Saiu → Para Onde Foi)</span>
              </Link>
              <Link to="/despesas" className="fg-btn-audit-ghost">
                <Building2 size={15} />
                <span>Ver Fornecedores Pagos</span>
              </Link>
            </div>
          </div>

          {/* 4 KPIs do Balanço no Hero */}
          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Total Arrecadado</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">{ data ? brlCompacto(rec) : '...' }</div>
              <div className="fg-hero-kpi__sub">R$ {inteiro(recPorMorador)} por habitante</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Total Liquidado e Pago</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">{ data ? brlCompacto(desp) : '...' }</div>
              <div className="fg-hero-kpi__sub">R$ {inteiro(despPorMorador)} por habitante</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Resultado no Período</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">{ data ? brlCompacto(saldo) : '...' }</div>
              <div className="fg-hero-kpi__sub">
                {saldo >= 0 ? 'Superávit primário de caixa' : 'Déficit financeiro no mês'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Índice de Execução</div>
              <div className="fg-hero-kpi__val">
                {rec > 0 ? `${Math.round((desp / rec) * 100)}%` : '...'}
              </div>
              <div className="fg-hero-kpi__sub">De cada R$ 100 arrecadados</div>
            </div>
          </div>
        </div>
      </header>

      {error && <ErrorBox error={error} />}

      {data && (
        <>
          {/* Guia Didático + Filtro de Competência */}
          <div className="fg-audit-explainer">
            <div className="fg-audit-explainer__icon">
              <Scale size={20} />
            </div>
            <div
              className="fg-audit-explainer__content"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ maxWidth: 820 }}>
                <strong>Leitura Executiva do Orçamento de Guarulhos (1,29 milhão de moradores):</strong>
                <p>
                  Tudo o que é pago em <strong>IPTU, ISS, IPVA e ICMS</strong> compõe a arrecadação de{' '}
                  <strong>{brlCompacto(rec)}</strong>. Quando a Prefeitura precisa remanejar verbas entre áreas ao
                  longo do ano, ela publica um Decreto no Diário Oficial — que você pode auditar em{' '}
                  <Link to="/decretos" className="fg-link">
                    Decretos Explicados
                  </Link>
                  .
                </p>
              </div>

              <div className="fin-filter" style={{ margin: 0 }}>
                <label htmlFor="fin-mes">Competência:</label>
                <select
                  id="fin-mes"
                  value={mes ?? ''}
                  onChange={(e) => setMes(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Ano acumulado ({ano})</option>
                  {Array.from(new Set(recMeses.map((r) => r.mes))).map((m) => (
                    <option key={m} value={m}>
                      {mesNome(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="fin-tabs" role="tablist">
            {ABAS.map((a) => (
              <button
                key={a.id}
                role="tab"
                aria-selected={aba === a.id}
                className={`fin-tab${aba === a.id ? ' is-active' : ''}`}
                onClick={() => setAba(a.id)}
              >
                {a.rotulo}
              </button>
            ))}
          </div>

          {aba === 'geral' && (
            <section className="fin-sec">
              <div className="fg-grid-2">
                <div className="fg-card">
                  <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} color="#059669" />
                    <span>Arrecadação × Pagamentos Mês a Mês</span>
                  </h2>
                  <p className="fg-sub">Clique em qualquer mês para filtrar toda a análise orçamentária.</p>
                  <div className="fin-legend">
                    <span>
                      <i className="fin-dot fin-dot--rec" />
                      Arrecadado (Entrou)
                    </span>
                    <span>
                      <i className="fin-dot fin-dot--desp" />
                      Pago (Saiu)
                    </span>
                  </div>
                  <Comparativo rec={recMeses} desp={despMeses} mesSel={mes} onMes={setMes} />
                </div>

                <div className="fg-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <h2 className="fg-h2">Composição da Receita por Categoria Econômica</h2>
                    <button
                      type="button"
                      onClick={() => setAba('receitas')}
                      className="fg-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Detalhar todos os tributos →
                    </button>
                  </div>
                  <p className="fg-sub">Origem dos {brlCompacto(rec)} arrecadados em {periodo}:</p>
                  <div
                    onClick={() => setAba('receitas')}
                    style={{ cursor: 'pointer' }}
                    title="Clique para abrir a árvore completa de impostos e transferências"
                  >
                    <BarraHorizontal
                      nome="Receitas Correntes (Impostos Municipais IPTU/ISS e Transferências SUS/FUNDEB/ICMS)"
                      valor={data.recResumo.total_corrente}
                      max={rec || 1}
                      accent
                      meta={`${pctTxt(data.recResumo.total_corrente, rec)} · Clique para detalhar`}
                    />
                    <BarraHorizontal
                      nome="Receitas Intra-Orçamentárias (Contribuições Patronais ao IPREM)"
                      valor={data.recResumo.total_intra}
                      max={rec || 1}
                      meta={`${pctTxt(data.recResumo.total_intra, rec)} · Clique para detalhar`}
                    />
                    <BarraHorizontal
                      nome="Receitas de Capital (Operações de Crédito, Convênios de Obras e Alienações)"
                      valor={data.recResumo.total_capital}
                      max={rec || 1}
                      meta={`${pctTxt(data.recResumo.total_capital, rec)} · Clique para detalhar`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="fg-section__head">
                  <div>
                    <h2 className="fg-h2">Destinação da Despesa por Área Temática ({periodo})</h2>
                    <p className="fg-sub">
                      Clique em qualquer área para auditar as empresas e entidades que receberam pagamentos:
                    </p>
                  </div>
                </div>
                <div className="fg-bento-areas">
                  {data.areas.map((a) => {
                    const percentual = pct(a.total_liquido, desp);
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
                            <span className="fg-area-card__pct">{pctTxt(a.total_liquido, desp)}</span>
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
              </div>
            </section>
          )}

          {aba === 'receitas' && (
            <section className="fin-sec">
              <div className="fg-grid-2">
                <div className="fg-card">
                  <h2 className="fg-h2">Árvore Completa de Receitas Arrecadadas</h2>
                  <p className="fg-sub">Expanda cada grupo contábil para auditar as rubricas de impostos e repasses:</p>
                  <ArvoreReceitas linhas={data.arvore} />
                </div>
                <div className="fg-card">
                  <h2 className="fg-h2">Vinculação por Fonte de Recurso (Carimbo Orçamentário)</h2>
                  <p className="fg-sub">
                    Recursos vinculados (SUS, FUNDEB, Convênios) possuem destinação exclusiva; Tesouro Municipal custeia
                    serviços gerais.
                  </p>
                  {data.fontes.map((f) => (
                    <BarraHorizontal
                      key={f.fonte_recurso}
                      nome={nomeLegivel(f.fonte_recurso)}
                      valor={f.total}
                      max={maxFonte}
                      meta={pctTxt(f.total, rec)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {aba === 'despesas' && (
            <section className="fin-sec">
              <div className="fg-bento-areas">
                {data.areas.map((a) => {
                  const percentual = pct(a.total_liquido, desp);
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
                          <span className="fg-area-card__pct">{pctTxt(a.total_liquido, desp)}</span>
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

              <div className="fg-grid-2">
                <div className="fg-card">
                  <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Landmark size={18} color="#09152b" />
                    <span>Desembolso por Unidade Gestora (Prefeitura, IPREM e Câmara)</span>
                  </h2>
                  <p className="fg-sub">Total liquidado e pago por cada órgão municipal em {periodo}.</p>
                  {data.orgaos.map((o) => (
                    <BarraHorizontal
                      key={o.orgao}
                      nome={nomeOrgaoCurto(o.orgao)}
                      valor={o.total_liquido}
                      max={maxOrgao}
                      accent
                      meta={`${pctTxt(o.total_liquido, desp)} do total · ${inteiro(o.qtd)} pagamentos · ${inteiro(o.qtd_credores)} credores`}
                      to={`/despesas?ano=${ano}${mes ? `&mes=${mes}` : ''}&orgao=${encodeURIComponent(o.orgao)}`}
                    />
                  ))}
                </div>
                <div className="fg-card">
                  <div className="fg-section__head" style={{ marginBottom: 6 }}>
                    <div>
                      <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={18} color="#0284c7" />
                        <span>Maiores Fornecedores no Período</span>
                      </h2>
                      <p className="fg-sub">Clique em qualquer empresa para abrir o dossiê completo de empenhos.</p>
                    </div>
                    <Link to={`/despesas?ano=${ano}${mes ? `&mes=${mes}` : ''}`} className="fg-link">
                      Ver todos →
                    </Link>
                  </div>
                  {data.top.map((t, i) => (
                    <BarraHorizontal
                      key={t.chave}
                      nome={`${i + 1}. ${nomeLegivel(t.credor)}`}
                      valor={t.total_liquido}
                      max={maxTop}
                      meta={`${inteiro(t.qtd)} pagamentos`}
                      to={`/despesas/credor/${t.chave}`}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {areaSelecionada && (
        <AreaDetalheModal
          area={areaSelecionada}
          ano={ano}
          mes={mes}
          onClose={() => setAreaSelecionada(null)}
        />
      )}
      {loading && !data && <div className="fg-skeleton" style={{ height: 220, marginTop: 16 }} aria-hidden />}
    </div>
  );
}
