-- Suporte à importação idempotente do TSE.
-- cpf_hash: HMAC-SHA256(CPF, segredo) — liga a mesma pessoa entre eleições SEM armazenar o CPF.
alter table public.pessoas add column if not exists cpf_hash text;
create unique index if not exists pessoas_cpf_hash_key on public.pessoas(cpf_hash); -- NULLs são distintos

-- Um mandato por candidatura (evita duplicar ao reimportar).
create unique index if not exists mandatos_candidatura_key on public.mandatos(candidatura_id);

-- cpf_hash não deve ser exposto publicamente: revoga leitura da coluna para anon/authenticated
-- e reexpõe as colunas públicas explicitamente.
revoke select on public.pessoas from anon, authenticated;
grant select (id, nome_civil, nome_politico, data_nascimento, foto_url, foto_fonte_id,
              identificadores_externos, fonte_id, created_at, updated_at)
  on public.pessoas to anon, authenticated;
grant insert, update, delete on public.pessoas to authenticated;
