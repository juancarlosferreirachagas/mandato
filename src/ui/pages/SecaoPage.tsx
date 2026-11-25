/**
 * ============================================================================
 * PÁGINA: FONTES DOS DADOS
 * Rota: /fontes
 * ============================================================================
 *
 * Explica, em linguagem simples, de onde vem cada informação do site, até que
 * data ela vai e como abrir o original no portal oficial. Também mostra o
 * histórico de atualizações da base de pagamentos (TCE-SP).
 * ============================================================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { despesasRepository } from '@/repositories/despesasRepository';
import { verificarFontesEmTempoReal } from '@/services/auditoriaTempoRealService';
import {
  QTD_DECRETOS,
  QTD_DIARIOS,
  QTD_DIARIOS_EXECUTIVO,
  QTD_DIARIOS_LEGISLATIVO,
  QTD_LEIS_SANCIONADAS,
} from '@/domain/plataforma';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, Loading } from '../components/common';
import { dataBr, dataHoraBr, inteiro } from '../format';
import type { Secao } from '../navigation';

export function SecaoPage({ secao }: { secao: Secao }) {
  // Muda a cada clique em "Verificar agora" para refazer as consultas
  const [ciclo, setCiclo] = useState(0);

  const { data: coletas, loading: loadingColetas, error } = useAsync(
    () => despesasRepository.coletasRecentes(20),
    [ciclo],
  );
  const { data: telemetria, loading: verificando } = useAsync(() => verificarFontesEmTempoReal(2026), [ciclo]);

  return (
    <div className="fg-page-container">
      {/* ===== Cabeçalho ===== */}
      <header className="fg-hero" style={{ marginBottom: 20 }}>
        <div className="fg-hero-split">
          <div>
            <span className="fg-hero__eyebrow">
              <span className="fg-hero__dot" />
              De onde vêm os dados
            </span>

            <h1 className="fg-hero__title">
              {secao.label} dos dados de <span>Guarulhos</span>
            </h1>
            <p className="fg-hero__lead">
              Tudo o que você vê neste site vem de bases públicas e oficiais. Aqui você confere cada fonte, até que data
              ela vai e como abrir o original no portal do órgão responsável.
            </p>

            <div className="fg-hero__actions">
              <button type="button" onClick={() => setCiclo((c) => c + 1)} disabled={verificando} className="fg-btn-audit-live">
                <RefreshCw size={15} className={verificando ? 'fg-spin' : ''} aria-hidden />
                <span>{verificando ? 'Verificando…' : 'Verificar agora'}</span>
              </button>
              <Link to="/decretos" className="fg-btn-audit-ghost">
                <ArrowRightLeft size={15} aria-hidden />
                <span>Entender os decretos</span>
              </Link>
            </div>
          </div>

          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Fontes oficiais</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">{telemetria ? telemetria.fontes.length : '…'}</div>
              <div className="fg-hero-kpi__sub">TCE-SP, Diário Oficial, Câmara, TSE e IBGE</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Registros na base</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">
                {telemetria ? inteiro(telemetria.totalRegistrosAuditados) : '…'}
              </div>
              <div className="fg-hero-kpi__sub">Pagamentos, receitas, decretos e mandatos</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Tempo de resposta</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">
                {telemetria ? `${telemetria.latenciaMediaMs} ms` : '…'}
              </div>
              <div className="fg-hero-kpi__sub">Média nesta consulta</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Diários validados</div>
              <div className="fg-hero-kpi__val">{QTD_DIARIOS}</div>
              <div className="fg-hero-kpi__sub">
                {QTD_DIARIOS_EXECUTIVO} Executivo · {QTD_DIARIOS_LEGISLATIVO} Legislativo · {QTD_DECRETOS} decretos
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Fontes ===== */}
      <section className="fg-section" style={{ marginTop: 0 }}>
        <div className="fg-section__head">
          <div>
            <h2 className="fg-h2">As fontes que usamos</h2>
            <p className="fg-sub">Cada cartão mostra o que a fonte traz e leva ao site oficial para você conferir.</p>
          </div>
          {telemetria && (
            <span className="fg-badge fg-badge--emerald">
              <CheckCircle2 size={13} aria-hidden />
              Consultado em {dataHoraBr(telemetria.verificadoEmIso)}
            </span>
          )}
        </div>

        <div className="fg-grid-2">
          {telemetria?.fontes.map((f) => (
            <article key={f.id} className="fg-card fg-fonte">
              <div className="fg-fonte__top">
                <span className="fg-badge fg-badge--navy">
                  <Database size={12} aria-hidden />
                  {f.sigla}
                </span>
                <span className="fg-badge fg-badge--emerald">
                  <CheckCircle2 size={12} aria-hidden />
                  Carregada · {f.latenciaMs} ms
                </span>
              </div>

              <h3 className="fg-fonte__title">{f.nomeOficial}</h3>
              <div className="fg-fonte__scope">{f.escopoAuditado}</div>
              <p className="fg-fonte__desc">{f.descricaoTecnica}</p>

              <dl className="fg-fonte__meta">
                <div>
                  <dt>Dados até</dt>
                  <dd>{dataBr(f.ultimaDataBase)}</dd>
                </div>
                <div>
                  <dt>Como obtemos</dt>
                  <dd>{f.protocoloExtracao}</dd>
                </div>
              </dl>

              <a href={f.portalHumanoUrl} target="_blank" rel="noreferrer noopener" className="fg-link-inline fg-fonte__link">
                <span>{f.portalHumanoLabel.replace(/\s*↗\s*$/, '')}</span>
                <ExternalLink size={13} aria-hidden />
              </a>
            </article>
          ))}
          {verificando && !telemetria && <Loading label="Consultando as fontes…" />}
        </div>
      </section>

      {/* ===== Atalho para decretos ===== */}
      <section className="fg-section">
        <div className="fg-card fg-fonte-cta">
          <div style={{ maxWidth: 740 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="fg-badge fg-badge--navy">
                <BookOpen size={12} aria-hidden />
                Diário Oficial de Guarulhos
              </span>
            </div>
            <h2 className="fg-h2">Quebra-cabeça completo: Diários Executivo + Legislativo, {QTD_LEIS_SANCIONADAS} leis e {QTD_DECRETOS} decretos</h2>
            <p className="fg-sub" style={{ fontSize: '0.88rem', marginTop: 4, lineHeight: 1.55 }}>
              Cruze cada edição do Diário do Executivo (validada com SHA-256) e do Diário do Legislativo (Câmara) com as
              leis sancionadas, os decretos que remanejam verbas e os pagamentos reais no TCE-SP.
            </p>
          </div>
          <Link to="/decretos?aba=quebra-cabeca" className="fg-btn fg-btn--primary fg-fonte-cta__btn">
            <FileCheck2 size={16} aria-hidden />
            <span>Abrir central de diários</span>
            <ArrowUpRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      {/* ===== Histórico de atualizações ===== */}
      <section className="fg-section">
        <div className="fg-section__head">
          <div>
            <h2 className="fg-h2">Histórico de atualizações dos pagamentos</h2>
            <p className="fg-sub">Cada linha é uma carga de dados do TCE-SP feita na nossa base.</p>
          </div>
        </div>

        {error && <ErrorBox error={error} />}
        {loadingColetas && !coletas && <Loading label="Carregando histórico…" />}

        {coletas && coletas.length > 0 && (
          <div className="fg-table-wrap">
            <div className="fg-table-scroll">
              <table className="fg-table fg-table--cards">
                <thead>
                  <tr>
                    <th>Mês de referência</th>
                    <th>Fonte</th>
                    <th>Atualizado em</th>
                    <th className="num">Registros</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {coletas.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Mês" style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {c.mes ? `${String(c.mes).padStart(2, '0')}/${c.exercicio}` : String(c.exercicio ?? '2026')}
                      </td>
                      <td data-label="Fonte">
                        <span className="fg-tag">{c.fonte || 'TCE-SP · Audesp Guarulhos'}</span>
                      </td>
                      <td data-label="Atualizado em">{dataBr(c.executado_em?.slice(0, 10))}</td>
                      <td data-label="Registros" className="num" style={{ fontFamily: 'var(--font-mono)' }}>
                        {inteiro(c.linhas)}
                      </td>
                      <td data-label="Situação">
                        <span className={`fg-badge ${c.status === 'ok' ? 'fg-badge--emerald' : 'fg-badge--amber'}`}>
                          <ShieldCheck size={12} aria-hidden />
                          {c.status === 'ok' ? 'Atualizado' : c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {coletas && coletas.length === 0 && (
          <EmptyState title="Ainda não há atualizações registradas">
            Quando uma nova carga de dados for feita, ela aparecerá aqui.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState title="Página não encontrada">
      <Link to="/" className="fg-link">
        Voltar ao início
      </Link>
    </EmptyState>
  );
}
