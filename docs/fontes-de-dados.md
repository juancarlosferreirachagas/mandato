# Fontes de dados

> Status: **nenhuma integração implementada.** A lista abaixo é plano, a ser verificado contra a documentação atual de cada órgão antes de implementar.

| Dado | Fonte candidata | Observação |
|---|---|---|
| Candidaturas, votos, resultados | TSE — Dados Abertos / DivulgaCandContas | Arquivos CSV por eleição |
| Deputados federais, proposições, votações, presença | API de Dados Abertos da Câmara | |
| Senadores, matérias, votações | Dados Abertos do Senado | |
| Deputados estaduais SP | ALESP — dados abertos / site | Formato a verificar |
| Processos/decisões | Tribunais (STF, STJ, TSE, TJSP) | Sempre com número do processo e URL |
| Localidades | IBGE | Códigos já usados no seed das UFs |

## Como adicionar um provedor

1. Criar `src/imports/providers/<nome>.ts` implementando `ImportProvider`.
2. Registrar em `src/imports/registry.ts`.
3. Cadastrar a fonte em Admin → Fontes e enviar o lote para staging.
4. Revisar e aplicar (etapa futura).

Todo lote exige `fonte_id`.
