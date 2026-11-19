# 00 · Contexto Geral — Fiscaliza Guarulhos (Base RAG)

> **Propósito deste documento:** Dar contexto completo do projeto em menos de 1 minuto de leitura para qualquer agente de IA, evitando varreduras repetitivas no código.

---

## 1. Identidade do Projeto
- **Nome:** Fiscaliza Guarulhos
- **URL em Produção (Vercel):** `https://fiscalizaguarulhos.vercel.app` (alias `https://mandato-flax.vercel.app`)
- **Domínio Registrado / Alvo:** `fiscalizaguarulhos.com.br`
- **Escopo Geográfico:** 100% restrito ao município de **Guarulhos - SP** (Código IBGE `3518800`, população `1.291.771` hab., área `318,68 km²`).
- **Missão:** Plataforma cívica de controle social e auditoria cidadã que traduz gastos públicos, receitas, fornecedores, quadro societário (CNPJ/QSA) e atuação do Prefeito, Vice e 34 Vereadores de Guarulhos para qualquer cidadão leigo ou jornalista investigativo.
- **Referência de UX/Engenharia Reversa:** `politicometro.org` adaptado com as cores oficiais da Bandeira de Guarulhos.

---

## 2. Decisões de Produto Consolidada
1. **Sem Módulo Waze / Relatos Anônimos de Rua:** Removido (`MapaProblemasPage.tsx` e `ocorrenciasRepository.ts` excluídos) para blindar o projeto juridicamente (LGPD, moderação de imagens de terceiros e custo zero de storage).
2. **Mapa Vetorial Mantido:** Usa-se apenas o [`GuarulhosSvgMap.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/components/GuarulhosSvgMap.tsx) com as 8 macrorregiões administrativas de Guarulhos e dados oficiais.
3. **Sem Links de API JSON Crus:** O usuário nunca é jogado para um JSON bruto. Pagamentos e fontes abrem comprovantes/modais visuais dentro do próprio app (`🔍 Ver Comprovante`).
4. **Conformidade LGPD & Segurança:** Página dedicada em [`PoliticaPrivacidadePage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/PoliticaPrivacidadePage.tsx) (`/privacidade`). Zero coleta de dados de visitantes, banco read-only no frontend, amparo na LAI (`Lei 12.527/2011`), Lei da Transparência (`LC 131/2009`) e `Art. 7º, §3º da LGPD`.

---

## 3. Stack Tecnológica (Custo Zero & Latência Baixíssima)
- **Frontend:** React 18 + TypeScript + Vite 5 + React Router 6 + Lucide React (`lucide-react`).
- **Banco de Dados Online:** Supabase (PostgreSQL) — Projeto `yusuaphkgbytgplfrddf` (`https://yusuaphkgbytgplfrddf.supabase.co`).
- **Processamento Pesado Local (Offline ETL):** Node.js (`tsx`) + Python/DuckDB para cruzar gigabytes da Receita Federal (CNPJ/QSA) no PC local e subir apenas o subconjunto enxuto dos ~3.800 fornecedores de Guarulhos para o Supabase.
- **Hospedagem:** Vercel CDN (Edge).

---

## 4. Status Atual das Telas
| Rota | Arquivo Principal | Status | O que exibe |
|---|---|---|---|
| `/` | [`src/ui/pages/HomePage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/HomePage.tsx) | ✅ No ar (Modernizado com Lucide + Decretos) | Hero executivo, 4 KPIs ao vivo, amostra de Decretos Orçamentários, 8 Áreas Temáticas, Evolução Mensal e Top Fornecedores |
| `/financas` | [`src/ui/pages/FinancasPage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/FinancasPage.tsx) | ✅ No ar | Comparativo Receitas × Despesas (R$ 5,74 bi vs R$ 4,28 bi), árvore de impostos explicada e gasto por área |
| `/despesas` | [`src/ui/pages/DespesasPage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/DespesasPage.tsx) | ✅ No ar | Ranking paginado dos 3.798 fornecedores com filtros rápidos por setor, mês, órgão e CNPJ/PF |
| `/despesas/credor/:chave` | [`src/ui/pages/CredorDetalhePage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/CredorDetalhePage.tsx) | ✅ No ar | Histórico completo da empresa, gráfico mensal, órgãos pagadores e modal de Comprovante de Auditoria |
| `/decretos` | [`src/ui/pages/DecretosAuditoriaPage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/DecretosAuditoriaPage.tsx) | ✅ No ar (Novo Módulo de Auditoria) | Decretos Orçamentários explicados ("De onde saiu → Para onde foi"), Diários Oficiais extraídos (DOM-GRU) e Validação em Tempo Real |
| `/politicos` | [`src/ui/pages/PoliticosPage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/PoliticosPage.tsx) | ✅ No ar | Prefeito, Vice e 34 Vereadores (19ª Legislatura 2025–2028) com fotos oficiais, filtros de cargo e partido |
| `/politicos/:id` | [`src/ui/pages/PerfilPage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/PerfilPage.tsx) | ✅ No ar | Crachá completo, biografia, comissões e 334 proposições com linha do tempo "No que deu" |
| `/fontes` | [`src/ui/pages/SecaoPage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/SecaoPage.tsx) | ✅ No ar (Telemetria Ao Vivo) | Validação em tempo real das 6 fontes oficiais (latência ms + checksum SHA-256) e log de coletas AUDESP |
| `/privacidade` | [`src/ui/pages/PoliticaPrivacidadePage.tsx`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/pages/PoliticaPrivacidadePage.tsx) | ✅ No ar | LGPD, Arquitetura de Segurança e Bases Legais (CF/88 e LAI) |

