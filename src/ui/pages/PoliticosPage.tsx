import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Building2, User } from 'lucide-react';
import { pessoaRepository } from '@/repositories/pessoaRepository';
import { isSupabaseConfigured } from '@/database/client';
import { rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, Loading } from '../components/common';
import { PartyBadge } from '../components/PartyBadge';

const CARGOS = [
  { codigo: 'vereador', label: 'Vereadores', icone: <User size={18} />, ajuda: 'Os 34 vereadores da 19ª Legislatura (2025–2028) da Câmara Municipal de Guarulhos. Votam leis municipais, aprovam o orçamento e fiscalizam os gastos da Prefeitura.' },
  { codigo: 'prefeito', label: 'Prefeito', icone: <Building2 size={18} />, ajuda: 'Comanda o Poder Executivo Municipal (Prefeitura de Guarulhos), gerenciando secretarias, obras, saúde, educação e execução do orçamento.' },
  { codigo: 'vice_prefeito', label: 'Vice-Prefeito', icone: <Building2 size={18} />, ajuda: 'Substitui o Prefeito em ausências ou impedimentos e auxilia na articulação administrativa do Executivo Municipal.' },
  { codigo: 'todos', label: 'Todos os Mandatos', icone: <Users size={18} />, ajuda: 'Todos os representantes municipais eleitos e em exercício em Guarulhos.' },
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
  const cargoParam = params.get('cargo');

  const [q, setQ] = useState('');
  const [partidoFiltro, setPartidoFiltro] = useState('TODOS');

  // Buscar todos os eleitos para extrair a lista global de partidos
  const resTodos = useAsync(
    () => (isSupabaseConfigured ? pessoaRepository.listarEleitos('todos', 'GRU') : Promise.resolve([])),
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

  const contasPorCargo = useMemo(() => {
    const counts: Record<string, number> = { todos: todosEleitos.length };
    todosEleitos.forEach(e => {
      if (e.cargoCodigo) {
        counts[e.cargoCodigo] = (counts[e.cargoCodigo] || 0) + 1;
      }
    });
    return counts;
  }, [todosEleitos]);

  const cargosDisponiveis = useMemo(() => {
    return CARGOS.filter(c => contasPorCargo[c.codigo] > 0);
  }, [contasPorCargo]);

  const cargoAtual = useMemo(() => {
    const valid = cargosDisponiveis.find(c => c.codigo === cargoParam);
    if (valid) return valid;
    const preferido = cargosDisponiveis.find(c => c.codigo === 'vereador');
    return preferido || cargosDisponiveis[0] || CARGOS[0];
  }, [cargosDisponiveis, cargoParam]);

  // Busca do cargo selecionado
  const resCargo = useAsync(
    () => {
      if (!isSupabaseConfigured) return Promise.resolve([]);
      return pessoaRepository.listarEleitos(cargoAtual.codigo, 'GRU');
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
      <section className="fg-hero" style={{ marginBottom: 14, padding: '18px 20px' }}>
        <div className="fg-hero-split">
          <div>
            <span className="fg-hero__eyebrow">
              <span className="fg-hero__dot" />
              CRACHÁ CÍVICO OFICIAL · TSE & CÂMARA MUNICIPAL
            </span>
            <h1 className="fg-hero__title" style={{ marginTop: 8, marginBottom: 6 }}>
              Prefeito, Vice & <span>34 Vereadores</span> de Guarulhos
            </h1>
            <p className="fg-hero__lead">
              Toque no crachá de qualquer representante para ver biografia completa, votação oficial no TSE, comissões
              e todos os projetos de lei, requerimentos de fiscalização e pedidos de bairro.
            </p>
          </div>

          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Câmara Municipal</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">34</div>
              <div className="fg-hero-kpi__sub">Vereadores em exercício</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Poder Executivo</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">2</div>
              <div className="fg-hero-kpi__sub">Prefeito & Vice-Prefeito</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Proposições</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">334</div>
              <div className="fg-hero-kpi__sub">Projetos e fiscalizações</div>
            </div>
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Partidos na Casa</div>
              <div className="fg-hero-kpi__val">{partidosDisponiveis.length || 16}</div>
              <div className="fg-hero-kpi__sub">19ª Legislatura (25–28)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Barra unificada: Abas de Cargo + Busca + Filtro de Partido */}
      <div
        className="fg-card"
        style={{
          marginBottom: 14,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div className="fg-pills" role="tablist" aria-label="Selecione o cargo">
            {cargosDisponiveis.map((c) => {
              const ativo = c.codigo === cargoAtual.codigo;
              return (
                <button
                  key={c.codigo}
                  type="button"
                  role="tab"
                  aria-selected={ativo}
                  className={`fg-pill ${ativo ? 'is-active' : ''}`}
                  onClick={() => {
                    setParams({ cargo: c.codigo });
                    setPartidoFiltro('TODOS');
                  }}
                >
                  <span>{c.icone}</span>
                  <span>{c.label}</span>
                  <span
                    style={{
                      background: ativo ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                      padding: '1px 6px',
                      borderRadius: 999,
                      fontSize: '0.7rem',
                    }}
                  >
                    {contasPorCargo[c.codigo]}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: '1 1 320px', justifyContent: 'flex-end' }}>
            <input
              id="filtro-busca"
              className="fg-input"
              type="search"
              placeholder="🔍 Buscar vereador, prefeito ou nome civil..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: '1 1 200px', maxWidth: 340 }}
            />
            <select
              id="filtro-partido"
              className="fg-select"
              value={partidoFiltro}
              onChange={(e) => setPartidoFiltro(e.target.value)}
              style={{ flex: '0 1 190px' }}
            >
              <option value="TODOS">Todos os partidos ({partidosDisponiveis.length})</option>
              {partidosDisponiveis.map((p) => (
                <option key={p} value={p}>
                  Partido: {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '7px 10px', borderRadius: 8 }}>
          <strong style={{ color: '#0f172a' }}>💡 O que faz ({cargoAtual.label}):</strong> {cargoAtual.ajuda}
        </div>
      </div>

      {resCargo.loading && <Loading />}
      {resCargo.error && <ErrorBox error={resCargo.error} />}

      {!resCargo.loading && !resCargo.error && dadosExibicao.length === 0 && (
        <EmptyState title="Nenhum representante encontrado">
          {q || partidoFiltro !== 'TODOS'
            ? 'Tente ajustar os filtros de busca ou escolher outro partido.'
            : 'Os dados entram a partir das bases oficiais da Câmara Municipal de Guarulhos e do TSE.'}
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
                <span>{e.condicao === 'suplente_exercicio' ? 'Suplente em exercício' : rotuloSituacao(e.situacao)}</span>
              </div>
            </div>

            <div className="politico-card__body">
              <div className="politico-card__party-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                <PartyBadge sigla={e.partido} />
                <span className="cargo-tag">{e.cargoNome ?? cargoAtual.label.replace(/s$/, '')}</span>
                {e.mesaDiretora && (
                  <span className="cargo-tag" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>
                    {e.mesaDiretora}
                  </span>
                )}
              </div>

              <h2 className="politico-card__name">{e.nome}</h2>
              {e.nomeCivil && e.nomeCivil.toLowerCase() !== e.nome.toLowerCase() && (
                <div className="politico-card__civil-name" title={e.nomeCivil}>
                  Nome civil: {e.nomeCivil}
                </div>
              )}

              <div className="politico-card__footer">
                <span className="muted">
                  {e.votos != null && e.votos > 0
                    ? `${e.votos.toLocaleString('pt-BR')} votos`
                    : rotuloSituacao(e.situacao)}
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
            Mostrando <strong>{dadosExibicao.length}</strong> de <strong>{resCargo.data?.length ?? 0}</strong> representantes · Fontes: Câmara Municipal de Guarulhos (19ª Legislatura 2025–2028) e Tribunal Superior Eleitoral (TSE).
          </p>
        </div>
      )}
    </>
  );
}
