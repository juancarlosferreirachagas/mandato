-- MANDATO — schema relacional
-- Princípio: FATO -> FONTE -> INTERPRETAÇÃO.
-- Nada aqui é específico de São Paulo: a localização é uma hierarquia genérica
-- (pais > estado > municipio) e cargos/órgãos são dados, não código.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Localização
-- ---------------------------------------------------------------------------
create table public.localidades (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in ('pais','estado','municipio')),
  nome         text not null,
  sigla        text,
  codigo_ibge  text,
  parent_id    uuid references public.localidades(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tipo, codigo_ibge)
);
create index localidades_parent_idx on public.localidades(parent_id);

-- ---------------------------------------------------------------------------
-- Fontes e documentos (versionados)
-- ---------------------------------------------------------------------------
create table public.fontes (
  id                  uuid primary key default gen_random_uuid(),
  tipo                text not null check (tipo in (
                        'api_oficial','dados_abertos','diario_oficial','site_oficial',
                        'documento_oficial','decisao_judicial','imprensa','declaracao','outro')),
  orgao               text,
  titulo              text not null,
  url                 text,
  data_publicacao     date,
  data_consulta       date,
  identificador_externo text,
  observacoes         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index fontes_orgao_idx on public.fontes(orgao);
create index fontes_ext_idx on public.fontes(identificador_externo);

create table public.documentos (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,               -- projeto, substitutivo, emenda, texto_aprovado, lei, decisao...
  titulo      text not null,
  descricao   text,
  fonte_id    uuid references public.fontes(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Original -> substitutivo -> emendas -> texto aprovado -> lei
create table public.documento_versoes (
  id              uuid primary key default gen_random_uuid(),
  documento_id    uuid not null references public.documentos(id) on delete cascade,
  numero_versao   int  not null,
  rotulo          text not null,           -- "Projeto original", "Substitutivo", "Texto aprovado", "Lei"
  data_versao     date,
  url             text,
  storage_path    text,                    -- Supabase Storage, quando houver cópia arquivada
  hash_conteudo   text,                    -- sha256 do arquivo para auditoria
  versao_anterior_id uuid references public.documento_versoes(id),
  fonte_id        uuid references public.fontes(id),
  created_at      timestamptz not null default now(),
  unique (documento_id, numero_versao)
);

-- ---------------------------------------------------------------------------
-- Pessoas, partidos, filiações
-- ---------------------------------------------------------------------------
create table public.pessoas (
  id                 uuid primary key default gen_random_uuid(),
  nome_civil         text not null,
  nome_politico      text,
  data_nascimento    date,
  foto_url           text,
  foto_fonte_id      uuid references public.fontes(id),
  identificadores_externos jsonb not null default '{}'::jsonb, -- ex.: {"tse_sq":"...","camara_id":"..."}
  fonte_id           uuid references public.fontes(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index pessoas_nome_trgm on public.pessoas
  using gin ((coalesce(nome_politico,'') || ' ' || nome_civil) gin_trgm_ops);

create table public.partidos (
  id         uuid primary key default gen_random_uuid(),
  sigla      text not null,
  nome       text not null,
  numero     int,
  ativo      boolean not null default true,
  fonte_id   uuid references public.fontes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sigla)
);

create table public.filiacoes (
  id         uuid primary key default gen_random_uuid(),
  pessoa_id  uuid not null references public.pessoas(id) on delete cascade,
  partido_id uuid not null references public.partidos(id),
  inicio     date,
  fim        date,
  fonte_id   uuid references public.fontes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fim is null or inicio is null or fim >= inicio)
);
create index filiacoes_pessoa_idx on public.filiacoes(pessoa_id);

-- ---------------------------------------------------------------------------
-- Órgãos e cargos
-- ---------------------------------------------------------------------------
create table public.orgaos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  sigla         text,
  poder         text not null check (poder in ('executivo','legislativo','judiciario')),
  esfera        text not null check (esfera in ('federal','estadual','distrital','municipal')),
  localidade_id uuid references public.localidades(id),
  fonte_id      uuid references public.fontes(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.cargos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,        -- ex.: 'deputado_estadual'
  nome        text not null,
  poder       text not null check (poder in ('executivo','legislativo')),
  esfera      text not null check (esfera in ('federal','estadual','distrital','municipal')),
  eletivo     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Número de vagas por cargo/localidade (dado estrutural, com fonte).
create table public.vagas_cargo (
  id            uuid primary key default gen_random_uuid(),
  cargo_id      uuid not null references public.cargos(id),
  localidade_id uuid not null references public.localidades(id),
  quantidade    int  not null check (quantidade > 0),
  vigencia_inicio date,
  vigencia_fim    date,
  fonte_id      uuid references public.fontes(id),
  unique (cargo_id, localidade_id, vigencia_inicio)
);

-- ---------------------------------------------------------------------------
-- Eleições, candidaturas, mandatos
-- ---------------------------------------------------------------------------
create table public.eleicoes (
  id            uuid primary key default gen_random_uuid(),
  ano           int  not null,
  tipo          text not null check (tipo in ('geral','municipal','suplementar')),
  turno         int  not null default 1 check (turno in (1,2)),
  data_votacao  date,
  descricao     text,
  fonte_id      uuid references public.fontes(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (ano, tipo, turno)
);

create table public.candidaturas (
  id              uuid primary key default gen_random_uuid(),
  eleicao_id      uuid not null references public.eleicoes(id),
  pessoa_id       uuid not null references public.pessoas(id),
  cargo_id        uuid not null references public.cargos(id),
  circunscricao_id uuid not null references public.localidades(id),
  partido_id      uuid references public.partidos(id),
  numero_candidato text,
  nome_urna       text,
  votos           bigint check (votos is null or votos >= 0),
  situacao        text,                    -- deferida, indeferida, renúncia...
  resultado       text check (resultado in ('eleito','eleito_por_media','eleito_por_qp','suplente','nao_eleito','segundo_turno','anulado','pendente')),
  fonte_id        uuid references public.fontes(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (eleicao_id, pessoa_id, cargo_id)
);
create index candidaturas_pessoa_idx on public.candidaturas(pessoa_id);
create index candidaturas_eleicao_idx on public.candidaturas(eleicao_id, cargo_id, circunscricao_id);

-- Uma pessoa => N mandatos. Nunca duplicar pessoa por mudança de cargo.
create table public.mandatos (
  id              uuid primary key default gen_random_uuid(),
  pessoa_id       uuid not null references public.pessoas(id),
  cargo_id        uuid not null references public.cargos(id),
  orgao_id        uuid references public.orgaos(id),
  localidade_id   uuid not null references public.localidades(id),
  candidatura_id  uuid references public.candidaturas(id),
  partido_id      uuid references public.partidos(id),
  condicao        text not null default 'titular' check (condicao in ('titular','suplente_exercicio')),
  inicio          date not null,
  fim             date,
  situacao        text not null default 'em_exercicio'
                    check (situacao in ('eleito_nao_empossado','em_exercicio','licenciado','afastado','encerrado','cassado','renunciou')),
  fonte_id        uuid references public.fontes(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);
create index mandatos_pessoa_idx on public.mandatos(pessoa_id);
create index mandatos_cargo_loc_idx on public.mandatos(cargo_id, localidade_id);

-- ---------------------------------------------------------------------------
-- Propostas / projetos
-- ---------------------------------------------------------------------------
create table public.temas (
  id    uuid primary key default gen_random_uuid(),
  nome  text not null unique,
  slug  text not null unique
);

create table public.propostas (
  id               uuid primary key default gen_random_uuid(),
  orgao_id         uuid not null references public.orgaos(id),
  tipo             text not null,          -- PL, PEC, PLC, PDL, REQ...
  numero           text,
  ano              int,
  ementa           text,
  data_apresentacao date,
  situacao         text,
  situacao_final   text check (situacao_final in ('em_tramitacao','aprovada','rejeitada','arquivada','retirada','transformada_em_lei')),
  id_externo       text,
  fonte_id         uuid references public.fontes(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (orgao_id, tipo, numero, ano)
);

create table public.proposta_autores (
  id           uuid primary key default gen_random_uuid(),
  proposta_id  uuid not null references public.propostas(id) on delete cascade,
  pessoa_id    uuid not null references public.pessoas(id),
  mandato_id   uuid references public.mandatos(id),
  papel        text not null default 'autor' check (papel in ('autor','coautor','relator_substitutivo')),
  fonte_id     uuid references public.fontes(id),
  unique (proposta_id, pessoa_id, papel)
);
create index proposta_autores_pessoa_idx on public.proposta_autores(pessoa_id);

create table public.proposta_temas (
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  tema_id     uuid not null references public.temas(id),
  fonte_id    uuid references public.fontes(id), -- quem classificou
  primary key (proposta_id, tema_id)
);

create table public.proposta_documentos (
  proposta_id  uuid not null references public.propostas(id) on delete cascade,
  documento_id uuid not null references public.documentos(id),
  papel        text,
  primary key (proposta_id, documento_id)
);

create table public.proposta_tramitacoes (
  id           uuid primary key default gen_random_uuid(),
  proposta_id  uuid not null references public.propostas(id) on delete cascade,
  data         timestamptz not null,
  sequencia    int,
  orgao_id     uuid references public.orgaos(id),
  descricao    text not null,
  situacao     text,
  fonte_id     uuid references public.fontes(id)
);
create index proposta_tramitacoes_idx on public.proposta_tramitacoes(proposta_id, data);

create table public.proposta_emendas (
  id            uuid primary key default gen_random_uuid(),
  proposta_id   uuid references public.propostas(id) on delete cascade,
  autor_mandato_id uuid references public.mandatos(id),
  tipo          text not null default 'legislativa' check (tipo in ('legislativa','orcamentaria')),
  numero        text,
  ementa        text,
  valor         numeric(18,2),             -- somente emendas orçamentárias
  situacao      text,
  data          date,
  documento_id  uuid references public.documentos(id),
  fonte_id      uuid references public.fontes(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index proposta_emendas_autor_idx on public.proposta_emendas(autor_mandato_id);

-- ---------------------------------------------------------------------------
-- Votações, votos, presença, comissões, discursos, relatorias
-- ---------------------------------------------------------------------------
create table public.votacoes (
  id           uuid primary key default gen_random_uuid(),
  orgao_id     uuid not null references public.orgaos(id),
  proposta_id  uuid references public.propostas(id),
  data         timestamptz not null,
  descricao    text,
  tipo         text,                       -- nominal, simbólica, secreta
  resultado    text,
  id_externo   text,
  fonte_id     uuid references public.fontes(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index votacoes_proposta_idx on public.votacoes(proposta_id);

create table public.votos (
  id          uuid primary key default gen_random_uuid(),
  votacao_id  uuid not null references public.votacoes(id) on delete cascade,
  mandato_id  uuid not null references public.mandatos(id),
  voto        text not null check (voto in ('sim','nao','abstencao','obstrucao','ausente','nao_votou','art17')),
  fonte_id    uuid references public.fontes(id),
  unique (votacao_id, mandato_id)
);
create index votos_mandato_idx on public.votos(mandato_id);

create table public.presencas (
  id           uuid primary key default gen_random_uuid(),
  mandato_id   uuid not null references public.mandatos(id),
  orgao_id     uuid references public.orgaos(id),
  data_sessao  date not null,
  tipo_sessao  text,
  situacao     text not null check (situacao in ('presente','ausente','ausencia_justificada','licenca','missao_oficial')),
  justificativa text,
  fonte_id     uuid references public.fontes(id),
  unique (mandato_id, data_sessao, tipo_sessao)
);
create index presencas_mandato_idx on public.presencas(mandato_id, data_sessao);

create table public.comissoes (
  id         uuid primary key default gen_random_uuid(),
  orgao_id   uuid not null references public.orgaos(id),
  nome       text not null,
  sigla      text,
  tipo       text check (tipo in ('permanente','temporaria','cpi','mista','especial')),
  fonte_id   uuid references public.fontes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membros_comissoes (
  id          uuid primary key default gen_random_uuid(),
  comissao_id uuid not null references public.comissoes(id) on delete cascade,
  mandato_id  uuid not null references public.mandatos(id),
  papel       text not null default 'membro' check (papel in ('presidente','vice_presidente','membro','suplente','relator')),
  inicio      date,
  fim         date,
  fonte_id    uuid references public.fontes(id)
);
create index membros_comissoes_mandato_idx on public.membros_comissoes(mandato_id);

create table public.discursos (
  id           uuid primary key default gen_random_uuid(),
  mandato_id   uuid not null references public.mandatos(id),
  data         timestamptz not null,
  sumario      text,
  transcricao_url text,
  documento_id uuid references public.documentos(id),
  fonte_id     uuid references public.fontes(id)
);
create index discursos_mandato_idx on public.discursos(mandato_id, data);

create table public.relatorias (
  id           uuid primary key default gen_random_uuid(),
  proposta_id  uuid not null references public.propostas(id) on delete cascade,
  mandato_id   uuid not null references public.mandatos(id),
  comissao_id  uuid references public.comissoes(id),
  designacao   date,
  encerramento date,
  parecer      text,                       -- ex.: favorável, contrário (declarado no documento)
  documento_id uuid references public.documentos(id),
  fonte_id     uuid references public.fontes(id)
);
create index relatorias_mandato_idx on public.relatorias(mandato_id);

-- ---------------------------------------------------------------------------
-- Promessas
-- Fato (a promessa dita) é separado da avaliação (interpretação).
-- ---------------------------------------------------------------------------
create table public.promessas (
  id             uuid primary key default gen_random_uuid(),
  pessoa_id      uuid not null references public.pessoas(id),
  candidatura_id uuid references public.candidaturas(id),
  texto          text not null,            -- transcrição literal
  contexto       text,
  data_declaracao date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index promessas_pessoa_idx on public.promessas(pessoa_id);

create table public.promessa_fontes (
  promessa_id uuid not null references public.promessas(id) on delete cascade,
  fonte_id    uuid not null references public.fontes(id),
  primary key (promessa_id, fonte_id)
);

create table public.promessa_avaliacoes (
  id            uuid primary key default gen_random_uuid(),
  promessa_id   uuid not null references public.promessas(id) on delete cascade,
  status        text not null check (status in ('sem_informacao','em_andamento','cumprida','parcialmente_cumprida','nao_cumprida','abandonada')),
  justificativa text not null,
  metodologia   text,
  avaliado_por  uuid references auth.users(id),
  data_avaliacao date not null default current_date,
  fonte_id      uuid not null references public.fontes(id)  -- avaliação sem fonte não é permitida
);

-- ---------------------------------------------------------------------------
-- Processos e decisões
-- ---------------------------------------------------------------------------
create table public.processos (
  id          uuid primary key default gen_random_uuid(),
  pessoa_id   uuid not null references public.pessoas(id),
  tribunal    text,
  numero      text,
  classe      text,
  natureza    text check (natureza in ('criminal','eleitoral','civel','improbidade','administrativo','outro')),
  situacao    text,
  posicao_declarada text,                  -- posição do político/defesa, quando houver
  contexto    text,
  fonte_id    uuid not null references public.fontes(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index processos_pessoa_idx on public.processos(pessoa_id);

create table public.decisoes (
  id           uuid primary key default gen_random_uuid(),
  processo_id  uuid not null references public.processos(id) on delete cascade,
  data         date not null,
  tipo         text,
  orgao_julgador text,
  resumo       text,
  transitou_em_julgado boolean,
  documento_id uuid references public.documentos(id),
  fonte_id     uuid not null references public.fontes(id)
);

-- ---------------------------------------------------------------------------
-- Importação (staging) e perfis administrativos
-- ---------------------------------------------------------------------------
create table public.perfis (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  papel      text not null default 'leitor' check (papel in ('leitor','editor','admin')),
  created_at timestamptz not null default now()
);

create table public.import_lotes (
  id           uuid primary key default gen_random_uuid(),
  provedor     text not null,              -- ex.: 'tse.candidaturas', 'manual.json'
  entidade     text not null,
  descricao    text,
  fonte_id     uuid references public.fontes(id),
  status       text not null default 'staged' check (status in ('staged','em_revisao','aplicado','rejeitado','erro')),
  total_itens  int not null default 0,
  criado_por   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  aplicado_em  timestamptz
);

create table public.import_itens (
  id         uuid primary key default gen_random_uuid(),
  lote_id    uuid not null references public.import_lotes(id) on delete cascade,
  indice     int  not null,
  payload    jsonb not null,
  status     text not null default 'pendente' check (status in ('pendente','valido','invalido','aplicado','ignorado')),
  erros      jsonb,
  unique (lote_id, indice)
);

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id              bigint generated always as identity primary key,
  tabela          text not null,
  registro_id     text,
  operacao        text not null check (operacao in ('INSERT','UPDATE','DELETE')),
  usuario_id      uuid,
  alterado_em     timestamptz not null default now(),
  valor_anterior  jsonb,
  valor_novo      jsonb,
  fonte_id        uuid                      -- fonte relacionada (se a linha tiver fonte_id)
);
create index audit_log_tabela_idx on public.audit_log(tabela, registro_id);
create index audit_log_data_idx on public.audit_log(alterado_em desc);

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_fonte uuid;
begin
  if v_row ? 'fonte_id' and (v_row->>'fonte_id') is not null then
    v_fonte := (v_row->>'fonte_id')::uuid;
  end if;
  insert into public.audit_log(tabela, registro_id, operacao, usuario_id, valor_anterior, valor_novo, fonte_id)
  values (tg_table_name, coalesce(v_row->>'id', v_row->>'user_id'), tg_op, auth.uid(), v_old, v_new, v_fonte);
  return coalesce(new, old);
end $$;

-- Triggers de updated_at e auditoria em todas as tabelas de conteúdo.
do $$
declare t text;
begin
  foreach t in array array[
    'localidades','fontes','documentos','documento_versoes','pessoas','partidos','filiacoes',
    'orgaos','cargos','vagas_cargo','eleicoes','candidaturas','mandatos','temas','propostas',
    'proposta_autores','proposta_temas','proposta_documentos','proposta_tramitacoes','proposta_emendas',
    'votacoes','votos','presencas','comissoes','membros_comissoes','discursos','relatorias',
    'promessas','promessa_fontes','promessa_avaliacoes','processos','decisoes','perfis'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.audit_trigger()', 'trg_audit_'||t, t);
  end loop;

  foreach t in array array[
    'localidades','fontes','documentos','pessoas','partidos','filiacoes','orgaos','eleicoes',
    'candidaturas','mandatos','propostas','proposta_emendas','votacoes','comissoes','promessas','processos'
  ] loop
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.set_updated_at()', 'trg_upd_'||t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Métricas: calculadas, nunca armazenadas. Sempre devolvem o período analisado.
-- ---------------------------------------------------------------------------
create or replace function public.metricas_mandato(
  p_mandato_id uuid,
  p_inicio date default null,
  p_fim date default null
) returns table (
  periodo_inicio date,
  periodo_fim date,
  projetos_apresentados bigint,
  projetos_aprovados bigint,
  votacoes_registradas bigint,
  votos_computados bigint,
  sessoes_registradas bigint,
  sessoes_presente bigint,
  relatorias bigint,
  emendas bigint
) language sql stable as $$
  with m as (
    select id, pessoa_id,
           greatest(inicio, coalesce(p_inicio, inicio)) as ini,
           least(coalesce(fim, current_date), coalesce(p_fim, current_date)) as fi
    from public.mandatos where id = p_mandato_id
  )
  select
    m.ini, m.fi,
    (select count(distinct a.proposta_id) from public.proposta_autores a
       join public.propostas p on p.id = a.proposta_id
      where a.mandato_id = m.id and a.papel in ('autor','coautor')
        and p.data_apresentacao between m.ini and m.fi),
    (select count(distinct a.proposta_id) from public.proposta_autores a
       join public.propostas p on p.id = a.proposta_id
      where a.mandato_id = m.id and a.papel in ('autor','coautor')
        and p.data_apresentacao between m.ini and m.fi
        and p.situacao_final in ('aprovada','transformada_em_lei')),
    (select count(*) from public.votos v join public.votacoes vt on vt.id = v.votacao_id
      where v.mandato_id = m.id and vt.data::date between m.ini and m.fi),
    (select count(*) from public.votos v join public.votacoes vt on vt.id = v.votacao_id
      where v.mandato_id = m.id and vt.data::date between m.ini and m.fi
        and v.voto in ('sim','nao','abstencao','obstrucao')),
    (select count(*) from public.presencas s
      where s.mandato_id = m.id and s.data_sessao between m.ini and m.fi),
    (select count(*) from public.presencas s
      where s.mandato_id = m.id and s.data_sessao between m.ini and m.fi and s.situacao = 'presente'),
    (select count(*) from public.relatorias r
      where r.mandato_id = m.id and coalesce(r.designacao, m.ini) between m.ini and m.fi),
    (select count(*) from public.proposta_emendas e
      where e.autor_mandato_id = m.id and coalesce(e.data, m.ini) between m.ini and m.fi)
  from m;
$$;

-- Contagem de mandatos vigentes por cargo/localidade (usado na home).
create or replace view public.v_mandatos_vigentes_por_cargo
with (security_invoker = true) as
select m.localidade_id, c.codigo as cargo_codigo, c.nome as cargo_nome, count(*) as total
from public.mandatos m
join public.cargos c on c.id = m.cargo_id
where m.situacao in ('em_exercicio','licenciado','afastado','eleito_nao_empossado')
  and (m.fim is null or m.fim >= current_date)
group by m.localidade_id, c.codigo, c.nome;
