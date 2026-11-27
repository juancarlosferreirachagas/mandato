/**
 * ============================================================================
 * PÁGINA: EMPRESAS, PAGAMENTOS (6.741 CREDORES) & CONEXÕES NO DIÁRIO OFICIAL
 * Rota: /despesas (Abas: ?visao=empresas | ?visao=conexoes)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Utiliza `@tanstack/react-table` + `framer-motion` + `<PaginacaoModerna />`
 * para listar 100% das empresas de 2025 e 2026 com paginação completa,
 * ordenação por colunas, filtros por mês/órgão/área/modalidade/DOM, exportação
 * CSV e cruzamento direto com os 222 PDFs do Diário Oficial.
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpDown,
  ArrowUpRight,
  BookOpen,
  Building2,
  Eye,
  FileCheck2,
  Filter,
  Link2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StatusBanco } from '../components/StatusFontes';
import { PaginacaoModerna } from '../components/PaginacaoModerna';
import { despesasRepository, type CredorRanking } from '@/repositories/despesasRepository';
import {
  carregarConexoesDom,
  carregarCredoresCompletos,
  exportarCsvPlanilha,
  ROTULOS_TIPO_ATO_DOM,
  type ConexaoEmpresaDom,
  type TipoAtoConexaoDom,
} from '@/services/baseIntegralService';
import { RESUMO_CONEXOES_OFICIAIS } from '@/database/resumoConexoesOficiais';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';
import { brl, brlCompacto, dataBr, formatarCnpj, inteiro, nomeLegivel } from '../format';
import { QTD_DECRETOS, QTD_PDFS_EXECUTIVO } from '@/domain/plataforma';

const MESES_NOMES = [
  { val: 1, label: 'Janeiro' },
  { val: 2, label: 'Fevereiro' },
  { val: 3, label: 'Março' },
  { val: 4, label: 'Abril' },
  { val: 5, label: 'Maio' },
  { val: 6, label: 'Junho' },
  { val: 7, label: 'Julho' },
  { val: 8, label: 'Agosto' },
  { val: 9, label: 'Setembro' },
  { val: 10, label: 'Outubro' },
  { val: 11, label: 'Novembro' },
  { val: 12, label: 'Dezembro' },
];

const AREAS_OPCOES = [
  'Saúde & Hospitais',
  'Educação & Creches',
  'Limpeza Urbana, Obras & Bairros',
  'Transporte & Trânsito',
  'Administração, Finanças & Legislativo',
  'Previdência Municipal (IPREM)',
  'Assistência Social & Cidadania',
  'Segurança & Guarda Civil (GCM)',
];

const ATALHOS_AUDITORIA = [
  { label: 'Todos', q: '' },
  { label: 'Saúde e hospitais', q: 'HOSPITAL' },
  { label: 'Ônibus e transporte', q: 'VIACAO' },
  { label: 'Coleta de lixo', q: 'SUSTENTARE' },
  { label: 'Obras e construtoras', q: 'CONSTRU' },
  { label: 'Vale-alimentação', q: 'SODEXO' },
];

type OrdenacaoEmpresa = 'valor' | 'pagamentos' | 'dom' | 'recente' | 'nome';

const colHelper = createColumnHelper<CredorRanking>();

export function DespesasPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Visão ativa: Ranking de Empresas ou Conexões Empresas <-> Diário Oficial
  const visao: 'empresas' | 'conexoes' =
    searchParams.get('visao') === 'conexoes' ? 'conexoes' : 'empresas';

  // Parâmetros da Aba Empresas
  const anoRaw = searchParams.get('ano');
  const ano: number | null = anoRaw === 'todos' ? null : Number(anoRaw) === 2025 ? 2025 : 2026;
  const mesParam = ano !== null && searchParams.get('mes') ? Number(searchParams.get('mes')) : null;
  const orgaoParam = searchParams.get('orgao') || null;
  const areaParam = searchParams.get('area') || null;
  const modalidadeParam = searchParams.get('modalidade') || null;
  const qParam = searchParams.get('q') || '';
  const tipoParam = (searchParams.get('tipo') as 'PJ' | 'PF' | null) || null;
  const somenteExternos = searchParams.get('todos') !== '1';
  const somenteComDom = searchParams.get('comDom') === '1';
  const ordenarPor = (searchParams.get('ord') as OrdenacaoEmpresa) || 'valor';
  const direcao: 'desc' | 'asc' = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const limite = [20, 30, 50, 100].includes(Number(searchParams.get('por')))
    ? Number(searchParams.get('por'))
    : 30;
  const pagina = Math.max(1, Number(searchParams.get('p') || '1'));

  const temFiltroAtivo = Boolean(
    qParam || mesParam || orgaoParam || areaParam || modalidadeParam || tipoParam || !somenteExternos || somenteComDom
  );

  const [buscaTexto, setBuscaTexto] = useState(qParam);
  useEffect(() => {
    setBuscaTexto(qParam);
  }, [qParam]);

  // Estado da Aba Conexões Diário Oficial <-> Empresas
  const [buscaDom, setBuscaDom] = useState(searchParams.get('qDom') || '');
  const [tipoAtoDom, setTipoAtoDom] = useState<'TODOS' | TipoAtoConexaoDom>('TODOS');
  const [anoDom, setAnoDom] = useState<'TODOS' | 2026 | 2025>('TODOS');
  const [ordemDom, setOrdemDom] = useState<'RECENTES' | 'MAIOR_PAGO'>('RECENTES');
  const [pagDom, setPagDom] = useState(1);
  const [porPagDom, setPorPagDom] = useState(20);
  const [pdfPreview, setPdfPreview] = useState<{
    titulo: string;
    subtitulo: string;
    url: string;
    sha256?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!pdfPreview) return;
    document.body.classList.add('fg-lock');
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPdfPreview(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [pdfPreview]);

  const atualizarFiltros = (novos: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(novos)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    if (!('p' in novos)) params.delete('p');
    setSearchParams(params);
  };

  const alternarOrdem = (campo: OrdenacaoEmpresa) => {
    if (ordenarPor === campo) {
      atualizarFiltros({ ord: campo, dir: direcao === 'desc' ? 'asc' : 'desc' });
    } else {
      atualizarFiltros({ ord: campo, dir: campo === 'nome' ? 'asc' : 'desc' });
    }
  };

  const deslocamento = (pagina - 1) * limite;

  // Dados da Aba 1 (Empresas)
  const { data, loading, error } = useAsync(
    async () => {
      const [ranking, resumo] = await Promise.all([
        despesasRepository.ranking({
          ano,
          mes: mesParam,
          orgao: orgaoParam,
          area: areaParam,
          modalidade: modalidadeParam,
          busca: qParam,
          tipo: tipoParam,
          somenteExternos,
          somenteComDom,
          ordenarPor,
          direcao,
          limite,
          deslocamento,
        }),
        despesasRepository.resumo({
          ano,
          mes: mesParam,
          orgao: orgaoParam,
        }),
      ]);
      return { ranking, resumo };
    },
    [
      ano,
      mesParam,
      orgaoParam,
      areaParam,
      modalidadeParam,
      qParam,
      tipoParam,
      somenteExternos,
      somenteComDom,
      ordenarPor,
      direcao,
      limite,
      deslocamento,
    ]
  );

  // Dados da Aba 2 (Conexões CNPJ <-> 222 PDFs)
  const { data: conexoesTodas, loading: loadingDom } = useAsync(
    () => (visao === 'conexoes' ? carregarConexoesDom() : Promise.resolve([] as ConexaoEmpresaDom[])),
    [visao]
  );

  const conexoesFiltradas = useMemo(() => {
    const base = conexoesTodas ?? [];
    const termo = buscaDom
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const dig = termo.replace(/\D/g, '');

    const filt = base.filter((c) => {
      if (anoDom !== 'TODOS' && c.ano !== anoDom) return false;
      if (tipoAtoDom !== 'TODOS' && c.tipoAto !== tipoAtoDom) return false;
      if (!termo) return true;
      const nomeNorm = c.credor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const trechoNorm = c.trecho
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return (
        nomeNorm.includes(termo) ||
        trechoNorm.includes(termo) ||
        c.dataBr.includes(termo) ||
        String(c.codigoDom).includes(termo) ||
        (dig.length >= 4 && c.cnpj.includes(dig))
      );
    });

    const copia = [...filt];
    if (ordemDom === 'MAIOR_PAGO') {
      copia.sort((a, b) => b.totalPagoTce - a.totalPagoTce || b.dataIso.localeCompare(a.dataIso));
    } else {
      copia.sort((a, b) => b.dataIso.localeCompare(a.dataIso) || b.totalPagoTce - a.totalPagoTce);
    }
    return copia;
  }, [conexoesTodas, buscaDom, tipoAtoDom, anoDom, ordemDom]);

  const conexoesVisiveis = useMemo(
    () => conexoesFiltradas.slice((pagDom - 1) * porPagDom, pagDom * porPagDom),
    [conexoesFiltradas, pagDom, porPagDom]
  );

  const totalLinhas = data?.ranking[0]?.total_linhas ?? 0;

  // Definição das colunas com @tanstack/react-table
  const columns = useMemo(
    () => [
      colHelper.display({
        id: 'rank',
        header: () => <span>#</span>,
        cell: (info) => <span className="fg-rank-num">#{deslocamento + info.row.index + 1}</span>,
      }),
      colHelper.accessor('credor', {
        header: () => (
          <button type="button" className="fg-th-sort" onClick={() => alternarOrdem('nome')}>
            <span>Empresa / Fornecedor</span>
            <ArrowUpDown size={13} aria-hidden />
          </button>
        ),
        cell: (info) => {
          const c = info.row.original;
          return (
            <div>
              <div className="fg-cell-name">
                <Link to={`/despesas/credor/${c.chave}`}>{nomeLegivel(c.credor)}</Link>
                {c.repasse_interno && (
                  <span className="fg-tag fg-tag--warn">Repasse interno</span>
                )}
              </div>
              <div className="fg-cell-sub" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
                <span>
                  {c.cnpj_credor ? `CNPJ ${formatarCnpj(c.cnpj_credor)}` : 'Pessoa física (CPF protegido)'}
                </span>
                {c.area && <span>· {c.area}</span>}
                {c.modalidade_principal && c.modalidade_principal !== 'Não aplicável / Outros' && (
                  <span className="fg-mini-tag">{c.modalidade_principal}</span>
                )}
              </div>
            </div>
          );
        },
      }),
      colHelper.accessor('qtd_conexoes_dom', {
        header: () => (
          <button type="button" className="fg-th-sort" onClick={() => alternarOrdem('dom')}>
            <span>Diário Oficial</span>
            <ArrowUpDown size={13} aria-hidden />
          </button>
        ),
        cell: (info) => {
          const c = info.row.original;
          const qtd = c.qtd_conexoes_dom ?? 0;
          if (qtd <= 0) {
            return <span className="fg-cell-sub">—</span>;
          }
          return (
            <Link
              to={`/despesas/credor/${c.chave}?aba=diario`}
              className="fg-badge fg-badge--blue"
              style={{ textDecoration: 'none' }}
              title="Ver publicações desta empresa nos 222 PDFs do Diário Oficial"
            >
              <Link2 size={12} aria-hidden />
              <span>
                {qtd} {qtd === 1 ? 'ato' : 'atos'}
              </span>
            </Link>
          );
        },
      }),
      colHelper.accessor('qtd', {
        header: () => (
          <button type="button" className="fg-th-sort fg-th-sort--right" onClick={() => alternarOrdem('pagamentos')}>
            <span>Pagamentos</span>
            <ArrowUpDown size={13} aria-hidden />
          </button>
        ),
        cell: (info) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {inteiro(info.getValue())}
          </span>
        ),
      }),
      colHelper.accessor('ultimo_pagamento', {
        header: () => (
          <button type="button" className="fg-th-sort" onClick={() => alternarOrdem('recente')}>
            <span>Último pag.</span>
            <ArrowUpDown size={13} aria-hidden />
          </button>
        ),
        cell: (info) => (
          <span style={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}>{dataBr(info.getValue())}</span>
        ),
      }),
      colHelper.accessor('total_liquido', {
        header: () => (
          <button type="button" className="fg-th-sort fg-th-sort--right" onClick={() => alternarOrdem('valor')}>
            <span>Total recebido</span>
            <ArrowUpDown size={13} aria-hidden />
          </button>
        ),
        cell: (info) => <strong className="fg-money">{brl(info.getValue())}</strong>,
      }),
      colHelper.display({
        id: 'acoes',
        header: () => <span>Dossiê</span>,
        cell: (info) => (
          <Link
            to={`/despesas/credor/${info.row.original.chave}`}
            className="fg-btn fg-btn--sm"
          >
            <FileCheck2 size={13} aria-hidden />
            <span>Abrir</span>
          </Link>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deslocamento, ordenarPor, direcao, searchParams]
  );

  const table = useReactTable({
    data: data?.ranking ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const aplicarBusca = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarFiltros({ q: buscaTexto.trim() || null });
  };

  const exportarEmpresasCsv = async () => {
    const todos = await carregarCredoresCompletos();
    const filtrados = await despesasRepository.ranking({
      ano,
      mes: mesParam,
      orgao: orgaoParam,
      area: areaParam,
      modalidade: modalidadeParam,
      busca: qParam,
      tipo: tipoParam,
      somenteExternos,
      somenteComDom,
      ordenarPor,
      direcao,
      limite: todos.length,
      deslocamento: 0,
    });
    exportarCsvPlanilha(
      `fiscaliza-guarulhos-empresas-${ano ?? '2025-2026'}.csv`,
      ['Posicao', 'Empresa', 'CNPJ', 'Tipo', 'Area', 'Modalidade', 'Atos_Diario_Oficial', 'Pagamentos', 'Ultimo_Pagamento', 'Total_Recebido_BRL'],
      filtrados.map((c, idx) => [
        idx + 1,
        c.credor,
        c.cnpj_credor ? formatarCnpj(c.cnpj_credor) : 'PF (LGPD)',
        c.tipo_credor,
        c.area,
        c.modalidade_principal,
        c.qtd_conexoes_dom ?? 0,
        c.qtd,
        c.ultimo_pagamento,
        c.total_liquido.toFixed(2).replace('.', ','),
      ])
    );
  };

  const exportarConexoesCsv = () => {
    exportarCsvPlanilha(
      `fiscaliza-guarulhos-conexoes-diario-oficial.csv`,
      ['Data', 'DOM', 'Pagina', 'Tipo_Ato', 'Empresa', 'CNPJ', 'Area', 'Total_Pago_TCE_2025_2026', 'Valor_Citado_Ato', 'PDF_Oficial', 'SHA256'],
      conexoesFiltradas.map((c) => [
        c.dataBr,
        `DOM #${c.codigoDom}`,
        c.pagina,
        ROTULOS_TIPO_ATO_DOM[c.tipoAto] || c.tipoAto,
        c.credor,
        formatarCnpj(c.cnpj),
        c.area,
        c.totalPagoTce.toFixed(2).replace('.', ','),
        c.valorMencionado ? c.valorMencionado.toFixed(2).replace('.', ',') : '',
        c.pdfUrl,
        c.sha256Pdf,
      ])
    );
  };

  return (
    <div className="fg-page-container">
      {/* Cabeçalho Executivo */}
      <header className="fg-hero" style={{ marginBottom: 16, padding: '22px 24px' }}>
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                Base integral · TCE-SP + {QTD_PDFS_EXECUTIVO} PDFs do Diário Oficial
              </span>
              <StatusBanco />
            </div>

            <h1 className="fg-hero__title" style={{ marginTop: 8, marginBottom: 6 }}>
              Empresas, pagamentos e <span>conexões oficiais</span>
            </h1>
            <p className="fg-hero__lead">
              Consulte <strong>todos os {inteiro(RESUMO_CONEXOES_OFICIAIS.totalCredoresUnicos)} fornecedores</strong> pagos
              pela Prefeitura, Câmara e IPREM, com paginação completa, filtro por mês e modalidade de licitação, além das{' '}
              <strong>{inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)} conexões diretas por CNPJ</strong> localizadas
              nos PDFs do Diário Oficial.
            </p>

            <div className="fg-hero__actions">
              <div className="fg-seg" role="group" aria-label="Escolha o período">
                {[
                  { id: 2026 as const, rotulo: '2026' },
                  { id: 2025 as const, rotulo: '2025' },
                  { id: 'todos' as const, rotulo: '2025–2026' },
                ].map((op) => {
                  const ativo = (op.id === 'todos' && ano === null) || ano === op.id;
                  return (
                    <button
                      key={String(op.id)}
                      type="button"
                      className={`fg-seg__btn${ativo ? ' is-active' : ''}`}
                      aria-pressed={ativo}
                      onClick={() => atualizarFiltros({ ano: String(op.id), mes: null })}
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
              <div className="fg-hero-kpi__lbl">Total pago ({ano ?? '2025–2026'})</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">
                {data?.resumo ? brlCompacto(data.resumo.total_liquido) : '…'}
              </div>
              <div className="fg-hero-kpi__sub">
                {data?.resumo ? brl(data.resumo.total_liquido) : 'Carregando…'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Empresas no filtro</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">
                {data ? inteiro(totalLinhas) : inteiro(RESUMO_CONEXOES_OFICIAIS.totalCredoresUnicos)}
              </div>
              <div className="fg-hero-kpi__sub">100% pagináveis e exportáveis</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Conexões no Diário</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">
                {inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)}
              </div>
              <div className="fg-hero-kpi__sub">
                {inteiro(RESUMO_CONEXOES_OFICIAIS.totalEmpresasConectadasDom)} empresas nos 222 PDFs
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Pagamentos na base</div>
              <div className="fg-hero-kpi__val">
                {data?.resumo ? inteiro(data.resumo.qtd_pagamentos) : '…'}
              </div>
              <div className="fg-hero-kpi__sub">
                Até {data?.resumo ? dataBr(data.resumo.ultima_data) : 'Set/2026'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação em 2 Abas: Ranking Completo vs Conexões CNPJ <-> Diário Oficial */}
      <div className="fg-hub-nav" role="tablist" aria-label="Visão de empresas e conexões">
        <button
          type="button"
          role="tab"
          aria-selected={visao === 'empresas'}
          className={`fg-hub-tab${visao === 'empresas' ? ' is-active' : ''}`}
          onClick={() => atualizarFiltros({ visao: null })}
        >
          <Building2 size={16} aria-hidden />
          <span>Todas as empresas (paginado)</span>
          <b className="fg-hub-tab__badge">{inteiro(RESUMO_CONEXOES_OFICIAIS.totalCredoresUnicos)}</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={visao === 'conexoes'}
          className={`fg-hub-tab${visao === 'conexoes' ? ' is-active' : ''}`}
          onClick={() => atualizarFiltros({ visao: 'conexoes' })}
        >
          <Link2 size={16} aria-hidden />
          <span>Conexões Empresas ↔ Diário Oficial</span>
          <b className="fg-hub-tab__badge">{inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)}</b>
        </button>
      </div>

      {/* ====================================================================
          ABA 1: TODAS AS EMPRESAS E FORNECEDORES (TANSTACK TABLE + PAGINAÇÃO)
          ==================================================================== */}
      {visao === 'empresas' && (
        <section aria-label="Ranking completo e paginado de empresas">
          <div className="fg-audit-explainer" style={{ marginBottom: 14 }}>
            <div className="fg-audit-explainer__icon">
              <Building2 size={20} aria-hidden />
            </div>
            <div className="fg-audit-explainer__content" style={{ width: '100%' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Atalhos rápidos:</strong> filtre por setor, modalidade de licitação ou empresas com publicações
                cruzadas nos 222 PDFs do Diário Oficial:
              </div>
              <div className="fg-pills">
                {ATALHOS_AUDITORIA.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={qParam.toUpperCase() === item.q && !somenteComDom ? 'fg-pill is-active' : 'fg-pill'}
                    onClick={() => atualizarFiltros({ q: item.q || null, comDom: null })}
                  >
                    <Filter size={12} aria-hidden />
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={somenteComDom ? 'fg-pill is-active' : 'fg-pill'}
                  onClick={() => atualizarFiltros({ comDom: somenteComDom ? null : '1' })}
                >
                  <Link2 size={12} aria-hidden />
                  <span>Só com atos no Diário ({inteiro(RESUMO_CONEXOES_OFICIAIS.totalEmpresasConectadasDom)})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Painel de Filtros Avançados */}
          <div className="fg-filters" style={{ marginBottom: 16 }}>
            <form onSubmit={aplicarBusca} className="fg-field fg-field--wide">
              <label htmlFor="filtro-busca">Buscar empresa, CNPJ, área ou nº do contrato</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  id="filtro-busca"
                  type="search"
                  placeholder="Ex.: Sodexo, hospital, 46.319.000, contrato 3422…"
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                />
                <button
                  type="submit"
                  className="fg-btn fg-btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Search size={15} aria-hidden />
                  <span>Buscar</span>
                </button>
              </div>
            </form>

            <div className="fg-field">
              <label htmlFor="filtro-ano">Ano</label>
              <select
                id="filtro-ano"
                value={ano === null ? 'todos' : String(ano)}
                onChange={(e) => atualizarFiltros({ ano: e.target.value, mes: null })}
              >
                <option value="2026">2026 (Jan–Set)</option>
                <option value="2025">2025 (completo)</option>
                <option value="todos">2025 e 2026 (consolidado)</option>
              </select>
            </div>

            <div className="fg-field">
              <label htmlFor="filtro-mes">Mês (real)</label>
              <select
                id="filtro-mes"
                value={mesParam ?? ''}
                disabled={ano === null}
                onChange={(e) => atualizarFiltros({ mes: e.target.value || null })}
              >
                <option value="">
                  {ano === null ? 'Escolha um ano' : ano === 2025 ? 'Ano todo' : 'Jan a Set/2026'}
                </option>
                {MESES_NOMES.filter((m) => ano === 2025 || m.val <= 9).map((m) => (
                  <option key={m.val} value={m.val}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="fg-field">
              <label htmlFor="filtro-area">Área da cidade</label>
              <select
                id="filtro-area"
                value={areaParam ?? ''}
                onChange={(e) => atualizarFiltros({ area: e.target.value || null })}
              >
                <option value="">Todas as áreas</option>
                {AREAS_OPCOES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="fg-field">
              <label htmlFor="filtro-modalidade">Licitação (2026)</label>
              <select
                id="filtro-modalidade"
                value={modalidadeParam ?? ''}
                onChange={(e) => atualizarFiltros({ modalidade: e.target.value || null })}
              >
                <option value="">Todas modalidades</option>
                {RESUMO_CONEXOES_OFICIAIS.modalidadesLicitacao2026.map((m) => (
                  <option key={m.modalidade} value={m.modalidade}>
                    {m.modalidade} ({inteiro(m.qtdEmpresas)})
                  </option>
                ))}
              </select>
            </div>

            <div className="fg-field">
              <label htmlFor="filtro-orgao">Quem pagou</label>
              <select
                id="filtro-orgao"
                value={orgaoParam ?? ''}
                onChange={(e) => atualizarFiltros({ orgao: e.target.value || null })}
              >
                <option value="">Todos os órgãos</option>
                <option value="PREFEITURA MUNICIPAL DE GUARULHOS">Prefeitura Municipal</option>
                <option value="CÂMARA MUNICIPAL DE GUARULHOS">Câmara Municipal</option>
                <option value="INSTITUTO DE PREVID.FUNC.PÚBL.MUNICIPAIS DE GUARULHOS">IPREM</option>
              </select>
            </div>

            <div className="fg-field">
              <label htmlFor="filtro-tipo">Tipo</label>
              <select
                id="filtro-tipo"
                value={tipoParam ?? ''}
                onChange={(e) => atualizarFiltros({ tipo: e.target.value || null })}
              >
                <option value="">Empresas e pessoas</option>
                <option value="PJ">Empresas (CNPJ)</option>
                <option value="PF">Pessoa física (LGPD)</option>
              </select>
            </div>

            <div className="fg-field fg-field--wide">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <label className="fg-check" style={{ flex: '1 1 250px' }}>
                  <input
                    type="checkbox"
                    checked={somenteExternos}
                    onChange={(e) => atualizarFiltros({ todos: e.target.checked ? null : '1' })}
                  />
                  <span>Mostrar só empresas e entidades externas (oculta repasses Prefeitura ↔ IPREM)</span>
                </label>
                {temFiltroAtivo && (
                  <button
                    type="button"
                    className="fg-btn fg-btn--sm"
                    onClick={() => setSearchParams(ano === null ? { ano: 'todos' } : { ano: String(ano) })}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <ErrorBox error={error} />}

          {/* Tabela TanStack responsiva + Paginação Moderna */}
          <div className="fg-table-wrap">
            <div className="fg-table-scroll">
              <table className="fg-table fg-table--cards fg-table--credores">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className={
                            header.id === 'rank'
                              ? 'rank'
                              : header.id === 'qtd' || header.id === 'total_liquido'
                              ? 'num'
                              : undefined
                          }
                          style={header.id === 'acoes' ? { textAlign: 'right' } : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading && !data && (
                    <tr>
                      <td colSpan={7} className="fg-empty-row">
                        <Loading label="Carregando base completa de empresas…" />
                      </td>
                    </tr>
                  )}

                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="fg-row-link">
                      {row.getVisibleCells().map((cell) => {
                        const cid = cell.column.id;
                        const labelMap: Record<string, string> = {
                          qtd_conexoes_dom: 'Diário Oficial',
                          qtd: 'Pagamentos',
                          ultimo_pagamento: 'Último pag.',
                          total_liquido: 'Total recebido',
                        };
                        return (
                          <td
                            key={cell.id}
                            className={
                              cid === 'rank'
                                ? 'rank'
                                : cid === 'qtd' || cid === 'total_liquido'
                                ? 'num'
                                : undefined
                            }
                            data-label={labelMap[cid]}
                            style={cid === 'acoes' ? { textAlign: 'right' } : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {!loading && data?.ranking.length === 0 && (
                    <tr>
                      <td colSpan={7} className="fg-empty-row">
                        Nenhuma empresa encontrada com estes filtros. Tente limpar um filtro ou mudar o período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginacaoModerna
              pagina={pagina}
              totalItens={totalLinhas}
              itensPorPagina={limite}
              rotuloItem="empresas/fornecedores"
              onMudarPagina={(p) => atualizarFiltros({ p: String(p) })}
              onMudarItensPorPagina={(por) => atualizarFiltros({ por: String(por), p: '1' })}
              onExportarCsv={exportarEmpresasCsv}
              rotuloExportar="Baixar CSV"
            />
          </div>
        </section>
      )}

      {/* ====================================================================
          ABA 2: CONEXÕES EMPRESAS (CNPJ) ↔ DIÁRIO OFICIAL (222 PDFs) PAGINADAS
          ==================================================================== */}
      {visao === 'conexoes' && (
        <section aria-label="Conexões auditadas entre empresas e Diário Oficial">
          <div className="fg-audit-explainer" style={{ marginBottom: 14 }}>
            <div className="fg-audit-explainer__icon">
              <Link2 size={20} aria-hidden />
            </div>
            <div className="fg-audit-explainer__content">
              <strong>Como o cruzamento funciona (100% determinístico por CNPJ):</strong>
              <p>
                Varremos os <strong>{QTD_PDFS_EXECUTIVO} PDFs do Diário Oficial de 2025 e 2026</strong> e cruzamos cada
                CNPJ publicado com a base oficial de pagamentos do TCE-SP. Abaixo estão todas as{' '}
                <strong>{inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)} conexões verificadas</strong> em{' '}
                <strong>{inteiro(RESUMO_CONEXOES_OFICIAIS.totalEmpresasConectadasDom)} empresas</strong>, prontas para
                ler no PDF original e abrir o dossiê de pagamentos.
              </p>
            </div>
          </div>

          {/* Barra de Filtros da Aba Conexões */}
          <div className="fg-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
            <div className="fg-toolbar-modern">
              <div className="fg-pills">
                {[
                  { id: 'TODOS' as const, label: 'Todos os atos' },
                  { id: 'CONTRATO' as const, label: 'Contratos' },
                  { id: 'DISPENSA' as const, label: 'Dispensas' },
                  { id: 'PORTARIA_FISCAL' as const, label: 'Fiscais de contrato' },
                  { id: 'CONVENIO' as const, label: 'Convênios / Gestão' },
                  { id: 'ATO_OFICIAL' as const, label: 'Outras publicações' },
                ].map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    className={`fg-pill${tipoAtoDom === op.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setTipoAtoDom(op.id);
                      setPagDom(1);
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              <div className="fg-pills">
                {(['TODOS', 2026, 2025] as const).map((a) => (
                  <button
                    key={String(a)}
                    type="button"
                    className={`fg-pill${anoDom === a ? ' is-active' : ''}`}
                    onClick={() => {
                      setAnoDom(a);
                      setPagDom(1);
                    }}
                  >
                    {a === 'TODOS' ? '2025 + 2026' : a}
                  </button>
                ))}

                <button
                  type="button"
                  className={`fg-pill${ordemDom === 'RECENTES' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDom('RECENTES');
                    setPagDom(1);
                  }}
                >
                  <ArrowDownWideNarrow size={13} aria-hidden />
                  <span>Mais recentes</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill${ordemDom === 'MAIOR_PAGO' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDom('MAIOR_PAGO');
                    setPagDom(1);
                  }}
                >
                  <Building2 size={13} aria-hidden />
                  <span>Maior valor pago</span>
                </button>
              </div>

              <div className="fg-toolbar-modern__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Empresa, CNPJ, DOM #3622, contrato ou termo…"
                  value={buscaDom}
                  onChange={(e) => {
                    setBuscaDom(e.target.value);
                    setPagDom(1);
                  }}
                />
              </div>
            </div>

            <div className="fg-toolbar-summary">
              <span>
                Conexões encontradas: <strong>{inteiro(conexoesFiltradas.length)}</strong>
              </span>
              <span className="fg-cell-sub">
                Cruzamento exato por CNPJ (14 dígitos) · PDF + SHA-256 + TCE-SP
              </span>
            </div>
          </div>

          {loadingDom ? (
            <div className="fg-card" style={{ padding: 28 }}>
              <Loading label="Carregando conexões entre empresas e 222 PDFs…" />
            </div>
          ) : (
            <>
              <div className="fg-clean-decree-grid">
                {conexoesVisiveis.map((cx) => (
                  <article key={cx.id} className="fg-clean-card fg-clean-card--exec">
                    <div className="fg-clean-card__top">
                      <div className="fg-clean-card__badges">
                        <span className="fg-badge fg-badge--amber">
                          {ROTULOS_TIPO_ATO_DOM[cx.tipoAto] || cx.tipoAto}
                        </span>
                        <span className="fg-badge fg-badge--navy">
                          DOM #{cx.codigoDom} · Pág. {cx.pagina}
                        </span>
                        <span className="fg-badge fg-badge--blue">{cx.dataBr}</span>
                      </div>
                      <strong className="fg-clean-card__amount" title="Total pago à empresa em 2025–2026 no TCE-SP">
                        {brlCompacto(cx.totalPagoTce)} pagos
                      </strong>
                    </div>

                    <div>
                      <h3 className="fg-clean-card__title">
                        <Link to={`/despesas/credor/${cx.chave}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {nomeLegivel(cx.credor)}
                        </Link>
                      </h3>
                      <div className="fg-cell-sub" style={{ marginTop: 2 }}>
                        CNPJ {formatarCnpj(cx.cnpj)} · {cx.area} · {inteiro(cx.qtdPagamentosTce)} pag.
                        {cx.valorMencionado ? ` · Citado no ato: ${brl(cx.valorMencionado)}` : ''}
                      </div>
                    </div>

                    <p className="fg-clean-card__text">{cx.trecho}</p>

                    <div className="fg-clean-card__foot">
                      <span className="fg-sha-pill" title={cx.sha256Pdf ?? 'PDF verificado'}>
                        <ShieldCheck size={13} aria-hidden />
                        <span>{cx.sha256Pdf ? `SHA-256 ${cx.sha256Pdf.slice(0, 10)}…` : 'PDF verificado'}</span>
                      </span>

                      <div className="fg-clean-card__actions">
                        <button
                          type="button"
                          className="fg-btn fg-btn--sm"
                          onClick={() =>
                            setPdfPreview({
                              titulo: `${nomeLegivel(cx.credor)} — DOM #${cx.codigoDom}`,
                              subtitulo: `${ROTULOS_TIPO_ATO_DOM[cx.tipoAto]} · ${cx.dataBr} · Página ${cx.pagina}`,
                              url: cx.pdfUrl,
                              sha256: cx.sha256Pdf,
                            })
                          }
                        >
                          <Eye size={13} aria-hidden />
                          <span>Ler PDF</span>
                        </button>
                        <a
                          href={cx.pdfUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-btn fg-btn--sm"
                        >
                          <BookOpen size={13} aria-hidden />
                          <span>Abrir</span>
                          <ArrowUpRight size={12} aria-hidden />
                        </a>
                        <Link to={`/despesas/credor/${cx.chave}`} className="fg-btn fg-btn--primary fg-btn--sm">
                          <span>Dossiê</span>
                          <ArrowRight size={13} aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {conexoesFiltradas.length === 0 && (
                <div className="fg-card" style={{ textAlign: 'center', padding: 28 }}>
                  Nenhuma conexão localizada para este filtro.
                </div>
              )}

              <div className="fg-card" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
                <PaginacaoModerna
                  pagina={pagDom}
                  totalItens={conexoesFiltradas.length}
                  itensPorPagina={porPagDom}
                  rotuloItem="conexões empresa ↔ Diário"
                  onMudarPagina={setPagDom}
                  onMudarItensPorPagina={(q) => {
                    setPorPagDom(q);
                    setPagDom(1);
                  }}
                  onExportarCsv={exportarConexoesCsv}
                  rotuloExportar="Baixar CSV"
                />
              </div>
            </>
          )}
        </section>
      )}

      {/* Modal Leitor Integrado de PDF */}
      {pdfPreview && (
        <div
          className="fg-modal"
          role="dialog"
          aria-modal="true"
          aria-label={pdfPreview.titulo}
          onClick={() => setPdfPreview(null)}
        >
          <div className="fg-modal__dialog fg-modal__dialog--pdf" onClick={(e) => e.stopPropagation()}>
            <div className="fg-modal__head" style={{ alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <strong className="fg-modal__title" style={{ display: 'block' }}>
                  {pdfPreview.titulo}
                </strong>
                <span className="fg-modal__sub">{pdfPreview.subtitulo}</span>
                {pdfPreview.sha256 && (
                  <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                    Integridade verificada: {pdfPreview.sha256}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <a
                  href={pdfPreview.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-btn-audit-live"
                  style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                >
                  <span>Abrir em nova aba</span>
                  <ArrowUpRight size={14} aria-hidden />
                </a>
                <button
                  type="button"
                  className="fg-modal__close"
                  onClick={() => setPdfPreview(null)}
                  aria-label="Fechar leitor"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>
            <div className="fg-pdf-mobile-tip">
              No celular, caso o leitor embutido não exiba a página exata, toque em <strong>“Abrir em nova aba”</strong>.
            </div>
            <iframe
              src={pdfPreview.url}
              title={pdfPreview.titulo}
              style={{ width: '100%', flex: 1, border: 0, background: '#f1f5f9' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
