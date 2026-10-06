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

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Monica Seixas do Movimento Pretas', 'Monica Seixas do Movimento Pretas', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1153.jpg', jsonb_build_object('alesp_id', '1153'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Márcia Lia', 'Márcia Lia', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/477.jpg', jsonb_build_object('alesp_id', '477'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Oseias de Madureira', 'Oseias de Madureira', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1221.jpg', jsonb_build_object('alesp_id', '1221'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paula da Bancada Feminista', 'Paula da Bancada Feminista', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1222.jpg', jsonb_build_object('alesp_id', '1222'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Correa Jr', 'Paulo Correa Jr', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/475.jpg', jsonb_build_object('alesp_id', '475'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Fiorilo', 'Paulo Fiorilo', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1152.jpg', jsonb_build_object('alesp_id', '1152'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Mansur', 'Paulo Mansur', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1223.jpg', jsonb_build_object('alesp_id', '1223'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Professora Bebel', 'Professora Bebel', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1150.jpg', jsonb_build_object('alesp_id', '1150'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Profª Camila Godoi', 'Profª Camila Godoi', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/2081.jpg', jsonb_build_object('alesp_id', '2081'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rafa Zimbaldi', 'Rafa Zimbaldi', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1149.jpg', jsonb_build_object('alesp_id', '1149'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rafael Saraiva', 'Rafael Saraiva', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1224.jpg', jsonb_build_object('alesp_id', '1224'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rafael Silva', 'Rafael Silva', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/280.jpg', jsonb_build_object('alesp_id', '280'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Reis', 'Reis', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1225.jpg', jsonb_build_object('alesp_id', '1225'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ricardo França', 'Ricardo França', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1226.jpg', jsonb_build_object('alesp_id', '1226'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ricardo Madalena', 'Ricardo Madalena', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/474.jpg', jsonb_build_object('alesp_id', '474'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rodrigo Moraes', 'Rodrigo Moraes', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/451.jpg', jsonb_build_object('alesp_id', '451'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rogério Nogueira', 'Rogério Nogueira', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/339.jpg', jsonb_build_object('alesp_id', '339'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rogério Santos', 'Rogério Santos', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1227.jpg', jsonb_build_object('alesp_id', '1227'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rui Alves', 'Rui Alves', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1228.jpg', jsonb_build_object('alesp_id', '1228'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rômulo Fernandes', 'Rômulo Fernandes', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1229.jpg', jsonb_build_object('alesp_id', '1229'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Sebastião Santos', 'Sebastião Santos', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/452.jpg', jsonb_build_object('alesp_id', '452'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Solange Freitas', 'Solange Freitas', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1230.jpg', jsonb_build_object('alesp_id', '1230'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Tenente Coimbra', 'Tenente Coimbra', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1144.jpg', jsonb_build_object('alesp_id', '1144'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Teonilio Barba', 'Teonilio Barba', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/472.jpg', jsonb_build_object('alesp_id', '472'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Thainara Faria', 'Thainara Faria', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1231.jpg', jsonb_build_object('alesp_id', '1231'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Thiago Auricchio', 'Thiago Auricchio', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1142.jpg', jsonb_build_object('alesp_id', '1142'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Tomé Abduch', 'Tomé Abduch', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1232.jpg', jsonb_build_object('alesp_id', '1232'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PSB', 'PSB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Valdomiro Lopes', 'Valdomiro Lopes', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/328.jpg', jsonb_build_object('alesp_id', '328'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Valeria Bolsonaro', 'Valeria Bolsonaro', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1141.jpg', jsonb_build_object('alesp_id', '1141'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Vitão do Cachorrão', 'Vitão do Cachorrão', 'https://www.al.sp.gov.br/repositorio/deputados/fotos/1233.jpg', jsonb_build_object('alesp_id', '1233'), v_fonte_alesp)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_est, v_orgao_alesp, v_sp_id, v_partido_id, '2023-03-15', 'em_exercicio', v_fonte_alesp);
end $$;