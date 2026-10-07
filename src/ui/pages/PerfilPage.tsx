import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { perfilService, type PerfilCompleto } from '@/services/perfilService';
import { abasRepository, type LinhaAba } from '@/repositories/abasRepository';
import { fonteRepository } from '@/repositories/adminRepositories';
import { camaraService, type CamaraProposicao, type CamaraDespesa, type CamaraOrgao, type CamaraDiscurso, type CamaraDeputadoDetalhe } from '@/services/camaraService';
import { alespService } from '@/services/alespService';
import { formatarData, formatarPeriodo, percentualPresenca, rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, FonteRef, Loading } from '../components/common';
import { PartyBadge } from '../components/PartyBadge';

type TabId =
  | 'geral' | 'propostas' | 'gastos' | 'comissoes' | 'discursos' | 'presenca'
  | 'historico' | 'mandato' | 'fontes';

const TABS: { id: TabId; label: string; icone: string }[] = [
  { id: 'geral', label: 'Visão Geral', icone: '📊' },
  { id: 'propostas', label: 'Propostas & Leis', icone: '📜' },
  { id: 'gastos', label: 'Cota & Gastos', icone: '💰' },
  { id: 'comissoes', label: 'Comissões', icone: '👥' },
  { id: 'discursos', label: 'Discursos', icone: '🎙️' },
  { id: 'presenca', label: 'Presença', icone: '📅' },
  { id: 'historico', label: 'Histórico & Eleições', icone: '⏱️' },
  { id: 'mandato', label: 'Mandatos', icone: '🏛️' },
  { id: 'fontes', label: 'Fontes Oficiais', icone: '🔗' },
];

const AJUDA: Record<TabId, string> = {
  geral: 'Resumo em números das atividades registradas durante o mandato atual.',
  propostas: 'Projetos de lei e iniciativas legislativas da base oficial da Câmara e ALESP.',
  gastos: 'Cota parlamentar oficial (combustível, passagens, divulgação, consultoria) com notas fiscais.',
  comissoes: 'Comissões temáticas permanentes e especiais onde o parlamentar atua.',
  discursos: 'Pronunciamentos e discursos oficiais proferidos no plenário.',
  presenca: 'Frequência do parlamentar nas sessões deliberativas oficiais.',
  historico: 'Histórico de eleições disputadas e evolução partidária.',
  mandato: 'Mandatos executivos e legislativos já exercidos ao longo da carreira.',
  fontes: 'Links e APIs oficiais de onde foram extraídos todos os dados deste perfil.',
};

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
            <strong>📜 Dados Abertos Oficiais da Câmara dos Deputados</strong>
            <div className="muted small">Últimas proposições e projetos apresentados pelo deputado.</div>
          </div>
          <span className="fonte-badge">API Swagger v2 · Live</span>
        </div>
        <ul className="data-rows">
          {proposicoesCamara.map((p) => (
            <li key={p.id} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">{p.siglaTipo} {p.numero}/{p.ano}</div>
                <div className="data-row__subtitle">{p.ementa}</div>
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

/** Aba de Gastos / Cota Parlamentar com API Live da Câmara */
function GastosAba({ camaraId }: { camaraId?: number }) {
  const res = useAsync(() => (camaraId ? camaraService.getDespesas(camaraId) : Promise.resolve([])), [camaraId]);

  if (!camaraId) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Cota Parlamentar</div>
        <p className="empty-box__text">
          Dados detalhados de despesas disponíveis para parlamentares federais através da API de Dados Abertos da Câmara.
        </p>
      </div>
    );
  }

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const despesas: CamaraDespesa[] = res.data ?? [];
  if (despesas.length === 0) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Nenhum gasto recente registrado</div>
        <p className="empty-box__text">Sem despesas registradas na cota do ano atual.</p>
      </div>
    );
  }

  const total = despesas.reduce((acc, d) => acc + (d.valorLiquido || 0), 0);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>💰 Cota para o Exercício da Atividade Parlamentar (CEAP)</strong>
          <div className="muted small">
            Total nas últimas {despesas.length} despesas: <strong>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
        <span className="fonte-badge">Fonte: Câmara dos Deputados</span>
      </div>

      <ul className="data-rows">
        {despesas.map((d, i) => (
          <li key={d.codDocumento || i} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{d.tipoDespesa}</div>
              <div className="data-row__subtitle">
                Fornecedor: <strong>{d.nomeFornecedor}</strong> · {formatarData(d.dataDocumento)}
              </div>
            </div>
            <div className="data-row__side">
              <span className="chip" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                R$ {d.valorLiquido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {d.urlDocumento && (
                <a
                  href={d.urlDocumento}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn--ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Nota Fiscal ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
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
            <strong>👥 Comissões & Frentes Parlamentares Oficiais</strong>
            <div className="muted small">Órgãos deliberativos e legislativos que o deputado integra.</div>
          </div>
          <span className="fonte-badge">Câmara dos Deputados</span>
        </div>
        <ul className="data-rows">
          {orgaosCamara.map((o) => (
            <li key={o.idOrgao} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">{o.nomeOrgao} ({o.siglaOrgao})</div>
                <div className="data-row__subtitle">
                  Condição: <strong>{o.titulo}</strong> · Desde {formatarData(o.dataInicio)}
                </div>
              </div>
              <div className="data-row__side">
                <span className="chip">{o.titulo}</span>
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
              {d.sumario || d.transcricao?.slice(0, 240) + '...'}
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
            <p className="muted">Dados de atuação em consolidação pelas fontes abertas oficiais.</p>
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
  const identificadores = (p?.pessoa as any)?.identificadores_externos || {};
  const camaraId: number | undefined = identificadores.camara_id;
  const alespId: string | undefined = identificadores.alesp_id;

  // Carregar detalhes ao vivo do gabinete da Câmara
  const resCamaraDetalhe = useAsync<CamaraDeputadoDetalhe | null>(
    () => (camaraId ? camaraService.getDeputado(camaraId) : Promise.resolve(null)),
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
  const gabinete = resCamaraDetalhe.data?.ultimoStatus?.gabinete;

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
          {p.pessoa.nome_politico && p.pessoa.nome_civil && p.pessoa.nome_civil !== p.pessoa.nome_politico && (
            <div className="profile-hero__civil">
              Nome civil: <strong>{p.pessoa.nome_civil}</strong>
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
              <div>🏢 Gabinete: <strong>{gabinete.predio ? `Prédio ${gabinete.predio}, Sala ${gabinete.sala}` : gabinete.nome}</strong></div>
              {gabinete.telefone && <div>📞 Tel: <strong>{gabinete.telefone}</strong></div>}
              {gabinete.email && <div>✉️ Email: <strong>{gabinete.email}</strong></div>}
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

        {tab === 'geral' && <Metricas perfil={p} />}
        {tab === 'propostas' && <PropostasAba pessoaId={p.pessoa.id} camaraId={camaraId} />}
        {tab === 'gastos' && <GastosAba camaraId={camaraId} />}
        {tab === 'comissoes' && <ComissoesAba pessoaId={p.pessoa.id} camaraId={camaraId} />}
        {tab === 'discursos' && <DiscursosAba camaraId={camaraId} />}
        {tab === 'presenca' && <Metricas perfil={p} />}
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
