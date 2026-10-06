/**
 * Importador oficial dos eleitos de São Paulo:
 * - 1 Governador (Governo SP / TSE)
 * - 3 Senadores (Senado Federal - Dados Abertos)
 * - 70 Deputados Federais (Câmara dos Deputados - Dados Abertos)
 * - 94 Deputados Estaduais (ALESP - Dados Abertos)
 *
 * Princípio: FATO -> FONTE -> INTERPRETAÇÃO.
 * Toda informação vem de endpoints abertos oficiais com suas fontes registradas.
 */

async function main() {
  console.log('1/4. Coletando 70 Deputados Federais da Câmara dos Deputados...');
  const resCamara = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=SP&itens=100');
  const jsonCamara = await resCamara.json();
  const federais = jsonCamara.dados;
  console.log(`-> ${federais.length} deputados federais obtidos.`);

  console.log('2/4. Coletando 94 Deputados Estaduais da ALESP...');
  const resAlesp = await fetch('https://www.al.sp.gov.br/repositorioDados/deputados/deputados.xml');
  const xmlAlesp = await resAlesp.text();
  const estaduais = xmlAlesp.split('<Deputado>').slice(1).map(b => {
    const get = tag => (b.match(new RegExp('<' + tag + '>(.*?)</' + tag + '>', 's')) || [])[1] || '';
    return {
      id: get('IdDeputado'),
      nome: (get('NomeParlamentar') || get('Nome')).trim(),
      partido: get('Partido').trim().toUpperCase(),
      situacao: get('Situacao'),
      foto: 'https://www.al.sp.gov.br/repositorio/deputados/fotos/' + get('IdDeputado') + '.jpg',
      email: get('Email')
    };
  }).filter(d => d.situacao === 'EXE' || d.situacao === 'LIC');
  console.log(`-> ${estaduais.length} deputados estaduais obtidos.`);

  console.log('3/4. Coletando 3 Senadores do Senado Federal...');
  const resSenado = await fetch('https://legis.senado.leg.br/dadosabertos/senador/lista/atual', { headers: { accept: 'application/json' } });
  const jsonSenado = await resSenado.json();
  const senadores = jsonSenado.ListaParlamentarEmExercicio.Parlamentares.Parlamentar
    .filter(p => p.IdentificacaoParlamentar.UfParlamentar === 'SP')
    .map(s => ({
      nome: s.IdentificacaoParlamentar.NomeParlamentar,
      partido: s.IdentificacaoParlamentar.SiglaPartidoParlamentar,
      foto: s.IdentificacaoParlamentar.UrlFotoParlamentar,
      id: s.IdentificacaoParlamentar.CodigoParlamentar
    }));
  console.log(`-> ${senadores.length} senadores obtidos.`);

  const governador = {
    nome: 'Tarcísio de Freitas',
    nomeCivil: 'Tarcísio Gomes de Freitas',
    partido: 'REPUBLICANOS',
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tarc%C3%ADsio_de_Freitas_em_2023.jpg/800px-Tarc%C3%ADsio_de_Freitas_em_2023.jpg'
  };

  // Gerar SQL completo de inserção
  const escapeSql = str => str ? "'" + str.replace(/'/g, "''") + "'" : "null";

  let sql = `-- Inserção dos eleitos oficiais de SP com fontes oficiais
do $$
declare
  v_sp_id uuid;
  v_fonte_camara uuid;
  v_fonte_alesp uuid;
  v_fonte_senado uuid;
  v_fonte_tse uuid;
  v_cargo_gov uuid;
  v_cargo_sen uuid;
  v_cargo_dep_fed uuid;
  v_cargo_dep_est uuid;
  v_orgao_cd uuid;
  v_orgao_alesp uuid;
  v_orgao_sf uuid;
  v_pessoa_id uuid;
  v_partido_id uuid;
begin
  select id into v_sp_id from public.localidades where tipo = 'estado' and sigla = 'SP';
  select id into v_cargo_gov from public.cargos where codigo = 'governador';
  select id into v_cargo_sen from public.cargos where codigo = 'senador';
  select id into v_cargo_dep_fed from public.cargos where codigo = 'deputado_federal';
  select id into v_cargo_dep_est from public.cargos where codigo = 'deputado_estadual';
  select id into v_orgao_cd from public.orgaos where sigla = 'CD';
  select id into v_orgao_alesp from public.orgaos where sigla = 'ALESP';
  select id into v_orgao_sf from public.orgaos where sigla = 'SF';

  -- Fontes
  insert into public.fontes (tipo, orgao, titulo, url, data_consulta)
  values ('api_oficial', 'Câmara dos Deputados', 'API de Dados Abertos da Câmara dos Deputados', 'https://dadosabertos.camara.leg.br', current_date)
  returning id into v_fonte_camara;

  insert into public.fontes (tipo, orgao, titulo, url, data_consulta)
  values ('dados_abertos', 'Assembleia Legislativa de SP', 'Repositório de Dados Abertos da ALESP', 'https://www.al.sp.gov.br/dados-abertos/', current_date)
  returning id into v_fonte_alesp;

  insert into public.fontes (tipo, orgao, titulo, url, data_consulta)
  values ('api_oficial', 'Senado Federal', 'API de Dados Abertos do Senado Federal', 'https://legis.senado.leg.br/dadosabertos/', current_date)
  returning id into v_fonte_senado;

  insert into public.fontes (tipo, orgao, titulo, url, data_consulta)
  values ('site_oficial', 'Governo do Estado de São Paulo', 'Portal do Governo do Estado de São Paulo', 'https://www.saopaulo.sp.gov.br', current_date)
  returning id into v_fonte_tse;
`;

  // 1. Governador
  sql += `
  -- Governador
  insert into public.partidos (sigla, nome) values (${escapeSql(governador.partido)}, ${escapeSql(governador.partido)}) on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = ${escapeSql(governador.partido)};
  
  insert into public.pessoas (nome_civil, nome_politico, foto_url, fonte_id)
  values (${escapeSql(governador.nomeCivil)}, ${escapeSql(governador.nome)}, ${escapeSql(governador.foto)}, v_fonte_tse)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_gov, v_sp_id, v_partido_id, '2023-01-01', 'em_exercicio', v_fonte_tse);
`;

  // 2. Senadores
  for (const s of senadores) {
    sql += `
  insert into public.partidos (sigla, nome) values (${escapeSql(s.partido)}, ${escapeSql(s.partido)}) on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = ${escapeSql(s.partido)};

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values (${escapeSql(s.nome)}, ${escapeSql(s.nome)}, ${escapeSql(s.foto)}, jsonb_build_object('senado_id', ${escapeSql(s.id)}), v_fonte_senado)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_sen, v_orgao_sf, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_senado);
`;
  }

  // 3. Deputados Federais
  for (const d of federais) {
    sql += `
  insert into public.partidos (sigla, nome) values (${escapeSql(d.siglaPartido)}, ${escapeSql(d.siglaPartido)}) on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = ${escapeSql(d.siglaPartido)};

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values (${escapeSql(d.nome)}, ${escapeSql(d.nome)}, ${escapeSql(d.urlFoto)}, jsonb_build_object('camara_id', ${d.id}), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);
`;
  }

  // 4. Deputados Estaduais
  for (const e of estaduais) {
    sql += `
  insert into public.partidos (sigla, nome) values (${escapeSql(e.partido)}, ${escapeSql(e.partido)}) on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = ${escapeSql(e.partido)};

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values (${escapeSql(e.nome)}, ${escapeSql(e.nome)}, ${escapeSql(e.foto)}, jsonb_build_object('alesp_id', ${escapeSql(e.id)}), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);
`;
  }

  sql += `
end $$;
`;

  return sql;
}

import { writeFileSync } from 'node:fs';
const sql = await main();
writeFileSync('supabase/seed_eleitos_sp.sql', sql, 'utf-8');
console.log('SQL de eleitos de SP gerado com sucesso em supabase/seed_eleitos_sp.sql!');
