-- FISCALIZA GUARULHOS — Filtro "fornecedores externos" no ranking.
--
-- No TCE-SP, repasses entre órgãos do próprio município (Prefeitura -> Secretarias,
-- Prefeitura -> Previdência, etc.) aparecem como "credor" e dominam qualquer ranking.
-- Para o cidadão enxergar quem vende para a cidade, o ranking pode ocultá-los.
--
-- Critério (público e conferível, exibido na tela):
--   * CNPJ com raiz 46.319.000 (Prefeitura de Guarulhos e seus órgãos) ou
--     52.373.396 (Instituto de Previdência dos Servidores); ou
--   * nome começando por SECRETARIA, PREFEITURA MUNICIPAL, CAMARA MUNICIPAL,
--     INSTITUTO DE PREVID ou FUNDO MUNICIPAL.

create or replace function public.fg_repasse_interno(p_cnpj text, p_credor text)
returns boolean language sql immutable as $$
  select coalesce(p_cnpj like '46319000%' or p_cnpj like '52373396%', false)
      or coalesce(upper(p_credor) ~ '^(SECRETARIA|PREFEITURA MUNICIPAL|CAMARA MUNICIPAL|C.MARA MUNICIPAL|INSTITUTO DE PREVID|FUNDO MUNICIPAL)', false)
$$;

drop function if exists public.fg_ranking_credores(integer, integer, text, text, text, integer, integer);

create or replace function public.fg_ranking_credores(
  p_ano integer default null, p_mes integer default null, p_orgao text default null,
  p_busca text default null,  p_tipo text default null,
  p_limit integer default 25, p_offset integer default 0,
  p_somente_externos boolean default false)
returns table (
  chave text, credor text, cnpj_credor text, tipo_credor text,
  total_liquido numeric, qtd bigint, ultimo_pagamento date, repasse_interno boolean,
  total_linhas bigint)
language sql stable as $$
  with g as (
    select
      public.fg_chave_credor(cnpj_credor, credor)               as chave,
      mode() within group (order by credor)                      as credor,
      max(cnpj_credor)                                           as cnpj_credor,
      max(tipo_credor)                                           as tipo_credor,
      sum(valor_pago)                                            as total_liquido,
      count(*) filter (where valor_pago > 0)                     as qtd,
      max(data_pagamento)                                        as ultimo_pagamento,
      bool_or(public.fg_repasse_interno(cnpj_credor, credor))    as repasse_interno
    from public.despesas_guarulhos
    where (p_ano   is null or exercicio = p_ano)
      and (p_mes   is null or mes = p_mes)
      and (p_orgao is null or orgao = p_orgao)
      and (p_tipo  is null or tipo_credor = p_tipo)
      and (not p_somente_externos or not public.fg_repasse_interno(cnpj_credor, credor))
      and (p_busca is null or btrim(p_busca) = ''
           or credor ilike '%' || btrim(p_busca) || '%'
           or cnpj_credor like '%' || regexp_replace(p_busca, '\D', '', 'g') || '%'
              and regexp_replace(p_busca, '\D', '', 'g') <> '')
    group by public.fg_chave_credor(cnpj_credor, credor)
    having sum(valor_pago) > 0
  )
  select g.*, count(*) over () as total_linhas
  from g
  order by total_liquido desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0)
$$;

grant execute on function
  public.fg_repasse_interno(text, text),
  public.fg_ranking_credores(integer, integer, text, text, text, integer, integer, boolean)
to anon, authenticated;
