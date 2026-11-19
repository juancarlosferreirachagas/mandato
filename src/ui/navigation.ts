/**
 * ============================================================================
 * MAPA DE NAVEGAÇÃO PRINCIPAL — FISCALIZA GUARULHOS
 * Projeto: Fiscaliza Guarulhos (Escopo 100% Municipal — IBGE 3518800)
 * ============================================================================
 *
 * Define a estrutura de rotas públicas da plataforma, garantindo consistência
 * entre o cabeçalho desktop, o menu gaveta (drawer) e a barra inferior mobile.
 * ============================================================================
 */

export interface Secao {
  /** Caminho relativo da rota no React Router (vazio para a Home `/`) */
  path: string;
  /** Rótulo objetivo exibido nos menus de navegação */
  label: string;
  /** Descrição curta explicativa exibida no menu mobile e metadados */
  descricao: string;
  /** Identificador semântico do ícone vetorial (Lucide) */
  iconeId: 'home' | 'financas' | 'despesas' | 'decretos' | 'politicos' | 'fontes' | 'privacidade';
}

/**
 * Seções oficiais do menu principal do Fiscaliza Guarulhos.
 */
export const SECOES: Secao[] = [
  {
    path: '',
    label: 'Início',
    descricao: 'Painel executivo do orçamento, fornecedores e política de Guarulhos.',
    iconeId: 'home',
  },
  {
    path: 'financas',
    label: 'Receitas & Gastos',
    descricao: 'De onde vem cada imposto ou repasse e para qual área da cidade ele vai.',
    iconeId: 'financas',
  },
  {
    path: 'despesas',
    label: 'Fornecedores',
    descricao: 'Ranking auditável das 3.798 empresas e entidades pagas pela Prefeitura e Câmara.',
    iconeId: 'despesas',
  },
  {
    path: 'decretos',
    label: 'Decretos & Diários',
    descricao: 'Diários Oficiais extraídos e decretos explicados: de onde saiu e para onde foi.',
    iconeId: 'decretos',
  },
  {
    path: 'politicos',
    label: 'Prefeito & Vereadores',
    descricao: 'Crachá cívico, biografias, comissões e 334 projetos da 19ª Legislatura.',
    iconeId: 'politicos',
  },
  {
    path: 'fontes',
    label: 'Fontes Ao Vivo',
    descricao: 'Validação em tempo real junto ao TCE-SP, DOM-GRU, Câmara, TSE e IBGE.',
    iconeId: 'fontes',
  },
  {
    path: 'privacidade',
    label: 'LGPD',
    descricao: 'Conformidade legal, segurança da informação e Lei de Acesso à Informação.',
    iconeId: 'privacidade',
  },
];
