import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { perfilService, type PerfilCompleto } from '@/services/perfilService';
import { abasRepository, type LinhaAba } from '@/repositories/abasRepository';
import { fonteRepository } from '@/repositories/adminRepositories';
import { formatarData, formatarPeriodo, percentualPresenca, rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, FonteRef, Loading } from '../components/common';
import { PartyBadge } from '../components/PartyBadge';

type TabId =
  | 'geral' | 'historico' | 'mandato' | 'propostas' | 'votacoes' | 'presenca'
  | 'emendas' | 'comissoes' | 'promessas' | 'processos' | 'fontes';

const TABS: { id: TabId; label: string; icone: string }[] = [
  { id: 'geral', label: 'Visão Geral', icone: '📊' },
  { id: 'propostas', label: 'Propostas de Lei', icone: '📜' },
  { id: 'votacoes', label: 'Como Votou', icone: '🗳️' },
  { id: 'presenca', label: 'Presença em Sessões', icone: '📅' },
  { id: 'emendas', label: 'Emendas do Orçamento', icone: '💰' },
  { id: 'comissoes', label: 'Comissões', icone: '👥' },
  { id: 'historico', label: 'Trajetória & Eleições', icone: '⏱️' },
  { id: 'mandato', label: 'Cargos Anteriores', icone: '🏛️' },
  { id: 'fontes', label: 'Fontes Oficiais', icone: '🔗' },
];

const AJUDA: Record<TabId, string> = {
  geral: 'Resumo em números das atividades registradas durante o mandato atual.',
  propostas: 'Projetos de lei e iniciativas legislativas escritas ou assinadas pelo parlamentar.',
  votacoes: 'Posicionamento oficial registrado nas votações de plenário: Sim, Não, Abstenção ou Ausência.',
  presenca: 'Frequência do parlamentar nas sessões deliberativas oficiais e ausências justificadas.',
  emendas: 'Recursos públicos do orçamento que o parlamentar indicou para obras, saúde e cidades.',
  comissoes: 'Grupos temáticos (ex: Educação, Saúde, Constituição e Justiça) em que o parlamentar atua.',
  historico: 'Histórico de eleições disputadas e evolução partidária.',
  mandato: 'Mandatos executivos e legislativos já exercidos ao longo da carreira.',
  promessas: 'Propostas e compromissos registrados em campanhas eleitorais.',
  processos: 'Processos judiciais públicos. Nota: a existência de processo não implica condenação.',
  fontes: 'Links e órgãos oficiais responsáveis pelos dados exibidos neste perfil.',
};

const LISTAS: Partial<Record<TabId, (id: string) => Promise<LinhaAba[]>>> = {
  propostas: abasRepository.propostas,
  votacoes: abasRepository.votacoes,
  presenca: abasRepository.presencas,
  emendas: abasRepository.emendas,
  comissoes: abasRepository.comissoes,
  promessas: abasRepository.promessas,
  processos: abasRepository.processos,
};

function ListaAba({ pessoaId, tab }: { pessoaId: string; tab: TabId }) {
  const fn = LISTAS[tab]!;
  const res = useAsync(() => fn(pessoaId), [pessoaId, tab]);
  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;
  if (!res.data?.length) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Nenhum registro encontrado</div>
        <p className="empty-box__text">
          Ainda não constam dados adicionais importados para esta seção na base oficial deste mandato.
        </p>
      </div>
    );
  }
  return (
    <ul className="data-rows">
      {res.data.map((r) => (
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

function Metricas({ perfil }: { perfil: PerfilCompleto }) {
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

          {!metricas ? (
            <p className="muted">Dados de atuação em consolidação pelas fontes abertas.</p>
          ) : (
            <>
              <p className="muted small" style={{ marginBottom: '16px' }}>
                Período analisado: {formatarPeriodo(metricas.periodo_inicio, metricas.periodo_fim)} · Cálculos auditáveis a partir de dados oficiais.
              </p>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-card__value">{metricas.projetos_apresentados}</div>
                  <div className="metric-card__label">Projetos Apresentados</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card__value">{metricas.projetos_aprovados}</div>
                  <div className="metric-card__label">Projetos Aprovados</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card__value">{metricas.votacoes_registradas}</div>
                  <div className="metric-card__label">Votações no Plenário</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card__value">{metricas.relatorias}</div>
                  <div className="metric-card__label">Relatorias de Projetos</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card__value">{metricas.emendas}</div>
                  <div className="metric-card__label">Emendas Indicadas</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card__value">
                    {percentualPresenca(metricas) == null ? '—' : `${percentualPresenca(metricas)!.toFixed(1)}%`}
                  </div>
                  <div className="metric-card__label">Índice de Presença</div>
                  <div className="metric-card__hint">
                    {metricas.sessoes_presente} de {metricas.sessoes_registradas} sessões
                  </div>
                </div>
              </div>
            </>
          )}
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

function FontesAba({ perfil }: { perfil: PerfilCompleto }) {
  const ids = useMemo(
    () => [...new Set([...perfil.mandatos.map((m) => m.fonte_id), ...perfil.candidaturas.map((c) => c.fonte_id)].filter((x): x is string => !!x))],
    [perfil],
  );
  const res = useAsync(() => fonteRepository.getMany(ids), [ids.join(',')]);
  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;
  if (!res.data?.length) return <EmptyState title="Nenhuma fonte vinculada" />;

  return (
    <ul className="data-rows">
      {res.data.map((f) => (
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
  );
}

export function PerfilPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<TabId>('geral');
  const res = useAsync(() => perfilService.carregar(id), [id]);

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;
  if (!res.data) return <EmptyState title="Político não encontrado" />;

  const p = res.data;
  const atual = p.mandatoAtual;
  const eleita = p.candidaturas
    .filter((c) => c.resultado?.startsWith('eleito'))
    .sort((a, b) => (b.eleicao?.ano ?? 0) - (a.eleicao?.ano ?? 0))[0];
  const nome = p.pessoa.nome_politico ?? p.pessoa.nome_civil;

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/politicos" className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
          ← Voltar para a lista de eleitos
        </Link>
      </div>

      {/* Header do Perfil com Foto em Destaque */}
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
          </div>

          <h1 className="profile-hero__name">{nome}</h1>
          {p.pessoa.nome_politico && p.pessoa.nome_civil && p.pessoa.nome_civil !== p.pessoa.nome_politico && (
            <div className="profile-hero__civil">
              Nome civil registrado: <strong>{p.pessoa.nome_civil}</strong>
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
        </div>
      </header>

      {/* Navegação por Abas */}
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

      <section role="tabpanel" style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div className="cargo-helper" style={{ marginBottom: '20px' }}>
          <div className="cargo-helper__icon">ℹ️</div>
          <div className="cargo-helper__content">
            <p>{AJUDA[tab]}</p>
          </div>
        </div>

        {tab === 'geral' && <Metricas perfil={p} />}
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
        {LISTAS[tab] && <ListaAba pessoaId={p.pessoa.id} tab={tab} />}
        {tab === 'fontes' && <FontesAba perfil={p} />}
      </section>
    </>
  );
}
