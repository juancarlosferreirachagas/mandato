import { auditoriaRepository } from '@/repositories/adminRepositories';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, FonteRef, Loading } from '../components/common';

export function AuditoriaAdmin() {
  const res = useAsync(() => auditoriaRepository.recentes(), []);
  return (
    <>
      <h1 className="page-title">Auditoria</h1>
      {res.loading && <Loading />}
      {res.error && <ErrorBox error={res.error} />}
      {res.data && res.data.length === 0 && <EmptyState title="Nenhuma alteração registrada" />}
      <ul className="rows">
        {res.data?.map((l) => (
          <li key={l.id} className="row">
            <div className="row__main">
              <div className="row__title">{l.operacao} · {l.tabela}</div>
              <div className="muted small">
                {new Date(l.alterado_em).toLocaleString('pt-BR')} · usuário {l.usuario_id?.slice(0, 8) ?? 'sistema'} · registro {l.registro_id?.slice(0, 8) ?? '—'}
              </div>
              <details>
                <summary>Anterior / novo</summary>
                <pre className="diff">{JSON.stringify({ anterior: l.valor_anterior, novo: l.valor_novo }, null, 2)}</pre>
              </details>
            </div>
            <div className="row__side"><FonteRef id={l.fonte_id} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
