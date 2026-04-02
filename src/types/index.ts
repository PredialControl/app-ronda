export interface AreaTecnica {
  id: string;
  nome: string;
  status: 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO';
  testeStatus?: 'TESTADO' | 'NAO_TESTADO';
  contrato: string;
  endereco: string;
  data: string;
  hora: string;
  foto: string | null; // Manter retrocompatibilidade
  fotos?: string[]; // Array de fotos em WebP/AVIF (até 40)
  observacoes?: string;
}

export interface Contrato {
  id: string;
  nome: string;
  sindico: string;
  endereco: string;
  periodicidade: 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  status?: 'IMPLANTADO' | 'EM IMPLANTACAO';
  tipo_uso?: 'RESIDENCIAL' | 'NAO_RESIDENCIAL' | 'RESIDENCIAL_E_NAO_RESIDENCIAL';
  quantidade_torres?: number;
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
  is_admin?: boolean; // Se é administrador
  ultimoAcesso?: string;
}

export interface SecaoRonda {
  id: string;
  ordem: number; // 1 para I, 2 para II, etc.
  titulo: string; // Ex: "Objetivo", "Observações", etc.
  conteudo: string; // Texto da seção
}

export interface Ronda {
  id: string;
  nome: string;
  contrato: string;
  data: string;
  hora: string;
  tipoVisita?: 'RONDA' | 'REUNIAO' | 'OUTROS'; // Tipo de visita
  templateRonda?: string; // ID do template usado (SEMANAL, MENSAL, BIMESTRAL, PERSONALIZADA)
  roteiro?: string[]; // Itens do roteiro da ronda
  objetivoRelatorio?: string; // Texto do objetivo específico para o tipo de ronda
  areasTecnicas: AreaTecnica[];
  checklistItems?: ChecklistItem[]; // Itens do checklist (card simples)
  fotosRonda: FotoRonda[];
  outrosItensCorrigidos: OutroItemCorrigido[];
  observacoesGerais?: string;
  responsavel?: string;
  secoes?: SecaoRonda[]; // Seções dinâmicas do relatório (I, II, III, etc.)
}

export interface FotoInfo {
  file: File;
  preview: string;
  nome: string;
}

export interface FotoRonda {
  id: string;
  foto: string; // Manter retrocompatibilidade - primeira foto do array ou foto única
  fotos?: string[]; // Array de fotos em WebP/AVIF (até 40)
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
  arquivo_word_url?: string; // URL do arquivo Word (.doc, .docx) anexado
  arquivo_word_nome?: string; // Nome original do arquivo Word
  status?: 'EXECUTADO' | 'NAO_EXECUTADO'; // Status do parecer
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
  familia?: string; // Grupo/família para agrupar relatórios no relatório e evolução
  capa_url?: string; // URL da imagem de capa personalizada
  foto_localidade_url?: string; // URL da foto da localidade
  data_inicio_vistoria?: string; // Data de início das vistorias (formato: DD/MM/YYYY)
  historico_visitas?: string[]; // Lista de datas e descrições das visitas (ex: "24/10/25 – Início das vistorias")
  data_situacao_atual?: string; // Data da situação atual (formato: DD/MM/YYYY)
  secoes?: RelatorioSecao[];
  created_at: string;
  updated_at: string;
}

export interface RelatorioSecao {
  id: string;
  relatorio_id: string;
  ordem: number;
  titulo_principal: string;
  subtitulo?: string; // Agora opcional (usado quando não tem subseções)
  tem_subsecoes?: boolean; // NOVO: indica se esta seção tem subseções (A, B, C)
  subsecoes?: RelatorioSubsecao[]; // NOVO: array de subseções (VIII.1A, VIII.1B, etc.)
  pendencias?: RelatorioPendencia[]; // Usado quando NÃO tem subseções
  created_at: string;
}

export interface RelatorioSubsecao {
  id: string;
  secao_id: string;
  ordem: number; // 0=A, 1=B, 2=C, etc.
  titulo: string; // Ex: "22 PAVIMENTO"
  tipo?: 'MANUAL' | 'CONSTATACAO'; // Tipo da subseção: manual (pendências) ou constatação (grid de fotos)
  pendencias?: RelatorioPendencia[]; // Usado para tipo MANUAL
  fotos_constatacao?: string[]; // Usado para tipo CONSTATACAO - array de URLs das fotos
  descricao_constatacao?: string; // Descrição opcional para constatação
  created_at: string;
}

export interface RelatorioPendencia {
  id: string;
  secao_id?: string; // ⚠️ OPCIONAL: pendências de subseção NÃO têm secao_id direto
  subsecao_id?: string; // NOVO: ID da subseção (se pertencer a uma)
  ordem: number;
  tipo?: 'CONSTATACAO' | 'PENDENCIA'; // Tipo: constatação (grid de fotos) ou pendência (formato completo)
  local: string;
  descricao: string;
  foto_url: string | null;
  foto_depois_url: string | null; // Foto do "depois" (corrigido)
  data_recebimento?: string; // Data de recebimento (quando adiciona foto depois)
  status?: 'PENDENTE' | 'RECEBIDO' | 'NAO_FARAO'; // Status da pendência
  created_at: string;
}

// Item Relevante (Kanban de pendências)
export interface ItemRelevante {
  id: string;
  contrato_nome: string;
  titulo: string;
  local?: string;
  foto_url?: string;
  data_abertura: string;
  responsabilidade: 'condominio' | 'construtora' | 'a_definir';
  status: 'pendente' | 'em_andamento' | 'concluido';
  parecer?: string;
  ronda_id?: string;
  created_at: string;
  updated_at: string;
}

// Checklist Item para Rondas (card simples)
export interface ChecklistItem {
  id: string;
  rondaId: string;
  tipo: string; // Tipo do item (Extintor, Mangueira, Hidrante, Hall, Escadaria, etc.)
  objetivo: string; // O item do roteiro original (ex: "Verificar extintores")
  local: string; // Ex: "3º Andar", "Hall B", "Escada A"
  fotos: string[]; // Array de fotos (múltiplas)
  status: 'OK' | 'NAO_OK';
  observacao?: string; // Observação opcional (só se precisar)
  testeFuncionamento?: 'SIM' | 'NAO'; // Se teste foi feito - NAO = não aparece no relatório
  data: string;
  hora: string;
}

