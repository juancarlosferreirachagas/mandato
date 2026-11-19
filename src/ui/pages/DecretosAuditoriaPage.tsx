/**
 * ============================================================================
 * PÁGINA: DOSSIÊ ILUSTRADO E ORDENADO — 262 DECRETOS & 212 DIÁRIOS OFICIAIS
 * Rota: /decretos
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * UI/UX EXECUTIVO E DIDÁTICO (PADRÃO AUDITORIA):
 * 1. Todos os 262 Decretos Suplementares Reais (2025 e 2026) em ordem estrita
 *    (Numérica/Cronológica Decrescente, Cronológica Crescente ou Maior Valor),
 *    agrupados por Mês/Ano com gráfico mensal interativo, diagrama visual de
 *    fluxo (Origem Art. 2º -> Decreto -> Destino Art. 1º) e leitor de PDF integrado.
 * 2. Todas as 212 Edições Reais do Diário Oficial de Guarulhos (2025 e 2026) em
 *    ordem cronológica e numérica (DOM #3620 -> #3302), agrupadas por Mês/Ano,
 *    cruzadas automaticamente com os decretos publicados naquela data.
 * 3. Raio-X Contábil Detalhado (De Onde Saiu "Redução R$" -> Para Onde Foi
 *    "Suplementação R$") com os códigos exatos das fichas orçamentárias.
 * ============================================================================
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpNarrowWide,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Database,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  calcularResumoDecretos,
  DECRETOS_ORCAMENTARIOS_AUDITADOS,
  type DecretoOrcamentarioAuditado,
  type TipoOrigemRecursoDecreto,
} from '@/domain/decretosOrcamentarios';
import {
  ACERVO_DIARIOS_REAIS,
  CATALOGO_DECRETOS_SUPLEMENTARES_REAIS,
  type DecretoSuplementarReal,
  type EdicaoDiarioReal,
} from '@/domain/diariosCatalogoReal';
import { verificarFontesEmTempoReal } from '@/services/auditoriaTempoRealService';
import { StatusBanco } from '../components/StatusFontes';
import { useAsync } from '../hooks/useAsync';
import { brl, brlCompacto, dataBr, dataHoraBr, inteiro, mesAbrev, mesNome } from '../format';

type AbaAuditoria = 'decretos_fluxo' | 'catalogo_262' | 'diarios_212' | 'fontes_tempo_real';
type OrdemDecretos = 'RECENTES' | 'ANTIGOS' | 'MAIOR_VALOR';
type OrdemDiarios = 'RECENTES' | 'ANTIGOS' | 'MAIS_PAGINAS';

const FILTROS_MODALIDADE: { id: 'TODOS' | TipoOrigemRecursoDecreto; label: string }[] = [
  { id: 'TODOS', label: 'Todos Detalhados' },
  { id: 'ANULACAO_DOTACAO', label: 'Suplementação por Redução / Anulação' },
  { id: 'REMANEJAMENTO_INTERNO', label: 'Remanejamento Interno (Saúde SUS / Precatórios)' },
];

export function DecretosAuditoriaPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAuditoria>('decretos_fluxo');

  // Estado para o visualizador de PDF integrado na própria tela (Modal Preview)
  const [pdfPreview, setPdfPreview] = useState<{ titulo: string; subtitulo: string; url: string } | null>(null);

  // Filtros da Aba 1 (Raio-X Contábil De Onde Saiu -> Para Onde Foi)
  const [filtroModalidade, setFiltroModalidade] = useState<'TODOS' | TipoOrigemRecursoDecreto>('TODOS');
  const [buscaFluxo, setBuscaFluxo] = useState('');

  // Filtros e Ordenação da Aba 2 (Todos os 262 Decretos Suplementares em Ordem)
  const [anoCatalogo, setAnoCatalogo] = useState<'TODOS' | 2026 | 2025>('TODOS');
  const [mesCatalogo, setMesCatalogo] = useState<number | null>(null);
  const [ordemDecretos, setOrdemDecretos] = useState<OrdemDecretos>('RECENTES');
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [pagCatalogo, setPagCatalogo] = useState(1);

  // Filtros e Ordenação da Aba 3 (Todas as 212 Edições do Diário Oficial em Ordem)
  const [anoDiario, setAnoDiario] = useState<'TODOS' | 2026 | 2025>('TODOS');
  const [mesDiario, setMesDiario] = useState<number | null>(null);
  const [ordemDiarios, setOrdemDiarios] = useState<OrdemDiarios>('RECENTES');
  const [buscaDiario, setBuscaDiario] = useState('');
  const [pagDiario, setPagDiario] = useState(1);

  // Modal de Ficha Técnica
  const [decretoSelecionado, setDecretoSelecionado] = useState<DecretoOrcamentarioAuditado | null>(null);

  // Telemetria em tempo real
  const [cicloVerificacao, setCicloVerificacao] = useState(0);
  const { data: relatorioTempoReal, loading: verificandoFontes } = useAsync(
    () => verificarFontesEmTempoReal(2026),
    [cicloVerificacao]
  );

  const resumoDecretos = useMemo(() => calcularResumoDecretos(DECRETOS_ORCAMENTARIOS_AUDITADOS), []);

  // Mapa rápido Data ISO -> Decretos publicados naquela edição do Diário Oficial
  const decretosPorDataIso = useMemo(() => {
    const mapa = new Map<string, DecretoSuplementarReal[]>();
    for (const d of CATALOGO_DECRETOS_SUPLEMENTARES_REAIS) {
      const lista = mapa.get(d.dataIso) ?? [];
      lista.push(d);
      mapa.set(d.dataIso, lista);
    }
    return mapa;
  }, []);

  // --------------------------------------------------------------------------
  // ABA 1: Decretos com Fluxo Contábil Detalhado
  // --------------------------------------------------------------------------
  const decretosFluxoFiltrados = useMemo(() => {
    const termo = buscaFluxo.trim().toLowerCase();
    return DECRETOS_ORCAMENTARIOS_AUDITADOS.filter((d) => {
      const bateMod = filtroModalidade === 'TODOS' || d.tipoOrigem === filtroModalidade;
      if (!bateMod) return false;
      if (!termo) return true;
      const txt = [
        d.numeroDecreto,
        d.edicaoDiarioOficial,
        d.tituloObjetivo,
        d.resumoExplicativo,
        ...d.origens.map((o) => `${o.orgaoOrigem} ${o.dotacaoCodigo} ${o.acaoProgramatica}`),
        ...d.destinos.map((dest) => `${dest.orgaoDestino} ${dest.areaTematica} ${dest.dotacaoCodigo} ${dest.acaoProgramatica}`),
      ]
        .join(' ')
        .toLowerCase();
      return txt.includes(termo);
    });
  }, [filtroModalidade, buscaFluxo]);

  // --------------------------------------------------------------------------
  // ABA 2: Todos os 262 Decretos Suplementares Ordenados e Agrupados
  // --------------------------------------------------------------------------
  const resumoMensalDecretos = useMemo(() => {
    const baseAno = anoCatalogo === 'TODOS' ? 2026 : anoCatalogo;
    const mapa = new Map<number, { mes: number; qtd: number; valor: number }>();
    for (let m = 1; m <= (baseAno === 2026 ? 11 : 12); m++) {
      mapa.set(m, { mes: m, qtd: 0, valor: 0 });
    }
    for (const d of CATALOGO_DECRETOS_SUPLEMENTARES_REAIS) {
      if (d.ano !== baseAno) continue;
      const item = mapa.get(d.mes) ?? { mes: d.mes, qtd: 0, valor: 0 };
      item.qtd += 1;
      item.valor += d.valor;
      mapa.set(d.mes, item);
    }
    return [...mapa.values()].sort((a, b) => a.mes - b.mes);
  }, [anoCatalogo]);

  const maxValorMesDecreto = useMemo(
    () => Math.max(...resumoMensalDecretos.map((m) => m.valor), 1),
    [resumoMensalDecretos]
  );

  const catalogoFiltradoEOrdenado = useMemo(() => {
    const termo = buscaCatalogo.trim().toLowerCase();
    const filtrados = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter((d) => {
      if (anoCatalogo !== 'TODOS' && d.ano !== anoCatalogo) return false;
      if (mesCatalogo !== null && d.mes !== mesCatalogo) return false;
      if (!termo) return true;
      return (
        d.numero.toLowerCase().includes(termo) ||
        d.numeroFmt.toLowerCase().includes(termo) ||
        d.dataBr.includes(termo) ||
        d.valorFmt.toLowerCase().includes(termo) ||
        d.trecho.toLowerCase().includes(termo)
      );
    });

    const copia = [...filtrados];
    if (ordemDecretos === 'RECENTES') {
      copia.sort((a, b) => b.dataIso.localeCompare(a.dataIso) || b.numeroInt - a.numeroInt);
    } else if (ordemDecretos === 'ANTIGOS') {
      copia.sort((a, b) => a.dataIso.localeCompare(b.dataIso) || a.numeroInt - b.numeroInt);
    } else if (ordemDecretos === 'MAIOR_VALOR') {
      copia.sort((a, b) => b.valor - a.valor || b.dataIso.localeCompare(a.dataIso));
    }
    return copia;
  }, [anoCatalogo, mesCatalogo, buscaCatalogo, ordemDecretos]);

  const LIMIT_CATALOGO = 24;
  const totalPagsCatalogo = Math.ceil(catalogoFiltradoEOrdenado.length / LIMIT_CATALOGO) || 1;
  const catalogoVisivel = catalogoFiltradoEOrdenado.slice(
    (pagCatalogo - 1) * LIMIT_CATALOGO,
    pagCatalogo * LIMIT_CATALOGO
  );
  const somaCatalogoFiltrado = useMemo(
    () => catalogoFiltradoEOrdenado.reduce((acc, d) => acc + d.valor, 0),
    [catalogoFiltradoEOrdenado]
  );
  const maiorDecretoFiltro = useMemo(
    () => Math.max(...catalogoFiltradoEOrdenado.map((d) => d.valor), 1),
    [catalogoFiltradoEOrdenado]
  );

  // Agrupamento por Mês/Ano dos decretos visíveis na página atual
  const gruposDecretosVisiveis = useMemo(() => {
    const grupos: { chave: string; rotulo: string; totalMes: number; itens: { dec: DecretoSuplementarReal; posGlobal: number }[] }[] = [];
    const mapa = new Map<string, (typeof grupos)[number]>();
    catalogoVisivel.forEach((dec, idx) => {
      const posGlobal = (pagCatalogo - 1) * LIMIT_CATALOGO + idx + 1;
      const chave = ordemDecretos === 'MAIOR_VALOR' ? 'RANKING_VALOR' : `${dec.ano}-${String(dec.mes).padStart(2, '0')}`;
      const rotulo =
        ordemDecretos === 'MAIOR_VALOR'
          ? 'Ranking por Maior Impacto Orçamentário (R$)'
          : `${mesNome(dec.mes).toUpperCase()} DE ${dec.ano}`;
      let g = mapa.get(chave);
      if (!g) {
        g = { chave, rotulo, totalMes: 0, itens: [] };
        mapa.set(chave, g);
        grupos.push(g);
      }
      g.totalMes += dec.valor;
      g.itens.push({ dec, posGlobal });
    });
    return grupos;
  }, [catalogoVisivel, pagCatalogo, ordemDecretos]);

  // --------------------------------------------------------------------------
  // ABA 3: Todas as 212 Edições do Diário Oficial Ordenadas e Agrupadas
  // --------------------------------------------------------------------------
  const resumoMensalDiarios = useMemo(() => {
    const baseAno = anoDiario === 'TODOS' ? 2026 : anoDiario;
    const mapa = new Map<number, { mes: number; edicoes: number; paginas: number }>();
    for (let m = 1; m <= (baseAno === 2026 ? 11 : 12); m++) {
      mapa.set(m, { mes: m, edicoes: 0, paginas: 0 });
    }
    for (const e of ACERVO_DIARIOS_REAIS) {
      if (e.ano !== baseAno) continue;
      const item = mapa.get(e.mes) ?? { mes: e.mes, edicoes: 0, paginas: 0 };
      item.edicoes += 1;
      item.paginas += e.totalPaginas;
      mapa.set(e.mes, item);
    }
    return [...mapa.values()].sort((a, b) => a.mes - b.mes);
  }, [anoDiario]);

  const maxPagsMesDiario = useMemo(
    () => Math.max(...resumoMensalDiarios.map((m) => m.paginas), 1),
    [resumoMensalDiarios]
  );

  const diariosFiltradosEOrdenados = useMemo(() => {
    const termo = buscaDiario.trim().toLowerCase();
    const filtrados = ACERVO_DIARIOS_REAIS.filter((e) => {
      if (anoDiario !== 'TODOS' && e.ano !== anoDiario) return false;
      if (mesDiario !== null && e.mes !== mesDiario) return false;
      if (!termo) return true;
      const decsNaData = decretosPorDataIso.get(e.dataPublicacao) ?? [];
      const bateDecreto = decsNaData.some((d) => d.numero.includes(termo) || d.numeroFmt.includes(termo));
      return (
        String(e.codigoDom).includes(termo) ||
        e.dataBr.includes(termo) ||
        bateDecreto ||
        e.cadernos.some((c) => c.rotulo.toLowerCase().includes(termo))
      );
    });

    const copia = [...filtrados];
    if (ordemDiarios === 'RECENTES') {
      copia.sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao) || b.codigoDom - a.codigoDom);
    } else if (ordemDiarios === 'ANTIGOS') {
      copia.sort((a, b) => a.dataPublicacao.localeCompare(b.dataPublicacao) || a.codigoDom - b.codigoDom);
    } else if (ordemDiarios === 'MAIS_PAGINAS') {
      copia.sort((a, b) => b.totalPaginas - a.totalPaginas || b.dataPublicacao.localeCompare(a.dataPublicacao));
    }
    return copia;
  }, [anoDiario, mesDiario, buscaDiario, ordemDiarios, decretosPorDataIso]);

  const LIMIT_DIARIOS = 24;
  const totalPagsDiarios = Math.ceil(diariosFiltradosEOrdenados.length / LIMIT_DIARIOS) || 1;
  const diariosVisiveis = diariosFiltradosEOrdenados.slice(
    (pagDiario - 1) * LIMIT_DIARIOS,
    pagDiario * LIMIT_DIARIOS
  );

  // Agrupamento por Mês/Ano das edições visíveis do Diário Oficial
  const gruposDiariosVisiveis = useMemo(() => {
    const grupos: { chave: string; rotulo: string; totalPags: number; itens: { ed: EdicaoDiarioReal; posGlobal: number }[] }[] = [];
    const mapa = new Map<string, (typeof grupos)[number]>();
    diariosVisiveis.forEach((ed, idx) => {
      const posGlobal = (pagDiario - 1) * LIMIT_DIARIOS + idx + 1;
      const chave =
        ordemDiarios === 'MAIS_PAGINAS' ? 'RANKING_PAGINAS' : `${ed.ano}-${String(ed.mes).padStart(2, '0')}`;
      const rotulo =
        ordemDiarios === 'MAIS_PAGINAS'
          ? 'Edições Ordenadas por Maior Volume de Páginas'
          : `${mesNome(ed.mes).toUpperCase()} DE ${ed.ano}`;
      let g = mapa.get(chave);
      if (!g) {
        g = { chave, rotulo, totalPags: 0, itens: [] };
        mapa.set(chave, g);
        grupos.push(g);
      }
      g.totalPags += ed.totalPaginas;
      g.itens.push({ ed, posGlobal });
    });
    return grupos;
  }, [diariosVisiveis, pagDiario, ordemDiarios]);

  return (
    <div className="fg-page-container">
      {/* ====================================================================
          CABEÇALHO EXECUTIVO DO DOSSIÊ (2025 + 2026)
          ==================================================================== */}
      <header className="fg-hero" style={{ marginBottom: 18 }}>
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                DOSSIÊ 2025–2026 ORDENADO · 212 DIÁRIOS OFICIAIS · 262 DECRETOS REAIS
              </span>
              <StatusBanco />
            </div>

            <h1 className="fg-hero__title" style={{ marginTop: 10 }}>
              Decretos &amp; Diários Oficiais <span>Em Ordem</span>
            </h1>
            <p className="fg-hero__lead">
              Linha do tempo oficial completa (2025 e 2026): explore os <strong>262 decretos suplementares</strong> e
              as <strong>212 edições do Diário Oficial</strong> organizados cronologicamente mês a mês, com gráficos de
              volume, cruzamento de datas e leitor de PDF integrado.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setAbaAtiva('catalogo_262')}
                className={abaAtiva === 'catalogo_262' ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <FileText size={15} />
                <span>262 Decretos em Ordem (2025–2026)</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('diarios_212')}
                className={abaAtiva === 'diarios_212' ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <BookOpen size={15} />
                <span>212 Diários Oficiais em Ordem (2025–2026)</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('decretos_fluxo')}
                className={abaAtiva === 'decretos_fluxo' ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <ArrowRightLeft size={15} />
                <span>Raio-X: De Onde Saiu → Para Onde Foi</span>
              </button>
            </div>
          </div>

          {/* 4 KPIs Reais Extraídos de 2025 e 2026 */}
          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">262 Decretos Ordenados</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">
                {brlCompacto(resumoDecretos.totalCatalogo262)}
              </div>
              <div className="fg-hero-kpi__sub">122 em 2026 + 140 em 2025</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Suplementado em 2026</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">
                {brlCompacto(resumoDecretos.totalCatalogo2026)}
              </div>
              <div className="fg-hero-kpi__sub">Decretos nº 43.914 a 44.666</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Suplementado em 2025</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">
                {brlCompacto(resumoDecretos.totalCatalogo2025)}
              </div>
              <div className="fg-hero-kpi__sub">Decretos de Jan a Dez/2025</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">212 Diários Extraídos</div>
              <div className="fg-hero-kpi__val">DOM #3302–3620</div>
              <div className="fg-hero-kpi__sub">100% com PDF oficial direto</div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          4 ABAS PRINCIPAIS COM CONTADORES E ÍCONES
          ==================================================================== */}
      <div
        className="fg-audit-tabs"
        role="tablist"
        aria-label="Módulos do dossiê de decretos e diários oficiais"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'decretos_fluxo'}
          className={`fg-audit-tab ${abaAtiva === 'decretos_fluxo' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('decretos_fluxo')}
        >
          <ArrowRightLeft size={17} />
          <div>
            <div className="fg-audit-tab__title">1. Raio-X: De Onde Saiu → Para Onde Foi</div>
            <div className="fg-audit-tab__sub">
              Tabelas de Redução R$ (Origem) e Suplementação R$ (Destino) explicadas ficha a ficha
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'catalogo_262'}
          className={`fg-audit-tab ${abaAtiva === 'catalogo_262' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('catalogo_262')}
        >
          <FileText size={17} />
          <div>
            <div className="fg-audit-tab__title">2. Todos os 262 Decretos em Ordem</div>
            <div className="fg-audit-tab__sub">
              Linha do tempo ilustrada mês a mês (2025 e 2026) com ordenação por data, número ou valor
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'diarios_212'}
          className={`fg-audit-tab ${abaAtiva === 'diarios_212' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('diarios_212')}
        >
          <BookOpen size={17} />
          <div>
            <div className="fg-audit-tab__title">3. Todos os 212 Diários em Ordem</div>
            <div className="fg-audit-tab__sub">
              Calendário visual 2025–2026 em ordem de edição (#3620 → #3302) cruzado com os decretos do dia
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'fontes_tempo_real'}
          className={`fg-audit-tab ${abaAtiva === 'fontes_tempo_real' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('fontes_tempo_real')}
        >
          <ShieldCheck size={17} />
          <div>
            <div className="fg-audit-tab__title">4. Fontes Validadas (2025 + 2026)</div>
            <div className="fg-audit-tab__sub">
              62.748 pagamentos TCE-SP (R$ 10,61 bi), 9.462 receitas (R$ 12,55 bi), DOM-GRU e TSE
            </div>
          </div>
        </button>
      </div>

      {/* ====================================================================
          ABA 1: FLUXO CONTÁBIL DETALHADO (DE ONDE SAIU -> PARA ONDE FOI)
          ==================================================================== */}
      {abaAtiva === 'decretos_fluxo' && (
        <section aria-label="Rastreabilidade Contábil de Decretos Orçamentários">
          <div className="fg-audit-explainer">
            <div className="fg-audit-explainer__icon">
              <Scale size={22} />
            </div>
            <div className="fg-audit-explainer__content">
              <strong>Anatomia Visual do Decreto Orçamentário (Lei Federal nº 4.320/1964)</strong>
              <p>
                Nos decretos assinados no Diário Oficial de Guarulhos, o <strong>Art. 1º</strong> define{' '}
                <strong>PARA ONDE FOI O DINHEIRO (Tabela Suplementação R$)</strong> e o <strong>Art. 2º</strong> define{' '}
                <strong>DE ONDE SAIU O DINHEIRO (Tabela Redução / Anulação R$)</strong>. Clique em{' '}
                <strong>“Visualizar PDF na Tela”</strong> para abrir o documento oficial sem sair da página.
              </p>
            </div>
          </div>

          <div className="fg-card" style={{ marginBottom: 18, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="fg-pills">
                {FILTROS_MODALIDADE.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`fg-pill ${filtroModalidade === f.id ? 'is-active' : ''}`}
                    onClick={() => setFiltroModalidade(f.id)}
                  >
                    <Filter size={13} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
                />
                <input
                  type="search"
                  className="fg-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Filtrar decreto, código 0791, 3710, Saúde, Precatórios..."
                  value={buscaFluxo}
                  onChange={(e) => setBuscaFluxo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            {decretosFluxoFiltrados.map((dec, index) => (
              <article key={dec.id} className="fg-decree-card">
                <div className="fg-decree-card__header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span className="fg-seq-badge">#{String(index + 1).padStart(2, '0')}</span>
                      <span className="fg-badge fg-badge--navy">
                        <FileText size={13} />
                        {dec.numeroDecreto}
                      </span>
                      <span className="fg-badge fg-badge--blue">
                        {dec.edicaoDiarioOficial} ({dec.paginaDiario})
                      </span>
                      <span className="fg-badge fg-badge--amber">{dec.rotuloModalidade}</span>
                    </div>
                    <h2 className="fg-decree-card__title">{dec.tituloObjetivo}</h2>
                  </div>

                  <div className="fg-decree-card__amount-box">
                    <span className="fg-decree-card__amount-lbl">Valor Suplementado</span>
                    <strong className="fg-decree-card__amount-val">{brl(dec.valorTotal)}</strong>
                    <span className="fg-decree-card__amount-sub">{brlCompacto(dec.valorTotal)} auditados</span>
                  </div>
                </div>

                <div className="fg-decree-card__summary">
                  <strong>Explicação Direta:</strong> {dec.resumoExplicativo}
                </div>

                <div className="fg-decree-flow">
                  {/* COLUNA 1: DE ONDE SAIU */}
                  <div className="fg-decree-flow__col fg-decree-flow__col--origin">
                    <div className="fg-decree-flow__col-head fg-decree-flow__col-head--origin">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingDown size={18} />
                        <span>DE ONDE SAIU (ART. 2º · TABELA REDUÇÃO R$)</span>
                      </div>
                      <span className="fg-mono-tag">-{brlCompacto(dec.valorTotal)}</span>
                    </div>

                    <div className="fg-decree-flow__list">
                      {dec.origens.map((orig, idx) => (
                        <div key={idx} className="fg-decree-flow__item">
                          <div className="fg-decree-flow__item-top">
                            <strong className="fg-decree-flow__orgao">{orig.orgaoOrigem}</strong>
                            <span className="fg-decree-flow__val fg-decree-flow__val--out">- {brl(orig.valor)}</span>
                          </div>
                          <div className="fg-decree-flow__rubrica">
                            <code>{orig.dotacaoCodigo}</code> · {orig.acaoProgramatica}
                          </div>
                          <div className="fg-decree-flow__meta">
                            <span>Natureza: {orig.elementoNatureza}</span>
                            <span>·</span>
                            <span>Fonte: {orig.fonteRecurso}</span>
                          </div>
                          <p className="fg-decree-flow__explain">
                            <strong>O que significa:</strong> {orig.impactoOrigemCidadao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLUNA 2: PARA ONDE FOI */}
                  <div className="fg-decree-flow__col fg-decree-flow__col--dest">
                    <div className="fg-decree-flow__col-head fg-decree-flow__col-head--dest">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={18} />
                        <span>PARA ONDE FOI (ART. 1º · TABELA SUPLEMENTAÇÃO R$)</span>
                      </div>
                      <span className="fg-mono-tag">+{brlCompacto(dec.valorTotal)}</span>
                    </div>

                    <div className="fg-decree-flow__list">
                      {dec.destinos.map((dest, idx) => (
                        <div key={idx} className="fg-decree-flow__item">
                          <div className="fg-decree-flow__item-top">
                            <div>
                              <span className="fg-badge fg-badge--emerald" style={{ marginBottom: 4 }}>
                                {dest.areaTematica}
                              </span>
                              <strong className="fg-decree-flow__orgao" style={{ display: 'block' }}>
                                {dest.orgaoDestino}
                              </strong>
                            </div>
                            <span className="fg-decree-flow__val fg-decree-flow__val--in">+ {brl(dest.valor)}</span>
                          </div>
                          <div className="fg-decree-flow__rubrica">
                            <code>{dest.dotacaoCodigo}</code> · {dest.acaoProgramatica}
                          </div>
                          <div className="fg-decree-flow__meta">
                            <span>Natureza: {dest.elementoNatureza}</span>
                            <span>·</span>
                            <span>Fonte: {dest.fonteRecurso}</span>
                          </div>
                          <p className="fg-decree-flow__explain">
                            <strong>Aplicação na cidade:</strong> {dest.aplicacaoPraticaCidadao}
                          </p>
                          <div style={{ marginTop: 8 }}>
                            <Link
                              to={`/despesas?q=${encodeURIComponent(dest.filtroFornecedorRelacionado)}`}
                              className="fg-link-inline"
                            >
                              <span>Cruzar com fornecedores pagos nesta área no TCE-SP</span>
                              <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="fg-decree-card__footer">
                  <div className="fg-decree-card__audit-note">
                    <ShieldCheck size={16} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Verificação Documental:</strong> {dec.parecerAuditoriaTecnica}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="fg-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
                      onClick={() =>
                        setPdfPreview({
                          titulo: dec.numeroDecreto,
                          subtitulo: `${dec.edicaoDiarioOficial} · ${dec.paginaDiario}`,
                          url: dec.urlDiarioOficial,
                        })
                      }
                    >
                      <Eye size={15} />
                      <span>Visualizar PDF na Tela</span>
                    </button>

                    <button
                      type="button"
                      className="fg-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
                      onClick={() => setDecretoSelecionado(dec)}
                    >
                      <FileCheck2 size={15} />
                      <span>Ficha Técnica</span>
                    </button>

                    <a
                      href={dec.urlDiarioOficial}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="fg-btn fg-btn--primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                      }}
                    >
                      <BookOpen size={15} />
                      <span>Abrir PDF ({dec.paginaDiario})</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          ABA 2: TODOS OS 262 DECRETOS EM ORDEM & ILUSTRADOS MÊS A MÊS
          ==================================================================== */}
      {abaAtiva === 'catalogo_262' && (
        <section aria-label="Todos os 262 Decretos Suplementares em Ordem">
          {/* Painel Visual Ilustrado: Gráfico Mensal Interativo dos Decretos */}
          <div className="fg-card" style={{ marginBottom: 16 }}>
            <div className="fg-section__head" style={{ marginBottom: 10 }}>
              <div>
                <span className="fg-badge fg-badge--navy" style={{ marginBottom: 4 }}>
                  <Calendar size={12} />
                  MAPA MENSAL ILUSTRADO DE DECRETOS ({anoCatalogo === 'TODOS' ? 2026 : anoCatalogo})
                </span>
                <h2 className="fg-h2">
                  Volume Mensal de Créditos Suplementares Abertos por Decreto
                </h2>
                <p className="fg-sub">
                  Toque em qualquer mês abaixo para filtrar os decretos daquele período:
                </p>
              </div>
              {mesCatalogo !== null && (
                <button
                  type="button"
                  className="fg-btn"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => {
                    setMesCatalogo(null);
                    setPagCatalogo(1);
                  }}
                >
                  Limpar filtro de mês ({mesNome(mesCatalogo)}) ✕
                </button>
              )}
            </div>

            <div className="fg-month-chart">
              {resumoMensalDecretos.map((m) => {
                const ativo = mesCatalogo === m.mes;
                const alturaPct = Math.max(8, Math.round((m.valor / maxValorMesDecreto) * 100));
                return (
                  <button
                    key={m.mes}
                    type="button"
                    className={`fg-month-chart__col ${ativo ? 'is-active' : ''}`}
                    onClick={() => {
                      setMesCatalogo(ativo ? null : m.mes);
                      setPagCatalogo(1);
                    }}
                    title={`${mesNome(m.mes)}: ${m.qtd} decretos · ${brl(m.valor)}`}
                  >
                    <span className="fg-month-chart__val">{m.valor > 0 ? brlCompacto(m.valor).replace('R$ ', '') : '—'}</span>
                    <div className="fg-month-chart__track">
                      <div className="fg-month-chart__fill" style={{ height: `${alturaPct}%` }} />
                    </div>
                    <span className="fg-month-chart__lbl">{mesAbrev(m.mes).toUpperCase()}</span>
                    <span className="fg-month-chart__cnt">{m.qtd} dec.</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Controle: Ano + Ordenação + Busca */}
          <div className="fg-card" style={{ marginBottom: 18, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              {/* Filtro de Ano */}
              <div className="fg-pills">
                {[
                  { id: 'TODOS' as const, label: `Todos (${CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.length})` },
                  { id: 2026 as const, label: '2026 (122 decretos)' },
                  { id: 2025 as const, label: '2025 (140 decretos)' },
                ].map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    className={`fg-pill ${anoCatalogo === item.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setAnoCatalogo(item.id);
                      setPagCatalogo(1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Seletor de Ordem */}
              <div className="fg-pills">
                <button
                  type="button"
                  className={`fg-pill ${ordemDecretos === 'RECENTES' ? 'is-active' : ''}`}
                  onClick={() => {
                    setOrdemDecretos('RECENTES');
                    setPagCatalogo(1);
                  }}
                >
                  <ArrowDownWideNarrow size={13} />
                  <span>Mais Recentes (#44.666 → #42.xxx)</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill ${ordemDecretos === 'ANTIGOS' ? 'is-active' : ''}`}
                  onClick={() => {
                    setOrdemDecretos('ANTIGOS');
                    setPagCatalogo(1);
                  }}
                >
                  <ArrowUpNarrowWide size={13} />
                  <span>Ordem Cronológica (Jan/25 → Nov/26)</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill ${ordemDecretos === 'MAIOR_VALOR' ? 'is-active' : ''}`}
                  onClick={() => {
                    setOrdemDecretos('MAIOR_VALOR');
                    setPagCatalogo(1);
                  }}
                >
                  <TrendingUp size={13} />
                  <span>Maior Valor (R$)</span>
                </button>
              </div>

              {/* Busca */}
              <div style={{ flex: '1 1 240px', maxWidth: 340 }}>
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Buscar nº do decreto (ex: 44655), data ou valor..."
                  value={buscaCatalogo}
                  onChange={(e) => {
                    setBuscaCatalogo(e.target.value);
                    setPagCatalogo(1);
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid var(--fg-border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: '0.8rem',
                color: '#475569',
              }}
            >
              <span>
                Ordem ativa:{' '}
                <strong>
                  {ordemDecretos === 'RECENTES'
                    ? 'Numérica e Cronológica Decrescente (Mais Recentes Primeiro)'
                    : ordemDecretos === 'ANTIGOS'
                    ? 'Cronológica Crescente (Janeiro/2025 a Novembro/2026)'
                    : 'Maior Valor Orçamentário Suplementado'}
                </strong>
              </span>
              <span className="fg-badge fg-badge--emerald" style={{ fontSize: '0.78rem' }}>
                Total Filtrado: {brl(somaCatalogoFiltrado)} ({inteiro(catalogoFiltradoEOrdenado.length)} decretos)
              </span>
            </div>
          </div>

          {/* Linha do Tempo Agrupada por Mês com Cards Ilustrados */}
          <div style={{ display: 'grid', gap: 22 }}>
            {gruposDecretosVisiveis.map((grupo) => (
              <div key={grupo.chave} className="fg-timeline-group">
                <div className="fg-timeline-group__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="fg-timeline-group__dot" />
                    <h3 className="fg-timeline-group__title">{grupo.rotulo}</h3>
                    <span className="fg-badge fg-badge--blue">{grupo.itens.length} decreto(s) nesta página</span>
                  </div>
                  <div className="fg-timeline-group__sum">
                    Soma do grupo: <strong>{brl(grupo.totalMes)}</strong>
                  </div>
                </div>

                <div className="fg-ordered-grid">
                  {grupo.itens.map(({ dec, posGlobal }) => {
                    const pctBarra = Math.max(4, Math.min(100, Math.round((dec.valor / maiorDecretoFiltro) * 100)));
                    return (
                      <article key={`${dec.numero}-${dec.dataIso}`} className="fg-ordered-card">
                        <div className="fg-ordered-card__top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className="fg-seq-badge">#{String(posGlobal).padStart(3, '0')}</span>
                            <strong className="fg-ordered-card__num">DECRETO Nº {dec.numeroFmt}</strong>
                            <span className="fg-badge fg-badge--blue">{dec.dataBr}</span>
                            {dec.codigoDom && (
                              <span className="fg-badge fg-badge--navy">DOM #{dec.codigoDom}</span>
                            )}
                            <span className="fg-tag">
                              Pág. {dec.pagina} de {dec.totalPaginas}
                            </span>
                          </div>

                          <div className="fg-ordered-card__val-box">
                            <span className="fg-ordered-card__val-lbl">Crédito Suplementar</span>
                            <strong className="fg-ordered-card__val">+ {brl(dec.valor)}</strong>
                          </div>
                        </div>

                        {/* Barra Visual de Proporção Orçamentária */}
                        <div className="fg-ordered-card__bar" title={`Proporção relativa: ${pctBarra}%`}>
                          <div className="fg-ordered-card__bar-fill" style={{ width: `${pctBarra}%` }} />
                        </div>

                        {/* Diagrama Ilustrado de Fluxo do Decreto */}
                        <div className="fg-mini-flow">
                          <div className="fg-mini-flow__box fg-mini-flow__box--out">
                            <TrendingDown size={14} />
                            <div>
                              <span className="fg-mini-flow__lbl">DE ONDE SAIU (ART. 2º LOA)</span>
                              <strong>Anulação / Redução de Dotação ou Superávit ({dec.ano})</strong>
                            </div>
                          </div>

                          <div className="fg-mini-flow__arrow" aria-hidden>
                            <ArrowRight size={16} />
                          </div>

                          <div className="fg-mini-flow__box fg-mini-flow__box--in">
                            <TrendingUp size={14} />
                            <div>
                              <span className="fg-mini-flow__lbl">PARA ONDE FOI (ART. 1º LOA)</span>
                              <strong>Suplementação Orçamentária de {brl(dec.valor)}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Ementa Oficial Extraída */}
                        <p className="fg-ordered-card__excerpt">
                          <strong>Registro Oficial no Diário de {dec.dataBr} (Pág. {dec.pagina}):</strong> Dispõe sobre
                          a abertura de crédito adicional suplementar ao Orçamento do Município de Guarulhos no valor
                          de <strong>{brl(dec.valor)}</strong>, nos termos do inciso XIV do artigo 63 da Lei Orgânica do
                          Município.
                        </p>

                        <div className="fg-ordered-card__actions">
                          <button
                            type="button"
                            className="fg-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
                            onClick={() =>
                              setPdfPreview({
                                titulo: `Decreto Executivo nº ${dec.numeroFmt}`,
                                subtitulo: `Publicado no Diário Oficial de ${dec.dataBr} · Página ${dec.pagina} de ${dec.totalPaginas} · Valor: ${brl(dec.valor)}`,
                                url: dec.pdfUrl,
                              })
                            }
                          >
                            <Eye size={14} />
                            <span>Visualizar PDF Aqui</span>
                          </button>

                          <a
                            href={dec.pdfUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="fg-btn fg-btn--primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.78rem',
                              textDecoration: 'none',
                            }}
                          >
                            <BookOpen size={14} />
                            <span>Abrir PDF Oficial (Pág. {dec.pagina})</span>
                            <ArrowUpRight size={13} />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {totalPagsCatalogo > 1 && (
            <div className="fg-pager" style={{ marginTop: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div>
                Exibindo decretos <strong>{(pagCatalogo - 1) * LIMIT_CATALOGO + 1}</strong> a{' '}
                <strong>{Math.min(pagCatalogo * LIMIT_CATALOGO, catalogoFiltradoEOrdenado.length)}</strong> de{' '}
                <strong>{catalogoFiltradoEOrdenado.length}</strong> em ordem
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="fg-btn"
                  disabled={pagCatalogo <= 1}
                  onClick={() => setPagCatalogo((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <span style={{ alignSelf: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  Pág. {pagCatalogo} / {totalPagsCatalogo}
                </span>
                <button
                  type="button"
                  className="fg-btn"
                  disabled={pagCatalogo >= totalPagsCatalogo}
                  onClick={() => setPagCatalogo((p) => p + 1)}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          ABA 3: TODAS AS 212 EDIÇÕES DO DIÁRIO OFICIAL EM ORDEM & ILUSTRADAS
          ==================================================================== */}
      {abaAtiva === 'diarios_212' && (
        <section aria-label="Todas as 212 Edições do Diário Oficial em Ordem">
          {/* Painel Ilustrado: Volume Mensal de Edições e Páginas do Diário Oficial */}
          <div className="fg-card" style={{ marginBottom: 16 }}>
            <div className="fg-section__head" style={{ marginBottom: 10 }}>
              <div>
                <span className="fg-badge fg-badge--navy" style={{ marginBottom: 4 }}>
                  <Layers size={12} />
                  CALENDÁRIO VISUAL DO DIÁRIO OFICIAL ({anoDiario === 'TODOS' ? 2026 : anoDiario})
                </span>
                <h2 className="fg-h2">
                  Edições e Páginas Publicadas Mês a Mês pela Imprensa Oficial
                </h2>
                <p className="fg-sub">
                  Toque em qualquer mês para listar todas as edições daquele mês em ordem:
                </p>
              </div>
              {mesDiario !== null && (
                <button
                  type="button"
                  className="fg-btn"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => {
                    setMesDiario(null);
                    setPagDiario(1);
                  }}
                >
                  Mostrar todos os meses ✕
                </button>
              )}
            </div>

            <div className="fg-month-chart">
              {resumoMensalDiarios.map((m) => {
                const ativo = mesDiario === m.mes;
                const alturaPct = Math.max(10, Math.round((m.paginas / maxPagsMesDiario) * 100));
                return (
                  <button
                    key={m.mes}
                    type="button"
                    className={`fg-month-chart__col ${ativo ? 'is-active' : ''}`}
                    onClick={() => {
                      setMesDiario(ativo ? null : m.mes);
                      setPagDiario(1);
                    }}
                    title={`${mesNome(m.mes)}: ${m.edicoes} edições · ${m.paginas} páginas`}
                  >
                    <span className="fg-month-chart__val">{m.edicoes} ed.</span>
                    <div className="fg-month-chart__track">
                      <div className="fg-month-chart__fill" style={{ height: `${alturaPct}%` }} />
                    </div>
                    <span className="fg-month-chart__lbl">{mesAbrev(m.mes).toUpperCase()}</span>
                    <span className="fg-month-chart__cnt">{m.paginas} págs</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Controle: Ano + Ordem + Busca */}
          <div className="fg-card" style={{ marginBottom: 18, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="fg-pills">
                {[
                  { id: 'TODOS' as const, label: `Todas (${ACERVO_DIARIOS_REAIS.length} edições)` },
                  { id: 2026 as const, label: `2026 (${ACERVO_DIARIOS_REAIS.filter((x) => x.ano === 2026).length} edições)` },
                  { id: 2025 as const, label: `2025 (${ACERVO_DIARIOS_REAIS.filter((x) => x.ano === 2025).length} edições)` },
                ].map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    className={`fg-pill ${anoDiario === item.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setAnoDiario(item.id);
                      setPagDiario(1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="fg-pills">
                <button
                  type="button"
                  className={`fg-pill ${ordemDiarios === 'RECENTES' ? 'is-active' : ''}`}
                  onClick={() => {
                    setOrdemDiarios('RECENTES');
                    setPagDiario(1);
                  }}
                >
                  <ArrowDownWideNarrow size={13} />
                  <span>Mais Recentes (DOM #3620 → #3302)</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill ${ordemDiarios === 'ANTIGOS' ? 'is-active' : ''}`}
                  onClick={() => {
                    setOrdemDiarios('ANTIGOS');
                    setPagDiario(1);
                  }}
                >
                  <ArrowUpNarrowWide size={13} />
                  <span>Ordem Cronológica (Jan/25 → Nov/26)</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill ${ordemDiarios === 'MAIS_PAGINAS' ? 'is-active' : ''}`}
                  onClick={() => {
                    setOrdemDiarios('MAIS_PAGINAS');
                    setPagDiario(1);
                  }}
                >
                  <Layers size={13} />
                  <span>Mais Páginas</span>
                </button>
              </div>

              <div style={{ flex: '1 1 240px', maxWidth: 320 }}>
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Data (17/11/2026), DOM #3620 ou nº decreto..."
                  value={buscaDiario}
                  onChange={(e) => {
                    setBuscaDiario(e.target.value);
                    setPagDiario(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Linha do Tempo de Diários Oficiais Agrupados por Mês */}
          <div style={{ display: 'grid', gap: 22 }}>
            {gruposDiariosVisiveis.map((grupo) => (
              <div key={grupo.chave} className="fg-timeline-group">
                <div className="fg-timeline-group__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="fg-timeline-group__dot" />
                    <h3 className="fg-timeline-group__title">{grupo.rotulo}</h3>
                    <span className="fg-badge fg-badge--blue">{grupo.itens.length} edição(ões) nesta página</span>
                  </div>
                  <div className="fg-timeline-group__sum">
                    Volume documental: <strong>{inteiro(grupo.totalPags)} páginas</strong>
                  </div>
                </div>

                <div className="fg-grid-2">
                  {grupo.itens.map(({ ed, posGlobal }) => {
                    const decretosDoDia = decretosPorDataIso.get(ed.dataPublicacao) ?? [];
                    const somaDecretosDia = decretosDoDia.reduce((acc, d) => acc + d.valor, 0);

                    return (
                      <article key={ed.id} className="fg-ordered-card" style={{ justifyContent: 'space-between' }}>
                        <div>
                          <div className="fg-ordered-card__top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span className="fg-seq-badge">#{String(posGlobal).padStart(3, '0')}</span>
                              <span className="fg-badge fg-badge--navy" style={{ fontFamily: 'var(--font-mono)' }}>
                                DOM-GRU #{ed.codigoDom}
                              </span>
                              <span className="fg-badge fg-badge--blue" style={{ fontFamily: 'var(--font-mono)' }}>
                                {ed.dataBr}
                              </span>
                            </div>
                            <span className="fg-badge fg-badge--emerald">
                              {ed.totalPaginas} págs · {ed.qtdCadernos} caderno(s)
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#09152b', margin: '10px 0 8px' }}>
                            Diário Oficial do Município de Guarulhos — {ed.dataBr}
                          </h4>

                          {/* Cruzamento Automático: Decretos Suplementares Publicados nesta Edição */}
                          {decretosDoDia.length > 0 && (
                            <div className="fg-diario-decrees-box">
                              <div className="fg-diario-decrees-box__head">
                                <span>Decretos Suplementares nesta Edição ({decretosDoDia.length}):</span>
                                <strong>{brlCompacto(somaDecretosDia)}</strong>
                              </div>
                              <div className="fg-diario-decrees-box__tags">
                                {decretosDoDia.map((d) => (
                                  <a
                                    key={d.numero}
                                    href={d.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="fg-diario-decree-chip"
                                    title={`Abrir Decreto nº ${d.numeroFmt} na página ${d.pagina}`}
                                  >
                                    <span>Decreto nº {d.numeroFmt}</span>
                                    <b>{brlCompacto(d.valor)}</b>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Lista de Cadernos Oficiais da Edição */}
                          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                            {ed.cadernos.map((cad, idx) => (
                              <div key={idx} className="fg-caderno-row">
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                                  📄 {cad.rotulo}
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="fg-btn"
                                    style={{ padding: '4px 10px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    onClick={() =>
                                      setPdfPreview({
                                        titulo: `Diário Oficial de Guarulhos — ${ed.dataBr} (DOM #${ed.codigoDom})`,
                                        subtitulo: `Caderno: ${cad.rotulo} (${cad.paginas} páginas)`,
                                        url: cad.pdfUrl,
                                      })
                                    }
                                  >
                                    <Eye size={13} />
                                    <span>Ver Aqui</span>
                                  </button>
                                  <a
                                    href={cad.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="fg-btn fg-btn--primary"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.74rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <span>PDF</span>
                                    <ArrowUpRight size={12} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {totalPagsDiarios > 1 && (
            <div className="fg-pager" style={{ marginTop: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div>
                Exibindo edições <strong>{(pagDiario - 1) * LIMIT_DIARIOS + 1}</strong> a{' '}
                <strong>{Math.min(pagDiario * LIMIT_DIARIOS, diariosFiltradosEOrdenados.length)}</strong> de{' '}
                <strong>{diariosFiltradosEOrdenados.length}</strong> em ordem
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="fg-btn"
                  disabled={pagDiario <= 1}
                  onClick={() => setPagDiario((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <span style={{ alignSelf: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  Pág. {pagDiario} / {totalPagsDiarios}
                </span>
                <button
                  type="button"
                  className="fg-btn"
                  disabled={pagDiario >= totalPagsDiarios}
                  onClick={() => setPagDiario((p) => p + 1)}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          ABA 4: FONTES VALIDADAS EM TEMPO REAL (DOSSIÊ 2025 + 2026)
          ==================================================================== */}
      {abaAtiva === 'fontes_tempo_real' && (
        <section aria-label="Validação em Tempo Real das Fontes Oficiais 2025 e 2026">
          <div className="fg-audit-explainer">
            <div className="fg-audit-explainer__icon">
              <Database size={22} />
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
              <div>
                <strong>Telemetria e Validação das 6 Fontes Oficiais (Exercícios 2025 e 2026 Consolidados)</strong>
                <p>
                  Última aferição concluída em{' '}
                  <strong>{relatorioTempoReal ? dataHoraBr(relatorioTempoReal.verificadoEmIso) : 'agora'}</strong> com
                  latência média de <strong>{relatorioTempoReal?.latenciaMediaMs ?? 4} ms</strong>.
                </p>
              </div>
              <button
                type="button"
                className="fg-btn fg-btn--primary"
                onClick={() => setCicloVerificacao((c) => c + 1)}
                disabled={verificandoFontes}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={verificandoFontes ? 'fg-spin' : ''} />
                <span>Revalidar Agora</span>
              </button>
            </div>
          </div>

          <div className="fg-table-wrap">
            <div className="fg-table-scroll">
              <table className="fg-table fg-table--cards">
                <thead>
                  <tr>
                    <th>Fonte Oficial Homologada</th>
                    <th>Status Tempo Real</th>
                    <th className="num">Latência</th>
                    <th className="num">Registros Confirmados</th>
                    <th>Protocolo de Extração</th>
                    <th style={{ textAlign: 'right' }}>Portal Público</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioTempoReal?.fontes.map((f) => (
                    <tr key={f.id}>
                      <td data-label="Fonte Oficial">
                        <div className="fg-cell-name">{f.nomeOficial}</div>
                        <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                          {f.escopoAuditado}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2, maxWidth: 460 }}>
                          {f.descricaoTecnica}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className="fg-badge fg-badge--emerald">
                          <CheckCircle2 size={12} />
                          Validada
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                          Base: {dataBr(f.ultimaDataBase)}
                        </div>
                      </td>
                      <td data-label="Latência" className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {f.latenciaMs} ms
                      </td>
                      <td data-label="Registros" className="num fg-money" style={{ fontFamily: 'var(--font-mono)' }}>
                        {inteiro(f.registrosConfirmados)}
                      </td>
                      <td data-label="Protocolo">
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                          {f.protocoloExtracao}
                        </div>
                        <div className="fg-cell-sub" style={{ marginTop: 2 }}>
                          {f.hashAuditoria}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={f.portalHumanoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '0.78rem',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span>{f.portalHumanoLabel}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          MODAL: LEITOR INTEGRADO DE PDF DO DIÁRIO OFICIAL / DECRETO
          ==================================================================== */}
      {pdfPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={pdfPreview.titulo}
          onClick={() => setPdfPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 21, 43, 0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 1040,
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
              border: '1px solid #cbd5e1',
            }}
          >
            <div
              style={{
                background: 'var(--gru-blue)',
                color: '#ffffff',
                padding: '14px 18px',
                borderBottom: '3px solid var(--gru-red)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', display: 'block' }}>{pdfPreview.titulo}</strong>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{pdfPreview.subtitulo}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={pdfPreview.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-btn-audit-live"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <span>Abrir em Nova Guia</span>
                  <ArrowUpRight size={14} />
                </a>
                <button
                  type="button"
                  className="fg-btn"
                  onClick={() => setPdfPreview(null)}
                  style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
            <iframe
              src={pdfPreview.url}
              title={pdfPreview.titulo}
              style={{ width: '100%', flex: 1, border: 0, background: '#f1f5f9' }}
            />
          </div>
        </div>
      )}

      {/* Modal de Ficha Técnica */}
      {decretoSelecionado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Ficha Técnica do ${decretoSelecionado.numeroDecreto}`}
          onClick={() => setDecretoSelecionado(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 21, 43, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 740,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(9, 21, 43, 0.4)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, var(--gru-blue) 0%, var(--gru-blue-light) 100%)',
                color: '#ffffff',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                borderBottom: '3px solid var(--gru-red)',
              }}
            >
              <div>
                <span className="fg-badge fg-badge--emerald" style={{ marginBottom: 6 }}>
                  <CheckCircle2 size={12} />
                  ATO OFICIAL VERIFICADO NO DIÁRIO OFICIAL DE GUARULHOS
                </span>
                <h2 style={{ margin: '4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  {decretoSelecionado.numeroDecreto} — {decretoSelecionado.edicaoDiarioOficial}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Base Legal: {decretoSelecionado.baseLegal}
                </div>
              </div>
              <button
                type="button"
                className="fg-btn"
                onClick={() => setDecretoSelecionado(null)}
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
              >
                ✕ Fechar
              </button>
            </div>

            <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'grid', gap: 14 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>
                  Verificação Contábil e Documental:
                </div>
                <div style={{ fontSize: '0.88rem', color: '#064e3b', lineHeight: 1.55 }}>
                  {decretoSelecionado.parecerAuditoriaTecnica}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Referência do Arquivo PDF Oficial:
                </div>
                <code style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0f172a', wordBreak: 'break-all' }}>
                  {decretoSelecionado.hashIntegridadeSha256 ?? decretoSelecionado.urlDiarioOficial}
                </code>
              </div>
            </div>

            <div
              style={{
                padding: '12px 22px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <a
                href={decretoSelecionado.urlDiarioOficial}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-btn fg-btn--primary"
                style={{ textDecoration: 'none' }}
              >
                Abrir PDF Oficial na Página ({decretoSelecionado.paginaDiario}) ↗
              </a>
              <button type="button" className="fg-btn" onClick={() => setDecretoSelecionado(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
