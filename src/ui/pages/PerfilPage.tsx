import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { perfilService, type PerfilCompleto } from '@/services/perfilService';
import { abasRepository, type LinhaAba } from '@/repositories/abasRepository';
import { fonteRepository } from '@/repositories/adminRepositories';
import { formatarData, formatarPeriodo, percentualPresenca, rotuloResultado, rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, FonteRef, Loading } from '../components/common';

type TabId =
  | 'geral' | 'historico' | 'mandato' | 'propostas' | 'votacoes' | 'presenca'
  | 'emendas' | 'comissoes' | 'promessas' | 'processos' | 'fontes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'geral', label: 'Visão geral' },
  { id: 'historico', label: 'Histórico' },
  { id: 'mandato', label: 'Mandato' },
  { id: 'propostas', label: 'Propostas' },
  { id: 'votacoes', label: 'Votações' },
  { id: 'presenca', label: 'Presença' },
  { id: 'emendas', label: 'Emendas' },
  { id: 'comissoes', label: 'Comissões' },
  { id: 'promessas', label: 'Promessas' },
  { id: 'processos', label: 'Processos' },
  { id: 'fontes', label: 'Fontes' },
];

/** Explicações para quem não conhece o vocabulário político. */
const AJUDA: Record<TabId, string> = {
  geral: 'Resumo em números do que foi registrado, sempre com o período analisado.',
  historico: 'A trajetória: eleições disputadas, cargos ocupados e partidos.',
  mandato: 'Os cargos que a pessoa exerceu ou vai exercer, com datas.',
  propostas: 'Projetos de lei e outras propostas que a pessoa escreveu ou assinou junto com outros.',
  votacoes: 'Como a pessoa votou nas decisões do plenário: sim, não, abstenção ou ausência.',
  presenca: 'Se a pessoa compareceu às sessões, e as ausências justificadas.',
  emendas: 'Alterações em projetos ou indicações de dinheiro do orçamento público.',
  comissoes: 'Grupos de trabalho que analisam temas específicos antes da votação geral.',
  promessas: 'O que foi prometido em campanha e o que as fontes mostram até agora.',
  processos: 'Processos na Justiça. Ter um processo não significa condenação; veja sempre a situação atual.',
  fontes: 'De onde vem cada informação desta página.',
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
  if (!res.data?.length) return <EmptyState title="Nenhum registro">Ainda não há dados importados de fonte oficial para esta seção.</EmptyState>;
  return (
    <ul className="rows">
      {res.data.map((r) => (
        <li key={r.id} className="row">
          <div className="row__main">
            <div className="row__title">{r.titulo}</div>
            {r.subtitulo && <div className="muted">{r.subtitulo}</div>}
          </div>
          <div className="row__side">
            {r.badge && <span className="chip">{r.badge}</span>}
            {r.data && <span className="muted">{formatarData(r.data)}</span>}
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
  if (!res.data?.length) return <EmptyState title="Sem mandatos cadastrados" />;
  return (
    <>
      {res.data.map(({ mandato, metricas }) => (
        <section key={mandato.id} className="card">
          <h3>{mandato.cargo?.nome} <span className="muted">· {mandato.localidade?.sigla}</span></h3>
          {!metricas ? <p className="muted">Sem métricas.</p> : (
            <>
              <p className="muted">Período analisado: {formatarPeriodo(metricas.periodo_inicio, metricas.periodo_fim)} — calculado a partir dos registros armazenados.</p>
              <div className="metrics">
                <Metric label="Projetos apresentados" v={metricas.projetos_apresentados} />
                <Metric label="Projetos aprovados" v={metricas.projetos_aprovados} />
                <Metric label="Votações registradas" v={metricas.votacoes_registradas} />
                <Metric label="Relatorias" v={metricas.relatorias} />
                <Metric label="Emendas" v={metricas.emendas} />
                <Metric
                  label="Presença"
                  v={percentualPresenca(metricas) == null ? '—' : `${percentualPresenca(metricas)!.toFixed(1)}%`}
                  hint={`${metricas.sessoes_presente} de ${metricas.sessoes_registradas} sessões registradas`}
                />
              </div>
            </>
          )}
        </section>
      ))}
    </>
  );
}

function Metric({ label, v, hint }: { label: string; v: number | string; hint?: string }) {
  return (
    <div className="metric">
      <div className="metric__value">{v}</div>
      <div className="metric__label">{label}</div>
      {hint && <div className="metric__hint">{hint}</div>}
    </div>
  );
}

function Timeline({ perfil }: { perfil: PerfilCompleto }) {
  if (!perfil.timeline.length) return <EmptyState title="Sem eventos" />;
  return (
    <ol className="timeline">
      {perfil.timeline.map((e, i) => (
        <li key={i} className={`timeline__item timeline__item--${e.tipo}`}>
          <div className="timeline__year">{e.data.slice(0, 4)}</div>
          <div>
            <div className="row__title">{e.titulo}</div>
            {e.detalhe && <div className="muted">{e.detalhe}</div>}
            {e.tipo !== 'filiacao' && <FonteRef id={e.fonteId} />}
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
    <ul className="rows">
      {res.data.map((f) => (
        <li key={f.id} className="row">
          <div className="row__main">
            <div className="row__title">{f.titulo}</div>
            <div className="muted">{[f.orgao, f.tipo].filter(Boolean).join(' · ')} · consultada {formatarData(f.data_consulta)}</div>
            {f.url && <a href={f.url} target="_blank" rel="noreferrer noopener">{f.url}</a>}
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
      <header className="profile">
        {p.pessoa.foto_url
          ? <img className="profile__photo" src={p.pessoa.foto_url} alt={`Foto de ${nome}`} />
          : <div className="profile__photo profile__photo--empty" aria-hidden>{nome.charAt(0)}</div>}
        <div>
          <h1 className="page-title">{nome}</h1>
          {p.pessoa.nome_politico && <div className="muted">Nome civil: {p.pessoa.nome_civil}</div>}
          <dl className="facts">
            <div><dt>Partido</dt><dd>{atual?.partido?.sigla ?? '—'}</dd></div>
            <div><dt>Cargo atual</dt><dd>{atual?.cargo?.nome ?? '—'}</dd></div>
            <div><dt>Estado/município</dt><dd>{atual?.localidade?.nome ?? '—'}</dd></div>
            <div>
              <dt>Votos{eleita?.eleicao ? ` (${eleita.eleicao.ano})` : ''}</dt>
              <dd>{eleita?.votos != null ? eleita.votos.toLocaleString('pt-BR') : '—'} {eleita && <FonteRef id={eleita.fonte_id} />}</dd>
            </div>
            <div><dt>Situação</dt><dd>{atual ? rotuloSituacao(atual.situacao) : '—'}</dd></div>
          </dl>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Seções do perfil">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'tab is-active' : 'tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <section className="tabpanel" role="tabpanel">
        <p className="hint">ℹ️ {AJUDA[tab]}</p>
        {tab === 'geral' && <Metricas perfil={p} />}
        {tab === 'historico' && <Timeline perfil={p} />}
        {tab === 'mandato' && (
          p.mandatos.length === 0 ? <EmptyState title="Sem mandatos cadastrados" /> : (
            <ul className="rows">
              {p.mandatos.map((m) => (
                <li key={m.id} className="row">
                  <div className="row__main">
                    <div className="row__title">{m.cargo?.nome} — {m.localidade?.nome}</div>
                    <div className="muted">{m.orgao?.nome ?? 'Órgão não informado'} · {formatarData(m.inicio)} a {m.fim ? formatarData(m.fim) : 'atual'}</div>
                  </div>
                  <div className="row__side">
                    <span className="chip">{rotuloSituacao(m.situacao)}</span>
                    {m.partido && <span className="chip">{m.partido.sigla}</span>}
                    <FonteRef id={m.fonte_id} />
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {LISTAS[tab] && <ListaAba pessoaId={p.pessoa.id} tab={tab} />}
        {tab === 'fontes' && <FontesAba perfil={p} />}
        {tab === 'historico' && p.candidaturas.length > 0 && (
          <p className="muted small">Resultados: {p.candidaturas.map((c) => `${c.eleicao?.ano}: ${rotuloResultado(c.resultado)}`).join(' · ')}</p>
        )}
      </section>
    </>
  );
}
