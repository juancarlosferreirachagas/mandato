#!/usr/bin/env node
/**
 * Script para fazer upload em massa de fotos de políticos para o Supabase Storage.
 *
 * Como usar:
 * 1. Crie uma pasta local (ex: ./fotos_novas) e coloque as imagens lá.
 *    Nomeie os arquivos com o NOME EXATO do político no banco, ou pelo NOME DE URNA.
 *    Ex: "Tarcísio de Freitas.jpg", "Eduardo Suplicy.png".
 * 2. Execute o script:
 *    node -r dotenv/config scripts/upload-fotos-storage.mjs ./fotos_novas
 *
 * O que ele faz:
 * - Lê as imagens.
 * - Faz upload para o bucket `fotos_politicos` no Supabase.
 * - Atualiza a tabela `pessoas` preenchendo o `foto_url` com a URL pública gerada.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error('Erro: Você precisa informar uma pasta válida com as fotos.');
  console.log('Uso: node -r dotenv/config scripts/upload-fotos-storage.mjs ./caminho/para/pasta');
  process.exit(1);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Erro: Variáveis VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas.');
  console.error('Lembre-se de colocar a service_role_key no seu .env.import e rodar com --env-file=.env.import se estiver no node 20+');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'fotos_politicos';

async function run() {
  const arquivos = fs.readdirSync(dir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  console.log(`Encontradas ${arquivos.length} imagens na pasta ${dir}.`);

  for (const arquivo of arquivos) {
    const nomeBase = path.parse(arquivo).name; // "Tarcísio de Freitas"
    const filePath = path.join(dir, arquivo);
    const extensao = path.extname(arquivo);
    const contentType = extensao.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    
    console.log(`\nProcessando: ${nomeBase}...`);

    // 1. Achar o político no banco pelo Nome Político (Urna) ou Nome Civil
    const { data: pessoas, error: errBusca } = await db
      .from('pessoas')
      .select('id, nome_politico, foto_url')
      .ilike('nome_politico', nomeBase)
      .limit(1);

    if (errBusca || !pessoas || pessoas.length === 0) {
      console.log(`⚠️  Político "${nomeBase}" não encontrado no banco. Pulando...`);
      continue;
    }

    const pessoa = pessoas[0];
    const novoNomeArquivo = `${pessoa.id}${extensao}`; // Evita caracteres especiais no storage

    // 2. Fazer o Upload para o Storage
    const fileBuffer = fs.readFileSync(filePath);
    const { data: uploadData, error: errUpload } = await db.storage
      .from(BUCKET)
      .upload(novoNomeArquivo, fileBuffer, {
        contentType,
        upsert: true, // Se já existir, substitui
      });

    if (errUpload) {
      console.error(`❌ Erro no upload de ${nomeBase}:`, errUpload.message);
      continue;
    }

    // 3. Pegar a URL Pública
    const { data: publicUrlData } = db.storage.from(BUCKET).getPublicUrl(novoNomeArquivo);
    const publicUrl = publicUrlData.publicUrl;

    // 4. Atualizar o cadastro no banco
    const { error: errUpdate } = await db
      .from('pessoas')
      .update({ foto_url: publicUrl })
      .eq('id', pessoa.id);

    if (errUpdate) {
      console.error(`❌ Erro ao atualizar o cadastro de ${nomeBase}:`, errUpdate.message);
    } else {
      console.log(`✅ Sucesso! Foto atualizada para ${pessoa.nome_politico}.`);
    }
  }

  console.log('\nFinalizado!');
}

run().catch(console.error);
