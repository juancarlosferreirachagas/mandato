-- MANDATO — Despesas pagas do município de Guarulhos
-- Fonte: API de Dados Abertos do TCE-SP (Portal da Transparência Municipal)
--   https://transparencia.tce.sp.gov.br/api/json/despesas/guarulhos/{exercicio}/{mes}
-- Alimentada por scripts/fetch-tcesp.ts (npm run sync:tcesp).
--
-- Os dados são declarados pelo próprio município ao TCE-SP (sistema Audesp) e
-- ainda podem ser revistos pela fiscalização. Guardamos a URL de origem de cada
-- linha para que qualquer pessoa possa conferir.

create table if not exists public.despesas_guarulhos (
  id              uuid primary key default gen_random_uuid(),

  -- Campos principais
  orgao           text          not null,              -- ex.: PREFEITURA MUNICIPAL DE GUARULHOS
  credor          text          not null,              -- nome do fornecedor/credor
  cnpj_credor     varchar(14),                         -- só dígitos; nulo para pessoa física
  valor_pago      numeric(16,2) not null,
  data_pagamento  date          not null,
  descricao       text,

  -- Rastreabilidade (permite conferir na fonte e evita duplicatas no upsert)
  chave_origem    text          not null unique,       -- hash determinístico da linha de origem
  tipo_credor     text,                                -- 'PJ' | 'PF' | 'OUTRO'
  nr_empenho      text,
  exercicio       smallint      not null,
  mes             smallint      not null check (mes between 1 and 12),
  fonte_url       text          not null,

  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index if not exists despesas_guarulhos_data_idx    on public.despesas_guarulhos (data_pagamento desc);
create index if not exists despesas_guarulhos_cnpj_idx    on public.despesas_guarulhos (cnpj_credor);
create index if not exists despesas_guarulhos_orgao_idx   on public.despesas_guarulhos (orgao);
create index if not exists despesas_guarulhos_periodo_idx on public.despesas_guarulhos (exercicio, mes);

create or replace function public.despesas_guarulhos_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists despesas_guarulhos_touch on public.despesas_guarulhos;
create trigger despesas_guarulhos_touch
  before update on public.despesas_guarulhos
  for each row execute function public.despesas_guarulhos_touch();

-- RLS: leitura pública; escrita apenas via service_role (script de sincronização)
-- ou staff autenticado, seguindo o padrão de 20261006000002_rls.sql.
alter table public.despesas_guarulhos enable row level security;

drop policy if exists despesas_guarulhos_public_read on public.despesas_guarulhos;
create policy despesas_guarulhos_public_read on public.despesas_guarulhos
  for select to anon, authenticated using (true);

drop policy if exists despesas_guarulhos_staff_write on public.despesas_guarulhos;
create policy despesas_guarulhos_staff_write on public.despesas_guarulhos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

comment on table public.despesas_guarulhos is
  'Pagamentos (evento "Valor Pago") de Guarulhos declarados ao TCE-SP. Fonte: transparencia.tce.sp.gov.br/apis';
