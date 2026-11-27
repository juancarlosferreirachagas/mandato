/**
 * ============================================================================
 * DOSSIÊ COMPLETO DO FORNECEDOR / EMPRESA (100% PAGINADO + DIÁRIO OFICIAL)
 * Rota: /despesas/credor/:chave
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Link2,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { despesasRepository } from '@/repositories/despesasRepository';
import {
  carregarPagamentosDoCredor,
  exportarCsvPlanilha,
  obterConexoesDomDoCredor,
  obterCredorIntegralPorChave,
  ROTULOS_TIPO_ATO_DOM,
  type ConexaoEmpresaDom,
  type PagamentoIntegral,
} from '@/services/baseIntegralService';
import { EXTRATOS_CONTRATOS_DOM_REAIS } from '@/domain/diariosCatalogoReal';
import { LINKS_OFICIAIS, urlConsultaCnpj } from '@/domain/plataforma';
import { urlPdfOficialSegura } from '@/domain/seguranca';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';
import { BarraHorizontal } from '../components/Graficos';
import { GraficoCredorComparativo } from '../components/GraficosModernos';
import { PaginacaoModerna } from '../components/PaginacaoModerna';
import { brl, brlCompacto, dataBr, formatarCnpj, inteiro, mesNome, nomeLegivel, nomeOrgaoCurto } from '../format';

export function CredorDetalhePage() {
  const { chave } = useParams<{ chave: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const abaAtiva: 'pagamentos' | 'diario' = searchParams.get('aba') === 'diario' ? 'diario' : 'pagamentos';

  // Filtros e paginação dos pagamentos
  const [anoPag, setAnoPag] = useState<'TODOS' | 2026 | 2025>('TODOS');
  const [buscaPag, setBuscaPag] = useState('');
  const [paginaPag, setPaginaPag] = useState(1);
  const [porPag, setPorPag] = useState(25);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<PagamentoIntegral | null>(null);

  // Paginação das publicações no Diário Oficial
  const [paginaDom, setPaginaDom] = useState(1);
  const [pdfPreview, setPdfPreview] = useState<{
    titulo: string;
    subtitulo: string;
    url: string;
    sha256?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!pagamentoSelecionado && !pdfPreview) return;
    document.body.classList.add('fg-lock');
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPagamentoSelecionado(null);
        setPdfPreview(null);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [pagamentoSelecionado, pdfPreview]);

  const { data, loading, error } = useAsync(async () => {
    if (!chave) throw new Error('Identificador do fornecedor não informado.');

    const [credor, integral, porOrgao, pagamentosTodos, conexoesDom] = await Promise.all([
      despesasRepository.credor(chave),
      obterCredorIntegralPorChave(chave).catch(() => null),
      despesasRepository.credorPorOrgao(chave),
      carregarPagamentosDoCredor(chave).catch(() => [] as PagamentoIntegral[]),
      obterConexoesDomDoCredor(chave).catch(() => [] as ConexaoEmpresaDom[]),
    ]);

    if (!credor) throw new Error('Fornecedor não encontrado na base oficial de Guarulhos.');

    // Fallback caso pagamentosTodos esteja vazio (snapshot legado)
    let listaPags = pagamentosTodos;
    if (listaPags.length === 0) {
      const legacy = await despesasRepository.credorPagamentos(chave, 200, 0);
      listaPags = legacy.map((p) => ({
        id: p.id,
        chave,
        ano: Number(p.data_pagamento?.slice(0, 4)) === 2025 ? 2025 : 2026,
        mes: Number(p.data_pagamento?.slice(5, 7)) || 1,
        data_pagamento: p.data_pagamento,
        orgao: p.orgao,
        valor_pago: p.valor_pago,
        nr_empenho: p.nr_empenho,
        descricao: p.descricao ?? 'Pagamento liquidado conforme empenho.',
        modalidade_lic: null,
        elemento: null,
        fonte_url: p.fonte_url ?? LINKS_OFICIAIS.tce,
      }));
    }

    return { credor, integral, porOrgao, listaPags, conexoesDom };
  }, [chave]);

  const pagamentosFiltrados = useMemo(() => {
    const base = data?.listaPags ?? [];
    const termo = buscaPag.trim().toLowerCase();
    return base.filter((p) => {
      if (anoPag !== 'TODOS' && p.ano !== anoPag) return false;
      if (!termo) return true;
      return (
        (p.nr_empenho ?? '').toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo) ||
        (p.modalidade_lic ?? '').toLowerCase().includes(termo) ||
        (p.elemento ?? '').toLowerCase().includes(termo) ||
        dataBr(p.data_pagamento).includes(termo)
      );
    });
  }, [data?.listaPags, anoPag, buscaPag]);

  const pagamentosVisiveis = useMemo(
    () => pagamentosFiltrados.slice((paginaPag - 1) * porPag, paginaPag * porPag),
    [pagamentosFiltrados, paginaPag, porPag]
  );

  const extratosRelacionadosDom = useMemo(() => {
    if (!data?.credor) return [];
    const prefixoForn = data.credor.credor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(LTDA|SA|S\/A|S\.A\.|ME|EPP|EIRELI)\b/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ')
      .toLowerCase();
    if (prefixoForn.length < 6) return [];
    return EXTRATOS_CONTRATOS_DOM_REAIS.filter((ext) =>
      ext.contratada
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(prefixoForn)
    );
  }, [data?.credor]);

  if (loading && !data) {
    return (
      <div className="fg-loading">
        <Loading label="Carregando dossiê completo da empresa (pagamentos + Diário Oficial)…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ marginTop: 20 }}>
        <ErrorBox error={error || new Error('Dados não disponíveis')} />
        <p style={{ marginTop: 12 }}>
          <Link to="/despesas" className="fg-link">
            ← Voltar para empresas
          </Link>
        </p>
      </div>
    );
  }

  const { credor, integral, porOrgao, conexoesDom } = data;
  const maxOrgao = Math.max(...porOrgao.map((o) => o.total_liquido), 1);
  const linkCnpjReceita = urlConsultaCnpj(credor.cnpj_credor);
  const totalAtosDom = conexoesDom.length + extratosRelacionadosDom.length;
  const LIMIT_DOM = 16;
  const domVisiveis = conexoesDom.slice((paginaDom - 1) * LIMIT_DOM, paginaDom * LIMIT_DOM);

  const setAba = (nova: 'pagamentos' | 'diario') => {
    const p = new URLSearchParams(searchParams);
    if (nova === 'diario') p.set('aba', 'diario');
    else p.delete('aba');
    setSearchParams(p, { replace: true });
  };

  const exportarPagamentosCsv = () => {
    exportarCsvPlanilha(
      `pagamentos-${credor.chave}.csv`,
      ['Data', 'Ano', 'Orgao', 'Empenho', 'Modalidade', 'Elemento', 'Valor_BRL', 'Descricao'],
      pagamentosFiltrados.map((p) => [
        dataBr(p.data_pagamento),
        p.ano,
        p.orgao,
        p.nr_empenho,
        p.modalidade_lic,
        p.elemento,
        p.valor_pago.toFixed(2).replace('.', ','),
        p.descricao,
      ])
    );
  };

  return (
    <div className="fg-page-container">
      <nav className="fg-crumbs" aria-label="Caminho da página">
        <Link to="/">Início</Link>
        <span aria-hidden>›</span>
        <Link to="/despesas">Empresas</Link>
        <span aria-hidden>›</span>
        <span>{nomeLegivel(credor.credor)}</span>
      </nav>

      {/* Cabeçalho do Fornecedor */}
      <header className="fg-detail-head" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`fg-tag ${credor.tipo_credor === 'PF' ? 'fg-tag--pf' : ''}`}>
              {credor.tipo_credor === 'PJ' ? 'Empresa (CNPJ)' : credor.tipo_credor === 'PF' ? 'Pessoa física' : 'Outro'}
            </span>
            {integral?.area && <span className="fg-badge fg-badge--blue">{integral.area}</span>}
            {integral?.modalidadePrincipal && integral.modalidadePrincipal !== 'Não aplicável / Outros' && (
              <span className="fg-badge fg-badge--amber">{integral.modalidadePrincipal}</span>
            )}
          </div>

          <h1 className="fg-page-title" style={{ marginTop: 8 }}>
            {nomeLegivel(credor.credor)}
          </h1>

          <div className="fg-detail-meta">
            {credor.cnpj_credor ? (
              <span className="fg-chip-link">
                CNPJ: <strong>{formatarCnpj(credor.cnpj_credor)}</strong>
              </span>
            ) : (
              <span className="fg-tag">CPF protegido pela LGPD</span>
            )}
            {linkCnpjReceita && (
              <a
                href={linkCnpjReceita}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-chip-link"
              >
                <span>Consultar na Receita</span>
                <ExternalLink size={12} aria-hidden />
              </a>
            )}
            <a href={LINKS_OFICIAIS.tce} target="_blank" rel="noreferrer noopener" className="fg-chip-link">
              <span>Fonte TCE-SP</span>
              <ExternalLink size={12} aria-hidden />
            </a>
          </div>

          {integral && integral.contratosRef.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {integral.contratosRef.map((cr) => (
                <span key={cr} className="fg-mini-chip">
                  {cr}
                </span>
              ))}
            </div>
          )}
        </div>

        <Link to="/despesas" className="fg-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} aria-hidden />
          <span>Voltar às empresas</span>
        </Link>
      </header>

      {/* KPIs */}
      <div className="fg-kpis" style={{ marginBottom: 20 }}>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Total recebido (2025–2026)</div>
          <div className="fg-kpi__value">{brlCompacto(credor.total_liquido)}</div>
          <div className="fg-kpi__hint">{brl(credor.total_liquido)}</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">2025 × 2026</div>
          <div className="fg-kpi__value" style={{ fontSize: '1.15rem' }}>
            {integral ? `${brlCompacto(integral.total2025)} · ${brlCompacto(integral.total2026)}` : brlCompacto(credor.maior_pagamento)}
          </div>
          <div className="fg-kpi__hint">
            {integral ? `${inteiro(integral.qtd2025)} pag. em 2025 · ${inteiro(integral.qtd2026)} em 2026` : 'Maior pagamento'}
          </div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Pagamentos na base</div>
          <div className="fg-kpi__value">{inteiro(data.listaPags.length || credor.qtd)}</div>
          <div className="fg-kpi__hint">
            {dataBr(credor.primeiro_pagamento)} a {dataBr(credor.ultimo_pagamento)}
          </div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Atos no Diário Oficial</div>
          <div className="fg-kpi__value" style={{ color: totalAtosDom > 0 ? '#1e5fa8' : undefined }}>
            {inteiro(totalAtosDom)}
          </div>
          <div className="fg-kpi__hint">
            {totalAtosDom > 0 ? 'Publicações cruzadas nos 222 PDFs' : 'Sem citação direta por CNPJ no DOM'}
          </div>
        </div>
      </div>

      {/* Gráficos Reais Mês a Mês (2025 vs 2026) + Órgão Pagador */}
      <div className="fg-grid-2" style={{ marginBottom: 20 }}>
        <div className="fg-card">
          <h2 className="fg-h2">Recebimentos reais mês a mês (2025 × 2026)</h2>
          <p className="fg-sub">Valores exatos pagos em cada mês segundo os lotes oficiais do TCE-SP.</p>
          <div style={{ marginTop: 10 }}>
            <GraficoCredorComparativo
              meses2025={integral?.meses2025 ?? Array(12).fill(0)}
              meses2026={integral?.meses2026 ?? Array(9).fill(0)}
            />
          </div>
        </div>

        <div className="fg-card">
          <h2 className="fg-h2">Quem pagou</h2>
          <p className="fg-sub" style={{ marginBottom: 10 }}>Divisão por órgão de Guarulhos (2025 e 2026).</p>
          {porOrgao.map((o) => (
            <BarraHorizontal
              key={o.orgao}
              nome={nomeOrgaoCurto(o.orgao)}
              valor={o.total_liquido}
              max={maxOrgao}
              meta={`${inteiro(o.qtd)} pagamentos · ${(credor.total_liquido > 0 ? ((o.total_liquido / credor.total_liquido) * 100).toFixed(1) : '0')}% do total`}
              accent
            />
          ))}
        </div>
      </div>

      {/* Abas do Dossiê: Pagamentos Paginados vs Conexões no Diário Oficial */}
      <div className="fg-hub-nav" role="tablist" aria-label="Seções do dossiê do fornecedor">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'pagamentos'}
          className={`fg-hub-tab${abaAtiva === 'pagamentos' ? ' is-active' : ''}`}
          onClick={() => setAba('pagamentos')}
        >
          <FileText size={16} aria-hidden />
          <span>Todos os pagamentos (TCE-SP)</span>
          <b className="fg-hub-tab__badge">{inteiro(data.listaPags.length)}</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'diario'}
          className={`fg-hub-tab${abaAtiva === 'diario' ? ' is-active' : ''}`}
          onClick={() => setAba('diario')}
        >
          <Link2 size={16} aria-hidden />
          <span>Publicações no Diário Oficial</span>
          <b className="fg-hub-tab__badge">{inteiro(totalAtosDom)}</b>
        </button>
      </div>

      {/* ABA 1: TODOS OS PAGAMENTOS (100% PAGINADOS) */}
      {abaAtiva === 'pagamentos' && (
        <section className="fg-section" style={{ marginTop: 0 }}>
          <div className="fg-card" style={{ marginBottom: 14, padding: '12px 14px' }}>
            <div className="fg-toolbar-modern" style={{ marginBottom: 0 }}>
              <div className="fg-pills">
                {(['TODOS', 2026, 2025] as const).map((a) => (
                  <button
                    key={String(a)}
                    type="button"
                    className={`fg-pill${anoPag === a ? ' is-active' : ''}`}
                    onClick={() => {
                      setAnoPag(a);
                      setPaginaPag(1);
                    }}
                  >
                    {a === 'TODOS' ? `Todos (${inteiro(data.listaPags.length)})` : a}
                  </button>
                ))}
              </div>

              <div className="fg-toolbar-modern__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Filtrar por nº de empenho, contrato, modalidade ou data…"
                  value={buscaPag}
                  onChange={(e) => {
                    setBuscaPag(e.target.value);
                    setPaginaPag(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="fg-table-wrap">
            <div className="fg-table-scroll">
              <table className="fg-table fg-table--cards fg-table--pagamentos">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Órgão</th>
                    <th>Empenho</th>
                    <th>Descrição / Modalidade</th>
                    <th className="num">Valor pago</th>
                    <th style={{ textAlign: 'right' }}>Comprovante</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosVisiveis.map((p) => {
                    const estorno = p.valor_pago < 0;
                    return (
                      <tr key={p.id} onClick={() => setPagamentoSelecionado(p)} style={{ cursor: 'pointer' }}>
                        <td data-label="Data" style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {dataBr(p.data_pagamento)}
                        </td>
                        <td data-label="Órgão" style={{ whiteSpace: 'nowrap' }}>
                          <span className="fg-tag">{nomeOrgaoCurto(p.orgao)}</span>
                        </td>
                        <td data-label="Empenho" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                          {p.nr_empenho ?? '—'}
                        </td>
                        <td data-label="Descrição" style={{ maxWidth: 380 }}>
                          <div style={{ fontSize: '0.86rem', color: 'var(--text-body)' }}>{p.descricao}</div>
                          {p.modalidade_lic && p.modalidade_lic !== 'Não aplicável / Outros' && (
                            <span className="fg-mini-tag" style={{ marginTop: 4, display: 'inline-block' }}>
                              {p.modalidade_lic}
                            </span>
                          )}
                        </td>
                        <td data-label="Valor" className={`num fg-money ${estorno ? 'neg' : ''}`}>
                          {brl(p.valor_pago)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="fg-btn fg-btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPagamentoSelecionado(p);
                            }}
                          >
                            <Search size={13} aria-hidden />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pagamentosVisiveis.length === 0 && (
                    <tr>
                      <td colSpan={6} className="fg-empty-row">
                        Nenhum pagamento encontrado com este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginacaoModerna
              pagina={paginaPag}
              totalItens={pagamentosFiltrados.length}
              itensPorPagina={porPag}
              rotuloItem="pagamentos"
              opcoesPorPagina={[25, 50, 100]}
              onMudarPagina={setPaginaPag}
              onMudarItensPorPagina={(q) => {
                setPorPag(q);
                setPaginaPag(1);
              }}
              onExportarCsv={exportarPagamentosCsv}
              rotuloExportar="Baixar CSV"
            />
          </div>
        </section>
      )}

      {/* ABA 2: CONEXÕES NO DIÁRIO OFICIAL (PAGINADAS + LEITOR PDF) */}
      {abaAtiva === 'diario' && (
        <section className="fg-section" style={{ marginTop: 0 }}>
          {totalAtosDom === 0 ? (
            <div className="fg-card" style={{ textAlign: 'center', padding: 28 }}>
              <p style={{ margin: '0 0 12px', color: '#475569' }}>
                Não localizamos o CNPJ desta empresa publicado diretamente nos PDFs de 2025–2026 do Diário Oficial do Executivo.
              </p>
              <Link to="/despesas?visao=conexoes" className="fg-btn fg-btn--primary fg-btn--sm">
                <span>Explorar todas as conexões no Diário Oficial</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="fg-clean-decree-grid">
                {domVisiveis.map((cx) => (
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
                      {cx.valorMencionado && (
                        <strong className="fg-clean-card__amount">{brl(cx.valorMencionado)}</strong>
                      )}
                    </div>

                    <p className="fg-clean-card__text">{cx.trecho}</p>

                    <div className="fg-clean-card__foot">
                      <span className="fg-sha-pill">
                        <ShieldCheck size={13} aria-hidden />
                        <span>{cx.sha256Pdf ? `SHA-256 ${cx.sha256Pdf.slice(0, 10)}…` : 'PDF verificado'}</span>
                      </span>
                      <div className="fg-clean-card__actions">
                        <button
                          type="button"
                          className="fg-btn fg-btn--sm"
                          onClick={() =>
                            setPdfPreview({
                              titulo: `${nomeLegivel(credor.credor)} — DOM #${cx.codigoDom}`,
                              subtitulo: `${ROTULOS_TIPO_ATO_DOM[cx.tipoAto]} · ${cx.dataBr} · Página ${cx.pagina}`,
                              url: cx.pdfUrl,
                              sha256: cx.sha256Pdf,
                            })
                          }
                        >
                          <Eye size={13} aria-hidden />
                          <span>Ler aqui</span>
                        </button>
                        <a
                          href={cx.pdfUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-btn fg-btn--primary fg-btn--sm"
                        >
                          <BookOpen size={13} aria-hidden />
                          <span>Abrir PDF</span>
                          <ArrowUpRight size={12} aria-hidden />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}

                {paginaDom === 1 &&
                  extratosRelacionadosDom.map((ext) => (
                    <article key={ext.id} className="fg-clean-card">
                      <div className="fg-clean-card__top">
                        <div className="fg-clean-card__badges">
                          <span className="fg-badge fg-badge--emerald">{ext.tipo}</span>
                          <span className="fg-badge fg-badge--navy">
                            DOM #{ext.codigoDom} · Pág. {ext.pagina}
                          </span>
                          <span className="fg-badge fg-badge--blue">{ext.dataBr}</span>
                        </div>
                        {ext.valorFmt && <strong className="fg-clean-card__amount">{ext.valorFmt}</strong>}
                      </div>
                      <p className="fg-clean-card__text">{ext.objeto}</p>
                      <div className="fg-clean-card__foot">
                        <span className="fg-sha-pill">
                          <ShieldCheck size={13} aria-hidden />
                          <span>Extrato contratual</span>
                        </span>
                        <div className="fg-clean-card__actions">
                          <button
                            type="button"
                            className="fg-btn fg-btn--sm"
                            onClick={() =>
                              setPdfPreview({
                                titulo: `${ext.tipo} — ${nomeLegivel(ext.contratada)}`,
                                subtitulo: `DOM #${ext.codigoDom} · ${ext.dataBr} · Página ${ext.pagina}`,
                                url: ext.pdfUrl,
                                sha256: ext.sha256Pdf,
                              })
                            }
                          >
                            <Eye size={13} aria-hidden />
                            <span>Ler aqui</span>
                          </button>
                          <a
                            href={ext.pdfUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="fg-btn fg-btn--primary fg-btn--sm"
                          >
                            <span>Abrir PDF</span>
                            <ArrowUpRight size={12} aria-hidden />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>

              {conexoesDom.length > LIMIT_DOM && (
                <div className="fg-card" style={{ marginTop: 14, padding: 0, overflow: 'hidden' }}>
                  <PaginacaoModerna
                    pagina={paginaDom}
                    totalItens={conexoesDom.length}
                    itensPorPagina={LIMIT_DOM}
                    rotuloItem="publicações no Diário"
                    onMudarPagina={setPaginaDom}
                  />
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Modal de Comprovante */}
      {pagamentoSelecionado && (
        <div
          className="fg-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Comprovante do pagamento"
          onClick={() => setPagamentoSelecionado(null)}
        >
          <div className="fg-modal__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fg-modal__head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span
                    className={`fg-badge ${pagamentoSelecionado.valor_pago < 0 ? 'fg-badge--amber' : 'fg-badge--emerald'}`}
                  >
                    {pagamentoSelecionado.valor_pago < 0 ? (
                      <>
                        <RotateCcw size={12} aria-hidden />
                        <span>Estorno / devolução</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} aria-hidden />
                        <span>Pago oficialmente</span>
                      </>
                    )}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    Registro TCE-SP #{pagamentoSelecionado.id}
                  </span>
                </div>
                <h2 className="fg-modal__title">Comprovante do pagamento</h2>
                <p className="fg-modal__sub">
                  Para: <strong style={{ color: '#fff' }}>{nomeLegivel(credor.credor)}</strong>
                </p>
              </div>
              <button
                type="button"
                className="fg-modal__close"
                onClick={() => setPagamentoSelecionado(null)}
                aria-label="Fechar comprovante"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="fg-modal__body" style={{ display: 'grid', gap: 14 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#fff', padding: 10, borderRadius: 8, borderLeft: '3px solid #1e5fa8' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e5fa8' }}>1. EMPENHO</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#09152b', marginTop: 2 }}>
                      Nº {pagamentoSelecionado.nr_empenho ?? 'Registrado'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                      {pagamentoSelecionado.modalidade_lic || `Exercício ${pagamentoSelecionado.ano}`}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: 10, borderRadius: 8, borderLeft: '3px solid #1e5fa8' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e5fa8' }}>2. NATUREZA</div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#09152b', marginTop: 2 }}>
                      {pagamentoSelecionado.elemento || 'Entrega confirmada'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                      {nomeOrgaoCurto(pagamentoSelecionado.orgao)}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: 10, borderRadius: 8, borderLeft: '3px solid #059669' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857' }}>3. PAGAMENTO</div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#047857', marginTop: 2 }}>
                      {brl(pagamentoSelecionado.valor_pago)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                      {dataBr(pagamentoSelecionado.data_pagamento)} ({mesNome(pagamentoSelecionado.mes)}/{pagamentoSelecionado.ano})
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: 4 }}>
                  <FileText size={14} aria-hidden />
                  <span>Histórico registrado no TCE-SP</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#09152b', fontWeight: 600, lineHeight: 1.5 }}>
                  {pagamentoSelecionado.descricao}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: '#1e5fa8' }} aria-hidden />
                <span>
                  Com o empenho <strong>{pagamentoSelecionado.nr_empenho ?? 'acima'}</strong>, data (
                  {dataBr(pagamentoSelecionado.data_pagamento)}) e CNPJ, qualquer cidadão pode solicitar a nota fiscal
                  e o contrato pela Lei de Acesso à Informação (LAI).
                </span>
              </div>
            </div>

            <div className="fg-modal__foot">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={LINKS_OFICIAIS.tce} target="_blank" rel="noreferrer noopener" className="fg-link-inline">
                  <span>Painel TCE-SP</span>
                  <ExternalLink size={13} aria-hidden />
                </a>
                {linkCnpjReceita && (
                  <a href={linkCnpjReceita} target="_blank" rel="noreferrer noopener" className="fg-link-inline">
                    <span>Receita Federal</span>
                    <ExternalLink size={13} aria-hidden />
                  </a>
                )}
              </div>
              <button type="button" className="fg-btn" onClick={() => setPagamentoSelecionado(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
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
            {urlPdfOficialSegura(pdfPreview.url) ? (
              <iframe
                src={urlPdfOficialSegura(pdfPreview.url)!}
                title={pdfPreview.titulo}
                referrerPolicy="no-referrer"
                style={{ width: '100%', flex: 1, border: 0, background: '#f1f5f9' }}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#475569' }}>
                Link fora do domínio oficial validado. Use “Abrir em nova aba”.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
