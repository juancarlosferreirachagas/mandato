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

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Edna Macedo', 'Edna Macedo', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/254.jpg', jsonb_build_object('alesp_id', '254'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Edson Giriboni', 'Edson Giriboni', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/381.jpg', jsonb_build_object('alesp_id', '381'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Eduardo Suplicy', 'Eduardo Suplicy', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1050.jpg', jsonb_build_object('alesp_id', '1050'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Emídio de Souza', 'Emídio de Souza', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/327.jpg', jsonb_build_object('alesp_id', '327'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Enio Tatto', 'Enio Tatto', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/372.jpg', jsonb_build_object('alesp_id', '372'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Fabiana Bolsonaro', 'Fabiana Bolsonaro', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1213.jpg', jsonb_build_object('alesp_id', '1213'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Felipe Franco', 'Felipe Franco', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1214.jpg', jsonb_build_object('alesp_id', '1214'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Fábio Faria de Sá', 'Fábio Faria de Sá', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/2041.jpg', jsonb_build_object('alesp_id', '2041'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Gil Diniz Bolsonaro', 'Gil Diniz Bolsonaro', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1161.jpg', jsonb_build_object('alesp_id', '1161'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Gilmaci Santos', 'Gilmaci Santos', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/382.jpg', jsonb_build_object('alesp_id', '382'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Guilherme Cortez', 'Guilherme Cortez', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1216.jpg', jsonb_build_object('alesp_id', '1216'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MISSÃO', 'MISSÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MISSÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Guto Zacarias', 'Guto Zacarias', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1217.jpg', jsonb_build_object('alesp_id', '1217'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Itamar Borges', 'Itamar Borges', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/442.jpg', jsonb_build_object('alesp_id', '442'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Jorge Caruso', 'Jorge Caruso', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/299.jpg', jsonb_build_object('alesp_id', '299'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Jorge Wilson Xerife do Consumidor', 'Jorge Wilson Xerife do Consumidor', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/484.jpg', jsonb_build_object('alesp_id', '484'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PCDOB', 'PCDOB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PCDOB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Leci Brandão', 'Leci Brandão', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/445.jpg', jsonb_build_object('alesp_id', '445'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('NOVO', 'NOVO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'NOVO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Leonardo Siqueira', 'Leonardo Siqueira', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1219.jpg', jsonb_build_object('alesp_id', '1219'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Letícia Aguiar', 'Letícia Aguiar', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1158.jpg', jsonb_build_object('alesp_id', '1158'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Lucas Bove', 'Lucas Bove', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1220.jpg', jsonb_build_object('alesp_id', '1220'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Luiz Claudio Marcolino', 'Luiz Claudio Marcolino', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/446.jpg', jsonb_build_object('alesp_id', '446'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Luiz Fernando T. Ferreira', 'Luiz Fernando T. Ferreira', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/481.jpg', jsonb_build_object('alesp_id', '481'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Léo Oliveira', 'Léo Oliveira', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/200.jpg', jsonb_build_object('alesp_id', '200'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Major Mecca', 'Major Mecca', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1157.jpg', jsonb_build_object('alesp_id', '1157'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marcelo Aguiar', 'Marcelo Aguiar', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/2042.jpg', jsonb_build_object('alesp_id', '2042'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marcio Nakashima', 'Marcio Nakashima', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1155.jpg', jsonb_build_object('alesp_id', '1155'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marcos Damasio', 'Marcos Damasio', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/479.jpg', jsonb_build_object('alesp_id', '479'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Maria Lúcia Amary', 'Maria Lúcia Amary', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/347.jpg', jsonb_build_object('alesp_id', '347'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSB', 'PSB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marina Helou', 'Marina Helou', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1154.jpg', jsonb_build_object('alesp_id', '1154'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marta Costa', 'Marta Costa', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/480.jpg', jsonb_build_object('alesp_id', '480'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Maurici', 'Maurici', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1187.jpg', jsonb_build_object('alesp_id', '1187'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Mauro Bragato', 'Mauro Bragato', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/75.jpg', jsonb_build_object('alesp_id', '75'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Milton Leite Filho', 'Milton Leite Filho', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/415.jpg', jsonb_build_object('alesp_id', '415'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);
end $$;