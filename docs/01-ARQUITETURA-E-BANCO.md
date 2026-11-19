# 01 · Arquitetura de Pastas e Banco de Dados

## 1. Mapa de Arquivos Relevantes (`src/`)

```text
c:\Users\Juan\Desktop\MANDATO\
├─ .agent/rules/00-indice-rag.md      # Regra lida automaticamente pela IA
├─ docs/                              # Base de conhecimento RAG do projeto
├─ public/bandeira-guarulhos.png      # Bandeira oficial de Guarulhos
├─ scripts/
│  └─ fetch-tcesp.ts                  # ETL atual de despesas do TCE-SP (Audesp)
├─ supabase/
│  └─ migrations/                     # SQL de tabelas, índices e RPCs/Views
└─ src/
   ├─ database/client.ts              # Cliente Supabase (somente leitura no app)
   ├─ domain/                         # Tipos TypeScript e regras de negócio
   ├─ repositories/
   │  ├─ despesasRepository.ts        # Consultas de gastos, áreas, credores e pagamentos
   │  ├─ receitasRepository.ts        # Consultas de arrecadação e fontes de receita
   │  ├─ pessoaRepository.ts          # Prefeito, Vice e 34 Vereadores (mandatos/candidaturas)
   │  ├─ abasRepository.ts            # Propostas (PL/REQ/IND), comissões, votações
   │  └─ adminRepositories.ts         # Fontes oficiais e logs de coleta
   └─ ui/
      ├─ App.tsx                      # Rotas principais
      ├─ navigation.ts                # Itens do menu superior e mobile
      ├─ format.ts                    # Formatação de moeda (brl, brlCompacto), datas e CNPJ
      ├─ layout/PublicLayout.tsx      # Topbar com bandeira, menu mobile e rodapé
      ├─ components/
      │  ├─ AreaDetalheModal.tsx      # Modal dos 30 maiores recebedores de uma área
      │  ├─ GuarulhosSvgMap.tsx       # Mapa vetorial das 8 macrorregiões de Guarulhos
      │  ├─ Graficos.tsx              # BarrasMensais e BarraHorizontal
      │  ├─ PartyBadge.tsx            # Emblema de partido político
      │  └─ common.tsx                # Loading, ErrorBox, EmptyState, FonteRef
      ├─ pages/                       # Páginas listadas no 00-CONTEXTO-GERAL.md
      └─ styles/
         ├─ global.css                # Reset e variáveis base
         └─ fiscaliza.css             # Design System com as cores de Guarulhos
```

---

## 2. Tabelas Principais no Supabase (`yusuaphkgbytgplfrddf`)

### Módulo Financeiro (TCE-SP Audesp)
- **`despesas_municipais`** (ou tabela/views equivalentes consultadas por `despesasRepository.ts`):
  - Armazena cada pagamento/empenho liquidado por Prefeitura, Câmara, IPREM e Proguaru.
  - Campos-chave: `exercicio`, `mes`, `data_pagamento`, `orgao`, `credor`, `cnpj_credor`, `tipo_credor` (`PJ`/`PF`), `valor_liquido`, `historico`, `num_empenho`, `fonte_recurso`.
- **`receitas_municipais`** (consultada por `receitasRepository.ts`):
  - Arrecadação mensal por categoria, subcategoria (origem), rubrica e fonte de recurso.

### Módulo Político & Legislativo (Câmara de Guarulhos + TSE)
- **`pessoas`**: `id`, `nome_civil`, `nome_politico`, `data_nascimento`, `foto_url`, `identificadores_externos` (JSONB com `biografia_completa`, `grau_instrucao`, `ocupacao`, `cargo_mesa_diretora`, `email_gabinete`, `telefone_gabinete`, `numero_urna`).
- **`mandatos`**: vincula `pessoa_id` ao `cargo_id` (`prefeito`, `vice_prefeito`, `vereador`), `partido_id`, `localidade_id` (`GRU`), `situacao` (`em_exercicio`).
- **`candidaturas`**: votos oficiais no TSE em 2024 (`votos`, `numero_candidato`, `resultado`).
- **`propostas` & `proposta_autores`**: 334 projetos de lei (`PL`), requerimentos (`REQ`), indicações (`IND`) e decretos legislativos (`DL`) da Câmara de Guarulhos.
- **`comissoes` & `membros_comissoes`**: participação nas comissões permanentes da Câmara.
- **`fontes` & `execucoes_coleta`**: rastreabilidade de auditoria de cada dado importado.

---

## 3. Próximas Tabelas Planejadas (Módulo Ouro de Auditoria CNPJ/QSA)
Para cruzar fornecedores e sócios em comum com **latência zero** no frontend:
1. **`fornecedores_rfb`**:
   - `cnpj` (PK, 14 dígitos), `razao_social`, `nome_fantasia`, `data_abertura`, `capital_social`, `cnae_principal_codigo`, `cnae_principal_descricao`, `situacao_cadastral`, `municipio`, `uf`, `logradouro`, `cep`.
2. **`fornecedores_socios`** (Quadro de Sócios e Administradores — QSA):
   - `id`, `cnpj` (FK), `nome_socio`, `cpf_cnpj_mascarado` (`***123456**` — padrão público da Receita/LGPD), `qualificacao_socio`, `data_entrada_sociedade`, `faixa_etaria`.
3. **View Materializada `vw_alertas_socios_em_comum`**:
   - Agrupa por `(nome_socio, cpf_cnpj_mascarado)` tendo `COUNT(DISTINCT cnpj) >= 2` entre os CNPJs que receberam pagamentos em Guarulhos, somando o total recebido pelo grupo econômico!

