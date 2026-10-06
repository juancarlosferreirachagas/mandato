import { useState, type FormEvent } from 'react';
import { fonteRepository } from '@/repositories/adminRepositories';
import { fonteService, TIPOS_FONTE } from '@/services/fonteService';
import { formatarData } from '@/domain/rules';
import type { NovaFonte } from '@/domain/types';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';

const VAZIA: NovaFonte = {
  tipo: 'dados_abertos', orgao: '', titulo: '', url: '', data_publicacao: null,
  data_consulta: new Date().toISOString().slice(0, 10), identificador_externo: '', observacoes: '',
};

const nul = (s: string | null) => (s && s.trim() ? s.trim() : null);

export function FontesAdmin() {
  const list = useAsync(() => fonteRepository.list(), []);
  const [form, setForm] = useState<NovaFonte>(VAZIA);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof NovaFonte>(k: K, v: NovaFonte[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fonteService.cadastrar({
        ...form,
        orgao: nul(form.orgao), url: nul(form.url), identificador_externo: nul(form.identificador_externo),
        observacoes: nul(form.observacoes), data_publicacao: nul(form.data_publicacao), data_consulta: nul(form.data_consulta),
      });
      setForm(VAZIA);
      list.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Fontes</h1>
      <form className="card form" onSubmit={submit}>
        <div className="form__grid">
          <label>Tipo
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>{TIPOS_FONTE.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label>Órgão<input value={form.orgao ?? ''} onChange={(e) => set('orgao', e.target.value)} placeholder="TSE, Câmara dos Deputados…" /></label>
          <label className="span2">Título<input required value={form.titulo} onChange={(e) => set('titulo', e.target.value)} /></label>
          <label className="span2">URL<input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://" /></label>
          <label>Data da publicação<input type="date" value={form.data_publicacao ?? ''} onChange={(e) => set('data_publicacao', e.target.value)} /></label>
          <label>Data da consulta<input type="date" value={form.data_consulta ?? ''} onChange={(e) => set('data_consulta', e.target.value)} /></label>
          <label>Identificador externo<input value={form.identificador_externo ?? ''} onChange={(e) => set('identificador_externo', e.target.value)} /></label>
          <label className="span2">Observações<textarea rows={2} value={form.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} /></label>
        </div>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Cadastrar fonte'}</button>
      </form>

      <h2>Cadastradas</h2>
      {list.loading && <Loading />}
      {list.error && <ErrorBox error={list.error} />}
      <ul className="rows">
        {list.data?.map((f) => (
          <li key={f.id} className="row">
            <div className="row__main">
              <div className="row__title">{f.titulo}</div>
              <div className="muted">{[f.orgao, f.tipo].filter(Boolean).join(' · ')} · consultada {formatarData(f.data_consulta)}</div>
              {f.url && <a href={f.url} target="_blank" rel="noreferrer noopener">{f.url}</a>}
            </div>
            <div className="row__side"><code className="small">{f.id.slice(0, 8)}</code></div>
          </li>
        ))}
      </ul>
    </>
  );
}
