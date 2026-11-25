/**
 * ============================================================================
 * MAPA DE NAVEGAÇÃO PRINCIPAL — FISCALIZA GUARULHOS
 * ============================================================================
 *
 * Uma única lista alimenta o menu do computador, o menu lateral (gaveta) do
 * celular, a barra inferior e o rodapé — assim todos os links ficam sempre
 * iguais e apontam para rotas que existem no `App.tsx`.
 * ============================================================================
 */

export type IconeSecaoId =
  | 'home'
  | 'financas'
  | 'despesas'
  | 'decretos'
  | 'politicos'
  | 'fontes'
  | 'privacidade';

export interface Secao {
  /** Caminho no React Router, sem a barra inicial (vazio = Início) */
  path: string;
  /** Nome completo (menu do computador, gaveta, títulos) */
  label: string;
  /** Nome curto (barra inferior do celular) */
  labelCurto: string;
  /** Frase simples que explica a seção */
  descricao: string;
  iconeId: IconeSecaoId;
}

export const SECOES: Secao[] = [
  {
    path: '',
    label: 'Início',
    labelCurto: 'Início',
    descricao: 'Resumo do dinheiro público de Guarulhos.',
    iconeId: 'home',
  },
  {
    path: 'financas',
    label: 'Receitas e Gastos',
    labelCurto: 'Gastos',
    descricao: 'De onde vem o dinheiro da cidade e em que ele é usado.',
    iconeId: 'financas',
  },
  {
    path: 'despesas',
    label: 'Fornecedores',
    labelCurto: 'Empresas',
    descricao: 'Empresas e entidades que mais recebem da Prefeitura e da Câmara.',
    iconeId: 'despesas',
  },
  {
    path: 'decretos',
    label: 'Diários e Decretos',
    labelCurto: 'Diários',
    descricao: 'Diários Executivo e Legislativo, leis, decretos e quebra-cabeça do orçamento.',
    iconeId: 'decretos',
  },
  {
    path: 'politicos',
    label: 'Vereadores',
    labelCurto: 'Câmara',
    descricao: 'Prefeito, vice e vereadores: perfil, votos e projetos.',
    iconeId: 'politicos',
  },
  {
    path: 'fontes',
    label: 'Fontes',
    labelCurto: 'Fontes',
    descricao: 'De onde vêm os dados e como conferir cada um.',
    iconeId: 'fontes',
  },
  {
    path: 'privacidade',
    label: 'Privacidade',
    labelCurto: 'LGPD',
    descricao: 'Como cuidamos dos dados e o que diz a LGPD.',
    iconeId: 'privacidade',
  },
];

/** Rota absoluta de uma seção ("" vira "/"). */
export const rotaDaSecao = (s: Secao): string => (s.path ? `/${s.path}` : '/');

/** Diz se a seção deve aparecer como ativa para o caminho atual (inclui subpáginas). */
export const secaoAtiva = (s: Secao, pathname: string): boolean =>
  s.path === '' ? pathname === '/' : pathname === `/${s.path}` || pathname.startsWith(`/${s.path}/`);

/** Seções que aparecem na barra inferior do celular (o resto fica em "Mais"). */
export const SECOES_BARRA_INFERIOR: IconeSecaoId[] = ['home', 'financas', 'despesas', 'decretos', 'politicos'];
