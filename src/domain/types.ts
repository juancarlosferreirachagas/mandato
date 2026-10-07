/** Tipos de domínio. Espelham o schema em supabase/migrations. */

export type Uuid = string;

export interface Fonte {
  id: Uuid;
  tipo: string;
  orgao: string | null;
  titulo: string;
  url: string | null;
  data_publicacao: string | null;
  data_consulta: string | null;
  identificador_externo: string | null;
  observacoes: string | null;
}

export type NovaFonte = Omit<Fonte, 'id'>;

export interface Localidade {
  id: Uuid;
  tipo: 'pais' | 'estado' | 'municipio';
  nome: string;
  sigla: string | null;
}

export interface Pessoa {
  id: Uuid;
  nome_civil: string;
  nome_politico: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
  identificadores_externos?: Record<string, any>;
}

export interface Cargo {
  id: Uuid;
  codigo: string;
  nome: string;
}

export interface Mandato {
  id: Uuid;
  pessoa_id: Uuid;
  inicio: string;
  fim: string | null;
  situacao: string;
  condicao: string;
  fonte_id: Uuid | null;
  cargo: Pick<Cargo, 'codigo' | 'nome'> | null;
  localidade: Pick<Localidade, 'nome' | 'sigla'> | null;
  partido: { sigla: string } | null;
  orgao: { nome: string; sigla: string | null } | null;
}

export interface Candidatura {
  id: Uuid;
  votos: number | null;
  resultado: string | null;
  situacao: string | null;
  numero_candidato: string | null;
  fonte_id: Uuid | null;
  eleicao: { ano: number; turno: number } | null;
  cargo: { nome: string } | null;
  circunscricao: { nome: string; sigla: string | null } | null;
  partido: { sigla: string } | null;
}

export interface Filiacao {
  id: Uuid;
  inicio: string | null;
  fim: string | null;
  partido: { sigla: string; nome: string } | null;
}

export interface PerfilPolitico {
  pessoa: Pessoa;
  mandatos: Mandato[];
  candidaturas: Candidatura[];
  filiacoes: Filiacao[];
}

export interface PessoaResumo extends Pessoa {
  mandato_atual: Pick<Mandato, 'situacao'> & {
    cargo: { nome: string } | null;
    partido: { sigla: string } | null;
  } | null;
}

export interface VagaCargo {
  cargo_codigo: string;
  cargo_nome: string;
  quantidade: number;
}

export interface MetricasMandato {
  periodo_inicio: string;
  periodo_fim: string;
  projetos_apresentados: number;
  projetos_aprovados: number;
  votacoes_registradas: number;
  votos_computados: number;
  sessoes_registradas: number;
  sessoes_presente: number;
  relatorias: number;
  emendas: number;
}

export interface LinhaAuditoria {
  id: number;
  tabela: string;
  registro_id: string | null;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  usuario_id: string | null;
  alterado_em: string;
  valor_anterior: unknown;
  valor_novo: unknown;
  fonte_id: Uuid | null;
}

export type PapelUsuario = 'leitor' | 'editor' | 'admin';
