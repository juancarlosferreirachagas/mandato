-- FISCALIZA GUARULHOS — Foco exclusivo em Guarulhos.
-- Remove os políticos estaduais/federais de SP importados na fase inicial do projeto
-- (deputados estaduais e federais, senadores e governador) e os órgãos/fontes que só
-- existiam para eles. Dados de referência (estados, partidos, cargos, eleições) e tudo
-- que é de Guarulhos (município, Câmara Municipal, Prefeitura, candidaturas 2024) ficam.
-- Reimportável a qualquer momento pelos scripts em scripts/ (inserir-banco.mjs etc.).
--
-- Obs.: cada DELETE é um comando separado de propósito — dentro de um único CTE o
-- `not exists` enxergaria os mandatos antigos (mesmo snapshot) e não apagaria as pessoas.

-- 1) Mandatos de cargos fora do município
delete from public.mandatos m
using public.cargos c
where c.id = m.cargo_id
  and c.codigo in ('deputado_estadual', 'deputado_federal', 'senador', 'governador',
                   'presidente', 'deputado_distrital');

-- 2) Pessoas que ficaram sem mandato e sem candidatura
delete from public.pessoas p
where not exists (select 1 from public.mandatos m     where m.pessoa_id = p.id)
  and not exists (select 1 from public.candidaturas c where c.pessoa_id = p.id);

-- 3) Órgãos que não são de Guarulhos (se nada mais aponta para eles)
delete from public.orgaos o
where o.sigla in ('ALESP', 'CD', 'CLDF', 'SF')
  and not exists (select 1 from public.mandatos m where m.orgao_id = o.id);

-- 4) Fontes que só serviam aos órgãos removidos
delete from public.fontes f
where f.orgao in ('Assembleia Legislativa de SP', 'Câmara dos Deputados',
                  'Governo do Estado de São Paulo', 'Senado Federal')
  and not exists (select 1 from public.pessoas  x where x.fonte_id = f.id or x.foto_fonte_id = f.id)
  and not exists (select 1 from public.mandatos x where x.fonte_id = f.id)
  and not exists (select 1 from public.orgaos   x where x.fonte_id = f.id);
