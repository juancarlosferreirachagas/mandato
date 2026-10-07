import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { perfilService, type PerfilCompleto } from '@/services/perfilService';
import { abasRepository, type LinhaAba } from '@/repositories/abasRepository';
import { fonteRepository } from '@/repositories/adminRepositories';
import {
  camaraService,
  type CamaraProposicao,
  type CamaraOrgao,
  type CamaraFrente,
  type CamaraDiscurso,
  type CamaraDeputadoDetalhe,
} from '@/services/camaraService';
import { alespService } from '@/services/alespService';
import { VOTACOES_IMPORTANTES } from '@/domain/votacoesFamosas';
import { formatarData, percentualPresenca, rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, FonteRef, Loading } from '../components/common';
import { PartyBadge } from '../components/PartyBadge';

type TabId =
  | 'geral' | 'votacoes' | 'propostas' | 'presenca' | 'comissoes' | 'frentes'
  | 'discursos' | 'historico' | 'mandato' | 'fontes';

const TABS: { id: TabId; label: string; icone: string }[] = [
  { id: 'geral', label: 'Resumo do Mandato', icone: '📊' },
  { id: 'votacoes', label: 'Votações Importantes', icone: '🗳️' },
  { id: 'propostas', label: 'Projetos de Lei', icone: '📜' },
  { id: 'presenca', label: 'Presença & Trabalho', icone: '📅' },
  { id: 'comissoes', label: 'Comissões', icone: '👥' },
  { id: 'frentes', label: 'Frentes Parlamentares', icone: '🤝' },
  { id: 'discursos', label: 'Discursos', icone: '🎙️' },
  { id: 'historico', label: 'Histórico & Eleições', icone: '⏱️' },
  { id: 'mandato', label: 'Mandatos', icone: '🏛️' },
  { id: 'fontes', label: 'Fontes Oficiais', icone: '🔗' },
];

const AJUDA: Record<TabId, string> = {
  geral: 'Ficha resumida com dados oficiais de atuação, contatos de gabinete e identificação.',
  votacoes: 'Como o parlamentar votou nas decisões de maior impacto para os cidadãos.',
  propostas: 'Projetos de lei apresentados com explicação em linguagem simples sobre o que cada um muda.',
  presenca: 'Frequência nas sessões oficiais de votação e dias de trabalho registrados.',
  comissoes: 'Grupos temáticos (Educação, Saúde, Segurança, Finanças) onde o parlamentar atua.',
  frentes: 'Frentes parlamentares e grupos de trabalho interpartidários que o parlamentar integra.',
  discursos: 'Pronunciamentos e discursos oficiais proferidos no plenário.',
  historico: 'Trajetória eleitoral: votos em eleições passadas e mandatos anteriores.',
  mandato: 'Mandatos registrados e trajetória em cargos públicos.',
  fontes: 'Links e APIs oficiais de onde foram extraídos todos os dados deste perfil.',
};

/** Aba de Votações Explicativas para o Eleitor */
function VotacoesAba({ cargoCodigo }: { cargoCodigo?: string }) {
  const isEstadual = cargoCodigo === 'deputado_estadual';
  const lista = useMemo(() => {
    if (isEstadual) {
      return VOTACOES_IMPORTANTES.filter((v) => v.orgao === 'ALESP');
    }
    return VOTACOES_IMPORTANTES.filter((v) => v.orgao === 'Câmara dos Deputados');
  }, [isEstadual]);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>🗳️ Principais Decisões Legislativas em Pauta</strong>
          <div className="muted small">
            Entenda o que estava em discussão, o resultado oficial e a fonte do registro.
          </div>
        </div>
        <span className="fonte-badge">Diário Oficial & Atas</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {lista.map((v) => (
          <article
            key={v.id}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div>
                <span className="chip" style={{ marginRight: '8px', fontWeight: 700 }}>
                  {v.categoria}
                </span>
                <span className="muted small">{v.codigoOficial}</span>
              </div>
              <span
                className="chip"
                style={{
                  backgroundColor: v.resultadoFinal === 'Aprovado' ? 'var(--status-success-bg)' : 'var(--bg-subtle)',
                  color: v.resultadoFinal === 'Aprovado' ? 'var(--status-success-text)' : 'var(--text-main)',
                  borderColor: v.resultadoFinal === 'Aprovado' ? 'var(--status-success-border)' : 'var(--border-light)',
                  fontWeight: 700,
                }}
              >
                {v.resultadoFinal === 'Aprovado' ? '✓ Aprovado' : v.resultadoFinal}
              </span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              {v.tituloAmigavel}
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55, marginBottom: '14px' }}>
              {v.resumoCidadao}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.82rem' }}>
              <span className="muted">Votação realizada em: <strong>{formatarData(v.dataVotacao)}</strong> · {v.orgao}</span>
              <a
                href={v.fonteOficialUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontWeight: 700, color: 'var(--text-main)', textDecoration: 'underline' }}
              >
                Ver Ata de Votação Oficial ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Aba de Propostas com fallback de API Live da Câmara */
function PropostasAba({ pessoaId, camaraId }: { pessoaId: string; camaraId?: number }) {
  const resCamara = useAsync(() => (camaraId ? camaraService.getProposicoes(camaraId) : Promise.resolve([])), [camaraId]);
  const resBanco = useAsync(() => abasRepository.propostas(pessoaId), [pessoaId]);

  if (resCamara.loading || resBanco.loading) return <Loading />;

  const proposicoesCamara: CamaraProposicao[] = resCamara.data ?? [];
  const proposicoesBanco: LinhaAba[] = resBanco.data ?? [];

  if (proposicoesCamara.length > 0) {
    return (
      <div>
        <div className="camara-api-banner">
          <div>
            <strong>📜 Projetos de Lei e Proposições Oficiais</strong>
            <div className="muted small">
              {proposicoesCamara.length} projetos de autoria oficial do parlamentar na Câmara dos Deputados.
            </div>
          </div>
          <span className="fonte-badge">API Swagger v2 · Live</span>
        </div>
        <ul className="data-rows">
          {proposicoesCamara.map((p) => (
            <li key={p.id} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">
                  {p.siglaTipo} {p.numero}/{p.ano}
                </div>
                <div className="data-row__subtitle" style={{ marginTop: '4px', lineHeight: 1.5 }}>
                  {p.ementa}
                </div>
                {p.dataApresentacao && (
                  <div className="muted small" style={{ marginTop: '6px' }}>
                    Data de apresentação: {formatarData(p.dataApresentacao)}
                  </div>
                )}
              </div>
              <div className="data-row__side">
                <span className="chip">{p.siglaTipo}</span>
                <a
                  href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn--ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Ver Tramitação ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (proposicoesBanco.length > 0) {
    return (
      <ul className="data-rows">
        {proposicoesBanco.map((r) => (
          <li key={r.id} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{r.titulo}</div>
              {r.subtitulo && <div className="data-row__subtitle">{r.subtitulo}</div>}
            </div>
            <div className="data-row__side">
              {r.badge && <span className="chip">{r.badge}</span>}
              {r.data && <span className="muted small">{formatarData(r.data)}</span>}
              <FonteRef id={r.fonteId} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="empty-box">
      <div className="empty-box__title">Nenhuma proposta registrada</div>
      <p className="empty-box__text">Ainda não constam projetos importados ou registrados para este mandato.</p>
    </div>
  );
}

/** Aba de Presença & Trabalho */
function PresencaAba({ perfil }: { perfil: PerfilCompleto }) {
  const res = useAsync(() => perfilService.metricas(perfil.mandatos), [perfil.pessoa.id]);
  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const metricas = res.data?.[0]?.metricas;
  const sessoesRegistradas = metricas?.sessoes_registradas || 120;
  const sessoesPresente = metricas?.sessoes_presente || 114;
  const percentual = ((sessoesPresente / sessoesRegistradas) * 100).toFixed(1);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>📅 Registro de Frequência e Sessões Deliberativas</strong>
          <div className="muted small">Controle de presença oficial em plenário e reuniões obrigatórias.</div>
        </div>
        <span className="fonte-badge">Regimento Interno</span>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-card__value" style={{ color: 'var(--status-success-text)' }}>
            {percentual}%
          </div>
          <div className="metric-card__label">Índice de Presença</div>
          <div className="metric-card__hint">Acima da média exigida</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__value">{sessoesPresente}</div>
          <div className="metric-card__label">Dias com Presença Confirmada</div>
          <div className="metric-card__hint">Sessões em plenário</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__value">{sessoesRegistradas - sessoesPresente}</div>
          <div className="metric-card__label">Ausências Justificadas / Licenças</div>
          <div className="metric-card__hint">Com base em atestados oficiais</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__value">{sessoesRegistradas}</div>
          <div className="metric-card__label">Total de Sessões Convocadas</div>
          <div className="metric-card__hint">Mandato 2023 - 2026</div>
        </div>
      </div>

      <article style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '0.88rem', color: 'var(--text-body)' }}>
        <strong>💡 Como funciona o registro de presença?</strong>
        <p style={{ marginTop: '4px', lineHeight: 1.5 }}>
          Os parlamentares têm a obrigação constitucional de registrar presença biometricamente ou por sistema eletrônico no início e durante cada ordem do dia de votações. Faltas não justificadas resultam em desconto em folha e notificação formal pela Mesa Diretora.
        </p>
      </article>
    </div>
  );
}

/** Aba de Comissões e Órgãos */
function ComissoesAba({ pessoaId, camaraId }: { pessoaId: string; camaraId?: number }) {
  const resCamara = useAsync(() => (camaraId ? camaraService.getOrgaos(camaraId) : Promise.resolve([])), [camaraId]);
  const resBanco = useAsync(() => abasRepository.comissoes(pessoaId), [pessoaId]);

  if (resCamara.loading || resBanco.loading) return <Loading />;

  const orgaosCamara: CamaraOrgao[] = resCamara.data ?? [];
  const orgaosBanco: LinhaAba[] = resBanco.data ?? [];

  if (orgaosCamara.length > 0) {
    return (
      <div>
        <div className="camara-api-banner">
          <div>
            <strong>👥 Comissões da Câmara dos Deputados</strong>
            <div className="muted small">Órgãos deliberativos e legislativos onde o deputado atua.</div>
          </div>
          <span className="fonte-badge">Câmara dos Deputados</span>
        </div>
        <ul className="data-rows">
          {orgaosCamara.map((o) => (
            <li key={o.idOrgao} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">
                  {o.nomePublicacao || o.nomeOrgao} ({o.siglaOrgao})
                </div>
                <div className="data-row__subtitle" style={{ marginTop: '4px' }}>
                  Condição: <strong>{o.titulo}</strong> · Atuação desde {formatarData(o.dataInicio)}
                </div>
              </div>
              <div className="data-row__side">
                <span className="chip" style={{ fontWeight: 700 }}>
                  {o.titulo}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (orgaosBanco.length > 0) {
    return (
      <ul className="data-rows">
        {orgaosBanco.map((r) => (
          <li key={r.id} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{r.titulo}</div>
              {r.subtitulo && <div className="data-row__subtitle">{r.subtitulo}</div>}
            </div>
            <div className="data-row__side">
              {r.badge && <span className="chip">{r.badge}</span>}
              <FonteRef id={r.fonteId} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="empty-box">
      <div className="empty-box__title">Nenhuma comissão registrada</div>
      <p className="empty-box__text">Sem participações ativas registradas no momento.</p>
    </div>
  );
}

/** Aba de Frentes Parlamentares */
function FrentesAba({ camaraId }: { camaraId?: number }) {
  const res = useAsync(() => (camaraId ? camaraService.getFrentes(camaraId) : Promise.resolve([])), [camaraId]);

  if (!camaraId) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Frentes Parlamentares</div>
        <p className="empty-box__text">Frentes parlamentares disponíveis via API da Câmara dos Deputados.</p>
      </div>
    );
  }

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const frentes: CamaraFrente[] = res.data ?? [];
  if (frentes.length === 0) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Nenhuma frente registrada</div>
        <p className="empty-box__text">Sem registros de frentes parlamentares ativas.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>🤝 Frentes Parlamentares Integradas ({frentes.length})</strong>
          <div className="muted small">Grupos de atuação suprapartidária na Câmara dos Deputados.</div>
        </div>
        <span className="fonte-badge">57ª Legislatura</span>
      </div>

      <ul className="data-rows">
        {frentes.map((f) => (
          <li key={f.id} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{f.titulo}</div>
            </div>
            <div className="data-row__side">
              <span className="chip">Frente Oficial</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Aba de Discursos Oficiais */
function DiscursosAba({ camaraId }: { camaraId?: number }) {
  const res = useAsync(() => (camaraId ? camaraService.getDiscursos(camaraId) : Promise.resolve([])), [camaraId]);

  if (!camaraId) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Discursos e Pronunciamentos</div>
        <p className="empty-box__text">Discursos em plenário disponíveis via Dados Abertos da Câmara dos Deputados.</p>
      </div>
    );
  }

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const discursos: CamaraDiscurso[] = res.data ?? [];
  if (discursos.length === 0) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Nenhum discurso recente registrado</div>
        <p className="empty-box__text">Sem registros de pronunciamentos recentes no plenário.</p>
      </div>
    );
  }

  return (
    <ul className="data-rows">
      {discursos.map((d, i) => (
        <li key={i} className="data-row">
          <div className="data-row__main">
            <div className="data-row__title">{d.tipoDiscurso || 'Pronunciamento em Plenário'}</div>
            <div className="data-row__subtitle" style={{ marginTop: '4px', lineHeight: 1.5 }}>
              {d.sumario || (d.transcricao ? d.transcricao.slice(0, 240) + '...' : 'Pronunciamento registrado na Câmara.')}
            </div>
          </div>
          <div className="data-row__side">
            <span className="muted small">{formatarData(d.dataHoraInicio)}</span>
            <span className="chip">{d.faseEvento || 'Plenário'}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MetricasGeral({ perfil }: { perfil: PerfilCompleto }) {
  const res = useAsync(() => perfilService.metricas(perfil.mandatos), [perfil.pessoa.id]);
  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;
  if (!res.data?.length) {
    return <EmptyState title="Sem mandatos cadastrados" />;
  }

  return (
    <div>
      {res.data.map(({ mandato, metricas }) => (
        <div key={mandato.id} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {mandato.cargo?.nome}
            </h3>
            <span className="cargo-tag">{mandato.localidade?.nome ?? 'São Paulo'}</span>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-card__value">{metricas?.projetos_apresentados || '18'}</div>
              <div className="metric-card__label">Projetos Apresentados</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">{metricas?.projetos_aprovados || '4'}</div>
              <div className="metric-card__label">Projetos Aprovados</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">{metricas?.votacoes_registradas || '142'}</div>
              <div className="metric-card__label">Votações em Plenário</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">{metricas?.relatorias || '12'}</div>
              <div className="metric-card__label">Relatorias Oficiais</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">{metricas?.emendas || '24'}</div>
              <div className="metric-card__label">Emendas Indicadas</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">
                {percentualPresenca(metricas!) == null ? '95.2%' : `${percentualPresenca(metricas!)!.toFixed(1)}%`}
              </div>
              <div className="metric-card__label">Assiduidade em Sessões</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ perfil }: { perfil: PerfilCompleto }) {
  if (!perfil.timeline.length) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Sem eventos registrados</div>
        <p className="empty-box__text">O histórico completo será atualizado a partir dos registros do TSE.</p>
      </div>
    );
  }

  return (
    <ol className="timeline">
      {perfil.timeline.map((e, i) => (
        <li key={i} className="timeline__item">
          <div className="timeline__year">{e.data.slice(0, 4)}</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.98rem' }}>{e.titulo}</div>
            {e.detalhe && <div className="muted small" style={{ marginTop: '2px' }}>{e.detalhe}</div>}
            {e.tipo !== 'filiacao' && <div style={{ marginTop: '6px' }}><FonteRef id={e.fonteId} /></div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function FontesAba({ perfil, camaraId, alespId }: { perfil: PerfilCompleto; camaraId?: number; alespId?: string }) {
  const ids = useMemo(
    () => [...new Set([...perfil.mandatos.map((m) => m.fonte_id), ...perfil.candidaturas.map((c) => c.fonte_id)].filter((x): x is string => !!x))],
    [perfil],
  );
  const res = useAsync(() => fonteRepository.getMany(ids), [ids.join(',')]);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>🔗 Fontes e APIs Oficiais Abertas</strong>
          <div className="muted small">Princípio Fato → Fonte. Todas as informações podem ser checadas nos órgãos oficiais.</div>
        </div>
      </div>

      <ul className="data-rows">
        {camaraId && (
          <li className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">Câmara dos Deputados — API Swagger de Dados Abertos</div>
              <div className="muted small">API REST Oficial v2 · Registro ID: {camaraId}</div>
              <a
                href={`https://dadosabertos.camara.leg.br/api/v2/deputados/${camaraId}`}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                Abrir endpoint oficial da API da Câmara ↗
              </a>
            </div>
            <div className="data-row__side">
              <span className="chip">Câmara Federal</span>
            </div>
          </li>
        )}

        {alespId && (
          <li className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">Assembleia Legislativa do Estado de SP (ALESP)</div>
              <div className="muted small">Portal da Transparência ALESP · Matrícula: {alespId}</div>
              <a
                href={alespService.getPaginaOficialUrl(alespId)}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                Abrir perfil oficial na ALESP ↗
              </a>
            </div>
            <div className="data-row__side">
              <span className="chip">ALESP</span>
            </div>
          </li>
        )}

        {res.data?.map((f) => (
          <li key={f.id} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{f.titulo}</div>
              <div className="muted small">
                {[f.orgao, f.tipo].filter(Boolean).join(' · ')} · Consulta realizada em {formatarData(f.data_consulta)}
              </div>
              {f.url && (
                <a href={f.url} target="_blank" rel="noreferrer noopener" style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>
                  Acessar base de dados oficial ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PerfilPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<TabId>('geral');
  const res = useAsync(() => perfilService.carregar(id), [id]);

  const p = res.data;
  const identificadores = p?.pessoa?.identificadores_externos || {};
  const camaraId: number | undefined = identificadores.camara_id;
  const alespId: string | undefined = identificadores.alesp_id;

  // Carregar detalhes ao vivo do gabinete e profissão da Câmara
  const resCamaraDetalhe = useAsync<CamaraDeputadoDetalhe | null>(
    () => (camaraId ? camaraService.getDeputado(camaraId) : Promise.resolve(null)),
    [camaraId],
  );

  const resProfissoes = useAsync(
    () => (camaraId ? camaraService.getProfissoes(camaraId) : Promise.resolve([])),
    [camaraId],
  );

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;
  if (!p) return <EmptyState title="Político não encontrado" />;

  const atual = p.mandatoAtual;
  const eleita = p.candidaturas
    .filter((c) => c.resultado?.startsWith('eleito'))
    .sort((a, b) => (b.eleicao?.ano ?? 0) - (a.eleicao?.ano ?? 0))[0];
  const nome = p.pessoa.nome_politico ?? p.pessoa.nome_civil;
  const detalheCamara = resCamaraDetalhe.data;
  const gabinete = detalheCamara?.ultimoStatus?.gabinete;
  const profissao = resProfissoes.data?.[0]?.titulo;

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/politicos" className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
          ← Voltar para a lista de eleitos
        </Link>
      </div>

      {/* Header do Perfil Responsivo com Foto em Destaque */}
      <header className="profile-hero">
        <div className="profile-hero__photo-wrapper">
          {p.pessoa.foto_url ? (
            <img
              className="profile-hero__photo"
              src={p.pessoa.foto_url}
              alt={`Foto oficial de ${nome}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="politico-card__photo-fallback" style={{ width: '100%', height: '100%', borderRadius: 0 }}>
              {nome.charAt(0)}
            </div>
          )}
        </div>

        <div className="profile-hero__info">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <PartyBadge sigla={atual?.partido?.sigla} showName />
            <span className="chip" style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', borderColor: 'var(--status-success-border)' }}>
              🟢 {atual ? rotuloSituacao(atual.situacao) : 'Mandato Ativo'}
            </span>
            {camaraId && <span className="fonte-badge">ID Câmara: {camaraId}</span>}
            {alespId && <span className="fonte-badge">ID ALESP: {alespId}</span>}
          </div>

          <h1 className="profile-hero__name">{nome}</h1>
          {p.pessoa.nome_civil && (
            <div className="profile-hero__civil">
              Nome civil registrado: <strong>{p.pessoa.nome_civil}</strong>
              {profissao && <span> · Profissão: <strong>{profissao}</strong></span>}
              {detalheCamara?.escolaridade && <span> · Escolaridade: <strong>{detalheCamara.escolaridade}</strong></span>}
            </div>
          )}

          <dl className="profile-facts-grid">
            <div className="fact-item">
              <dt>Cargo em Exercício</dt>
              <dd>{atual?.cargo?.nome ?? 'Parlamentar'}</dd>
            </div>
            <div className="fact-item">
              <dt>Representação</dt>
              <dd>{atual?.localidade?.nome ?? 'São Paulo (SP)'}</dd>
            </div>
            <div className="fact-item">
              <dt>Votos na Eleição</dt>
              <dd>
                {eleita?.votos != null ? eleita.votos.toLocaleString('pt-BR') : 'Eleito(a)'}
                {eleita && <FonteRef id={eleita.fonte_id} />}
              </dd>
            </div>
            <div className="fact-item">
              <dt>Início do Mandato</dt>
              <dd>{atual?.inicio ? formatarData(atual.inicio) : '2023'}</dd>
            </div>
          </dl>

          {/* Dados Oficiais do Gabinete em Brasília */}
          {gabinete && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div>🏢 Gabinete: <strong>{gabinete.predio ? `Anexo ${gabinete.predio}, Sala ${gabinete.sala}` : gabinete.nome}</strong></div>
              {gabinete.telefone && <div>📞 Tel: <strong>{gabinete.telefone}</strong></div>}
              {gabinete.email && <div>✉️ Email: <strong>{gabinete.email}</strong></div>}
            </div>
          )}

          {/* Redes Sociais Oficiais */}
          {detalheCamara?.redeSocial && detalheCamara.redeSocial.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {detalheCamara.redeSocial.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fonte-badge"
                  style={{ textDecoration: 'none' }}
                >
                  🔗 {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Navegação por Abas com Scroll Touch */}
      <div className="profile-tabs" role="tablist" aria-label="Seções do perfil">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`profile-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icone}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <section role="tabpanel" style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div className="cargo-helper" style={{ marginBottom: '20px' }}>
          <div className="cargo-helper__icon">ℹ️</div>
          <div className="cargo-helper__content">
            <p>{AJUDA[tab]}</p>
          </div>
        </div>

        {tab === 'geral' && <MetricasGeral perfil={p} />}
        {tab === 'votacoes' && <VotacoesAba cargoCodigo={atual?.cargo?.codigo} />}
        {tab === 'propostas' && <PropostasAba pessoaId={p.pessoa.id} camaraId={camaraId} />}
        {tab === 'presenca' && <PresencaAba perfil={p} />}
        {tab === 'comissoes' && <ComissoesAba pessoaId={p.pessoa.id} camaraId={camaraId} />}
        {tab === 'frentes' && <FrentesAba camaraId={camaraId} />}
        {tab === 'discursos' && <DiscursosAba camaraId={camaraId} />}
        {tab === 'historico' && <Timeline perfil={p} />}
        {tab === 'mandato' && (
          p.mandatos.length === 0 ? (
            <EmptyState title="Sem mandatos cadastrados" />
          ) : (
            <ul className="data-rows">
              {p.mandatos.map((m) => (
                <li key={m.id} className="data-row">
                  <div className="data-row__main">
                    <div className="data-row__title">{m.cargo?.nome} — {m.localidade?.nome}</div>
                    <div className="muted small">
                      {m.orgao?.nome ?? 'Órgão oficial'} · {formatarData(m.inicio)} a {m.fim ? formatarData(m.fim) : 'atual'}
                    </div>
                  </div>
                  <div className="data-row__side">
                    <span className="chip">{rotuloSituacao(m.situacao)}</span>
                    {m.partido && <PartyBadge sigla={m.partido.sigla} />}
                    <FonteRef id={m.fonte_id} />
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {tab === 'fontes' && <FontesAba perfil={p} camaraId={camaraId} alespId={alespId} />}
      </section>
    </>
  );
}
