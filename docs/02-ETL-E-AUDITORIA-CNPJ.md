# 02 · Guia de ETL Automatizado & Auditoria de CNPJs (Receita Federal + DuckDB)

> Este documento serve tanto de **especificação técnica para a IA** quanto de **apostila prática de Engenharia de Dados** para você aprender SQL, Linux/WSL e ETL na prática.

---

## 1. O que é ETL e como funciona no Fiscaliza Guarulhos

**ETL** significa **Extract (Extrair) → Transform (Transformar) → Load (Carregar)**.
Em vez de o site fazer contas pesadas toda vez que um morador abre a página (o que deixaria lento e caro), nós fazemos o trabalho pesado antes:

```text
[Fontes Públicas] ──(1. Extract)──> [Script Local / GitHub Action]
                                           │
                                    (2. Transform: limpa e cruza no DuckDB)
                                           │
                                    (3. Load: salva só o resumo limpo)
                                           ▼
                                  [Supabase PostgreSQL]
                                           │
                                  (Views pré-calculadas)
                                           ▼
                              [Site Rápido na Vercel CDN]
```

---

## 2. Como cruzar os 3.798 Fornecedores de Guarulhos com a Receita Federal (Custo Zero)

### Por que usar o DuckDB no seu PC?
A Receita Federal publica mensalmente os dados abertos de **todos os CNPJs do Brasil** (`Empresas`, `Estabelecimentos` e `Socios`).
- O conjunto inteiro tem mais de **50 milhões de empresas** (dezenas de GB).
- Mas Guarulhos pagou para apenas **~3.000 CNPJs distintos**!
- Com o **DuckDB** rodando no seu PC (que agora tem 118 GB livres), você filtra esses 3.000 CNPJs em poucos segundos usando SQL puro e gera um arquivo de **menos de 5 MB** para subir no Supabase gratuito!

### Exemplo real da Query SQL no DuckDB (para seu estudo de Banco de Dados)
```sql
-- 1. Lê a lista dos CNPJs que receberam dinheiro da Prefeitura/Câmara de Guarulhos
CREATE TEMP TABLE cnpjs_guarulhos AS
SELECT DISTINCT regexp_replace(cnpj_credor, '[^0-9]', '', 'g') AS cnpj
FROM read_csv_auto('dados/credores_guarulhos.csv')
WHERE length(regexp_replace(cnpj_credor, '[^0-9]', '', 'g')) = 14;

-- 2. Filtra apenas os sócios dessas empresas direto do arquivo da Receita Federal
CREATE TABLE socios_guarulhos AS
SELECT
  s.cnpj_basico,
  c.cnpj,
  s.nome_socio,
  s.cpf_cnpj_socio AS cpf_mascarado,
  s.qualificacao_socio,
  s.data_entrada_sociedade
FROM read_csv('dados/Socios*.csv', delim=';', header=false, columns={
  'cnpj_basico': 'VARCHAR',
  'identificador_socio': 'VARCHAR',
  'nome_socio': 'VARCHAR',
  'cpf_cnpj_socio': 'VARCHAR',
  'qualificacao_socio': 'VARCHAR',
  'data_entrada_sociedade': 'VARCHAR',
  'pais': 'VARCHAR',
  'representante_legal': 'VARCHAR',
  'nome_representante': 'VARCHAR',
  'qualificacao_representante': 'VARCHAR',
  'faixa_etaria': 'VARCHAR'
}) s
JOIN cnpjs_guarulhos c ON substr(c.cnpj, 1, 8) = s.cnpj_basico;

-- 3. Descobre SÓCIOS EM COMUM entre fornecedores diferentes da Prefeitura!
SELECT
  nome_socio,
  cpf_mascarado,
  COUNT(DISTINCT cnpj) AS qtd_empresas_fornecedoras,
  LIST(DISTINCT cnpj) AS lista_cnpjs
FROM socios_guarulhos
GROUP BY nome_socio, cpf_mascarado
HAVING COUNT(DISTINCT cnpj) >= 2
ORDER BY qtd_empresas_fornecedoras DESC;
```

---

## 3. Os 6 Indicadores de Auditoria Cidadã ("Ouro para Jornalistas")

Na página de cada fornecedor (`/despesas/credor/:chave`) e na futura página `/auditoria`, podemos exibir:

1. **Rede Societária (Sócios em Comum):**
   - *"O sócio X (CPF `***123.456-**`) também figura no quadro societário de outra(s) empresa(s) que receberam R$ Y da Prefeitura de Guarulhos."*
2. **Tempo de Existência vs. Primeiro Pagamento:**
   - Compara a `data_abertura` do CNPJ na Receita com a data do `primeiro_pagamento` na Prefeitura (ex.: empresa aberta há menos de 6 meses antes de receber).
3. **Proporção Capital Social × Contratos Recebidos:**
   - Compara o `capital_social` declarado na Receita com o `total_liquido` recebido no ano.
4. **Coincidência de Endereço / Contador / Telefone:**
   - Fornecedores distintos registrados exatamente no mesmo endereço e sala comercial.
5. **Compatibilidade de CNAE (Atividade Econômica):**
   - Mostra o ramo oficial da empresa na Receita ao lado do histórico do que ela vendeu para a Prefeitura.
6. **Cruzamento com Doações Eleitorais (TSE Prestação de Contas 2024):**
   - Verifica se os sócios aparecem na base pública de doadores de campanha do TSE em Guarulhos.

---

## 4. Blindagem Jurídica e LGPD Obrigatória
- **Nunca usar termos acusatórios:** Proibido usar palavras como *"fraude"*, *"laranja"*, *"superfaturamento"* ou *"esquema"*. Usar sempre: **"Vínculo societário registrado na Receita Federal"** ou **"Ponto de atenção para análise documental"**.
- **CPF sempre mascarado (`***123.456-**`):** Exatamente no formato público fornecido pela própria Receita Federal e TSE, respeitando a LGPD.

