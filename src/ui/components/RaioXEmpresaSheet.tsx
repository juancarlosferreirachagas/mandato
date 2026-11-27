/**
 * ============================================================================
 * RAIO-X RÁPIDO DA EMPRESA (SEM SAIR DA TELA — SHARD ~120 KB SOB DEMANDA)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 */

import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ExternalLink,
  FileText,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import {
  carregarPagamentosDoCredor,
  obterConexoesDomDoCredor,
  obterCredorIntegralPorChave,
  ROTULOS_TIPO_ATO_DOM,
  type ConexaoEmpresaDom,
  type CredorIntegral,
  type PagamentoIntegral,
} from '@/services/baseIntegralService';
import { LINKS_OFICIAIS, urlConsultaCnpj } from '@/domain/plataforma';
import { traduzirHistoricoPagamento } from '@/domain/linguagemCidada';
import { useAsync } from '../hooks/useAsync';
import { PainelRaioX } from './PainelRaioX';
import { GraficoCredorComparativo } from './GraficosModernos';
import { Loading } from './common';
import { brl, brlCompacto, dataBr, formatarCnpj, inteiro, nomeLegivel, nomeOrgaoCurto } from '../format';

interface RaioXEmpresaSheetProps {
  chave: string | null;
  onFechar: () => void;
}

export function RaioXEmpresaSheet({ chave, onFechar }: RaioXEmpresaSheetProps) {
  const { data, loading } = useAsync<{
    credor: CredorIntegral | null;
    pagamentos: PagamentoIntegral[];
    conexoes: ConexaoEmpresaDom[];
  } | null>(
    async () => {
      if (!chave) return null;
      const [credor, pagamentos, conexoes] = await Promise.all([
        obterCredorIntegralPorChave(chave),
        carregarPagamentosDoCredor(chave).catch(() => []),
        obterConexoesDomDoCredor(chave).catch(() => []),
      ]);
      return { credor, pagamentos, conexoes };
    },
    [chave]
  );

  const credor = data?.credor ?? null;
  const linkReceita = urlConsultaCnpj(credor?.cnpj);

  return (
    <PainelRaioX
      aberto={Boolean(chave)}
      onFechar={onFechar}
      eyebrow={credor ? `${credor.area}${credor.modalidadePrincipal ? ` · ${credor.modalidadePrincipal}` : ''}` : 'Raio-X do Fornecedor'}
      titulo={credor ? nomeLegivel(credor.credor) : 'Carregando empresa…'}
      subtitulo={
        credor
          ? credor.cnpj
            ? `CNPJ ${formatarCnpj(credor.cnpj)} · ${inteiro(credor.qtdConsolidado)} pagamentos em 2025–2026`
            : `Pessoa física (CPF protegido pela LGPD) · ${inteiro(credor.qtdConsolidado)} pagamentos`
          : undefined
      }
      rodape={
        chave ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {linkReceita && (
                <a
                  href={linkReceita}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-btn fg-btn--sm"
                >
                  <span>Receita Federal</span>
                  <ExternalLink size={12} aria-hidden />
                </a>
              )}
              <a
                href={LINKS_OFICIAIS.tce}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-btn fg-btn--sm"
              >
                <span>TCE-SP</span>
                <ExternalLink size={12} aria-hidden />
              </a>
            </div>
            <Link
              to={`/despesas/credor/${chave}`}
              className="fg-btn fg-btn--primary fg-btn--sm"
              onClick={onFechar}
            >
              <span>Abrir dossiê completo</span>
              <ArrowRight size={13} aria-hidden />
            </Link>
          </>
        ) : undefined
      }
    >
      {loading || !credor ? (
        <div style={{ padding: '24px 0' }}>
          <Loading label="Carregando raio-x leve (~120 KB)…" />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* KPIs compactos sem sair da tela */}
          <div className="fg-sheet-kpis">
            <div className="fg-sheet-kpi">
              <span>Total 2025–2026</span>
              <strong>{brlCompacto(credor.totalConsolidado)}</strong>
              <small>{brl(credor.totalConsolidado)}</small>
            </div>
            <div className="fg-sheet-kpi">
              <span>Em 2026 (Jan–Set)</span>
              <strong>{brlCompacto(credor.total2026)}</strong>
              <small>{inteiro(credor.qtd2026)} pagamentos</small>
            </div>
            <div className="fg-sheet-kpi">
              <span>Em 2025 (ano todo)</span>
              <strong>{brlCompacto(credor.total2025)}</strong>
              <small>{inteiro(credor.qtd2025)} pagamentos</small>
            </div>
            <div className="fg-sheet-kpi">
              <span>No Diário Oficial</span>
              <strong style={{ color: credor.qtdConexoesDom > 0 ? '#1e5fa8' : undefined }}>
                {inteiro(credor.qtdConexoesDom)} {credor.qtdConexoesDom === 1 ? 'ato' : 'atos'}
              </strong>
              <small>{credor.qtdConexoesDom > 0 ? 'Nos 222 PDFs oficiais' : 'Sem citação direta'}</small>
            </div>
          </div>

          {/* Contratos identificados nos empenhos */}
          {credor.contratosRef.length > 0 && (
            <div className="fg-sheet-section">
              <div className="fg-sheet-section__head">
                <Building2 size={14} aria-hidden />
                <span>Contratos citados nos empenhos</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {credor.contratosRef.map((cr) => (
                  <span key={cr} className="fg-mini-chip fg-mini-chip--blue">
                    {cr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico real mês a mês 2025 vs 2026 */}
          <div className="fg-sheet-section">
            <div className="fg-sheet-section__head">
              <FileText size={14} aria-hidden />
              <span>Pagamentos reais mês a mês (2025 × 2026)</span>
            </div>
            <GraficoCredorComparativo
              meses2025={credor.meses2025}
              meses2026={credor.meses2026}
              altura={210}
            />
          </div>

          {/* Conexões no Diário Oficial */}
          {data && data.conexoes.length > 0 && (
            <div className="fg-sheet-section">
              <div className="fg-sheet-section__head">
                <Link2 size={14} aria-hidden />
                <span>Publicações nos 222 PDFs do Diário Oficial ({data.conexoes.length})</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {data.conexoes.slice(0, 4).map((cx) => (
                  <div key={cx.id} className="fg-sheet-item">
                    <div className="fg-sheet-item__top">
                      <span className="fg-badge fg-badge--amber">
                        {ROTULOS_TIPO_ATO_DOM[cx.tipoAto] || cx.tipoAto}
                      </span>
                      <span className="fg-tag">
                        DOM #{cx.codigoDom} · Pág. {cx.pagina} · {cx.dataBr}
                      </span>
                    </div>
                    <p className="fg-sheet-item__text">{cx.trecho}</p>
                    <div className="fg-sheet-item__foot">
                      <span className="fg-sha-pill">
                        <ShieldCheck size={12} aria-hidden />
                        <span>{cx.sha256Pdf ? `SHA-256 ${cx.sha256Pdf.slice(0, 8)}…` : 'Verificado'}</span>
                      </span>
                      <a
                        href={cx.pdfUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="fg-link-inline"
                      >
                        <span>Abrir PDF oficial</span>
                        <ArrowUpRight size={12} aria-hidden />
                      </a>
                    </div>
                  </div>
                ))}
                {data.conexoes.length > 4 && (
                  <Link
                    to={`/despesas/credor/${chave}?aba=diario`}
                    className="fg-link"
                    onClick={onFechar}
                    style={{ fontSize: '0.82rem' }}
                  >
                    Ver todas as {data.conexoes.length} publicações no Diário →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Últimos pagamentos reais */}
          <div className="fg-sheet-section">
            <div className="fg-sheet-section__head">
              <FileText size={14} aria-hidden />
              <span>Últimos pagamentos liquidados ({inteiro(data?.pagamentos.length ?? 0)} no total)</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(data?.pagamentos ?? []).slice(0, 6).map((p) => {
                const trad = traduzirHistoricoPagamento(p.descricao);
                return (
                  <div key={p.id} className="fg-sheet-item">
                    <div className="fg-sheet-item__top">
                      <strong>{dataBr(p.data_pagamento)}</strong>
                      <span className="fg-tag">{nomeOrgaoCurto(p.orgao)}</span>
                      <strong className={`fg-money ${p.valor_pago < 0 ? 'neg' : ''}`} style={{ marginLeft: 'auto' }}>
                        {brl(p.valor_pago)}
                      </strong>
                    </div>
                    <p className="fg-sheet-item__text">{trad.resumoLimpo}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {p.nr_empenho && (
                        <span className="fg-mini-tag">Empenho {p.nr_empenho}</span>
                      )}
                      {trad.tags.map((tg) => (
                        <span key={tg} className="fg-mini-tag">
                          {tg}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PainelRaioX>
  );
}
