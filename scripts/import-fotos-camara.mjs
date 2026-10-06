#!/usr/bin/env node
/**
 * Fotos oficiais de deputados federais (API de Dados Abertos da Câmara) -> pessoas.foto_url.
 *
 * A associação é feita por CPF (HMAC, mesmo segredo do importador TSE), nunca por nome.
 * Só preenche quem ainda não tem foto. Quem não estiver na legislatura atual da Câmara
 * (ex.: eleitos que ainda não tomaram posse) fica sem foto até a nova legislatura.
 *
 * Uso: node --env-file=.env.import scripts/import-fotos-camara.mjs [--dry-run]
 */
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const API = 'https://dadosabertos.camara.leg.br/api/v2';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CPF_HASH_SECRET } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CPF_HASH_SECRET) throw new Error('Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e CPF_HASH_SECRET.');

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const hashCpf = (cpf) => createHmac('sha256', CPF_HASH_SECRET).update(cpf.replace(/\D/g, '')).digest('hex');
const getJson = async (url) => {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

const lista = (await getJson(`${API}/deputados?itens=1000&ordem=ASC&ordenarPor=nome`)).dados;
console.log(`${lista.length} deputados na legislatura atual.`);

let fonteId = null;
if (!DRY) {
  const { data, error } = await db.from('fontes').insert({
    tipo: 'api_oficial', orgao: 'Câmara dos Deputados', titulo: 'API de Dados Abertos da Câmara — fotos de deputados',
    url: 'https://dadosabertos.camara.leg.br/swagger/api.html', data_consulta: new Date().toISOString().slice(0, 10),
    identificador_externo: 'camara.deputados.urlFoto',
  }).select('id').single();
  if (error) throw error;
  fonteId = data.id;
}

let achados = 0, atualizados = 0;
const POOL = 8;
for (let i = 0; i < lista.length; i += POOL) {
  await Promise.all(lista.slice(i, i + POOL).map(async (d) => {
    const det = (await getJson(`${API}/deputados/${d.id}`)).dados;
    const cpf = det.cpf;
    const foto = det.ultimoStatus?.urlFoto ?? d.urlFoto;
    if (!cpf || !foto) return;
    achados++;
    if (DRY) return;
    const { data, error } = await db.from('pessoas')
      .update({ foto_url: foto, foto_fonte_id: fonteId })
      .eq('cpf_hash', hashCpf(cpf)).is('foto_url', null).select('id');
    if (error) throw error;
    if (data?.length) {
      atualizados++;
      await db.from('pessoas').update({ identificadores_externos: { camara_id: d.id } }).eq('id', data[0].id);
    }
  }));
}
console.log(`${achados} com CPF+foto na API; ${atualizados} pessoas da base atualizadas.${DRY ? ' (dry-run)' : ''}`);
