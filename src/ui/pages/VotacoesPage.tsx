import { useState, useMemo } from 'react';
import { VOTACOES_IMPORTANTES, type VotacaoExplicada } from '@/domain/votacoesFamosas';
import { formatarData } from '@/domain/rules';

const CATEGORIAS = ['Todas', 'Economia', 'Saúde', 'Segurança', 'Trabalho', 'Meio Ambiente', 'Administração'];

export function VotacoesPage() {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return VOTACOES_IMPORTANTES.filter((v) => {
      const matchCat = categoriaAtiva === 'Todas' || v.categoria === categoriaAtiva;
      const matchTexto =
        !t ||
        v.tituloAmigavel.toLowerCase().includes(t) ||
        v.codigoOficial.toLowerCase().includes(t) ||
        v.resumoCidadao.toLowerCase().includes(t);
      return matchCat && matchTexto;
    });
  }, [busca, categoriaAtiva]);

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Decisões e Votações em Pauta</h1>
        <p className="page-lead">
          Entenda as principais votações do Congresso Nacional e da Assembleia de São Paulo explicadas em linguagem simples, sem jargões jurídicos ou viés partidário.
        </p>
      </header>

      {/* Categorias */}
      <div className="cargo-pills" role="tablist" aria-label="Filtrar por tema">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={categoriaAtiva === cat}
            className={`cargo-pill ${categoriaAtiva === cat ? 'is-active' : ''}`}
            onClick={() => setCategoriaAtiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="filter-bar">
        <div className="filter-search">
          <label htmlFor="busca-votacao" className="sr-only">Buscar votação</label>
          <input
            id="busca-votacao"
            className="search__input"
            type="search"
            placeholder="Buscar por projeto (ex: Reforma Tributária, Sabesp, Enfermagem)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Decisões */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtradas.map((v: VotacaoExplicada) => (
          <article
            key={v.id}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
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

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              {v.tituloAmigavel}
            </h2>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '16px' }}>
              {v.resumoCidadao}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '14px', fontSize: '0.85rem' }}>
              <span className="muted">
                Órgão: <strong>{v.orgao}</strong> · Votação em {formatarData(v.dataVotacao)}
              </span>
              <a
                href={v.fonteOficialUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn--ghost"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                Ver Ata de Votação Oficial ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
