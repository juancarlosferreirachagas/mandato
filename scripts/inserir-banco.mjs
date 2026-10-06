import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yusuaphkgbytgplfrddf.supabase.co';
// Usamos a anon key ou chave direta para popular as tabelas
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3VhcGhrZ2J5dGdwbGZyZGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTcxNzgsImV4cCI6MjEwNjg5MzE3OH0.NE7GpCZgxWN3rCv5TKCd20MGI5zs900iXygP4q2m2wo';

const db = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

async function run() {
  console.log('Iniciando carga de dados...');

  // 1. Obter referências básicas
  const { data: sp } = await db.from('localidades').select('id').eq('sigla', 'SP').single();
  const { data: cargos } = await db.from('cargos').select('id, codigo');
  const { data: orgaos } = await db.from('orgaos').select('id, sigla');
  const { data: fontes } = await db.from('fontes').select('id, orgao');

  const cargoMap = Object.fromEntries(cargos.map(c => [c.codigo, c.id]));
  const orgaoMap = Object.fromEntries(orgaos.map(o => [o.sigla, o.id]));
  const fonteCamara = fontes.find(f => f.orgao === 'Câmara dos Deputados')?.id;
  const fonteAlesp = fontes.find(f => f.orgao === 'Assembleia Legislativa de SP')?.id;

  // 2. Deputados Federais (70)
  console.log('Buscando federais na API da Câmara...');
  const resCamara = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=SP&itens=100');
  const { dados: federais } = await resCamara.json();

  console.log(`Inserindo ${federais.length} deputados federais...`);
  for (const d of federais) {
    const sigla = d.siglaPartido.trim().toUpperCase();
    await db.from('partidos').upsert({ sigla, nome: sigla }, { onConflict: 'sigla' });
    const { data: partido } = await db.from('partidos').select('id').eq('sigla', sigla).single();

    const { data: pessoa, error: errP } = await db.from('pessoas').insert({
      nome_civil: d.nome.trim(),
      nome_politico: d.nome.trim(),
      foto_url: d.urlFoto,
      identificadores_externos: { camara_id: d.id },
      fonte_id: fonteCamara
    }).select('id').single();

    if (errP) {
      console.error('Erro ao inserir pessoa federal:', d.nome, errP.message);
      continue;
    }

    await db.from('mandatos').insert({
      pessoa_id: pessoa.id,
      cargo_id: cargoMap.deputado_federal,
      orgao_id: orgaoMap.CD,
      localidade_id: sp.id,
      partido_id: partido?.id,
      inicio: '2023-02-01',
      situacao: 'em_exercicio',
      fonte_id: fonteCamara
    });
  }

  // 3. Deputados Estaduais (94)
  console.log('Buscando estaduais na ALESP...');
  const resAlesp = await fetch('https://www.al.sp.gov.br/repositorioDados/deputados/deputados.xml');
  const xmlAlesp = await resAlesp.text();
  const estaduais = xmlAlesp.split('<Deputado>').slice(1).map(b => {
    const get = tag => (b.match(new RegExp('<' + tag + '>(.*?)</' + tag + '>', 's')) || [])[1] || '';
    return {
      id: get('IdDeputado'),
      nome: (get('NomeParlamentar') || get('Nome')).trim(),
      partido: get('Partido').trim().toUpperCase(),
      situacao: get('Situacao'),
      foto: 'https://www.al.sp.gov.br/repositorio/deputados/fotos/' + get('IdDeputado') + '.jpg'
    };
  }).filter(d => d.situacao === 'EXE' || d.situacao === 'LIC');

  console.log(`Inserindo ${estaduais.length} deputados estaduais da ALESP...`);
  for (const e of estaduais) {
    const sigla = e.partido;
    await db.from('partidos').upsert({ sigla, nome: sigla }, { onConflict: 'sigla' });
    const { data: partido } = await db.from('partidos').select('id').eq('sigla', sigla).single();

    const { data: pessoa, error: errP } = await db.from('pessoas').insert({
      nome_civil: e.nome,
      nome_politico: e.nome,
      foto_url: e.foto,
      identificadores_externos: { alesp_id: e.id },
      fonte_id: fonteAlesp
    }).select('id').single();

    if (errP) {
      console.error('Erro ao inserir pessoa estadual:', e.nome, errP.message);
      continue;
    }

    await db.from('mandatos').insert({
      pessoa_id: pessoa.id,
      cargo_id: cargoMap.deputado_estadual,
      orgao_id: orgaoMap.ALESP,
      localidade_id: sp.id,
      partido_id: partido?.id,
      inicio: '2023-03-15',
      situacao: 'em_exercicio',
      fonte_id: fonteAlesp
    });
  }

  console.log('✅ Carga completa finalizada com sucesso!');
}

run().catch(console.error);
