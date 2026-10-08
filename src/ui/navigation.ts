export interface Secao {
  path: string;
  label: string;
  descricao: string;
}

/** Seções do menu. As listagens dedicadas entram nas próximas etapas. */
export const SECOES: Secao[] = [
  { path: 'politicos', label: 'Políticos', descricao: 'Pesquisa e listagem de políticos eleitos.' },
  { path: 'eleicoes', label: 'Eleições', descricao: 'Eleições, candidaturas e resultados por cargo e circunscrição.' },
  { path: 'mandatos', label: 'Mandatos', descricao: 'Mandatos em exercício e encerrados.' },
  { path: 'projetos', label: 'Projetos', descricao: 'Propostas, autoria, coautoria e tramitação.' },
  { path: 'votacoes', label: 'Votações', descricao: 'Votações e como cada político votou.' },
  { path: 'partidos', label: 'Partidos', descricao: 'Partidos e filiações.' },
  { path: 'comissoes', label: 'Comissões', descricao: 'Comissões, membros e relatorias.' },
  { path: 'emendas', label: 'Emendas', descricao: 'Emendas legislativas e orçamentárias.' },
  { path: 'promessas', label: 'Promessas', descricao: 'Promessas registradas e suas avaliações fundamentadas.' },
  { path: 'fontes', label: 'Fontes', descricao: 'Fontes e documentos que sustentam cada informação.' },
  { path: 'guarulhos/orcamento', label: 'Guarulhos (Orçamento)', descricao: 'Despesas e orçamento oficial de Guarulhos.' }
];
