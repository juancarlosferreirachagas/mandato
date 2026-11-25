import { useState } from 'react';
import { fonteRepository } from '@/repositories/adminRepositories';
import { formatarData } from '@/domain/rules';
import type { Fonte } from '@/domain/types';
import { LINKS_OFICIAIS } from '@/domain/plataforma';

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

function urlHumanaFonte(url?: string | null): { href: string; label: string } | null {
  if (!url) return null;
  if (
    url.includes('/api/json/') ||
    url.includes('transparencia.tce.sp.gov.br/api') ||
    url.includes('transparencia.tce.sp.gov.br/painel')
  ) {
    return {
      href: LINKS_OFICIAIS.tce,
      label: 'Abrir Painel Visual do TCE-SP (Guarulhos) ↗',
    };
  }
  if (url.includes('dadosabertos.camara.leg.br/api')) {
    return {
      href: 'https://www.camara.leg.br/deputados/quem-sao',
      label: 'Abrir Portal da Câmara ↗',
    };
  }
  if (url.includes('#doc-')) {
    return {
      href: LINKS_OFICIAIS.camaraAtividade,
      label: 'Portal Legislativo da Câmara de Guarulhos ↗',
    };
  }
  return {
    href: url,
    label: 'Abrir portal oficial da fonte ↗',
  };
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

  const linkHumano = urlHumanaFonte(fonte?.url);

  return (
    <span className="fonte-ref">
      <button type="button" className="chip chip--link" onClick={toggle} aria-expanded={open}>
        ✓ Fonte Oficial
      </button>
      {open && (
        <span className="fonte-ref__pop" role="note">
          {err ? err : !fonte ? 'Carregando…' : (
            <>
              <strong>{fonte.titulo}</strong><br />
              {fonte.orgao && <>{fonte.orgao} · </>}{fonte.tipo}<br />
              Publicada: {formatarData(fonte.data_publicacao)} · Auditada: {formatarData(fonte.data_consulta)}<br />
              {linkHumano && (
                <a href={linkHumano.href} target="_blank" rel="noreferrer noopener" style={{ fontWeight: 700, display: 'inline-block', marginTop: 4 }}>
                  {linkHumano.label}
                </a>
              )}
            </>
          )}
        </span>
      )}
    </span>
  );
}
