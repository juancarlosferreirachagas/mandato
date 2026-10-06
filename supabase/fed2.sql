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

  insert into public.partidos (sigla, nome) values ('PCDOB', 'PCDOB') on conflict (sigla) do nothing;
  select id into v_partido_id from public.partidos where sigla = 'PCDOB';

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
end $$;