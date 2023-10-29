export interface EPMActivities {
  mes: number;
  ano: number;
  qtdDiasMesAtual: number;
  diasPendentesAprovacao: any[];
  projetos: Projeto[];
  somaAtividades: SomaAtividade[];
}

export interface Projeto {
  mesAnoId: string;
  mes: number;
  ano: number;
  projetoId: string;
  projetoNome: string;
  projetoNumero: string;
  epmAtividadesProjetoProfissional: EpmAtividadesProjetoProfissional[];
  atividades: Atividade[];
}

export interface Atividade {
  id: string;
  epmAtividadeProjetoProfissionalId: string;
  nome: Nome;
  diaMesAno: string;
  diaMesAnoFormatado: string;
  hora: string;
  statusAtividade: number;
  totalHorasEmTodosProjetosNoDia: null;
  totalHorasEmOutrosProjetosNoDia: null;
  formatDiaMesAno: string;
  formatHoraDouble: number;
  hora_Double: number;
  comentarios: any[];
}

export type Nome = 'Development'; // | ???

export interface EpmAtividadesProjetoProfissional {
  id: string;
  nome: Nome;
  descricao: string;
  codigo: number;
}

export interface SomaAtividade {
  diaMesAno: string;
  diaMesAnoFormatado: string;
  totalHorasNoDia: string;
  formatDiaMesAno: string;
}
