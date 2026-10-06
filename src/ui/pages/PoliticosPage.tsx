import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pessoaRepository } from '@/repositories/pessoaRepository';
import { isSupabaseConfigured } from '@/database/client';
import { rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, Loading } from '../components/common';

const CARGOS = [
  { codigo: 'governador', label: 'Governador', ajuda: 'Comanda o governo do estado.' },
  { codigo: 'senador', label: 'Senadores', ajuda: 'Representam o estado no Senado Federal e votam leis do país.' },
  { codigo: 'deputado_federal', label: 'Deputados Federais', ajuda: 'Votam leis do país na Câmara dos Deputados, em Brasília.' },
  { codigo: 'deputado_estadual', label: 'Deputados Estaduais', ajuda: 'Votam leis do estado e fiscalizam o governo estadual na Assembleia Legislativa.' },
];

export function Avatar({ nome, fotoUrl, size = 72 }: { nome: string; fotoUrl: string | null; size?: number }) {
  const [erro, setErro] = useState(false);
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  if (fotoUrl && !erro) {
    return <img className="avatar" style={{ width: size, height: size }} src={fotoUrl} alt={`Foto de ${nome}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setErro(true)} />;
  }
  return <div className="avatar avatar--empty" style={{ width: size, height: size }} aria-hidden>{iniciais}</div>;
}

export function PoliticosPage() {
  const [params, setParams] = useSearchParams();
  const cargo = CARGOS.find((c) => c.codigo === params.get('cargo')) ?? CARGOS[2];
  const [q, setQ] = useState('');
  const res = useAsync(() => (isSupabaseConfigured ? pessoaRepository.listarEleitos(cargo.codigo, 'SP') : Promise.resolve([])), [cargo.codigo]);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (res.data ?? []).filter((e) => !t || e.nome.toLowerCase().includes(t) || e.nomeCivil.toLowerCase().includes(t) || e.partido?.toLowerCase() === t);
  }, [res.data, q]);

  return (
    <>
      <h1 className="page-title">Quem foi eleito em São Paulo</h1>
      <p className="muted">Escolha o cargo. Toque em um político para ver quem ele é e o que fez.</p>

      <div className="pills" role="tablist" aria-label="Cargo">
        {CARGOS.map((c) => (
          <button key={c.codigo} role="tab" aria-selected={c.codigo === cargo.codigo} className={c.codigo === cargo.codigo ? 'pill is-active' : 'pill'} onClick={() => setParams({ cargo: c.codigo })}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="hint">ℹ️ {cargo.ajuda}</p>

      <label htmlFor="filtro" className="sr-only">Filtrar por nome ou partido</label>
      <input id="filtro" className="search__input search__input--sm" type="search" placeholder="Filtrar por nome ou sigla do partido" value={q} onChange={(e) => setQ(e.target.value)} />

      {res.loading && <Loading />}
      {res.error && <ErrorBox error={res.error} />}
      {!res.loading && !res.error && (res.data?.length ?? 0) === 0 && (
        <EmptyState title="Ainda não há eleitos carregados para este cargo">Os dados entram a partir do arquivo oficial do TSE. Veja o README (importação).</EmptyState>
      )}

      <div className="cards">
        {lista.map((e) => (
          <Link key={e.mandatoId} to={`/politicos/${e.pessoaId}`} className="pcard">
            <Avatar nome={e.nome} fotoUrl={e.fotoUrl} />
            <div className="pcard__body">
              <div className="pcard__name">{e.nome}</div>
              <div className="pcard__meta">
                {e.partido && <span className="chip">{e.partido}</span>}
                <span className="muted small">{rotuloSituacao(e.situacao)}</span>
              </div>
              {e.votos != null && <div className="muted small">{e.votos.toLocaleString('pt-BR')} votos</div>}
            </div>
          </Link>
        ))}
      </div>
      {lista.length > 0 && <p className="muted small">{lista.length} resultado{lista.length === 1 ? '' : 's'} · Fonte: TSE. Fotos: dados abertos oficiais, quando disponíveis.</p>}
    </>
  );
}
