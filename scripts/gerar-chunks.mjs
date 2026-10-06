import { writeFileSync } from 'node:fs';

async function generate() {
  const resCamara = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=SP&itens=100');
  const { dados: federais } = await resCamara.json();

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

  const escapeSql = str => str ? "'" + str.replace(/'/g, "''") + "'" : "null";

  // Federais em 2 partes
  function makeFed(list, name) {
    let sql = `do $$
declare
  v_sp_id uuid;
  v_fonte_camara uuid;
  v_cargo_dep_fed uuid;
  v_orgao_cd uuid;
  v_pessoa_id uuid;
  v_partido_id uuid;
begin
  select id into v_sp_id from public.localidades where tipo = 'estado' and sigla = 'SP';
  select id into v_cargo_dep_fed from public.cargos where codigo = 'deputado_federal';
  select id into v_orgao_cd from public.orgaos where sigla = 'CD';
  select id into v_fonte_camara from public.fontes where orgao = 'Câmara dos Deputados' limit 1;
`;
    for (const d of list) {
      const sigla = d.siglaPartido.trim().toUpperCase();
      sql += `
  insert into public.partidos (sigla, nome) values (${escapeSql(sigla)}, ${escapeSql(sigla)}) on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = ${escapeSql(sigla)};

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values (${escapeSql(d.nome)}, ${escapeSql(d.nome)}, ${escapeSql(d.urlFoto)}, jsonb_build_object('camara_id', ${d.id}), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);
`;
    }
    sql += `end $$;`;
    writeFileSync(name, sql, 'utf-8');
  }

  makeFed(federais.slice(0, 35), 'supabase/fed1.sql');
  makeFed(federais.slice(35), 'supabase/fed2.sql');

  // Estaduais em 3 partes
  function makeEst(list, name) {
    let sql = `do $$
declare
  v_sp_id uuid;
  v_fonte_alesp uuid;
  v_cargo_dep_est uuid;
  v_orgao_alesp uuid;
  v_pessoa_id uuid;
  v_partido_id uuid;
begin
  select id into v_sp_id from public.localidades where tipo = 'estado' and sigla = 'SP';
  select id into v_cargo_dep_est from public.cargos where codigo = 'deputado_estadual';
  select id into v_orgao_alesp from public.orgaos where sigla = 'ALESP';
  select id into v_fonte_alesp from public.fontes where orgao = 'Assembleia Legislativa de SP' limit 1;
`;
    for (const e of list) {
      const sigla = e.partido;
      sql += `
  insert into public.partidos (sigla, nome) values (${escapeSql(sigla)}, ${escapeSql(sigla)}) on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = ${escapeSql(sigla)};

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values (${escapeSql(e.nome)}, ${escapeSql(e.nome)}, ${escapeSql(e.foto)}, jsonb_build_object('alesp_id', ${escapeSql(e.id)}), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);
`;
    }
    sql += `end $$;`;
    writeFileSync(name, sql, 'utf-8');
  }

  makeEst(estaduais.slice(0, 32), 'supabase/est1.sql');
  makeEst(estaduais.slice(32, 64), 'supabase/est2.sql');
  makeEst(estaduais.slice(64), 'supabase/est3.sql');

  console.log('Todos os chunks gerados com sucesso!');
}

generate().catch(console.error);
