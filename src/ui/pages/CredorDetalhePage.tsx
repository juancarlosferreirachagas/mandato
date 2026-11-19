import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { despesasRepository, type Pagamento } from '@/repositories/despesasRepository';
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

  const { data, loading, error } = useAsync(async () => {
    if (!chave) throw new Error('Identificador do credor não informado.');

    const [credor, mensal, porOrgao, pagamentos] = await Promise.all([
      despesasRepository.credor(chave),
      despesasRepository.credorPorMes(chave),
      despesasRepository.credorPorOrgao(chave),
      despesasRepository.credorPagamentos(chave, LIMIT_PAGAMENTOS, deslocamento),
    ]);

    if (!credor) throw new Error('Credor não encontrado na base de dados de Guarulhos.');

    return { credor, mensal, porOrgao, pagamentos };
  }, [chave, deslocamento]);

  if (loading && !data) {
    return (
      <div className="fg-loading">
        <Loading label="Carregando histórico do recebedor..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ marginTop: 20 }}>
        <ErrorBox error={error || new Error('Dados não disponíveis')} />
        <p style={{ marginTop: 12 }}>
          <Link to="/despesas" className="fg-link">← Voltar para a lista de despesas</Link>
        </p>
      </div>
    );
  }

  const { credor, mensal, porOrgao, pagamentos } = data;
  const totalLinhas = pagamentos[0]?.total_linhas ?? 0;
  const totalPaginas = Math.ceil(totalLinhas / LIMIT_PAGAMENTOS) || 1;
  const maxOrgao = Math.max(...porOrgao.map((o) => o.total_liquido), 1);

  // Link para consulta pública de CNPJ
  const cnpjLimpo = credor.cnpj_credor?.replace(/\D/g, '');
  const linkCnpjReceita = cnpjLimpo ? `https://cnpjs.rocks/cnpj/${cnpjLimpo}` : null;

  return (
    <div className="fg-page-container">
      {/* Navegação / Breadcrumb */}
      <div className="fg-crumbs">
        <Link to="/">Início</Link> &gt; <Link to="/despesas">Gastos &amp; Fornecedores</Link> &gt;{' '}
        <span>{nomeLegivel(credor.credor)}</span>
      </div>

      {/* Cabeçalho do Credor */}
      <header className="fg-detail-head" style={{ marginBottom: 24 }}>
        <div>
          <span className={`fg-tag ${credor.tipo_credor === 'PF' ? 'fg-tag--pf' : ''}`}>
            {credor.tipo_credor === 'PJ' ? 'Pessoa Jurídica (Empresa)' : credor.tipo_credor === 'PF' ? 'Pessoa Física' : 'Outro'}
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
              <span className="fg-tag">CPF restrito por lei de proteção</span>
            )}
            {linkCnpjReceita && (
              <a
                href={linkCnpjReceita}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-chip-link"
                title="Consultar dados cadastrais públicos na Receita"
              >
                Ficha Cadastral ↗
              </a>
            )}
            <a
              href={`https://transparencia.tce.sp.gov.br/painel/guarulhos`}
              target="_blank"
              rel="noreferrer noopener"
              className="fg-chip-link"
              title="Acessar o Portal de Transparência do TCE-SP"
            >
              Fonte TCE-SP ↗
            </a>
          </div>

          {/* Variações de nomes registrados se houver */}
          {credor.nomes && credor.nomes.length > 1 && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Variações de razão social registradas nos empenhos: {credor.nomes.join('; ')}
            </p>
          )}
        </div>

        <Link to="/despesas" className="fg-btn">
          ← Voltar à lista
        </Link>
      </header>

      {/* Cartões de Indicadores */}
      <div className="fg-kpis" style={{ marginBottom: 24 }}>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Total Recebido (Líquido)</div>
          <div className="fg-kpi__value">{brlCompacto(credor.total_liquido)}</div>
          <div className="fg-kpi__hint">{brl(credor.total_liquido)}</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Total de Pagamentos</div>
          <div className="fg-kpi__value">{inteiro(credor.qtd)}</div>
          <div className="fg-kpi__hint">ordens bancárias processadas</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Maior Pagamento Único</div>
          <div className="fg-kpi__value">{brlCompacto(credor.maior_pagamento)}</div>
          <div className="fg-kpi__hint">{brl(credor.maior_pagamento)}</div>
        </div>
        <div className="fg-kpi">
          <div className="fg-kpi__label">Período de Recebimento</div>
          <div className="fg-kpi__value" style={{ fontSize: '1.25rem' }}>
            {dataBr(credor.primeiro_pagamento)} a {dataBr(credor.ultimo_pagamento)}
          </div>
          <div className="fg-kpi__hint">exercício de 2026</div>
        </div>
      </div>

      {/* Gráficos de Evolução e Quem Pagou */}
      <div className="fg-grid-2" style={{ marginBottom: 32 }}>
        <div className="fg-card">
          <h2 className="fg-h2">Recebimentos Mês a Mês</h2>
          <p className="fg-sub">Distribuição dos valores pagos ao longo de 2026.</p>
          <div style={{ marginTop: 12 }}>
            <BarrasMensais pontos={mensal} />
          </div>
        </div>

        <div className="fg-card">
          <h2 className="fg-h2">De Onde Veio o Recurso?</h2>
          <p className="fg-sub" style={{ marginBottom: 8 }}>Divisão por órgão pagador municipal.</p>
          {porOrgao.map((o) => (
            <BarraHorizontal
              key={o.orgao}
              nome={nomeOrgaoCurto(o.orgao)}
              valor={o.total_liquido}
              max={maxOrgao}
              meta={`${inteiro(o.qtd)} ordens de pagamento · ${(credor.total_liquido > 0 ? (o.total_liquido / credor.total_liquido * 100).toFixed(1) : '0')}% do total`}
              accent
            />
          ))}
        </div>
      </div>

      {/* Tabela de Todos os Pagamentos Individuais */}
      <section className="fg-section" style={{ marginTop: 0 }}>
        <div className="fg-section__head">
          <div>
            <h2 className="fg-h2">Histórico de Pagamentos — Conferência Completa</h2>
            <p className="fg-sub">
              Toque em qualquer linha ou em <strong>“🔍 Ver Comprovante”</strong> para abrir a ficha completa de auditoria (empenho, liquidação e no que deu) sem sair da página.
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
                  <th>Nº Empenho</th>
                  <th>Descrição / Histórico Oficial</th>
                  <th className="num">Valor Pago</th>
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
                      <td data-label="Nº Empenho" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {p.nr_empenho ?? '—'}
                      </td>
                      <td data-label="Descrição" style={{ maxWidth: 360 }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>
                          {p.descricao}
                        </div>
                      </td>
                      <td data-label="Valor pago" className={`num fg-money ${estorno ? 'neg' : ''}`}>
                        {brl(p.valor_pago)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="fg-btn"
                          style={{
                            fontSize: '0.76rem',
                            padding: '5px 10px',
                            fontWeight: 800,
                            color: '#0284c7',
                            borderColor: '#bae6fd',
                            background: '#f0f9ff',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPagamentoSelecionado(p);
                          }}
                        >
                          🔍 Ver Comprovante
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
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
                <span style={{ alignSelf: 'center', padding: '0 8px', fontWeight: 600 }}>
                  Pág. {pagina} de {totalPaginas}
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

      {/* Modal de Ficha Completa de Auditoria do Pagamento ("No que deu") */}
      {pagamentoSelecionado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Comprovante de Auditoria do Pagamento"
          onClick={() => setPagamentoSelecionado(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 21, 43, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(9, 21, 43, 0.35)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
            }}
          >
            {/* Cabeçalho do Comprovante */}
            <div
              style={{
                background: 'linear-gradient(135deg, #09152b 0%, #102a56 100%)',
                color: '#ffffff',
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    className="fg-badge"
                    style={{
                      background: pagamentoSelecionado.valor_pago < 0 ? '#fef3c7' : '#dcfce7',
                      color: pagamentoSelecionado.valor_pago < 0 ? '#b45309' : '#166534',
                      fontWeight: 800,
                    }}
                  >
                    {pagamentoSelecionado.valor_pago < 0 ? '↩️ Estorno / Devolução Contábil' : '✅ Liquidado e Pago Oficialmente'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Registro Audesp / TCE-SP #{pagamentoSelecionado.id}
                  </span>
                </div>
                <h2 style={{ margin: '8px 0 2px', fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 800 }}>
                  Comprovante de Auditoria do Pagamento
                </h2>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                  Favorecido: <strong style={{ color: '#38bdf8' }}>{nomeLegivel(credor.credor)}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPagamentoSelecionado(null)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕ Fechar
              </button>
            </div>

            {/* Corpo do Comprovante */}
            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'grid', gap: 14 }}>
              {/* Passo a Passo: No que deu */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: 8 }}>
                  📌 Passo a Passo Oficial — “No que deu” este gasto:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10,
                  }}
                >
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: 8, borderLeft: '3px solid #0284c7' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284c7' }}>1º EMPENHO (RESERVA)</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#09152b', marginTop: 2 }}>
                      Nº {pagamentoSelecionado.nr_empenho ?? 'Registrado'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                      O dinheiro foi reservado no orçamento de {pagamentoSelecionado.data_pagamento?.slice(0, 4) || '2026'}.
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: 8, borderLeft: '3px solid #0284c7' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284c7' }}>2º LIQUIDAÇÃO (CONFERÊNCIA)</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#09152b', marginTop: 2 }}>
                      Serviço / Entrega Atestada
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                      O órgão público declarou que o contrato foi cumprido.
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857' }}>3º PAGAMENTO EFETIVO</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#047857', marginTop: 2 }}>
                      {brl(pagamentoSelecionado.valor_pago)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                      Pago em {dataBr(pagamentoSelecionado.data_pagamento)} ({mesNome(Number(pagamentoSelecionado.data_pagamento?.slice(5, 7)) || 1)}/{pagamentoSelecionado.data_pagamento?.slice(0, 4) || '2026'}).
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição / Histórico Completo */}
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: 4 }}>
                  📄 Histórico / Descrição Oficial Declarada pelo Órgão:
                </div>
                <div style={{ fontSize: '0.92rem', color: '#09152b', fontWeight: 600, lineHeight: 1.5 }}>
                  {pagamentoSelecionado.descricao || 'Pagamento ordinário conforme nota de empenho.'}
                </div>
              </div>

              {/* Quadro Técnico Auditável */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Órgão Pagador</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09152b', marginTop: 2 }}>
                    {nomeOrgaoCurto(pagamentoSelecionado.orgao)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{pagamentoSelecionado.orgao}</div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Documento do Credor</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09152b', marginTop: 2 }}>
                    {credor.cnpj_credor ? formatarCnpj(credor.cnpj_credor) : 'Pessoa Física (CPF protegido)'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>Razão: {credor.credor}</div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Evento Contábil</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09152b', marginTop: 2 }}>
                    {pagamentoSelecionado.valor_pago < 0 ? 'Anulação / Estorno de Pagamento' : 'Valor Pago (Audesp)'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                    Empenho: {pagamentoSelecionado.nr_empenho ?? 'Não informado'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45 }}>
                💡 <strong>Como usar este comprovante para fiscalizar?</strong> Com o{' '}
                <strong>Nº do Empenho ({pagamentoSelecionado.nr_empenho ?? 'acima'})</strong>, a data ({dataBr(pagamentoSelecionado.data_pagamento)}) e o CNPJ, qualquer cidadão ou vereador pode solicitar a cópia integral da nota fiscal e do contrato via Lei de Acesso à Informação (LAI).
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div
              style={{
                padding: '12px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href="https://transparencia.tce.sp.gov.br/painel/guarulhos"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-link"
                  style={{ fontSize: '0.82rem' }}
                >
                  Painel Visual TCE-SP (Guarulhos) ↗
                </a>
                {linkCnpjReceita && (
                  <a
                    href={linkCnpjReceita}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="fg-link"
                    style={{ fontSize: '0.82rem' }}
                  >
                    Consultar CNPJ na Receita ↗
                  </a>
                )}
              </div>

              <button
                type="button"
                className="fg-btn"
                onClick={() => setPagamentoSelecionado(null)}
              >
                Fechar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
