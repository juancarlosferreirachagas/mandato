import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pessoaRepository } from '@/repositories/pessoaRepository';
import { isSupabaseConfigured } from '@/database/client';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';
import type { PessoaResumo } from '@/domain/types';
import { PartyBadge } from '../components/PartyBadge';

function Busca() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const res = useAsync<PessoaResumo[]>(
    () => (isSupabaseConfigured ? pessoaRepository.search(debounced) : Promise.resolve([])),
    [debounced],
  );

  return (
    <div className="search-box">
      <div className="search-input-wrapper">
        <label htmlFor="busca-home" className="sr-only">Pesquisar político</label>
        <input
          id="busca-home"
          className="search__input"
          type="search"
          placeholder="🔍 Digite o nome de qualquer deputado, senador ou governador..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {debounced.trim().length >= 2 && (
        <div className="search__results">
          {res.loading && <Loading />}
          {res.error && <ErrorBox error={res.error} />}
          {res.data && res.data.length === 0 && !res.loading && (
            <p className="muted" style={{ padding: '12px', textAlign: 'center' }}>
              Nenhum representante encontrado para “{debounced}”.
            </p>
          )}
          {res.data?.map((p) => (
            <Link key={p.id} to={`/politicos/${p.id}`} className="search__item">
              <div style={{ flex: 1 }}>
                <strong>{p.nome_politico ?? p.nome_civil}</strong>
                <div className="muted small">
                  {[p.mandato_atual?.cargo?.nome, 'SP'].filter(Boolean).join(' · ')}
                </div>
              </div>
              {p.mandato_atual?.partido?.sigla && (
                <PartyBadge sigla={p.mandato_atual.partido.sigla} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const CARGOS_ESTADO = [
  {
    codigo: 'deputado_estadual',
    titulo: 'Deputados Estaduais',
    vagas: 94,
    orgao: 'ALESP (Assembleia Legislativa de SP)',
    icone: '🏛️',
    descricao: 'Elaboram e votam as leis estaduais de São Paulo, além de fiscalizar os atos e gastos do Governador.',
  },
  {
    codigo: 'deputado_federal',
    titulo: 'Deputados Federais',
    vagas: 70,
    orgao: 'Câmara dos Deputados (Brasília)',
    icone: '👥',
    descricao: 'Representam os cidadãos paulistas na criação de leis nacionais e na destinação do orçamento da União.',
  },
  {
    codigo: 'senador',
    titulo: 'Senadores da República',
    vagas: 3,
    orgao: 'Senado Federal (Brasília)',
    icone: '⚖️',
    descricao: 'Representam o Estado de São Paulo na câmara alta, aprovam indicações de autoridades e julgam processos constitucionais.',
  },
  {
    codigo: 'governador',
    titulo: 'Governador do Estado',
    vagas: 1,
    orgao: 'Palácio dos Bandeirantes',
    icone: '🏢',
    descricao: 'Chefe do Executivo estadual, responsável por gerenciar a Polícia, saúde pública estadual, transporte e educação.',
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__badge">
          <span>🏛️</span>
          <span>Observatório Cívico Factual</span>
        </div>
        <h1 className="hero__title">MANDATO</h1>
        <p className="hero__slogan">
          Acompanhe quem foi eleito por São Paulo. Veja propostas, votações, presença e histórico político com transparência e neutralidade.
        </p>
        <Busca />
      </section>

      <section className="uf" aria-labelledby="sp-title">
        <div className="section-header">
          <div>
            <h2 id="sp-title" className="section-title">São Paulo — Representantes em Exercício</h2>
            <p className="section-subtitle">
              Estrutura política oficial com 168 parlamentares e governantes eleitos.
            </p>
          </div>
          <Link to="/politicos" className="btn btn--ghost">
            Ver todos os 168 eleitos →
          </Link>
        </div>

        <div className="uf__grid">
          {CARGOS_ESTADO.map((c) => (
            <Link key={c.codigo} to={`/politicos?cargo=${c.codigo}`} className="stat-card">
              <div>
                <div className="stat-card__top">
                  <span className="stat-card__icon">{c.icone}</span>
                  <span className="stat-card__count">{c.vagas}</span>
                </div>
                <h3 className="stat-card__title">{c.titulo}</h3>
                <div className="muted small" style={{ marginBottom: '8px', fontWeight: 600 }}>
                  {c.orgao}
                </div>
                <p className="stat-card__desc">{c.descricao}</p>
              </div>
              <div className="stat-card__link">
                Acessar os {c.vagas} eleitos →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '48px', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
          💡 Princípio Fundamental: Fato → Fonte → Interpretação
        </h3>
        <p style={{ color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '16px' }}>
          O <strong>MANDATO</strong> é uma plataforma estritamente apartidária e neutra. Todos os registros de mandatos, votações, propostas, presença e gastos são obtidos diretamente das APIs abertas e arquivos oficiais da <strong>Câmara dos Deputados</strong>, <strong>Assembleia Legislativa de São Paulo (ALESP)</strong>, <strong>Senado Federal</strong> e <strong>Tribunal Superior Eleitoral (TSE)</strong>.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span className="fonte-badge">✓ Dados 100% Auditáveis</span>
          <span className="fonte-badge">✓ Fotos Oficiais dos Parlamentos</span>
          <span className="fonte-badge">✓ Sem Opinião Editorial ou Classificação</span>
        </div>
      </section>
    </>
  );
}
