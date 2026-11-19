# 03 · Design System Oficial — Bandeira de Guarulhos & Clareza Editorial

## 1. Paleta Oficial (Inspirada na Bandeira de Guarulhos)
Definida em [`src/ui/styles/fiscaliza.css`](file:///c:/Users/Juan/Desktop/MANDATO/src/ui/styles/fiscaliza.css):
- **Azul Institucional (`--gru-blue: #162b4d` / `--gru-blue-light: #1e3a68`):** Cor principal de autoridade, cabeçalho, hero e números principais.
- **Vermelho Cívico (`--gru-red: #c5221f` / `--gru-red-dark: #9b1916`):** Usado com precisão cirúrgica em bordas de destaque, aba ativa, botão de busca e alertas importantes.
- **Dourado Heráldico (`--gru-gold: #d4a017`):** Detalhes nobres do brasão.
- **Superfícies Limpas (`--fg-surface: #ffffff` sobre `--fg-bg: #f4f6fa`):** Alto contraste para leitura confortável no celular e no computador.

---

## 2. Regras de Ouro de UI/UX (Anti-Poluição Visual)
1. **Proibido "Card dentro de Card":**
   - Se uma seção já está dentro de um bloco branco (`.fg-card`), os itens internos devem usar **linhas divisórias finas (`border-bottom: 1px solid var(--fg-border-light)`)** ou tabelas limpas, nunca outras caixas com borda e sombra dentro da caixa.
2. **Zero Emojis Soltos na Interface Principal → Usar Ícones `lucide-react`:**
   - Substituir emojis infantis (`🏠`, `📈`, `💰`, `🏛️`, `🔍`) por ícones vetoriais limpos da biblioteca `lucide-react` (`Landmark`, `TrendingUp`, `Building2`, `Users`, `ShieldCheck`, `Search`, `FileCheck2`, `Scale`, `ArrowUpRight`), que já está instalada no `package.json`.
3. **Tipografia Editorial + Monoespaçada para Dinheiro:**
   - Textos e títulos em `Plus Jakarta Sans`.
   - Valores em reais (`R$`), percentuais (`%`) e CNPJs com `font-variant-numeric: tabular-nums` e `JetBrains Mono` para alinhamento vertical perfeito em tabelas.
4. **Hierarquia "Leigo + Jornalista" em 3 Camadas:**
   - **Camada 1 (5 segundos — Leigo):** Título direto com conclusão + Número grande + Frase *"Na prática: o que isso paga na sua rua"*.
   - **Camada 2 (30 segundos — Curioso):** Gráfico de barras ou lista dos maiores recebedores com percentual.
   - **Camada 3 (Auditoria — Jornalista):** Botão `Ver Comprovante / Quadro Societário` com CNPJ, número de empenho, órgão pagador e link oficial do TCE-SP / Receita Federal.

