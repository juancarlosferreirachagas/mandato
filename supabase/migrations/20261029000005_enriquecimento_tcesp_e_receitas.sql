-- FISCALIZA GUARULHOS — Enriquecimento de Despesas (Função, Modalidade, Elemento, Histórico Real)
-- e Tabela de Receitas Arrecadadas (TCE-SP Audesp).

-- 1) Novas colunas em public.despesas_guarulhos para guardar os metadados completos do empenho
alter table public.despesas_guarulhos
  add column if not exists funcao        text,
  add column if not exists subfuncao     text,
  add column if not exists programa      text,
  add column if not exists acao          text,
  add column if not exists fonte_recurso text,
  add column if not exists modalidade    text,
  add column if not exists elemento      text;

create index if not exists despesas_guarulhos_funcao_idx     on public.despesas_guarulhos (exercicio, funcao);
create index if not exists despesas_guarulhos_modalidade_idx on public.despesas_guarulhos (exercicio, modalidade);
create index if not exists despesas_guarulhos_empenho_idx    on public.despesas_guarulhos (orgao, nr_empenho);
create index if not exists despesas_guarulhos_descricao_trgm on public.despesas_guarulhos using gin (descricao gin_trgm_ops);

-- 2) Tabela de Receitas Arrecadadas de Guarulhos (TCE-SP)
create table if not exists public.receitas_guarulhos (
  id_detalhe    bigint primary key,
  exercicio     smallint not null,
  mes           smallint not null check (mes between 1 and 12),
  orgao         text not null,
  poder         text,
  fonte_recurso text,
  categoria     text,
  subcategoria  text,
  fonte_origem  text,
  rubrica       text,
  alinea        text,
  subalinea     text,
  valor         numeric(18, 2) not null,
  created_at    timestamptz not null default now()
);

create index if not exists receitas_guarulhos_periodo_idx on public.receitas_guarulhos (exercicio, mes);
create index if not exists receitas_guarulhos_rubrica_idx on public.receitas_guarulhos (exercicio, rubrica);

alter table public.receitas_guarulhos enable row level security;
drop policy if exists receitas_guarulhos_public_read on public.receitas_guarulhos;
create policy receitas_guarulhos_public_read on public.receitas_guarulhos
  for select to anon, authenticated using (true);

-- 3) Atualização das funções analíticas de despesas (suporte a função, modalidade e busca no histórico)

drop function if exists public.fg_resumo(integer, integer, text);
create or replace function public.fg_resumo(
  p_ano integer default null, p_mes integer default null, p_orgao text default null,
  p_funcao text default null, p_modalidade text default null)
returns table (
  total_liquido numeric, total_pago numeric, total_estornos numeric,
  qtd_pagamentos bigint, qtd_estornos bigint, qtd_credores bigint,
  ultima_data date, ultima_coleta timestamptz)
language sql stable as $$
  select
    coalesce(sum(valor_pago), 0),
    coalesce(sum(valor_pago) filter (where valor_pago > 0), 0),
    coalesce(sum(valor_pago) filter (where valor_pago < 0), 0),
    count(*) filter (where valor_pago > 0),
    count(*) filter (where valor_pago < 0),
    count(distinct public.fg_chave_credor(cnpj_credor, credor)),
    max(data_pagamento),
    (select max(executado_em) from public.coleta_execucoes
      where fonte = 'tcesp-despesas' and status = 'ok')
  from public.despesas_guarulhos
  where (p_ano        is null or exercicio  = p_ano)
    and (p_mes        is null or mes        = p_mes)
    and (p_orgao      is null or orgao      = p_orgao)
    and (p_funcao     is null or funcao     = p_funcao)
    and (p_modalidade is null or modalidade = p_modalidade)
$$;

drop function if exists public.fg_por_mes(integer, text);
create or replace function public.fg_por_mes(
  p_ano integer default null, p_orgao text default null, p_funcao text default null)
returns table (exercicio smallint, mes smallint, total_liquido numeric, qtd bigint)
language sql stable as $$
  select exercicio, mes, sum(valor_pago), count(*) filter (where valor_pago > 0)
  from public.despesas_guarulhos
  where (p_ano    is null or exercicio = p_ano)
    and (p_orgao  is null or orgao     = p_orgao)
    and (p_funcao is null or funcao    = p_funcao)
  group by exercicio, mes
  order by exercicio, mes
$$;

drop function if exists public.fg_por_orgao(integer, integer);
create or replace function public.fg_por_orgao(
  p_ano integer default null, p_mes integer default null, p_funcao text default null)
returns table (orgao text, total_liquido numeric, qtd bigint, qtd_credores bigint)
language sql stable as $$
  select orgao, sum(valor_pago), count(*) filter (where valor_pago > 0),
         count(distinct public.fg_chave_credor(cnpj_credor, credor))
  from public.despesas_guarulhos
  where (p_ano    is null or exercicio = p_ano)
    and (p_mes    is null or mes       = p_mes)
    and (p_funcao is null or funcao    = p_funcao)
  group by orgao
  order by sum(valor_pago) desc
$$;

create or replace function public.fg_por_funcao(
  p_ano integer default null, p_mes integer default null, p_orgao text default null)
returns table (funcao text, total_liquido numeric, qtd bigint, qtd_credores bigint)
language sql stable as $$
  select coalesce(nullif(funcao, ''), 'OUTROS') as funcao,
         sum(valor_pago),
         count(*) filter (where valor_pago > 0),
         count(distinct public.fg_chave_credor(cnpj_credor, credor))
  from public.despesas_guarulhos
  where (p_ano   is null or exercicio = p_ano)
    and (p_mes   is null or mes       = p_mes)
    and (p_orgao is null or orgao     = p_orgao)
  group by coalesce(nullif(funcao, ''), 'OUTROS')
  having sum(valor_pago) > 0
  order by sum(valor_pago) desc
$$;

create or replace function public.fg_por_modalidade(
  p_ano integer default null, p_mes integer default null, p_orgao text default null,
  p_funcao text default null)
returns table (modalidade text, total_liquido numeric, qtd bigint, qtd_credores bigint)
language sql stable as $$
  select coalesce(nullif(modalidade, ''), 'OUTROS/NÃO APLICÁVEL') as modalidade,
         sum(valor_pago),
         count(*) filter (where valor_pago > 0),
         count(distinct public.fg_chave_credor(cnpj_credor, credor))
  from public.despesas_guarulhos
  where (p_ano    is null or exercicio = p_ano)
    and (p_mes    is null or mes       = p_mes)
    and (p_orgao  is null or orgao     = p_orgao)
    and (p_funcao is null or funcao    = p_funcao)
  group by coalesce(nullif(modalidade, ''), 'OUTROS/NÃO APLICÁVEL')
  having sum(valor_pago) > 0
  order by sum(valor_pago) desc
$$;

drop function if exists public.fg_ranking_credores(integer, integer, text, text, text, integer, integer, boolean);
create or replace function public.fg_ranking_credores(
  p_ano integer default null, p_mes integer default null, p_orgao text default null,
  p_busca text default null,  p_tipo text default null,
  p_limit integer default 25, p_offset integer default 0,
  p_somente_externos boolean default false,
  p_funcao text default null, p_modalidade text default null)
returns table (
  chave text, credor text, cnpj_credor text, tipo_credor text,
  total_liquido numeric, qtd bigint, ultimo_pagamento date, repasse_interno boolean,
  funcao_principal text, modalidade_principal text,
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
      bool_or(public.fg_repasse_interno(cnpj_credor, credor))    as repasse_interno,
      mode() within group (order by funcao)                      as funcao_principal,
      mode() within group (order by modalidade)                  as modalidade_principal
    from public.despesas_guarulhos
    where (p_ano        is null or exercicio  = p_ano)
      and (p_mes        is null or mes        = p_mes)
      and (p_orgao      is null or orgao      = p_orgao)
      and (p_tipo       is null or tipo_credor = p_tipo)
      and (p_funcao     is null or funcao     = p_funcao)
      and (p_modalidade is null or modalidade = p_modalidade)
      and (not p_somente_externos or not public.fg_repasse_interno(cnpj_credor, credor))
      and (p_busca is null or btrim(p_busca) = ''
           or credor     ilike '%' || btrim(p_busca) || '%'
           or descricao  ilike '%' || btrim(p_busca) || '%'
           or elemento   ilike '%' || btrim(p_busca) || '%'
           or nr_empenho ilike '%' || btrim(p_busca) || '%'
           or (cnpj_credor like '%' || regexp_replace(p_busca, '\D', '', 'g') || '%'
               and regexp_replace(p_busca, '\D', '', 'g') <> ''))
    group by public.fg_chave_credor(cnpj_credor, credor)
    having sum(valor_pago) > 0
  )
  select g.*, count(*) over () as total_linhas
  from g
  order by total_liquido desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0)
$$;

drop function if exists public.fg_credor_resumo(text);
create or replace function public.fg_credor_resumo(p_chave text)
returns table (
  chave text, credor text, cnpj_credor text, tipo_credor text,
  total_liquido numeric, qtd bigint, primeiro_pagamento date, ultimo_pagamento date,
  maior_pagamento numeric, nomes text[], funcoes text[], modalidades text[])
language sql stable as $$
  select
    p_chave,
    mode() within group (order by credor),
    max(cnpj_credor),
    max(tipo_credor),
    sum(valor_pago),
    count(*) filter (where valor_pago > 0),
    min(data_pagamento),
    max(data_pagamento),
    max(valor_pago),
    array_agg(distinct credor),
    array_remove(array_agg(distinct funcao), null),
    array_remove(array_agg(distinct modalidade), null)
  from public.despesas_guarulhos
  where public.fg_chave_credor(cnpj_credor, credor) = p_chave
  having count(*) > 0
$$;

drop function if exists public.fg_credor_pagamentos(text, integer, integer);
create or replace function public.fg_credor_pagamentos(
  p_chave text, p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, data_pagamento date, orgao text, valor_pago numeric,
  nr_empenho text, descricao text, fonte_url text,
  funcao text, subfuncao text, modalidade text, elemento text, fonte_recurso text,
  total_linhas bigint)
language sql stable as $$
  select id, data_pagamento, orgao, valor_pago, nr_empenho, descricao, fonte_url,
         funcao, subfuncao, modalidade, elemento, fonte_recurso,
         count(*) over ()
  from public.despesas_guarulhos
  where public.fg_chave_credor(cnpj_credor, credor) = p_chave
  order by data_pagamento desc, valor_pago desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0)
$$;

-- 4) Funções analíticas de Receitas Arrecadadas
create or replace function public.fg_receitas_resumo(
  p_ano integer default null, p_mes integer default null, p_orgao text default null)
returns table (
  total_arrecadado numeric, total_corrente numeric, total_capital numeric, total_intra numeric,
  qtd_lancamentos bigint, ultimo_mes smallint)
language sql stable as $$
  select
    coalesce(sum(valor), 0),
    coalesce(sum(valor) filter (where categoria like '1%'), 0),
    coalesce(sum(valor) filter (where categoria like '2%'), 0),
    coalesce(sum(valor) filter (where categoria like '7%' or categoria like '8%'), 0),
    count(*),
    max(mes)
  from public.receitas_guarulhos
  where (p_ano   is null or exercicio = p_ano)
    and (p_mes   is null or mes       = p_mes)
    and (p_orgao is null or orgao     = p_orgao)
$$;

create or replace function public.fg_receitas_por_mes(
  p_ano integer default null, p_orgao text default null)
returns table (exercicio smallint, mes smallint, total_liquido numeric, qtd bigint)
language sql stable as $$
  select exercicio, mes, sum(valor), count(*)
  from public.receitas_guarulhos
  where (p_ano   is null or exercicio = p_ano)
    and (p_orgao is null or orgao     = p_orgao)
  group by exercicio, mes
  order by exercicio, mes
$$;

create or replace function public.fg_receitas_por_origem(
  p_ano integer default null, p_mes integer default null, p_orgao text default null)
returns table (rubrica text, subcategoria text, total_arrecadado numeric, qtd bigint)
language sql stable as $$
  select
    coalesce(nullif(regexp_replace(rubrica, '^\d+\s*-\s*', ''), ''), 'Outras Origens') as rubrica,
    coalesce(nullif(regexp_replace(subcategoria, '^\d+\s*-\s*', ''), ''), 'Receitas') as subcategoria,
    sum(valor) as total_arrecadado,
    count(*) as qtd
  from public.receitas_guarulhos
  where (p_ano   is null or exercicio = p_ano)
    and (p_mes   is null or mes       = p_mes)
    and (p_orgao is null or orgao     = p_orgao)
  group by 1, 2
  having sum(valor) > 0
  order by sum(valor) desc
$$;

grant execute on function
  public.fg_resumo(integer, integer, text, text, text),
  public.fg_por_mes(integer, text, text),
  public.fg_por_orgao(integer, integer, text),
  public.fg_por_funcao(integer, integer, text),
  public.fg_por_modalidade(integer, integer, text, text),
  public.fg_ranking_credores(integer, integer, text, text, text, integer, integer, boolean, text, text),
  public.fg_credor_resumo(text),
  public.fg_credor_pagamentos(text, integer, integer),
  public.fg_receitas_resumo(integer, integer, text),
  public.fg_receitas_por_mes(integer, text),
  public.fg_receitas_por_origem(integer, integer, text)
to anon, authenticated;
