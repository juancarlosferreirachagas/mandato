import { useState } from 'react';
import { fonteRepository } from '@/repositories/adminRepositories';
import { formatarData } from '@/domain/rules';
import type { Fonte } from '@/domain/types';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return <p className="muted" role="status">{label}</p>;
}

export function ErrorBox({ error }: { error: Error }) {
  return <div className="alert alert--error" role="alert">{error.message}</div>;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Mostra a fonte de um fato sob demanda. Sem fonte, deixa isso explícito. */
export function FonteRef({ id }: { id?: string | null }) {
  const [fonte, setFonte] = useState<Fonte | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!id) return <span className="chip chip--warn" title="Este registro ainda não aponta para uma fonte">sem fonte</span>;

  const toggle = async () => {
    setOpen((o) => !o);
    if (!fonte && !err) {
      try {
        setFonte((await fonteRepository.getMany([id]))[0] ?? null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar fonte');
      }
    }
  };

  return (
    <span className="fonte-ref">
      <button type="button" className="chip chip--link" onClick={toggle} aria-expanded={open}>fonte</button>
      {open && (
        <span className="fonte-ref__pop" role="note">
          {err ? err : !fonte ? 'Carregando…' : (
            <>
              <strong>{fonte.titulo}</strong><br />
              {fonte.orgao && <>{fonte.orgao} · </>}{fonte.tipo}<br />
              Publicada: {formatarData(fonte.data_publicacao)} · Consultada: {formatarData(fonte.data_consulta)}<br />
              {fonte.url && <a href={fonte.url} target="_blank" rel="noreferrer noopener">{fonte.url}</a>}
            </>
          )}
        </span>
      )}
    </span>
  );
}
