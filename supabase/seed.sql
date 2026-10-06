-- MANDATO — seed ESTRUTURAL. Nenhuma pessoa, voto ou candidatura aqui.

-- Brasil + 27 UFs (códigos IBGE)
insert into public.localidades (tipo, nome, sigla, codigo_ibge) values ('pais','Brasil','BR','76')
on conflict do nothing;

with br as (select id from public.localidades where tipo = 'pais' and sigla = 'BR')
insert into public.localidades (tipo, nome, sigla, codigo_ibge, parent_id)
select 'estado', v.nome, v.sigla, v.cod, br.id
from br, (values
  ('Acre','AC','12'),('Alagoas','AL','27'),('Amapá','AP','16'),('Amazonas','AM','13'),
  ('Bahia','BA','29'),('Ceará','CE','23'),('Distrito Federal','DF','53'),('Espírito Santo','ES','32'),
  ('Goiás','GO','52'),('Maranhão','MA','21'),('Mato Grosso','MT','51'),('Mato Grosso do Sul','MS','50'),
  ('Minas Gerais','MG','31'),('Pará','PA','15'),('Paraíba','PB','25'),('Paraná','PR','41'),
  ('Pernambuco','PE','26'),('Piauí','PI','22'),('Rio de Janeiro','RJ','33'),('Rio Grande do Norte','RN','24'),
  ('Rio Grande do Sul','RS','43'),('Rondônia','RO','11'),('Roraima','RR','14'),('Santa Catarina','SC','42'),
  ('São Paulo','SP','35'),('Sergipe','SE','28'),('Tocantins','TO','17')
) as v(nome, sigla, cod)
on conflict do nothing;

-- Cargos
insert into public.cargos (codigo, nome, poder, esfera) values
  ('presidente','Presidente da República','executivo','federal'),
  ('governador','Governador','executivo','estadual'),
  ('prefeito','Prefeito','executivo','municipal'),
  ('senador','Senador','legislativo','federal'),
  ('deputado_federal','Deputado Federal','legislativo','federal'),
  ('deputado_estadual','Deputado Estadual','legislativo','estadual'),
  ('deputado_distrital','Deputado Distrital','legislativo','distrital'),
  ('vereador','Vereador','legislativo','municipal')
on conflict (codigo) do nothing;

-- Órgãos legislativos de referência
insert into public.orgaos (nome, sigla, poder, esfera, localidade_id)
select v.nome, v.sigla, 'legislativo', v.esfera,
       (select id from public.localidades where tipo = v.tipo and sigla = v.loc)
from (values
  ('Senado Federal','SF','federal','pais','BR'),
  ('Câmara dos Deputados','CD','federal','pais','BR'),
  ('Assembleia Legislativa do Estado de São Paulo','ALESP','estadual','estado','SP'),
  ('Câmara Legislativa do Distrito Federal','CLDF','distrital','estado','DF')
) as v(nome, sigla, esfera, tipo, loc);

-- Vagas de São Paulo.
-- ATENÇÃO: valores estruturais conforme o briefing; VERIFICAR contra a fonte oficial
-- (TSE/ALESP/Câmara/Senado) e anexar fonte_id antes de ir para produção.
-- Observação: em 2026 renovam-se 2 das 3 vagas de Senador por estado.
insert into public.vagas_cargo (cargo_id, localidade_id, quantidade)
select c.id, l.id, v.qtd
from (values ('governador',1),('senador',3),('deputado_federal',70),('deputado_estadual',94)) as v(cod, qtd)
join public.cargos c on c.codigo = v.cod
join public.localidades l on l.tipo = 'estado' and l.sigla = 'SP';

-- Eleição 2026 (estrutura; resultados virão de importação oficial)
insert into public.eleicoes (ano, tipo, turno, descricao)
values (2026, 'geral', 1, 'Eleições Gerais 2026 — 1º turno'),
       (2026, 'geral', 2, 'Eleições Gerais 2026 — 2º turno')
on conflict do nothing;
