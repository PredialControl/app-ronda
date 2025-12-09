export interface AreaTecnica {
  id: string;
  nome: string;
  status: 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO';
  testeStatus?: 'TESTADO' | 'NAO_TESTADO';
  contrato: string;
  endereco: string;
  data: string;
  hora: string;
  foto: string | null;
  observacoes?: string;
}

export interface Contrato {
  id: string;
  nome: string;
  sindico: string;
  endereco: string;
  periodicidade: 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  status?: 'IMPLANTADO' | 'EM IMPLANTACAO';
  observacoes?: string;
  dataCriacao: string;
}

export interface OutroItemCorrigido {
  id: string;
  nome: string;
  descricao: string;
  local: string;
  tipo: 'CIVIL' | 'ELÉTRICA' | 'HIDRÁULICA' | 'MECÂNICA' | 'CORREÇÃO' | 'MELHORIA' | 'MANUTENÇÃO' | 'OUTRO'; // Especialidades + valores antigos para compatibilidade
  prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA';
  status: 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDO' | 'CANCELADO';
  contrato: string;
  endereco: string;
  data: string;
  hora: string;
  foto: string | null; // Manter para compatibilidade
  fotos: string[]; // Nova propriedade para múltiplas fotos
  categoria?: 'CHAMADO' | 'CORRIGIDO'; // Nova propriedade para distinguir categorias
  observacoes?: string;
  responsavel?: string;
  // Propriedades para edição de fotos individuais
  isIndividualPhotoEdit?: boolean;
  originalItemId?: string;
}

export interface UsuarioAutorizado {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  permissoes: string[];
  ativo: boolean;
  ultimoAcesso?: string;
}

export interface Ronda {
  id: string;
  nome: string;
  contrato: string;
  data: string;
  hora: string;
  tipoVisita?: 'RONDA' | 'REUNIAO' | 'OUTROS'; // Tipo de visita
  areasTecnicas: AreaTecnica[];
  fotosRonda: FotoRonda[];
  outrosItensCorrigidos: OutroItemCorrigido[];
  observacoesGerais?: string;
  responsavel?: string;
}

export interface FotoInfo {
  file: File;
  preview: string;
  nome: string;
}

export interface FotoRonda {
  id: string;
  foto: string;
  local: string;
  pendencia: string;
  especialidade: string;
  responsavel: 'CONSTRUTORA' | 'CONDOMÍNIO';
  observacoes?: string;
  data: string;
  hora: string;
  criticidade?: 'Baixa' | 'Média' | 'Alta' | 'BAIXA' | 'MÉDIA' | 'ALTA';
}

export interface AgendaItem {
  id: string;
  contratoId: string;
  contratoNome: string;
  endereco: string;
  diaSemana: 'SEGUNDA' | 'TERÇA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SÁBADO' | 'DOMINGO';
  horario: string; // Formato HH:MM
  observacoes?: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  // Campos para recorrência
  recorrencia?: {
    tipo: 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
    intervalo: number; // A cada X dias/semanas/meses
    dataInicio: string; // Data de início da recorrência
    dataFim?: string; // Data de fim (opcional)
    diasSemana?: string[]; // Para recorrência semanal específica
    exclusoes?: string[]; // Datas (YYYY-MM-DD) a excluir da série
  };
}

export interface AgendaSemanal {
  [key: string]: AgendaItem[]; // key = dia da semana (SEGUNDA, TERÇA, etc.)
}

// Parecer Técnico Interfaces
export interface ParecerTecnico {
  id: string;
  contrato_id: string;
  titulo: string;
  finalidade: string;
  narrativa_cenario: string;
  capa_url?: string; // URL da imagem de capa personalizada
  topicos?: ParecerTopico[];
  created_at: string;
  updated_at: string;
}

export interface ParecerTopico {
  id: string;
  parecer_id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  imagens?: ParecerImagem[];
  created_at: string;
}

export interface ParecerImagem {
  id: string;
  topico_id: string;
  ordem: number;
  url: string;
  descricao: string;
  created_at: string;
}

// Relatórios de Pendências Interfaces
export interface RelatorioPendencias {
  id: string;
  contrato_id: string;
  titulo: string;
  secoes?: RelatorioSecao[];
  created_at: string;
  updated_at: string;
}

export interface RelatorioSecao {
  id: string;
  relatorio_id: string;
  ordem: number;
  titulo_principal: string;
  subtitulo: string;
  pendencias?: RelatorioPendencia[];
  created_at: string;
}

export interface RelatorioPendencia {
  id: string;
  secao_id: string;
  ordem: number;
  local: string;
  descricao: string;
  foto_url: string | null;
  created_at: string;
}

