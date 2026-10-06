do $$
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

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Agente Federal Danilo Balas', 'Agente Federal Danilo Balas', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1139.jpg', jsonb_build_object('alesp_id', '1139'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Alex Madureira', 'Alex Madureira', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1140.jpg', jsonb_build_object('alesp_id', '1140'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Altair Moraes', 'Altair Moraes', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1178.jpg', jsonb_build_object('alesp_id', '1178'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSDB', 'PSDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ana Carolina Serra', 'Ana Carolina Serra', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1201.jpg', jsonb_build_object('alesp_id', '1201'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ana Perugini', 'Ana Perugini', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/398.jpg', jsonb_build_object('alesp_id', '398'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Analice Fernandes', 'Analice Fernandes', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/363.jpg', jsonb_build_object('alesp_id', '363'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('André Bueno', 'André Bueno', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1237.jpg', jsonb_build_object('alesp_id', '1237'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('André do Prado', 'André do Prado', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/429.jpg', jsonb_build_object('alesp_id', '429'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSB', 'PSB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Andréa Werner', 'Andréa Werner', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1202.jpg', jsonb_build_object('alesp_id', '1202'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PRD', 'PRD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PRD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Atila Jacomussi', 'Atila Jacomussi', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/494.jpg', jsonb_build_object('alesp_id', '494'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Barros Munhoz', 'Barros Munhoz', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/124.jpg', jsonb_build_object('alesp_id', '124'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Beth Sahão', 'Beth Sahão', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/367.jpg', jsonb_build_object('alesp_id', '367'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Bruna Furlan', 'Bruna Furlan', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1203.jpg', jsonb_build_object('alesp_id', '1203'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Bruno Zambelli', 'Bruno Zambelli', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1204.jpg', jsonb_build_object('alesp_id', '1204'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSB', 'PSB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Caio França', 'Caio França', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/492.jpg', jsonb_build_object('alesp_id', '492'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PP', 'PP') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PP';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Capitão Telhada', 'Capitão Telhada', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1205.jpg', jsonb_build_object('alesp_id', '1205'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Carla Morando', 'Carla Morando', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1173.jpg', jsonb_build_object('alesp_id', '1173'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Carlos Giannazi', 'Carlos Giannazi', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/417.jpg', jsonb_build_object('alesp_id', '417'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Carlão Pignatari', 'Carlão Pignatari', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/431.jpg', jsonb_build_object('alesp_id', '431'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Clarice Ganem', 'Clarice Ganem', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1206.jpg', jsonb_build_object('alesp_id', '1206'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Conte Lopes', 'Conte Lopes', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/141.jpg', jsonb_build_object('alesp_id', '141'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Dani Alonso', 'Dani Alonso', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1207.jpg', jsonb_build_object('alesp_id', '1207'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Daniel Soares', 'Daniel Soares', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1168.jpg', jsonb_build_object('alesp_id', '1168'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Delegada Graciela', 'Delegada Graciela', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1167.jpg', jsonb_build_object('alesp_id', '1167'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PP', 'PP') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PP';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Delegado Olim', 'Delegado Olim', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/493.jpg', jsonb_build_object('alesp_id', '493'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Dirceu Dalben', 'Dirceu Dalben', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1183.jpg', jsonb_build_object('alesp_id', '1183'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Donato', 'Donato', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1208.jpg', jsonb_build_object('alesp_id', '1208'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Dr. Eduardo Nóbrega', 'Dr. Eduardo Nóbrega', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1209.jpg', jsonb_build_object('alesp_id', '1209'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Dr. Elton', 'Dr. Elton', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1210.jpg', jsonb_build_object('alesp_id', '1210'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Dr. Jorge do Carmo', 'Dr. Jorge do Carmo', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1164.jpg', jsonb_build_object('alesp_id', '1164'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSDB', 'PSDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Dra. Damaris Moura', 'Dra. Damaris Moura', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1179.jpg', jsonb_build_object('alesp_id', '1179'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ediane Maria', 'Ediane Maria', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1211.jpg', jsonb_build_object('alesp_id', '1211'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);
end $$;