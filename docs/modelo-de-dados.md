# Modelo de dados

Arquivo fonte: `supabase/migrations/20261006000001_schema.sql`.

## Núcleo

```
localidades(pais>estado>municipio)
pessoas ─┬─ filiacoes ── partidos
         ├─ candidaturas ── eleicoes, cargos, localidades(circunscrição)
         ├─ mandatos ── cargos, orgaos, localidades, candidaturas
         ├─ promessas ── promessa_fontes, promessa_avaliacoes
         └─ processos ── decisoes
mandatos ─┬─ proposta_autores ── propostas ── proposta_temas/documentos/tramitacoes/emendas
          ├─ votos ── votacoes ── propostas
          ├─ presencas
          ├─ membros_comissoes ── comissoes ── orgaos
          ├─ relatorias
          └─ discursos
fontes ← (fonte_id em quase todas as tabelas)
documentos ── documento_versoes (encadeadas por versao_anterior_id)
```

## Fontes

Campos: tipo, órgão, título, URL, data de publicação, data de consulta, identificador externo, observações.
`fonte_id` é **nullable** nas tabelas de importação (para permitir carga em etapas) mas **NOT NULL** onde a afirmação é sensível: `promessa_avaliacoes`, `processos`, `decisoes`. A UI exibe “sem fonte” explicitamente.

## Versionamento de documentos

`documentos` (1) → `documento_versoes` (N): original → substitutivo → emendas → texto aprovado → lei, com hash e `storage_path` opcional.

## Métricas

Não há colunas de contagem. Use `metricas_mandato(mandato_id, inicio, fim)`.

## Auditoria

`audit_log` populado por trigger `audit_trigger()`; `fonte_id` é copiado da linha alterada quando existir.

## Extensibilidade

Novo cargo = nova linha em `cargos`; novo estado/município = linha em `localidades`. Nenhum campo é específico de SP.

## Pontos em aberto

- `candidaturas.resultado` e `mandatos.situacao` usam CHECK; revisar vocabulário com dados reais do TSE.
- Suplentes/substituições dentro de um mesmo mandato.
- Partido por mandato vs. filiação datada (hoje ambos existem).
