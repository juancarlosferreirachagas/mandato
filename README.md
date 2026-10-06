# MANDATO

> **Acompanhe quem foi eleito. Veja o que fez.**

Plataforma independente, factual e auditável de acompanhamento político brasileiro. Começa por São Paulo (eleições 2026), com arquitetura pronta para todos os estados e cargos.

**Princípio editorial:** FATO → FONTE → INTERPRETAÇÃO. Nenhum dado é inventado; nenhum político é classificado. Veja [docs/regras-editoriais.md](docs/regras-editoriais.md).

## Estado atual (Etapa 1)

- Schema relacional + RLS + auditoria + seed **estrutural** (sem políticos).
- Frontend React + TypeScript: home, perfil (11 abas, timeline, métricas), admin (fontes, importação em staging, auditoria).
- Camada de importação abstrata (`ImportProvider`). **Nenhum provedor oficial implementado ainda.**
- Nenhum dado fictício.

## Executar localmente

Requisitos: Node 20+, Docker (para Supabase local) e Supabase CLI.

```bash
npm install
npx supabase init          # uma vez (gera supabase/config.toml)
npx supabase start         # sobe Postgres/Auth local
npx supabase db reset      # aplica migrations + seed.sql
cp .env.example .env       # preencha com URL e anon key do `supabase status`
npm run dev
```

Para criar o primeiro admin: crie o usuário em Supabase Studio (Auth) e rode no SQL editor:

```sql
insert into public.perfis (user_id, nome, papel)
values ('<uuid-do-usuario>', 'Seu nome', 'admin');
```

## Estrutura

```
supabase/migrations   schema, RLS, auditoria, métricas
supabase/seed.sql     apenas dados estruturais
src/domain            tipos e regras puras
src/database          cliente Supabase
src/repositories      acesso a dados (únicos que falam com o banco)
src/services          casos de uso
src/imports           contrato de provedores de importação
src/ui                componentes, páginas, admin, estilos
docs/                 arquitetura, modelo, regras, fontes, roadmap
```

Scripts: `npm run dev`, `npm run typecheck`, `npm run build`.

## Carregar os eleitos (fonte oficial TSE)

1. Baixe em https://dadosabertos.tse.jus.br os arquivos de **candidatos** (`consulta_cand_2026_SP.csv`) e de **vota��o por candidato** (`votacao_candidato_munzona_2026_SP.csv`) e coloque em `data/` (ignorado pelo git).
2. `cp .env.import.example .env.import` e preencha (`SUPABASE_SERVICE_ROLE_KEY` fica s� na sua m�quina).
3. Simular: `node --env-file=.env.import scripts/import-tse.mjs --uf SP --ano 2026 --turno 1 --consulta data/consulta_cand_2026_SP.csv --votacao data/votacao_candidato_munzona_2026_SP.csv --fonte-url <url-do-arquivo> --dry-run`
4. Rodar sem `--dry-run`. Repita com `--turno 2` se houver.
5. Fotos de federais: `node --env-file=.env.import scripts/import-fotos-camara.mjs`.

O CPF nunca � armazenado (somente HMAC). O importador valida as colunas e para se o layout do TSE mudou.

## Deploy

- **Supabase**: `npx supabase link --project-ref <ref>` e `npx supabase db push` (aplica migrations); rode `supabase/seed.sql` uma vez no SQL editor.
- **Vercel**: importe o reposit�rio do GitHub; vari�veis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. `vercel.json` j� cobre o roteamento SPA.
