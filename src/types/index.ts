export interface AreaTecnica {
  id: string;
  nome: string;
  status: 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO';
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
  observacoes?: string;
  dataCriacao: string;
}

export interface OutroItemCorrigido {
  id: string;
  nome: string;
  descricao: string;
  local: string;
  tipo: 'CORREÇÃO' | 'MELHORIA' | 'MANUTENÇÃO' | 'OUTRO';
  prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'URGENTE';
  status: 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDO' | 'CANCELADO';
  contrato: string;
  endereco: string;
  data: string;
  hora: string;
  foto: string | null;
  observacoes?: string;
  responsavel?: string;
}

export interface Ronda {
  id: string;
  nome: string;
  contrato: string;
  data: string;
  hora: string;
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
}
