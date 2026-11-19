---
description: Índice RAG do projeto Fiscaliza Guarulhos e regras de economia de tokens
---

# Regra de Contexto & Economia de Tokens — Fiscaliza Guarulhos

Sempre que iniciar uma tarefa neste workspace (`c:\Users\Juan\Desktop\MANDATO`), **NÃO faça buscas cegas pelo código**. Consulte diretamente a base de conhecimento consolidada em `docs/`:

1. [`docs/00-CONTEXTO-GERAL.md`](file:///c:/Users/Juan/Desktop/MANDATO/docs/00-CONTEXTO-GERAL.md) — Visão geral, URLs, escopo 100% Guarulhos, status atual e roadmap.
2. [`docs/01-ARQUITETURA-E-BANCO.md`](file:///c:/Users/Juan/Desktop/MANDATO/docs/01-ARQUITETURA-E-BANCO.md) — Mapa exato das pastas, tabelas do Supabase (`yusuaphkgbytgplfrddf`) e repositórios.
3. [`docs/02-ETL-E-AUDITORIA-CNPJ.md`](file:///c:/Users/Juan/Desktop/MANDATO/docs/02-ETL-E-AUDITORIA-CNPJ.md) — Arquitetura de dados automatizados (ETL), cruzamento de CNPJs/Sócios (QSA Receita Federal + DuckDB) e regras jurídicas/LGPD.
4. [`docs/03-DESIGN-SYSTEM-GUARULHOS.md`](file:///c:/Users/Juan/Desktop/MANDATO/docs/03-DESIGN-SYSTEM-GUARULHOS.md) — Paleta oficial da Bandeira de Guarulhos, tipografia, ícones Lucide e diretrizes de UI sem excesso de cards.
5. [`docs/04-CAIXA-DE-ENTRADA-GEMINI.md`](file:///c:/Users/Juan/Desktop/MANDATO/docs/04-CAIXA-DE-ENTRADA-GEMINI.md) — Arquivo onde o usuário cola conversas externas, pesquisas ou ideias novas para absorção imediata.

## Regras Operacionais Obrigatórias
- **Economia de Tokens**: Não execute `npm run build` ou deploy na Vercel a menos que o usuário peça explicitamente. Prefira editar os arquivos e deixar o usuário validar.
- **Escopo 100% Municipal**: Apenas dados de **Guarulhos** (IBGE `3518800`). Sem módulo Waze colaborativo (removido por decisão de segurança/LGPD).
- **Tom Editorial e Jurídico**: Neutro, auditável (`FATO → FONTE → DADOS AUDITÁVEIS`), sem acusações, exibindo sempre a fonte pública oficial.

