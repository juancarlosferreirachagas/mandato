import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { despesasRepository, type Pagamento } from '@/repositories/despesasRepository';
import { EXTRATOS_CONTRATOS_DOM_REAIS } from '@/domain/diariosCatalogoReal';
import { LINKS_OFICIAIS, urlConsultaCnpj } from '@/domain/plataforma';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';
import { BarrasMensais, BarraHorizontal } from '../components/Graficos';
import { brl, brlCompacto, formatarCnpj, inteiro, nomeLegivel, dataBr, nomeOrgaoCurto, mesNome } from '../format';

const LIMIT_PAGAMENTOS = 40;

export function CredorDetalhePage() {
  const { chave } = useParams<{ chave: string }>();
  const [pagina, setPagina] = useState(1);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<Pagamento | null>(null);

  const deslocamento = (pagina - 1) * LIMIT_PAGAMENTOS;

  useEffect(() => {
    if (!pagamentoSelecionado) return;
    document.body.classList.add('fg-lock');
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPagamentoSelecionado(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [pagamentoSelecionado]);

  const { data, loading, error } = useAsync(async () => {
    if (!chave) throw new Error('Identificador do fornecedor não informado.');

    const [credor, mensal, porOrgao, pagamentos] = await Promise.all([
      despesasRepository.credor(chave),
      despesasRepository.credorPorMes(chave),
      despesasRepository.credorPorOrgao(chave),
      despesasRepository.credorPagamentos(chave, LIMIT_PAGAMENTOS, deslocamento),
    ]);

    if (!credor) throw new Error('Fornecedor não encontrado na base de Guarulhos.');

    return { credor, mensal, porOrgao, pagamentos };
  }, [chave, deslocamento]);

  if (loading && !data) {
    return (
      <div className="fg-loading">
        <Loading label="Carregando pagamentos do fornecedor…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ marginTop: 20 }}>
        <ErrorBox error={error || new Error('Dados não disponíveis')} />
        <p style={{ marginTop: 12 }}>
          <Link to="/despesas" className="fg-link">
            ← Voltar para fornecedores
          </Link>
        </p>
      </div>
    );
  }

  const { credor, mensal, porOrgao, pagamentos } = data;
  const totalLinhas = pagamentos[0]?.total_linhas ?? 0;
  const totalPaginas = Math.ceil(totalLinhas / LIMIT_PAGAMENTOS) || 1;
  const maxOrgao = Math.max(...porOrgao.map((o) => o.total_liquido), 1);

  const linkCnpjReceita = urlConsultaCnpj(credor.cnpj_credor);
  const anoIni = credor.primeiro_pagamento?.slice(0, 4);
  const anoFim = credor.ultimo_pagamento?.slice(0, 4);
  const rotuloPeriodo =
    anoIni && anoFim && anoIni !== anoFim ? `${anoIni} e ${anoFim}` : anoFim || anoIni || '2025–2026';

  const prefixoForn = credor.credor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(LTDA|SA|S\/A|S\.A\.|ME|EPP|EIRELI)\b/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ')
    .toLowerCase();

  const extratosRelacionadosDom =
    prefixoForn.length >= 6
      ? EXTRATOS_CONTRATOS_DOM_REAIS.filter((ext) => {
          const norm = ext.contratada
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          return norm.includes(prefixoForn);
        })
      : [];

  return (
    <div className="fg-page-container">
      {/* Navegação / Breadcrumb */}
      <nav className="fg-crumbs" aria-label="Caminho da página">
        <Link to="/">Início</Link>
        <span aria-hidden>›</span>
        <Link to="/despesas">Fornecedores</Link>
        <span aria-hidden>›</span>
        <span>{nomeLegivel(credor.credor)}</span>
      </nav>

      {/* Cabeçalho do Fornecedor */}
      <header className="fg-detail-head" style={{ marginBottom: 22 }}>
        <div>
          <span className={`fg-tag ${credor.tipo_credor === 'PF' ? 'fg-tag--pf' : ''}`}>
            {credor.tipo_credor === 'PJ' ? 'Empresa (CNPJ)' : credor.tipo_credor === 'PF' ? 'Pessoa física' : 'Outro'}
          </span>
          <h1 className="fg-page-title" style={{ marginTop: 6 }}>
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
                title="Consultar CNPJ no site da Receita Federal"
              >
                <span>Consultar na Receita</span>
                <ExternalLink size={12} aria-hidden />
              </a>
            )}
            <a
              href={LINKS_OFICIAIS.tce}
              target="_blank"
              rel="noreferrer noopener"
              className="fg-chip-link"
              title="Abrir painel de Guarulhos no TCE-SP"
            >
              <span>Fonte TCE-SP</span>
              <ExternalLink size={12} aria-hidden />
            </a>
          </div>

          {credor.nomes && credor.nomes.length > 1 && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Outros nomes registrados nos empenhos: {credor.nomes.join('; ')}
            </p>
          )}
        </div>

        <Link to="/despesas" className="fg-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} aria-hidden />
          <span>Voltar à lista</span>
        </Link>
      </header>

      {/* Cartões de Indicadores */}
      <div className="fg-kpis" style={{ marginBottom: 22 }}>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Total recebido</div>
          <div className="fg-kpi__value">{brlCompacto(credor.total_liquido)}</div>
          <div className="fg-kpi__hint">{brl(credor.total_liquido)}</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Pagamentos</div>
          <div className="fg-kpi__value">{inteiro(credor.qtd)}</div>
          <div className="fg-kpi__hint">pagamentos registrados</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Maior pagamento</div>
          <div className="fg-kpi__value">{brlCompacto(credor.maior_pagamento)}</div>
          <div className="fg-kpi__hint">{brl(credor.maior_pagamento)}</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Período</div>
          <div className="fg-kpi__value" style={{ fontSize: '1.15rem' }}>
            {dataBr(credor.primeiro_pagamento)} a {dataBr(credor.ultimo_pagamento)}
          </div>
          <div className="fg-kpi__hint">dados de {rotuloPeriodo}</div>
        </div>
      </div>

      {/* Gráficos de Evolução e Quem Pagou */}
      <div className="fg-grid-2" style={{ marginBottom: 24 }}>
        <div className="fg-card">
          <h2 className="fg-h2">Recebimentos mês a mês</h2>
          <p className="fg-sub">Distribuição dos valores ao longo de {rotuloPeriodo}.</p>
          <div style={{ marginTop: 12 }}>
            <BarrasMensais pontos={mensal} />
          </div>
        </div>

        <div className="fg-card">
          <h2 className="fg-h2">Quem pagou</h2>
          <p className="fg-sub" style={{ marginBottom: 8 }}>Divisão por órgão de Guarulhos.</p>
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

      {extratosRelacionadosDom.length > 0 && (
        <section className="fg-card" style={{ marginBottom: 22 }}>
          <div className="fg-section__head" style={{ marginBottom: 10 }}>
            <div>
              <h2 className="fg-h2">Extratos contratuais localizados no Diário Oficial ({extratosRelacionadosDom.length})</h2>
              <p className="fg-sub">
                Publicações do Diário Oficial do Município (DOM-GRU) vinculadas a este fornecedor.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {extratosRelacionadosDom.map((ext) => (
              <div
                key={ext.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <div style={{ maxWidth: 680 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className="fg-badge fg-badge--amber">{ext.tipo}</span>
                    <span className="fg-badge fg-badge--blue">{ext.dataBr} · DOM #{ext.codigoDom}</span>
                    {ext.valorFmt && <span className="fg-badge fg-badge--emerald">{ext.valorFmt}</span>}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.45 }}>{ext.objeto}</div>
                </div>
                <a
                  href={ext.pdfUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-btn fg-btn--primary fg-btn--sm"
                >
                  <FileText size={13} aria-hidden />
                  <span>Abrir PDF (Pág. {ext.pagina})</span>
                  <ExternalLink size={12} aria-hidden />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabela de Pagamentos */}
      <section className="fg-section" style={{ marginTop: 0 }}>
        <div className="fg-section__head">
          <div>
            <h2 className="fg-h2">Histórico de pagamentos</h2>
            <p className="fg-sub">
              Toque em qualquer linha ou em <strong>“Ver comprovante”</strong> para ver os detalhes do empenho e da
              entrega do serviço.
            </p>
          </div>
        </div>

        <div className="fg-table-wrap">
          <div className="fg-table-scroll">
            <table className="fg-table fg-table--cards fg-table--pagamentos">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Órgão</th>
                  <th>Nº do empenho</th>
                  <th>Descrição</th>
                  <th className="num">Valor pago</th>
                  <th style={{ textAlign: 'right' }}>Comprovante</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => {
                  const estorno = p.valor_pago < 0;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setPagamentoSelecionado(p)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td data-label="Data" style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {dataBr(p.data_pagamento)}
                      </td>
                      <td data-label="Órgão" style={{ whiteSpace: 'nowrap' }}>
                        <span className="fg-tag">{nomeOrgaoCurto(p.orgao)}</span>
                      </td>
                      <td data-label="Empenho" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {p.nr_empenho ?? '—'}
                      </td>
                      <td data-label="Descrição" style={{ maxWidth: 360 }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>
                          {p.descricao}
                        </div>
                      </td>
                      <td data-label="Valor" className={`num fg-money ${estorno ? 'neg' : ''}`}>
                        {brl(p.valor_pago)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="fg-btn"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 12px',
                            fontWeight: 700,
                            color: '#1e5fa8',
                            borderColor: '#bfdbfe',
                            background: '#eff6ff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPagamentoSelecionado(p);
                          }}
                        >
                          <Search size={13} aria-hidden />
                          <span>Ver comprovante</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="fg-pager">
              <div>
                Mostrando <strong>{deslocamento + 1}</strong> a{' '}
                <strong>{Math.min(deslocamento + LIMIT_PAGAMENTOS, totalLinhas)}</strong> de{' '}
                <strong>{inteiro(totalLinhas)}</strong> pagamentos
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="fg-btn"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <span style={{ alignSelf: 'center', padding: '0 8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  Pág. {pagina} / {totalPaginas}
                </span>
                <button
                  type="button"
                  className="fg-btn"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

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
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e5fa8', textTransform: 'uppercase', marginBottom: 8 }}>
                  Passo a passo deste gasto
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#fff', padding: 10, borderRadius: 8, borderLeft: '3px solid #1e5fa8' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e5fa8' }}>1. RESERVA (EMPENHO)</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#09152b', marginTop: 2 }}>
                      Nº {pagamentoSelecionado.nr_empenho ?? 'Registrado'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 2 }}>
                      Valor separado no orçamento de {pagamentoSelecionado.data_pagamento?.slice(0, 4) || '2026'}.
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: 10, borderRadius: 8, borderLeft: '3px solid #1e5fa8' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e5fa8' }}>2. CONFERÊNCIA</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#09152b', marginTop: 2 }}>
                      Entrega confirmada
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 2 }}>
                      O órgão atestou que o serviço ou produto foi entregue.
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: 10, borderRadius: 8, borderLeft: '3px solid #059669' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857' }}>3. PAGAMENTO</div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#047857', marginTop: 2 }}>
                      {brl(pagamentoSelecionado.valor_pago)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 2 }}>
                      Pago em {dataBr(pagamentoSelecionado.data_pagamento)} ({mesNome(Number(pagamentoSelecionado.data_pagamento?.slice(5, 7)) || 1)}/{pagamentoSelecionado.data_pagamento?.slice(0, 4) || '2026'}).
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: 4 }}>
                  <FileText size={14} aria-hidden />
                  <span>Descrição registrada no TCE-SP</span>
                </div>
                <div style={{ fontSize: '0.92rem', color: '#09152b', fontWeight: 600, lineHeight: 1.5 }}>
                  {pagamentoSelecionado.descricao || 'Pagamento conforme nota de empenho.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Quem pagou</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09152b', marginTop: 2 }}>
                    {nomeOrgaoCurto(pagamentoSelecionado.orgao)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{pagamentoSelecionado.orgao}</div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Documento</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09152b', marginTop: 2 }}>
                    {credor.cnpj_credor ? formatarCnpj(credor.cnpj_credor) : 'Pessoa física (CPF protegido)'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{credor.credor}</div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Tipo de lançamento</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09152b', marginTop: 2 }}>
                    {pagamentoSelecionado.valor_pago < 0 ? 'Devolução ou estorno' : 'Valor pago'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                    Empenho: {pagamentoSelecionado.nr_empenho ?? 'Não informado'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: '#1e5fa8' }} aria-hidden />
                <span>
                  <strong>Quer pedir a nota fiscal?</strong> Com o número do empenho (
                  <strong>{pagamentoSelecionado.nr_empenho ?? 'acima'}</strong>), a data (
                  {dataBr(pagamentoSelecionado.data_pagamento)}) e o CNPJ, qualquer cidadão pode solicitar a cópia do
                  contrato e da nota fiscal pela Lei de Acesso à Informação.
                </span>
              </div>
            </div>

            <div className="fg-modal__foot">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href={LINKS_OFICIAIS.tce}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-link-inline"
                >
                  <span>Abrir painel do TCE-SP</span>
                  <ExternalLink size={13} aria-hidden />
                </a>
                {linkCnpjReceita && (
                  <a
                    href={linkCnpjReceita}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="fg-link-inline"
                  >
                    <span>Consultar CNPJ na Receita</span>
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
    </div>
  );
}
