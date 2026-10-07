import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pessoaRepository } from '@/repositories/pessoaRepository';
import { isSupabaseConfigured } from '@/database/client';
import { rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, Loading } from '../components/common';
import { PartyBadge } from '../components/PartyBadge';

const CARGOS = [
  { codigo: 'todos', label: 'Todos os Eleitos', icone: '🏛️', ajuda: 'Todos os 168 representantes em exercício eleitos pela população do estado de São Paulo.' },
  { codigo: 'governador', label: 'Governador', icone: '🏢', ajuda: 'Comanda o Poder Executivo do Estado de São Paulo, administra a segurança pública, saúde, educação estadual e orçamento.' },
  { codigo: 'senador', label: 'Senadores', icone: '⚖️', ajuda: 'Representam o Estado de São Paulo em Brasília no Senado Federal (3 vagas). Votam leis nacionais e fiscalizam o governo federal.' },
  { codigo: 'deputado_federal', label: 'Deputados Federais', icone: '👥', ajuda: 'Representam o povo na Câmara dos Deputados em Brasília (70 vagas). Criam leis federais e destinam emendas para os municípios.' },
  { codigo: 'deputado_estadual', label: 'Deputados Estaduais', icone: '🏛️', ajuda: 'Trabalham na ALESP (Assembleia Legislativa de SP - 94 vagas). Criam leis estaduais e fiscalizam os gastos do Governador.' },
];

function CardFoto({ nome, fotoUrl }: { nome: string; fotoUrl: string | null }) {
  const [erro, setErro] = useState(false);
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  if (fotoUrl && !erro) {
    return (
      <img
        className="politico-card__photo"
        src={fotoUrl}
        alt={`Foto oficial de ${nome}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setErro(true)}
      />
    );
  }

  return (
    <div className="politico-card__photo-fallback" aria-hidden>
      {iniciais}
    </div>
  );
}

export function PoliticosPage() {
  const [params, setParams] = useSearchParams();
  const cargoParam = params.get('cargo') || 'deputado_estadual';
  const cargoAtual = CARGOS.find((c) => c.codigo === cargoParam) ?? CARGOS[4];

  const [q, setQ] = useState('');
  const [partidoFiltro, setPartidoFiltro] = useState('TODOS');

  // Buscar todos os eleitos para extrair a lista global de partidos
  const resTodos = useAsync(
    () => (isSupabaseConfigured ? pessoaRepository.listarEleitos('todos', 'SP') : Promise.resolve([])),
    [],
  );

  const todosEleitos = resTodos.data ?? [];

  // Lista de partidos únicos para o filtro
  const partidosDisponiveis = useMemo(() => {
    const pSet = new Set<string>();
    todosEleitos.forEach((e) => {
      if (e.partido) pSet.add(e.partido.toUpperCase().trim());
    });
    return Array.from(pSet).sort();
  }, [todosEleitos]);

  // Busca do cargo selecionado
  const resCargo = useAsync(
    () => {
      if (!isSupabaseConfigured) return Promise.resolve([]);
      return pessoaRepository.listarEleitos(cargoAtual.codigo, 'SP');
    },
    [cargoAtual.codigo],
  );

  const dadosExibicao = useMemo(() => {
    const termo = q.trim().toLowerCase();
    const base = resCargo.data ?? [];

    return base.filter((e) => {
      const bateNome = !termo || e.nome.toLowerCase().includes(termo) || e.nomeCivil.toLowerCase().includes(termo);
      const batePartido = partidoFiltro === 'TODOS' || e.partido?.toUpperCase().trim() === partidoFiltro;
      return bateNome && batePartido;
    });
  }, [resCargo.data, q, partidoFiltro]);

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Representantes Eleitos de São Paulo</h1>
        <p className="page-lead">
          Conheça quem ocupa cada cargo público, quanto recebeu de votos e acompanhe sua atuação parlamentar com dados 100% oficiais e auditáveis.
        </p>
      </header>

      {/* Abas com ícones e contadores */}
      <div className="cargo-pills" role="tablist" aria-label="Selecione o cargo">
        {CARGOS.map((c) => {
          const ativo = c.codigo === cargoAtual.codigo;
          return (
            <button
              key={c.codigo}
              role="tab"
              aria-selected={ativo}
              className={`cargo-pill ${ativo ? 'is-active' : ''}`}
              onClick={() => {
                setParams({ cargo: c.codigo });
                setPartidoFiltro('TODOS');
              }}
            >
              <span>{c.icone}</span>
              <span>{c.label}</span>
              {c.codigo === 'governador' && <span className="cargo-pill__badge">1</span>}
              {c.codigo === 'senador' && <span className="cargo-pill__badge">3</span>}
              {c.codigo === 'deputado_federal' && <span className="cargo-pill__badge">70</span>}
              {c.codigo === 'deputado_estadual' && <span className="cargo-pill__badge">94</span>}
              {c.codigo === 'todos' && <span className="cargo-pill__badge">168</span>}
            </button>
          );
        })}
      </div>

      {/* Caixa didática de explicação para o cidadão */}
      <div className="cargo-helper">
        <div className="cargo-helper__icon">{cargoAtual.icone}</div>
        <div className="cargo-helper__content">
          <strong>O que faz o {cargoAtual.label}?</strong>
          <p>{cargoAtual.ajuda}</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="filter-bar">
        <div className="filter-search">
          <label htmlFor="filtro-busca" className="sr-only">Pesquisar por nome</label>
          <input
            id="filtro-busca"
            className="search__input"
            type="search"
            placeholder="🔍 Buscar por nome do político ou nome civil..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filtro-partido" className="sr-only">Filtrar por partido</label>
          <select
            id="filtro-partido"
            className="filter-party-select"
            value={partidoFiltro}
            onChange={(e) => setPartidoFiltro(e.target.value)}
          >
            <option value="TODOS">Todos os partidos</option>
            {partidosDisponiveis.map((p) => (
              <option key={p} value={p}>
                Partido: {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {resCargo.loading && <Loading />}
      {resCargo.error && <ErrorBox error={resCargo.error} />}

      {!resCargo.loading && !resCargo.error && dadosExibicao.length === 0 && (
        <EmptyState title="Nenhum representante encontrado">
          {q || partidoFiltro !== 'TODOS'
            ? 'Tente ajustar os filtros de busca ou escolher outro partido.'
            : 'Os dados entram a partir das bases oficiais da Câmara, ALESP e Senado.'}
        </EmptyState>
      )}

      {/* Grade de Cards com Fotos de Alta Resolução */}
      <div className="politicos-grid">
        {dadosExibicao.map((e) => (
          <Link key={e.mandatoId} to={`/politicos/${e.pessoaId}`} className="politico-card">
            <div className="politico-card__header">
              <CardFoto nome={e.nome} fotoUrl={e.fotoUrl} />
              <div className="politico-card__status-badge">
                <span className="politico-card__status-dot"></span>
                <span>{rotuloSituacao(e.situacao)}</span>
              </div>
            </div>

            <div className="politico-card__body">
              <div className="politico-card__party-row">
                <PartyBadge sigla={e.partido} />
                <span className="cargo-tag">{e.cargoNome ?? cargoAtual.label.replace(/s$/, '')}</span>
              </div>

              <h2 className="politico-card__name">{e.nome}</h2>
              {e.nomeCivil && e.nomeCivil !== e.nome && (
                <div className="politico-card__civil-name" title={e.nomeCivil}>
                  Nome civil: {e.nomeCivil}
                </div>
              )}

              <div className="politico-card__footer">
                <span className="muted">
                  {e.votos != null ? `${e.votos.toLocaleString('pt-BR')} votos` : 'Em exercício'}
                </span>
                <span className="politico-card__action">Ver perfil →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {dadosExibicao.length > 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid var(--border-light)' }}>
          <p className="muted small">
            Mostrando <strong>{dadosExibicao.length}</strong> de <strong>{resCargo.data?.length ?? 0}</strong> representantes · Fontes: Câmara dos Deputados, Assembleia Legislativa de SP (ALESP), Senado Federal e TSE.
          </p>
        </div>
      )}
    </>
  );
}
