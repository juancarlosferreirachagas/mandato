import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pessoaRepository } from '@/repositories/pessoaRepository';
import { territorioRepository } from '@/repositories/territorioRepository';
import { isSupabaseConfigured } from '@/database/client';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, Loading } from '../components/common';
import type { PessoaResumo } from '@/domain/types';

const ORDEM = ['governador', 'senador', 'deputado_federal', 'deputado_estadual'];

function Busca() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const res = useAsync<PessoaResumo[]>(() => (isSupabaseConfigured ? pessoaRepository.search(debounced) : Promise.resolve([])), [debounced]);

  return (
    <div className="search">
      <label htmlFor="busca" className="sr-only">Pesquisar político</label>
      <input id="busca" className="search__input" type="search" placeholder="Pesquisar político" value={q} onChange={(e) => setQ(e.target.value)} />
      {debounced.trim().length >= 2 && (
        <div className="search__results">
          {res.loading && <Loading />}
          {res.error && <ErrorBox error={res.error} />}
          {res.data && res.data.length === 0 && !res.loading && <p className="muted">Nenhum resultado para “{debounced}”.</p>}
          {res.data?.map((p) => (
            <Link key={p.id} to={`/politicos/${p.id}`} className="search__item">
              <strong>{p.nome_politico ?? p.nome_civil}</strong>
              <span className="muted">{[p.mandato_atual?.cargo?.nome, p.mandato_atual?.partido?.sigla].filter(Boolean).join(' · ')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AreaEstado({ sigla, nome }: { sigla: string; nome: string }) {
  const vagas = useAsync(() => territorioRepository.vagasPorUf(sigla), [sigla]);
  const cadastrados = useAsync(() => territorioRepository.mandatosCadastradosPorUf(sigla), [sigla]);

  const ordenadas = [...(vagas.data ?? [])].sort((a, b) => ORDEM.indexOf(a.cargo_codigo) - ORDEM.indexOf(b.cargo_codigo));

  return (
    <section className="uf" aria-labelledby="uf-title">
      <h2 id="uf-title" className="uf__title">{nome.toUpperCase()}</h2>
      {(vagas.loading || cadastrados.loading) && <Loading />}
      {vagas.error && <ErrorBox error={vagas.error} />}
      {vagas.data && ordenadas.length === 0 && (
        <EmptyState title="Estrutura ainda não carregada">Rode as migrations e o seed (<code>supabase db reset</code>).</EmptyState>
      )}
      <div className="uf__grid">
        {ordenadas.map((v) => {
          const n = cadastrados.data?.[v.cargo_codigo] ?? 0;
          return (
            <Link key={v.cargo_codigo} to={`/politicos?cargo=${v.cargo_codigo}`} className="stat">
              <div className="stat__value">{v.quantidade}</div>
              <div className="stat__label">{v.cargo_nome}{v.quantidade > 1 ? 's' : ''}</div>
              <div className="stat__meta">{n > 0 ? `Ver os ${n} eleitos →` : 'Dados ainda não carregados'}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <section className="hero">
        <h1 className="hero__title">MANDATO</h1>
        <p className="hero__slogan">Acompanhe quem foi eleito.<br />Veja o que fez.</p>
        <Busca />
      </section>
      {isSupabaseConfigured && <AreaEstado sigla="SP" nome="São Paulo" />}
    </>
  );
}
