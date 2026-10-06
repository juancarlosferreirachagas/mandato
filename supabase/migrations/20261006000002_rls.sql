-- MANDATO — Row Level Security
-- Dados públicos: leitura anônima. Escrita: somente editor/admin autenticado.
-- Auditoria, perfis e importação: somente staff.

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select papel from public.perfis where user_id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('editor','admin'), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

-- Tabelas de conteúdo público
do $$
declare t text;
begin
  foreach t in array array[
    'localidades','fontes','documentos','documento_versoes','pessoas','partidos','filiacoes',
    'orgaos','cargos','vagas_cargo','eleicoes','candidaturas','mandatos','temas','propostas',
    'proposta_autores','proposta_temas','proposta_documentos','proposta_tramitacoes','proposta_emendas',
    'votacoes','votos','presencas','comissoes','membros_comissoes','discursos','relatorias',
    'promessas','promessa_fontes','promessa_avaliacoes','processos','decisoes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t||'_public_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_staff())', t||'_staff_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t||'_staff_update', t);
    -- exclusão apenas por admin
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t||'_admin_delete', t);
  end loop;
end $$;

-- perfis: usuário lê o próprio; admin gerencia todos
alter table public.perfis enable row level security;
create policy perfis_self_read on public.perfis for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy perfis_admin_write on public.perfis for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- importação: somente staff
alter table public.import_lotes enable row level security;
alter table public.import_itens enable row level security;
create policy import_lotes_staff on public.import_lotes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy import_itens_staff on public.import_itens for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- auditoria: leitura por staff; escrita só via trigger (security definer)
alter table public.audit_log enable row level security;
create policy audit_log_staff_read on public.audit_log for select to authenticated
  using (public.is_staff());

-- A trigger roda como owner e ignora RLS; usuários comuns não têm grant de escrita.
revoke insert, update, delete on public.audit_log from anon, authenticated;
