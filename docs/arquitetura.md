# Arquitetura

## Visão

MANDATO é uma **data platform** com uma interface web, não apenas um site. Web e futuro app mobile consomem a mesma camada de dados (Supabase: PostgREST + RPC + Auth).

```
UI (React) → services → repositories → database/client (Supabase) → PostgreSQL + RLS
                  ↑
               domain (tipos e regras puras, sem I/O)

imports: ImportProvider → staging (import_lotes/import_itens) → revisão → tabelas finais
```

## Camadas e regras

| Camada | Pode | Não pode |
|---|---|---|
| `ui` | renderizar, chamar services/repositories | conter regra de negócio, acessar `supabase` direto |
| `services` | orquestrar casos de uso, validar | renderizar |
| `repositories` | consultas ao banco | regra de negócio |
| `domain` | tipos e funções puras | I/O |
| `imports` | parsear fontes externas | gravar em tabelas finais |

> Nesta etapa, algumas páginas ainda chamam repositories diretamente (listas simples). Deve migrar para services quando houver regra.

## Decisões

1. **Sem backend próprio por enquanto.** Supabase (RLS + RPC) é a API. Quando houver coleta pesada, entram Edge Functions/workers, sem mudar o contrato.
2. **Localização genérica** (`localidades`: país > estado > município). Cargos e órgãos são dados.
3. **Pessoa única, N mandatos.**
4. **Métricas calculadas** via `metricas_mandato(mandato, inicio, fim)`, que devolve o período analisado.
5. **Auditoria por trigger** em todas as tabelas de conteúdo (`audit_log`: quem, quando, antes, depois, fonte).
6. **Staging de importação**: nada entra em tabela final sem revisão.
7. **Segurança**: leitura pública; escrita por `editor/admin` via `perfis` + RLS; exclusão só `admin`. O guard do frontend é apenas UX.

## Futuro

API pública (views versionadas/Edge Functions), mobile (mesmo Supabase), notificações, IA (apenas resumos com citação de fonte; nunca julgamento).
