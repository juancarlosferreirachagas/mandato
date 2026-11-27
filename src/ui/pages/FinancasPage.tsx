/**
 * ============================================================================
 * PÁGINA: RECEITAS E GASTOS — DE ONDE VEM E PARA ONDE VAI O DINHEIRO
 * Rota: /financas
 * ============================================================================
 */

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  Building2,
  Landmark,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { StatusBanco } from '../components/StatusFontes';
import { despesasRepository, type DespesaPorArea } from '@/repositories/despesasRepository';
import { receitasRepository, type ReceitaLinha } from '@/repositories/receitasRepository';
import { PLATAFORMA, QTD_DECRETOS } from '@/domain/plataforma';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox } from '../components/common';
import { BarraHorizontal } from '../components/Graficos';
import { GraficoReceitaDespesaModerno, GraficoRoscaAreas } from '../components/GraficosModernos';
import { AreaDetalheModal } from '../components/AreaDetalheModal';
import { GradeAreas } from '../components/AreasOrcamento';
import { brl, brlCompacto, inteiro, mesNome, nomeLegivel, nomeOrgaoCurto } from '../format';
import { RESUMO_CONEXOES_OFICIAIS } from '@/database/resumoConexoesOficiais';

type Aba = 'geral' | 'receitas' | 'despesas';
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'geral', rotulo: 'Visão geral' },
  { id: 'receitas', rotulo: 'De onde vem' },
  { id: 'despesas', rotulo: 'Para onde vai' },
];

type AnoOpcao = 2026 | 2025 | 'todos';
const OPCOES_ANO: { id: AnoOpcao; rotulo: string }[] = [
  { id: 2026, rotulo: '2026' },
  { id: 2025, rotulo: '2025' },
  { id: 'todos', rotulo: '2025–2026' },
];

const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);
const pctTxt = (v: number, total: number) => `${pct(v, total).toLocaleString('pt-BR')}%`;

async function carregar(ano: number | null, mes: number | null) {
  const mesEfetivo = ano === null ? null : mes;
  const [recMeses, despMeses] = await Promise.all([
    receitasRepository.porMes(ano),
    despesasRepository.porMes({ ano }),
  ]);
  const [recResumo, despResumo, arvore, fontes, orgaos, areas, top] = await Promise.all([
    receitasRepository.resumo(ano, mesEfetivo),
    despesasRepository.resumo({ ano, mes: mesEfetivo }),
    receitasRepository.arvore(ano, mesEfetivo),
    receitasRepository.porFonte(ano, mesEfetivo),
    despesasRepository.porOrgao({ ano, mes: mesEfetivo }),
    despesasRepository.porArea({ ano, mes: mesEfetivo }),
    despesasRepository.ranking({ ano, mes: mesEfetivo, somenteExternos: true, limite: 10 }),
  ]);
  return { recMeses, despMeses, recResumo, despResumo, arvore, fontes, orgaos, areas, top };
}

interface PontoComparativo {
  exercicio: number;
  mes: number;
  v: number;
}

function explicarGrupoReceita(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('transferências correntes')) {
    return 'Repasses obrigatórios da União e do Estado (ICMS, IPVA, FPM, FUNDEB para Educação e SUS para Saúde).';
  }
  if (n.includes('impostos, taxas')) {
    return 'Tributos pagos na cidade: IPTU dos imóveis, ISS das empresas e serviços, ITBI e taxas municipais.';
  }
  if (n.includes('contribuições')) {
    return 'Contribuições para a previdência dos servidores (IPREM) e para a iluminação pública.';
  }
  if (n.includes('patrimonial')) {
    return 'Rendimentos das aplicações do dinheiro em caixa e aluguéis/permissões de uso.';
  }
  if (n.includes('operações de crédito')) {
    return 'Empréstimos e financiamentos contratados para obras na cidade.';
  }
  if (n.includes('transferências de capital')) {
    return 'Verbas enviadas pelo Estado ou União para obras e compra de equipamentos.';
  }
  return 'Receitas públicas registradas pelo município no TCE-SP.';
}

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

  if (!grupos.length) return <p className="muted">Sem receitas registradas para o período selecionado.</p>;

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
                      ? 'Mostrar menos itens ↑'
                      : `Ver todos os ${g.rubricas.length} itens (+${g.rubricas.length - 12}) ↓`}
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
  const anoRaw = params.get('ano');
  const ano: number | null = anoRaw === 'todos' ? null : Number(anoRaw) === 2025 ? 2025 : 2026;
  const mes = ano !== null && params.get('mes') ? Number(params.get('mes')) : null;
  const [aba, setAba] = useState<Aba>('geral');
  const [areaSelecionada, setAreaSelecionada] = useState<DespesaPorArea | null>(null);

  const { data, loading, error } = useAsync(() => carregar(ano, mes), [ano, mes]);

  const selecionarAno = (op: AnoOpcao) => {
    setParams({ ano: String(op) }, { replace: true });
  };

  const setMes = (m: number | null) => {
    const p = new URLSearchParams(params);
    if (m) p.set('mes', String(m));
    else p.delete('mes');
    setParams(p, { replace: true });
  };

  const aoClicarMesComparativo = (m: number, exercicio: number) => {
    if (ano === null) {
      setParams({ ano: String(exercicio), mes: String(m) }, { replace: true });
    } else {
      setMes(mes === m ? null : m);
    }
  };

  const rec = data?.recResumo.total_arrecadado ?? 0;
  const desp = data?.despResumo.total_liquido ?? 0;
  const saldo = rec - desp;
  const recMeses: PontoComparativo[] =
    data?.recMeses.map((r) => ({ exercicio: r.exercicio, mes: r.mes, v: r.total_liquido })) ?? [];
  const despMeses: PontoComparativo[] =
    data?.despMeses
      .filter((d) => ano === null || d.exercicio === ano)
      .map((d) => ({ exercicio: d.exercicio, mes: d.mes, v: d.total_liquido })) ?? [];

  const periodo =
    ano === null
      ? '2025 e 2026 (consolidado)'
      : mes
      ? `${mesNome(mes)} de ${ano}`
      : `${ano} (${ano === 2025 ? 'ano completo' : `até ${mesNome(data?.recResumo.ultimo_mes ?? 9)}`})`;

  const maxOrgao = Math.max(...(data?.orgaos.map((o) => o.total_liquido) ?? [1]), 1);
  const maxTop = Math.max(...(data?.top.map((t) => t.total_liquido) ?? [1]), 1);
  const maxFonte = Math.max(...(data?.fontes.map((f) => f.total) ?? [1]), 1);
  const recPorMorador = rec > 0 ? Math.round(rec / PLATAFORMA.populacao) : 0;
  const despPorMorador = desp > 0 ? Math.round(desp / PLATAFORMA.populacao) : 0;
  const anoQuery = ano === null ? 'todos' : String(ano);

  return (
    <div className="fg-page-container">
      {/* Cabeçalho */}
      <header className="fg-hero" style={{ marginBottom: 18 }}>
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                Quanto entra e quanto sai · dados do TCE-SP
              </span>
              <StatusBanco />
            </div>

            <h1 className="fg-hero__title" style={{ marginTop: 8, marginBottom: 6 }}>
              Receitas e gastos de <span>{PLATAFORMA.municipio}</span>
            </h1>
            <p className="fg-hero__lead">
              Veja quanto dinheiro entrou nos cofres da Prefeitura, de quais impostos e repasses ele veio e em que
              serviços foi usado — {periodo}.
            </p>

            <div className="fg-hero__actions">
              <div className="fg-seg" role="group" aria-label="Escolha o período">
                {OPCOES_ANO.map((op) => {
                  const ativo = (op.id === 'todos' && ano === null) || ano === op.id;
                  return (
                    <button
                      key={String(op.id)}
                      type="button"
                      className={`fg-seg__btn${ativo ? ' is-active' : ''}`}
                      aria-pressed={ativo}
                      onClick={() => selecionarAno(op.id)}
                    >
                      {op.rotulo}
                    </button>
                  );
                })}
              </div>
              <Link to="/decretos" className="fg-btn-audit-ghost">
                <ArrowRightLeft size={15} aria-hidden />
                <span>Ver os {QTD_DECRETOS} decretos</span>
              </Link>
            </div>
          </div>

          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Dinheiro que entrou</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">{data ? brlCompacto(rec) : '…'}</div>
              <div className="fg-hero-kpi__sub">R$ {inteiro(recPorMorador)} por morador</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Dinheiro gasto</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">{data ? brlCompacto(desp) : '…'}</div>
              <div className="fg-hero-kpi__sub">R$ {inteiro(despPorMorador)} por morador</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Saldo do período</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">{data ? brlCompacto(saldo) : '…'}</div>
              <div className="fg-hero-kpi__sub">
                {saldo >= 0 ? 'Entrou mais do que saiu' : 'Saiu mais do que entrou'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Parte já gasta</div>
              <div className="fg-hero-kpi__val">{rec > 0 ? `${Math.round((desp / rec) * 100)}%` : '…'}</div>
              <div className="fg-hero-kpi__sub">do que foi arrecadado</div>
            </div>
          </div>
        </div>
      </header>

      {error && <ErrorBox error={error} />}

      {data && (
        <>
          <div className="fg-audit-explainer">
            <div className="fg-audit-explainer__icon">
              <Scale size={20} aria-hidden />
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
                <strong>Como ler esta página:</strong>
                <p>
                  Impostos como <strong>IPTU, ISS, IPVA e ICMS</strong> e repasses do governo somaram{' '}
                  <strong>{brlCompacto(rec)}</strong>. Quando a Prefeitura precisa mudar verba de uma área para outra,
                  ela publica um decreto no Diário Oficial. Você pode conferir em{' '}
                  <Link to="/decretos" className="fg-link">
                    Decretos
                  </Link>
                  .
                </p>
              </div>

              {ano !== null ? (
                <div className="fin-filter" style={{ margin: 0 }}>
                  <label htmlFor="fin-mes">Mês:</label>
                  <select
                    id="fin-mes"
                    value={mes ?? ''}
                    onChange={(e) => setMes(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Ano todo ({ano})</option>
                    {Array.from(new Set(recMeses.map((r) => r.mes))).map((m) => (
                      <option key={m} value={m}>
                        {mesNome(m)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="fg-badge fg-badge--blue">Consolidado 2025 + 2026</span>
              )}
            </div>
          </div>

          <div className="fin-tabs" role="tablist">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
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
                    <TrendingUp size={18} color="#059669" aria-hidden />
                    <span>Quanto entrou e quanto saiu por mês</span>
                  </h2>
                  <p className="fg-sub">Passe o mouse ou toque em um mês para ver o saldo exato e filtrar o período.</p>
                  <GraficoReceitaDespesaModerno
                    rec={recMeses}
                    desp={despMeses}
                    onSelecionarMes={aoClicarMesComparativo}
                  />
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
                    <h2 className="fg-h2">De onde vem o dinheiro</h2>
                    <button
                      type="button"
                      onClick={() => setAba('receitas')}
                      className="fg-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Ver impostos e repasses →
                    </button>
                  </div>
                  <p className="fg-sub">Origem dos {brlCompacto(rec)} arrecadados em {periodo}:</p>
                  <div>
                    <BarraHorizontal
                      nome="Impostos e repasses do dia a dia (IPTU, ISS, ICMS, SUS, FUNDEB)"
                      valor={data.recResumo.total_corrente}
                      max={rec || 1}
                      accent
                      meta={`${pctTxt(data.recResumo.total_corrente, rec)} do total`}
                    />
                    <BarraHorizontal
                      nome="Previdência dos servidores (contribuições ao IPREM)"
                      valor={data.recResumo.total_intra}
                      max={rec || 1}
                      meta={`${pctTxt(data.recResumo.total_intra, rec)} do total`}
                    />
                    <BarraHorizontal
                      nome="Obras e convênios (empréstimos e repasses para investimentos)"
                      valor={data.recResumo.total_capital}
                      max={rec || 1}
                      meta={`${pctTxt(data.recResumo.total_capital, rec)} do total`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="fg-section__head">
                  <div>
                    <h2 className="fg-h2">Para onde foi o dinheiro ({periodo})</h2>
                    <p className="fg-sub">Toque em uma área para ver quais empresas e entidades receberam.</p>
                  </div>
                </div>
                <GradeAreas areas={data.areas} totalBase={desp} onSelecionar={setAreaSelecionada} />
              </div>
            </section>
          )}

          {aba === 'receitas' && (
            <section className="fin-sec">
              <div className="fg-grid-2">
                <div className="fg-card">
                  <h2 className="fg-h2">Impostos e repasses detalhados</h2>
                  <p className="fg-sub">Toque em um grupo para abrir cada imposto, taxa ou repasse:</p>
                  <ArvoreReceitas linhas={data.arvore} />
                </div>
                <div className="fg-card">
                  <h2 className="fg-h2">Dinheiro carimbado vs. livre</h2>
                  <p className="fg-sub">
                    Verbas com carimbo (SUS, FUNDEB, convênios) só podem ir para aquela área. O Tesouro Municipal paga os
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
              <div className="fg-card">
                <h2 className="fg-h2">Divisão proporcional por área da cidade ({periodo})</h2>
                <p className="fg-sub">Toque em qualquer fatia ou linha da legenda para abrir os maiores recebedores.</p>
                <GraficoRoscaAreas areas={data.areas} onSelecionarArea={setAreaSelecionada} />
              </div>

              <GradeAreas areas={data.areas} totalBase={desp} onSelecionar={setAreaSelecionada} />

              <div className="fg-card">
                <div className="fg-section__head" style={{ marginBottom: 8 }}>
                  <div>
                    <h2 className="fg-h2">Como a Prefeitura contrata em 2026 (Modalidades de Licitação)</h2>
                    <p className="fg-sub">
                      Toque em uma modalidade para abrir a lista completa e paginada de empresas contratadas por aquele meio.
                    </p>
                  </div>
                  <Link to="/despesas?ano=2026" className="fg-link">
                    Filtrar empresas →
                  </Link>
                </div>
                <div style={{ display: 'grid', gap: 2 }}>
                  {RESUMO_CONEXOES_OFICIAIS.modalidadesLicitacao2026.map((m) => (
                    <BarraHorizontal
                      key={m.modalidade}
                      nome={m.modalidade}
                      valor={m.total}
                      max={RESUMO_CONEXOES_OFICIAIS.modalidadesLicitacao2026[0]?.total || 1}
                      meta={`${inteiro(m.qtdEmpresas)} empresas · ${inteiro(m.qtdPagamentos)} pagamentos`}
                      to={`/despesas?ano=2026&modalidade=${encodeURIComponent(m.modalidade)}`}
                    />
                  ))}
                </div>
              </div>

              <div className="fg-grid-2">
                <div className="fg-card">
                  <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Landmark size={18} color="#09152b" aria-hidden />
                    <span>Quanto cada órgão pagou</span>
                  </h2>
                  <p className="fg-sub">Total pago pela Prefeitura, Câmara e IPREM em {periodo}.</p>
                  {data.orgaos.map((o) => (
                    <BarraHorizontal
                      key={o.orgao}
                      nome={nomeOrgaoCurto(o.orgao)}
                      valor={o.total_liquido}
                      max={maxOrgao}
                      accent
                      meta={`${pctTxt(o.total_liquido, desp)} do total · ${inteiro(o.qtd)} pagamentos · ${inteiro(o.qtd_credores)} fornecedores`}
                      to={`/despesas?ano=${anoQuery}${mes ? `&mes=${mes}` : ''}&orgao=${encodeURIComponent(o.orgao)}`}
                    />
                  ))}
                </div>
                <div className="fg-card">
                  <div className="fg-section__head" style={{ marginBottom: 6 }}>
                    <div>
                      <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={18} color="#1e5fa8" aria-hidden />
                        <span>Quem mais recebeu</span>
                      </h2>
                      <p className="fg-sub">Toque em uma empresa para ver todos os pagamentos.</p>
                    </div>
                    <Link to={`/despesas?ano=${anoQuery}${mes ? `&mes=${mes}` : ''}`} className="fg-link">
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
          mes={ano === null ? null : mes}
          onClose={() => setAreaSelecionada(null)}
        />
      )}
      {loading && !data && <div className="fg-skeleton" style={{ height: 220, marginTop: 16 }} aria-hidden />}
    </div>
  );
}
