-- FISCALIZA GUARULHOS — Funções de consulta para o site (agregações no banco).
--
-- O navegador nunca baixa as ~25 mil linhas: cada tela chama uma função (RPC) que devolve
-- só o necessário. Todas são `stable`, `security invoker` (respeitam a RLS de leitura
-- pública de despesas_guarulhos) e aceitam filtros opcionais (null = sem filtro).
--
-- "Credor" = CNPJ quando existe; para pessoa física (sem CNPJ) agrupa pelo nome.
-- Valores: total_liquido = pagamentos − estornos (dinheiro que de fato saiu do caixa).

create or replace function public.fg_chave_credor(p_cnpj text, p_credor text)
returns text language sql immutable as $$
  select coalesce(p_cnpj, 'n' || substr(md5(p_credor), 1, 16))
$$;

create index if not exists despesas_guarulhos_credor_key_idx
  on public.despesas_guarulhos (public.fg_chave_credor(cnpj_credor, credor));

-- ---------------------------------------------------------------------------
-- Visão geral (cartões do topo)
-- ---------------------------------------------------------------------------
create or replace function public.fg_resumo(
  p_ano integer default null, p_mes integer default null, p_orgao text default null)
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
  where (p_ano   is null or exercicio = p_ano)
    and (p_mes   is null or mes = p_mes)
    and (p_orgao is null or orgao = p_orgao)
$$;

-- ---------------------------------------------------------------------------
-- Evolução mês a mês (gráfico + lista de períodos disponíveis)
-- ---------------------------------------------------------------------------
create or replace function public.fg_por_mes(
  p_ano integer default null, p_orgao text default null)
returns table (exercicio smallint, mes smallint, total_liquido numeric, qtd bigint)
language sql stable as $$
  select exercicio, mes, sum(valor_pago), count(*) filter (where valor_pago > 0)
  from public.despesas_guarulhos
  where (p_ano is null or exercicio = p_ano)
    and (p_orgao is null or orgao = p_orgao)
  group by exercicio, mes
  order by exercicio, mes
$$;

-- ---------------------------------------------------------------------------
-- Por órgão pagador (Prefeitura, Câmara, Previdência...)
-- ---------------------------------------------------------------------------
create or replace function public.fg_por_orgao(
  p_ano integer default null, p_mes integer default null)
returns table (orgao text, total_liquido numeric, qtd bigint, qtd_credores bigint)
language sql stable as $$
  select orgao, sum(valor_pago), count(*) filter (where valor_pago > 0),
         count(distinct public.fg_chave_credor(cnpj_credor, credor))
  from public.despesas_guarulhos
  where (p_ano is null or exercicio = p_ano)
    and (p_mes is null or mes = p_mes)
  group by orgao
  order by sum(valor_pago) desc
$$;

-- ---------------------------------------------------------------------------
-- Ranking: quem mais recebeu (paginado, com busca)
-- ---------------------------------------------------------------------------
create or replace function public.fg_ranking_credores(
  p_ano integer default null, p_mes integer default null, p_orgao text default null,
  p_busca text default null,  p_tipo text default null,
  p_limit integer default 25, p_offset integer default 0)
returns table (
  chave text, credor text, cnpj_credor text, tipo_credor text,
  total_liquido numeric, qtd bigint, ultimo_pagamento date, total_linhas bigint)
language sql stable as $$
  with g as (
    select
      public.fg_chave_credor(cnpj_credor, credor)               as chave,
      mode() within group (order by credor)                      as credor,
      max(cnpj_credor)                                           as cnpj_credor,
      max(tipo_credor)                                           as tipo_credor,
      sum(valor_pago)                                            as total_liquido,
      count(*) filter (where valor_pago > 0)                     as qtd,
      max(data_pagamento)                                        as ultimo_pagamento
    from public.despesas_guarulhos
    where (p_ano   is null or exercicio = p_ano)
      and (p_mes   is null or mes = p_mes)
      and (p_orgao is null or orgao = p_orgao)
      and (p_tipo  is null or tipo_credor = p_tipo)
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

-- ---------------------------------------------------------------------------
-- Detalhe de um credor
-- ---------------------------------------------------------------------------
create or replace function public.fg_credor_resumo(p_chave text)
returns table (
  chave text, credor text, cnpj_credor text, tipo_credor text,
  total_liquido numeric, qtd bigint, primeiro_pagamento date, ultimo_pagamento date,
  maior_pagamento numeric, nomes text[])
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
    array_agg(distinct credor)
  from public.despesas_guarulhos
  where public.fg_chave_credor(cnpj_credor, credor) = p_chave
  having count(*) > 0
$$;

create or replace function public.fg_credor_por_mes(p_chave text)
returns table (exercicio smallint, mes smallint, total_liquido numeric, qtd bigint)
language sql stable as $$
  select exercicio, mes, sum(valor_pago), count(*) filter (where valor_pago > 0)
  from public.despesas_guarulhos
  where public.fg_chave_credor(cnpj_credor, credor) = p_chave
  group by exercicio, mes
  order by exercicio, mes
$$;

create or replace function public.fg_credor_por_orgao(p_chave text)
returns table (orgao text, total_liquido numeric, qtd bigint)
language sql stable as $$
  select orgao, sum(valor_pago), count(*) filter (where valor_pago > 0)
  from public.despesas_guarulhos
  where public.fg_chave_credor(cnpj_credor, credor) = p_chave
  group by orgao
  order by sum(valor_pago) desc
$$;

create or replace function public.fg_credor_pagamentos(
  p_chave text, p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, data_pagamento date, orgao text, valor_pago numeric,
  nr_empenho text, descricao text, fonte_url text, total_linhas bigint)
language sql stable as $$
  select id, data_pagamento, orgao, valor_pago, nr_empenho, descricao, fonte_url,
         count(*) over ()
  from public.despesas_guarulhos
  where public.fg_chave_credor(cnpj_credor, credor) = p_chave
  order by data_pagamento desc, valor_pago desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0)
$$;

grant execute on function
  public.fg_chave_credor(text, text),
  public.fg_resumo(integer, integer, text),
  public.fg_por_mes(integer, text),
  public.fg_por_orgao(integer, integer),
  public.fg_ranking_credores(integer, integer, text, text, text, integer, integer),
  public.fg_credor_resumo(text),
  public.fg_credor_por_mes(text),
  public.fg_credor_por_orgao(text),
  public.fg_credor_pagamentos(text, integer, integer)
to anon, authenticated;
