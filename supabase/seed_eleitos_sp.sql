-- Inserção dos eleitos oficiais de SP com fontes oficiais
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

  -- Governador
  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';
  
  insert into public.pessoas (nome_civil, nome_politico, foto_url, fonte_id)
  values ('Tarcísio Gomes de Freitas', 'Tarcísio de Freitas', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tarc%C3%ADsio_de_Freitas_em_2023.jpg/800px-Tarc%C3%ADsio_de_Freitas_em_2023.jpg', v_fonte_tse)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_gov, v_sp_id, v_partido_id, '2023-01-01', 'em_exercicio', v_fonte_tse);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Astronauta Marcos Pontes', 'Astronauta Marcos Pontes', 'http://www.senado.leg.br/senadores/img/fotos-oficiais/senador6009.jpg', jsonb_build_object('senado_id', '6009'), v_fonte_senado)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_sen, v_orgao_sf, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_senado);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Giordano', 'Giordano', 'http://www.senado.leg.br/senadores/img/fotos-oficiais/senador6008.jpg', jsonb_build_object('senado_id', '6008'), v_fonte_senado)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_sen, v_orgao_sf, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_senado);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Mara Gabrilli', 'Mara Gabrilli', 'http://www.senado.leg.br/senadores/img/fotos-oficiais/senador5376.jpg', jsonb_build_object('senado_id', '5376'), v_fonte_senado)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_sen, v_orgao_sf, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_senado);

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

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Luiz Philippe de Orleans e Bragança', 'Luiz Philippe de Orleans e Bragança', 'https://www.camara.leg.br/internet/deputado/bandep/204526.jpg', jsonb_build_object('camara_id', 204526), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Luiza Erundina', 'Luiza Erundina', 'https://www.camara.leg.br/internet/deputado/bandep/74784.jpg', jsonb_build_object('camara_id', 74784), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marangoni', 'Marangoni', 'https://www.camara.leg.br/internet/deputado/bandep/220648.jpg', jsonb_build_object('camara_id', 220648), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marcio Alvino', 'Marcio Alvino', 'https://www.camara.leg.br/internet/deputado/bandep/178983.jpg', jsonb_build_object('camara_id', 178983), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marcos Pereira', 'Marcos Pereira', 'https://www.camara.leg.br/internet/deputado/bandep/204506.jpg', jsonb_build_object('camara_id', 204506), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Maria Rosas', 'Maria Rosas', 'https://www.camara.leg.br/internet/deputado/bandep/204540.jpg', jsonb_build_object('camara_id', 204540), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('REDE', 'REDE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REDE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Marina Silva', 'Marina Silva', 'https://www.camara.leg.br/internet/deputado/bandep/220637.jpg', jsonb_build_object('camara_id', 220637), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Mario Frias', 'Mario Frias', 'https://www.camara.leg.br/internet/deputado/bandep/220655.jpg', jsonb_build_object('camara_id', 220655), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PP', 'PP') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PP';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Mauricio Neves', 'Mauricio Neves', 'https://www.camara.leg.br/internet/deputado/bandep/220647.jpg', jsonb_build_object('camara_id', 220647), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Miguel Lombardi', 'Miguel Lombardi', 'https://www.camara.leg.br/internet/deputado/bandep/178985.jpg', jsonb_build_object('camara_id', 178985), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('REPUBLICANOS', 'REPUBLICANOS') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'REPUBLICANOS';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Milton Vieira', 'Milton Vieira', 'https://www.camara.leg.br/internet/deputado/bandep/154178.jpg', jsonb_build_object('camara_id', 154178), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Missionário José Olimpio', 'Missionário José Olimpio', 'https://www.camara.leg.br/internet/deputado/bandep/160561.jpg', jsonb_build_object('camara_id', 160561), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Nilto Tatto', 'Nilto Tatto', 'https://www.camara.leg.br/internet/deputado/bandep/178986.jpg', jsonb_build_object('camara_id', 178986), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PCdoB', 'PCdoB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PCdoB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Orlando Silva', 'Orlando Silva', 'https://www.camara.leg.br/internet/deputado/bandep/178987.jpg', jsonb_build_object('camara_id', 178987), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('SOLIDARIEDADE', 'SOLIDARIEDADE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'SOLIDARIEDADE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulinho da Força', 'Paulinho da Força', 'https://www.camara.leg.br/internet/deputado/bandep/141518.jpg', jsonb_build_object('camara_id', 141518), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Alexandre Barbosa', 'Paulo Alexandre Barbosa', 'https://www.camara.leg.br/internet/deputado/bandep/220650.jpg', jsonb_build_object('camara_id', 220650), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Freire Costa', 'Paulo Freire Costa', 'https://www.camara.leg.br/internet/deputado/bandep/160558.jpg', jsonb_build_object('camara_id', 160558), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Soares', 'Paulo Soares', 'https://www.camara.leg.br/internet/deputado/bandep/154700.jpg', jsonb_build_object('camara_id', 154700), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Paulo Teixeira', 'Paulo Teixeira', 'https://www.camara.leg.br/internet/deputado/bandep/141488.jpg', jsonb_build_object('camara_id', 141488), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Pr. Marco Feliciano', 'Pr. Marco Feliciano', 'https://www.camara.leg.br/internet/deputado/bandep/160601.jpg', jsonb_build_object('camara_id', 160601), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Professora Luciene Cavalcante', 'Professora Luciene Cavalcante', 'https://www.camara.leg.br/internet/deputado/bandep/221338.jpg', jsonb_build_object('camara_id', 221338), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ribamar Silva', 'Ribamar Silva', 'https://www.camara.leg.br/internet/deputado/bandep/175765.jpg', jsonb_build_object('camara_id', 175765), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('NOVO', 'NOVO') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'NOVO';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Ricardo Salles', 'Ricardo Salles', 'https://www.camara.leg.br/internet/deputado/bandep/220633.jpg', jsonb_build_object('camara_id', 220633), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PODE', 'PODE') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PODE';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rodrigo Gambale', 'Rodrigo Gambale', 'https://www.camara.leg.br/internet/deputado/bandep/220641.jpg', jsonb_build_object('camara_id', 220641), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rosana Valle', 'Rosana Valle', 'https://www.camara.leg.br/internet/deputado/bandep/204525.jpg', jsonb_build_object('camara_id', 204525), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rosangela Moro', 'Rosangela Moro', 'https://www.camara.leg.br/internet/deputado/bandep/220644.jpg', jsonb_build_object('camara_id', 220644), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PT', 'PT') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PT';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Rui Falcão', 'Rui Falcão', 'https://www.camara.leg.br/internet/deputado/bandep/73604.jpg', jsonb_build_object('camara_id', 73604), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Sâmia Bomfim', 'Sâmia Bomfim', 'https://www.camara.leg.br/internet/deputado/bandep/204535.jpg', jsonb_build_object('camara_id', 204535), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Saulo Pedroso', 'Saulo Pedroso', 'https://www.camara.leg.br/internet/deputado/bandep/226837.jpg', jsonb_build_object('camara_id', 226837), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PP', 'PP') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PP';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Simone Marquetto', 'Simone Marquetto', 'https://www.camara.leg.br/internet/deputado/bandep/220651.jpg', jsonb_build_object('camara_id', 220651), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSOL', 'PSOL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSOL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Sônia Guajajara', 'Sônia Guajajara', 'https://www.camara.leg.br/internet/deputado/bandep/220643.jpg', jsonb_build_object('camara_id', 220643), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSB', 'PSB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSB';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Tabata Amaral', 'Tabata Amaral', 'https://www.camara.leg.br/internet/deputado/bandep/204534.jpg', jsonb_build_object('camara_id', 204534), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Tiririca', 'Tiririca', 'https://www.camara.leg.br/internet/deputado/bandep/160976.jpg', jsonb_build_object('camara_id', 160976), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PL', 'PL') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PL';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Vinicius Carvalho', 'Vinicius Carvalho', 'https://www.camara.leg.br/internet/deputado/bandep/141555.jpg', jsonb_build_object('camara_id', 141555), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

  insert into public.partidos (sigla, nome) values ('PSD', 'PSD') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PSD';

  insert into public.pessoas (nome_civil, nome_politico, foto_url, identificadores_externos, fonte_id)
  values ('Vitor Lippi', 'Vitor Lippi', 'https://www.camara.leg.br/internet/deputado/bandep/178992.jpg', jsonb_build_object('camara_id', 178992), v_fonte_camara)
  returning id into v_pessoa_id;

  insert into public.mandatos (pessoa_id, cargo_id, orgao_id, localidade_id, partido_id, inicio, situacao, fonte_id)
  values (v_pessoa_id, v_cargo_dep_fed, v_orgao_cd, v_sp_id, v_partido_id, '2023-02-01', 'em_exercicio', v_fonte_camara);

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
