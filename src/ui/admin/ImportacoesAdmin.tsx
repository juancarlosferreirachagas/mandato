import { useState, type FormEvent } from 'react';
import { fonteRepository } from '@/repositories/adminRepositories';
import { importService } from '@/services/importService';
import { formatarData } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';

export function ImportacoesAdmin() {
  const fontes = useAsync(() => fonteRepository.list(), []);
  const lotes = useAsync(() => importService.lotes(), []);
  const providers = importService.providers();

  const [providerId, setProviderId] = useState(providers[0]?.id ?? '');
  const [fonteId, setFonteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [texto, setTexto] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await importService.stage(providerId, texto, fonteId, descricao);
      setMsg({ ok: true, text: `Lote criado em staging com ${r.total} itens. Aplicação às tabelas finais: próxima etapa.` });
      setTexto('');
      lotes.reload();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro na importação' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Importações</h1>
      <p className="muted">Os dados entram em <strong>staging</strong> e só serão aplicados após revisão. Provedores oficiais (TSE, Câmara, Senado, ALESP) ainda não foram implementados.</p>
      <form className="card form" onSubmit={submit}>
        <div className="form__grid">
          <label>Provedor
            <select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.descricao}</option>)}
            </select>
          </label>
          <label>Fonte (obrigatória)
            <select required value={fonteId} onChange={(e) => setFonteId(e.target.value)}>
              <option value="">Selecione…</option>
              {fontes.data?.map((f) => <option key={f.id} value={f.id}>{f.titulo}</option>)}
            </select>
          </label>
          <label className="span2">Descrição do lote<input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
          <label className="span2">Conteúdo (JSON)<textarea rows={8} required value={texto} onChange={(e) => setTexto(e.target.value)} placeholder='[{"campo":"valor"}]' /></label>
        </div>
        {msg && <div className={msg.ok ? 'alert alert--ok' : 'alert alert--error'} role="status">{msg.text}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Enviando…' : 'Enviar para staging'}</button>
      </form>

      <h2>Lotes</h2>
      {lotes.loading && <Loading />}
      {lotes.error && <ErrorBox error={lotes.error} />}
      <ul className="rows">
        {lotes.data?.map((l: any) => (
          <li key={l.id} className="row">
            <div className="row__main">
              <div className="row__title">{l.provedor}</div>
              <div className="muted">{l.descricao ?? '—'} · {l.total_itens} itens · {formatarData(l.created_at)}</div>
            </div>
            <div className="row__side"><span className="chip">{l.status}</span></div>
          </li>
        ))}
      </ul>
    </>
  );
}
