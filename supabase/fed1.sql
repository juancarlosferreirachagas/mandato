do $$
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

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Adilson Barroso', 'Adilson Barroso', 'https://www.camara.leg.br/internet/deputado/bandep/221328.jpg', jsonb_build_object('camara_id', 221328), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('NOVO', 'NOVO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'NOVO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Adriana Ventura', 'Adriana Ventura', 'https://www.camara.leg.br/internet/deputado/bandep/204528.jpg', jsonb_build_object('camara_id', 204528), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Alencar Santana', 'Alencar Santana', 'https://www.camara.leg.br/internet/deputado/bandep/204501.jpg', jsonb_build_object('camara_id', 204501), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('CIDADANIA', 'CIDADANIA') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'CIDADANIA';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Alex Manente', 'Alex Manente', 'https://www.camara.leg.br/internet/deputado/bandep/178972.jpg', jsonb_build_object('camara_id', 178972), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Alexandre Leite', 'Alexandre Leite', 'https://www.camara.leg.br/internet/deputado/bandep/160545.jpg', jsonb_build_object('camara_id', 160545), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Alfredinho', 'Alfredinho', 'https://www.camara.leg.br/internet/deputado/bandep/221148.jpg', jsonb_build_object('camara_id', 221148), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Antonio Carlos Rodrigues', 'Antonio Carlos Rodrigues', 'https://www.camara.leg.br/internet/deputado/bandep/220638.jpg', jsonb_build_object('camara_id', 220638), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Arlindo Chinaglia', 'Arlindo Chinaglia', 'https://www.camara.leg.br/internet/deputado/bandep/73433.jpg', jsonb_build_object('camara_id', 73433), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('CIDADANIA', 'CIDADANIA') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'CIDADANIA';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Arnaldo Jardim', 'Arnaldo Jardim', 'https://www.camara.leg.br/internet/deputado/bandep/141391.jpg', jsonb_build_object('camara_id', 141391), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Baleia Rossi', 'Baleia Rossi', 'https://www.camara.leg.br/internet/deputado/bandep/178975.jpg', jsonb_build_object('camara_id', 178975), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Bruno Ganem', 'Bruno Ganem', 'https://www.camara.leg.br/internet/deputado/bandep/220635.jpg', jsonb_build_object('camara_id', 220635), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Capitão Augusto', 'Capitão Augusto', 'https://www.camara.leg.br/internet/deputado/bandep/178829.jpg', jsonb_build_object('camara_id', 178829), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Carlos Sampaio', 'Carlos Sampaio', 'https://www.camara.leg.br/internet/deputado/bandep/74262.jpg', jsonb_build_object('camara_id', 74262), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Carlos Zarattini', 'Carlos Zarattini', 'https://www.camara.leg.br/internet/deputado/bandep/141398.jpg', jsonb_build_object('camara_id', 141398), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Celso Russomanno', 'Celso Russomanno', 'https://www.camara.leg.br/internet/deputado/bandep/73441.jpg', jsonb_build_object('camara_id', 73441), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Cezinha de Madureira', 'Cezinha de Madureira', 'https://www.camara.leg.br/internet/deputado/bandep/204504.jpg', jsonb_build_object('camara_id', 204504), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('David Soares', 'David Soares', 'https://www.camara.leg.br/internet/deputado/bandep/204511.jpg', jsonb_build_object('camara_id', 204511), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Delegado Bruno Lima', 'Delegado Bruno Lima', 'https://www.camara.leg.br/internet/deputado/bandep/220642.jpg', jsonb_build_object('camara_id', 220642), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Delegado da Cunha', 'Delegado da Cunha', 'https://www.camara.leg.br/internet/deputado/bandep/220649.jpg', jsonb_build_object('camara_id', 220649), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Delegado Palumbo', 'Delegado Palumbo', 'https://www.camara.leg.br/internet/deputado/bandep/220652.jpg', jsonb_build_object('camara_id', 220652), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Delegado Paulo Bilynskyj', 'Delegado Paulo Bilynskyj', 'https://www.camara.leg.br/internet/deputado/bandep/220654.jpg', jsonb_build_object('camara_id', 220654), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Erika Hilton', 'Erika Hilton', 'https://www.camara.leg.br/internet/deputado/bandep/220645.jpg', jsonb_build_object('camara_id', 220645), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Fábio Teruel', 'Fábio Teruel', 'https://www.camara.leg.br/internet/deputado/bandep/220653.jpg', jsonb_build_object('camara_id', 220653), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('UNIÃO', 'UNIÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'UNIÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Fausto Pinato', 'Fausto Pinato', 'https://www.camara.leg.br/internet/deputado/bandep/66828.jpg', jsonb_build_object('camara_id', 66828), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Felipe Becari', 'Felipe Becari', 'https://www.camara.leg.br/internet/deputado/bandep/220646.jpg', jsonb_build_object('camara_id', 220646), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Gilberto Nascimento', 'Gilberto Nascimento', 'https://www.camara.leg.br/internet/deputado/bandep/74270.jpg', jsonb_build_object('camara_id', 74270), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PP', 'PP') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PP';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Guilherme Derrite', 'Guilherme Derrite', 'https://www.camara.leg.br/internet/deputado/bandep/204531.jpg', jsonb_build_object('camara_id', 204531), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Jefferson Campos', 'Jefferson Campos', 'https://www.camara.leg.br/internet/deputado/bandep/74273.jpg', jsonb_build_object('camara_id', 74273), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Jilmar Tatto', 'Jilmar Tatto', 'https://www.camara.leg.br/internet/deputado/bandep/141456.jpg', jsonb_build_object('camara_id', 141456), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('MDB', 'MDB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MDB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('João Cury', 'João Cury', 'https://www.camara.leg.br/internet/deputado/bandep/230957.jpg', jsonb_build_object('camara_id', 230957), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSB', 'PSB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Jonas Donizette', 'Jonas Donizette', 'https://www.camara.leg.br/internet/deputado/bandep/160548.jpg', jsonb_build_object('camara_id', 160548), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Juliana Cardoso', 'Juliana Cardoso', 'https://www.camara.leg.br/internet/deputado/bandep/220640.jpg', jsonb_build_object('camara_id', 220640), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Kiko Celeguim', 'Kiko Celeguim', 'https://www.camara.leg.br/internet/deputado/bandep/162067.jpg', jsonb_build_object('camara_id', 162067), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('MISSÃO', 'MISSÃO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'MISSÃO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Kim Kataguiri', 'Kim Kataguiri', 'https://www.camara.leg.br/internet/deputado/bandep/204536.jpg', jsonb_build_object('camara_id', 204536), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Luiz Carlos Motta', 'Luiz Carlos Motta', 'https://www.camara.leg.br/internet/deputado/bandep/204485.jpg', jsonb_build_object('camara_id', 204485), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);
end $$;