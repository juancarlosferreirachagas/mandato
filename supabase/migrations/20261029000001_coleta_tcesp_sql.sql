-- FISCALIZA GUARULHOS — Coleta automática das despesas (TCE-SP) direto no Postgres.
--
-- O banco busca a API de Dados Abertos do TCE-SP sozinho (extensão `http`), trata os
-- dados com a MESMA regra de scripts/fetch-tcesp.ts (inclusive a chave determinística
-- `chave_origem`) e grava em public.despesas_guarulhos via upsert idempotente.
-- Rodar quantas vezes quiser não duplica nada. Agendado com pg_cron (diário).
--
--   select public.sync_despesas_guarulhos(2026, 3);   -- um mês
--   select public.sync_despesas_recentes();           -- mês atual + 2 anteriores

create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Registro de cada coleta (alimenta o "última atualização" do site)
-- ---------------------------------------------------------------------------
create table if not exists public.coleta_execucoes (
  id           bigint generated always as identity primary key,
  fonte        text        not null,                -- ex.: 'tcesp-despesas'
  exercicio    smallint,
  mes          smallint,
  linhas       integer     not null default 0,      -- pagamentos gravados/atualizados
  status       text        not null check (status in ('ok', 'vazio', 'erro')),
  mensagem     text,
  executado_em timestamptz not null default now()
);
create index if not exists coleta_execucoes_idx on public.coleta_execucoes (fonte, executado_em desc);

alter table public.coleta_execucoes enable row level security;
drop policy if exists coleta_execucoes_public_read on public.coleta_execucoes;
create policy coleta_execucoes_public_read on public.coleta_execucoes
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Data dd/mm/aaaa -> date (nulo se inválida, como parseData() do script Node)
-- ---------------------------------------------------------------------------
create or replace function public.tcesp_parse_data(p text)
returns date language plpgsql immutable set search_path = public as $$
begin
  if p is null or p !~ '^\d{2}/\d{2}/\d{4}$' then return null; end if;
  return to_date(p, 'DD/MM/YYYY');
exception when others then
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- Coleta de um mês
-- ---------------------------------------------------------------------------
create or replace function public.sync_despesas_guarulhos(p_ano integer, p_mes integer)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url   text := format('https://transparencia.tce.sp.gov.br/api/json/despesas/guarulhos/%s/%s', p_ano, p_mes);
  v_resp  extensions.http_response;
  v_json  jsonb;
  v_n     integer := 0;
  v_try   integer;
  v_meses text[] := array['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho',
                          'Agosto','Setembro','Outubro','Novembro','Dezembro'];
begin
  if p_mes not between 1 and 12 then raise exception 'mês inválido: %', p_mes; end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '170');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT', '30');
  for v_try in 1..4 loop
    begin
      v_resp := extensions.http((
        'GET', v_url,
        array[extensions.http_header('user-agent', 'FiscalizaGuarulhos/1.0'),
              extensions.http_header('accept', 'application/json')],
        null, null)::extensions.http_request);
      exit when v_resp.status < 500;
      if v_try = 4 then raise exception 'TCE-SP respondeu HTTP %', v_resp.status; end if;
    exception when others then
      if v_try = 4 then raise; end if;
    end;
    perform pg_sleep(2 * v_try);
  end loop;

  if v_resp.status = 404 or btrim(coalesce(v_resp.content, '')) = '' then
    insert into coleta_execucoes (fonte, exercicio, mes, linhas, status, mensagem)
      values ('tcesp-despesas', p_ano, p_mes, 0, 'vazio', 'sem dados publicados');
    return 0;
  end if;
  if v_resp.status <> 200 then
    raise exception 'TCE-SP respondeu HTTP %', v_resp.status;
  end if;

  v_json := v_resp.content::jsonb;
  if jsonb_typeof(v_json) <> 'array' or jsonb_array_length(v_json) = 0 then
    insert into coleta_execucoes (fonte, exercicio, mes, linhas, status, mensagem)
      values ('tcesp-despesas', p_ano, p_mes, 0, 'vazio', 'sem dados publicados');
    return 0;
  end if;

  with p as (   -- só eventos de pagamento ("Valor Pago"), campos normalizados
    select ord,
      btrim(regexp_replace(coalesce(e->>'orgao', ''),         '\s+', ' ', 'g')) as orgao,
      btrim(regexp_replace(coalesce(e->>'nm_fornecedor', ''), '\s+', ' ', 'g')) as credor,
      nullif(btrim(regexp_replace(coalesce(e->>'nr_empenho', ''), '\s+', ' ', 'g')), '') as empenho,
      btrim(regexp_replace(coalesce(e->>'id_fornecedor', ''), '\s+', ' ', 'g')) as idf,
      btrim(coalesce(e->>'dt_emissao_despesa', '')) as dt,
      btrim(coalesce(e->>'vl_despesa', ''))         as vl
    from jsonb_array_elements(v_json) with ordinality as t(e, ord)
    where lower(coalesce(e->>'evento', '')) like '%pago%'
  ),
  v as (
    select p.*,
      case when vl ~ '^-?[0-9.]*(,[0-9]+)?$' and vl ~ '[0-9]'
           then round(replace(replace(vl, '.', ''), ',', '.')::numeric, 2) end as valor,
      public.tcesp_parse_data(dt) as data
    from p
  ),
  ok as (
    select * from v where valor is not null and data is not null and credor <> '' and orgao <> ''
  ),
  k as (
    select ok.*,
      p_ano || '|' || p_mes || '|' || orgao || '|' || coalesce(empenho, '') || '|' || idf
        || '|' || data::text || '|' || valor::text as base
    from ok
  ),
  n as (
    select k.*, row_number() over (partition by base order by ord) as seq from k
  ),
  ins as (
    insert into public.despesas_guarulhos
      (orgao, credor, cnpj_credor, valor_pago, data_pagamento, descricao, chave_origem,
       tipo_credor, nr_empenho, exercicio, mes, fonte_url)
    select
      orgao, credor,
      case when idf ~* 'CNPJ|JUR.DICA' and length(regexp_replace(idf, '\D', '', 'g')) >= 14
           then right(regexp_replace(idf, '\D', '', 'g'), 14) end,
      valor, data,
      (case when valor < 0 then 'Estorno de pagamento' else 'Pagamento' end)
        || coalesce(' do empenho nº ' || empenho, '')
        || ' — ' || orgao || ' (' || v_meses[p_mes] || '/' || p_ano || ')',
      encode(extensions.digest(base || '|' || seq, 'sha256'), 'hex'),
      case when idf ~* 'CNPJ|JUR.DICA' then 'PJ'
           when idf ~* 'F.SICA'        then 'PF'
           else 'OUTRO' end,
      empenho, p_ano, p_mes, v_url
    from n
    on conflict (chave_origem) do update set
      orgao = excluded.orgao, credor = excluded.credor, cnpj_credor = excluded.cnpj_credor,
      valor_pago = excluded.valor_pago, data_pagamento = excluded.data_pagamento,
      descricao = excluded.descricao, tipo_credor = excluded.tipo_credor,
      nr_empenho = excluded.nr_empenho, exercicio = excluded.exercicio,
      mes = excluded.mes, fonte_url = excluded.fonte_url
    returning 1
  )
  select count(*) into v_n from ins;

  insert into coleta_execucoes (fonte, exercicio, mes, linhas, status, mensagem)
    values ('tcesp-despesas', p_ano, p_mes, v_n, 'ok', jsonb_array_length(v_json) || ' eventos lidos');
  return v_n;
end $$;

-- Só o banco (pg_cron/postgres) e a service_role executam; nunca o público.
revoke all on function public.sync_despesas_guarulhos(integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mês atual + 2 anteriores (o TCE-SP publica com atraso e revisa meses antigos)
-- ---------------------------------------------------------------------------
create or replace function public.sync_despesas_recentes()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_ref    date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  v_d      date;
  v_i      integer;
  v_result jsonb := '[]'::jsonb;
  v_n      integer;
begin
  for v_i in 0..2 loop
    v_d := (v_ref - make_interval(months => v_i))::date;
    begin
      v_n := public.sync_despesas_guarulhos(extract(year from v_d)::int, extract(month from v_d)::int);
      v_result := v_result || jsonb_build_object('periodo', to_char(v_d, 'YYYY-MM'), 'linhas', v_n);
    exception when others then
      insert into coleta_execucoes (fonte, exercicio, mes, linhas, status, mensagem)
        values ('tcesp-despesas', extract(year from v_d)::int, extract(month from v_d)::int, 0, 'erro', sqlerrm);
      v_result := v_result || jsonb_build_object('periodo', to_char(v_d, 'YYYY-MM'), 'erro', sqlerrm);
    end;
  end loop;
  return v_result;
end $$;

revoke all on function public.sync_despesas_recentes() from public, anon, authenticated;

-- Diariamente às 08:00 UTC (05:00 em Brasília)
select cron.unschedule('fiscaliza-sync-tcesp') where exists (select 1 from cron.job where jobname = 'fiscaliza-sync-tcesp');
select cron.schedule('fiscaliza-sync-tcesp', '0 8 * * *', $cron$ select public.sync_despesas_recentes(); $cron$);

comment on function public.sync_despesas_guarulhos(integer, integer) is
  'Baixa do TCE-SP os pagamentos de Guarulhos de um mês e faz upsert em despesas_guarulhos.';
