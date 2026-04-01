import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KanbanPhotoUpload } from '@/components/KanbanPhotoUpload';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { supabase } from '@/lib/supabase';

// Função auxiliar para converter base64 para File
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Search,
  Wrench,
  CheckCircle,
  Plus,
  Calendar,
  X,
  Trash2,
  Filter,
  Edit,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileText
} from 'lucide-react';

// Definição das categorias e suas cores
const CATEGORIES = {
  VISTORIA: {
    id: 'VISTORIA',
    label: '1. VISTORIA',
    color: 'bg-blue-500',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    bgLight: 'bg-blue-50'
  },
  RECEBIMENTO_INCENDIO: {
    id: 'RECEBIMENTO_INCENDIO',
    label: '2. RECEBIMENTO INCÊNDIO',
    color: 'bg-yellow-400',
    border: 'border-l-yellow-400',
    text: 'text-yellow-700',
    bgLight: 'bg-yellow-50'
  },
  RECEBIMENTO_AREAS: {
    id: 'RECEBIMENTO_AREAS',
    label: '3. RECEBIMENTO ÁREAS',
    color: 'bg-yellow-400',
    border: 'border-l-yellow-400',
    text: 'text-yellow-700',
    bgLight: 'bg-yellow-50'
  },
  RECEBIMENTO_CHAVES: {
    id: 'RECEBIMENTO_CHAVES',
    label: '4. RECEBIMENTO CHAVES',
    color: 'bg-yellow-400',
    border: 'border-l-yellow-400',
    text: 'text-yellow-700',
    bgLight: 'bg-yellow-50'
  },
  CONFERENCIA: {
    id: 'CONFERENCIA',
    label: '5. CONFERÊNCIA',
    color: 'bg-purple-500',
    border: 'border-l-purple-500',
    text: 'text-purple-700',
    bgLight: 'bg-purple-50'
  },
  COMISSIONAMENTO: {
    id: 'COMISSIONAMENTO',
    label: '6. COMISSIONAMENTO',
    color: 'bg-orange-500',
    border: 'border-l-orange-500',
    text: 'text-orange-700',
    bgLight: 'bg-orange-50'
  },
  DOCUMENTACAO: {
    id: 'DOCUMENTACAO',
    label: '7. DOCUMENTAÇÃO',
    color: 'bg-green-500',
    border: 'border-l-green-500',
    text: 'text-green-700',
    bgLight: 'bg-green-50'
  }
};

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: 'aguardando' | 'em_andamento' | 'em_correcao' | 'finalizado';
  category: string; // Nova propriedade para categoria
  createdAt: string;
  updatedAt: string;
  dataVistoria?: string;
  dataRecebimento?: string;
  correcao?: string; // Motivo da correção (quando está em Em Correção)
  oQueFalta?: string; // O que falta para concluir (quando está em Em Andamento)
  dataCorrecao?: string;
  dataAndamento?: string;
  historicoCorrecao?: string;
  documentoUrl?: string; // Link do Google Drive para documentos (categoria DOCUMENTACAO)
  documentoConferido?: 'sim' | 'nao'; // Status de conferência do documento
  // Checklist para cards de VISTORIA
  checklistVistoria?: {
    vistoriaRealizada: boolean;
    relatorioGerado: boolean;
    observacoes?: string;
    dataVistoria?: string;
    dataEntregaRelatorio?: string;
  };
  // Checklist para cards de RECEBIMENTO_INCENDIO
  checklistRecebimentoIncendio?: {
    extintores: boolean;
    dataExtintores?: string;
    mangueiras: boolean;
    dataMangueiras?: string;
    engates: boolean;
    dataEngates?: string;
    tampas: boolean;
    dataTampas?: string;
    chavesStorz: boolean;
    dataChavesStorz?: string;
    bicos: boolean;
    dataBicos?: string;
    observacoes?: string;
  };
  // Lista de áreas comuns para RECEBIMENTO_AREAS
  checklistRecebimentoAreas?: {
    areas: {
      id: string;
      nome: string;
      status: 'recebido' | 'pendente';
      data?: string;
    }[];
  };
  // Checklist para cards de RECEBIMENTO_CHAVES
  checklistRecebimentoChaves?: {
    chavesAreasComuns: boolean;
    dataChavesAreasComuns?: string;
    chavesAreasTecnicas: boolean;
    dataChavesAreasTecnicas?: string;
    observacoes?: string;
  };
  // Checklist para ACESSIBILIDADE ELEVADORES
  checklistAcessibilidadeElevadores?: {
    braileBatentes: boolean;
    dataBraileBatentes?: string;
    brailePlacaAdvertencia: boolean;
    dataBrailePlacaAdvertencia?: string;
    pisoTatil: boolean;
    dataPisoTatil?: string;
    identificacaoSonora: boolean;
    dataIdentificacaoSonora?: string;
    intercomunicador: boolean;
    dataIntercomunicador?: string;
    observacoes?: string;
  };
  // Checklist para ACESSIBILIDADE ESCADAS
  checklistAcessibilidadeEscadas?: {
    corrimaoDuplo: boolean;
    dataCorrimaoDuplo?: string;
    braileCorrimao: boolean;
    dataBraileCorrimao?: string;
    pisoTatilEscadas: boolean;
    dataPisoTatilEscadas?: string;
    fitaFotoluminescente: boolean;
    dataFitaFotoluminescente?: string;
    demarcacaoAreaResgate: boolean;
    dataDemarcacaoAreaResgate?: string;
    areaResgate: boolean;
    dataAreaResgate?: string;
    alarmeIntercomunicador: boolean;
    dataAlarmeIntercomunicador?: string;
    observacoes?: string;
  };
  // Checklist para ACESSIBILIDADE WCS
  checklistAcessibilidadeWCs?: {
    revestimentoPorta: boolean;
    dataRevestimentoPorta?: string;
    desnivelPiso: boolean;
    dataDesnivelPiso?: string;
    larguraPorta: boolean;
    dataLarguraPorta?: string;
    portaTranqueta: boolean;
    dataPortaTranqueta?: string;
    barras: boolean;
    dataBarras?: string;
    alarmeIntercomunicador: boolean;
    dataAlarmeIntercomunicador?: string;
    lavatorio: boolean;
    dataLavatorio?: string;
    areaManobra: boolean;
    dataAreaManobra?: string;
    observacoes?: string;
  };
  // Checklist para ACESSIBILIDADE ÁREAS COMUNS
  checklistAcessibilidadeAreasComuns?: {
    larguraPorta: boolean;
    dataLarguraPorta?: string;
    desnivelPiso: boolean;
    dataDesnivelPiso?: string;
    alarmeIntercomunicador: boolean;
    dataAlarmeIntercomunicador?: string;
    areaCirculacao: boolean;
    dataAreaCirculacao?: string;
    observacoes?: string;
  };
  // Checklist para ACESSIBILIDADE PISCINA
  checklistAcessibilidadePiscina?: {
    desnivelPiso: boolean;
    dataDesnivelPiso?: string;
    placaProfundidade: boolean;
    dataPlacaProfundidade?: string;
    cadeiraAcesso: boolean;
    dataCadeiraAcesso?: string;
    observacoes?: string;
  };
  // Checklist para ACESSIBILIDADE ENTRADA DO PRÉDIO
  checklistAcessibilidadeEntrada?: {
    pisoTatilCalcada: boolean;
    dataPisoTatilCalcada?: string;
    calcadaFaixaLivre: boolean;
    dataCalcadaFaixaLivre?: string;
    placaBraile: boolean;
    dataPlacaBraile?: string;
    desnivelPiso: boolean;
    dataDesnivelPiso?: string;
    alarmeSonoro: boolean;
    dataAlarmeSonoro?: string;
    observacoes?: string;
  };
  // Checklist para CONFERENCIA - MEMORIAL DESCRITIVO
  checklistConferenciaMemorial?: {
    // Memorial Descritivo
    mdAreasEquipamentos?: 'sim' | 'nao';
    mdAcabamentos?: 'sim' | 'nao';
    mdMobiliario?: 'sim' | 'nao';
    // Memorial de Vendas
    mvAreasEquipamentos?: 'sim' | 'nao';
    mvAcabamentos?: 'sim' | 'nao';
    mvMobiliario?: 'sim' | 'nao';
    observacoes?: string;
  };
  // Checklist para CONFERENCIA - ITENS DE BOMBEIRO
  checklistConferenciaIncendio?: {
    temExtintor?: 'sim' | 'nao' | 'x';
    extintorValidade?: 'sim' | 'nao' | 'x';
    temMangueira?: 'sim' | 'nao' | 'x';
    mangueirasValidade?: 'sim' | 'nao' | 'x';
    temEngates?: 'sim' | 'nao' | 'x';
    temChaveStorz?: 'sim' | 'nao' | 'x';
    temBico?: 'sim' | 'nao' | 'x';
  };
  // Checklist genérico para COMISSIONAMENTO (Record<itemId, 'sim'|'nao'|'x'>)
  checklistComissionamento?: Record<string, 'sim' | 'nao' | 'x'>;
  // Fotos do card (até 40 fotos em WebP ou AVIF)
  fotos?: string[]; // Array de URLs base64 ou URLs das imagens
  // Pendências vinculadas ao card (integração com Relatório de Pendências)
  pendencias?: KanbanPendencia[];
}

// Interface para pendências do Kanban (compatível com RelatorioPendencia)
interface KanbanPendencia {
  id: string;
  tipo: 'CONSTATACAO' | 'PENDENCIA'; // CONSTATACAO = OK, PENDENCIA = problema
  local: string; // Local da verificação/problema
  descricao: string; // Descrição da constatação ou pendência
  foto_url: string | null; // Foto
  foto_depois_url: string | null; // Foto do "depois" (quando corrigido)
  data_recebimento?: string; // Data de recebimento (quando foi corrigido)
  status: 'PENDENTE' | 'RECEBIDO' | 'NAO_FARAO';
  created_at: string;
}

// ============================================================
// CHECKLISTS DE COMISSIONAMENTO — mapeados por card ID
// ============================================================
const COMISSIONAMENTO_CHECKLISTS: Record<string, { grupo: string; itens: { id: string; label: string }[] }[]> = {

  // GERADOR
  '9': [
    { grupo: 'Inspeção Visual', itens: [
      { id: 'g1', label: 'Alinhamento do gerador e amortecedores de vibração instalados corretamente' },
      { id: 'g2', label: 'Silencioso, tubulação de escape, suportes e isolamento térmico sem danos' },
      { id: 'g3', label: 'Entrada de ar suficiente para não superaquecer' },
      { id: 'g4', label: 'Venezianas de entrada e saída de ar livres de obstrução' },
      { id: 'g5', label: 'Nível do líquido de arrefecimento (água + aditivo) no radiador OK' },
      { id: 'g6', label: 'Nível do óleo do cárter verificado pela vareta de medição' },
      { id: 'g7', label: 'Nível de óleo diesel no tanque a 100%' },
    ]},
    { grupo: 'Teste em Carga', itens: [
      { id: 'g8', label: 'Partida no modo Manual — sem ruídos anormais, fumaça ou instabilidade' },
      { id: 'g9', label: 'Sem vazamentos de óleo, água ou gases de escape com motor em vibração' },
    ]},
    { grupo: 'Simulação de Blackout', itens: [
      { id: 'g10', label: 'Desligar disjuntor geral — simular falta de energia' },
      { id: 'g11', label: 'Tempo de retardo para partida do motor e transferência do QTA cronometrado' },
      { id: 'g12', label: 'Gerador assumiu carga real por 1h — temperatura, pressão, tensão, corrente e frequência OK' },
      { id: 'g13', label: 'Re-transferência do QTA ao religar a energia' },
      { id: 'g14', label: 'Gerador resfria 3 a 5 min sem carga antes de desligar automaticamente' },
      { id: 'g15', label: 'Botoeira de emergência acionada — gerador desliga imediatamente' },
    ]},
  ],

  // SISTEMA ELÉTRICO — Quadro Iluminação e Tomada
  '10': [
    { grupo: 'Quadro Elétrico — Iluminação e Tomada', itens: [
      { id: 'qe1', label: 'Diagrama unifilar e bitola do cabo correspondem ao disjuntor instalado' },
      { id: 'qe2', label: 'Diagrama unifilar afixado na porta do quadro' },
      { id: 'qe3', label: 'Projetado igual ao executado (projeto vs. campo)' },
      { id: 'qe4', label: 'Disjuntores de iluminação acionados — interruptores validados no ambiente' },
      { id: 'qe5', label: 'Disjuntores das tomadas — tensão confirmada com multímetro ou testador' },
      { id: 'qe6', label: 'Etiquetas claras em todos os disjuntores' },
      { id: 'qe7', label: 'Barramentos de Neutro e Terra separados e isolados entre si' },
      { id: 'qe8', label: 'DRs e DPS presentes e instalados corretamente' },
      { id: 'qe9', label: 'Botão "T" do DR testado — atuação mecânica confirmada' },
      { id: 'qe10', label: 'Padrão de cores dos cabos correto (Azul=Neutro, Verde=Terra)' },
      { id: 'qe11', label: 'Corrente por fase medida com alicate amperímetro — fases equilibradas' },
      { id: 'qe12', label: 'Termografia no quadro com carga — sem disjuntores ou cabos sobreaquecendo' },
    ]},
  ],

  // SPDA
  '11': [
    { grupo: 'Inspeção da Malha', itens: [
      { id: 'sp1', label: 'Tensionamento dos cabos, fixação dos suportes e integridade dos mastros' },
      { id: 'sp2', label: 'Conectores mecânicos apertados e qualidade das soldas exotérmicas OK' },
      { id: 'sp3', label: 'Sem oxidação nem contato inadequado entre metais diferentes (corrosão galvânica)' },
      { id: 'sp4', label: 'Conexões nos pilares de concreto (esperas no topo e na base)' },
      { id: 'sp5', label: 'Distanciamento e proteção mecânica das descidas externas (últimos 3m)' },
    ]},
    { grupo: 'Malha de Terra', itens: [
      { id: 'sp6', label: 'Laudo com teste de continuidade e resistência da Malha de Terra' },
      { id: 'sp7', label: 'Caixas de inspeção no solo — hastes OK, caixa limpa, conexão haste-cabo' },
      { id: 'sp8', label: 'Todas as massas metálicas do prédio interligadas ao BEP com bitola adequada' },
      { id: 'sp9', label: 'DPS dos quadros elétricos aterrados na mesma malha do SPDA' },
    ]},
  ],

  // BOMBA INCÊNDIO — Hidrante + Sprinkler
  '12': [
    { grupo: 'Bomba de Incêndio — Hidrante', itens: [
      { id: 'bh1', label: 'Diagrama unifilar e bitola do cabo correspondem ao disjuntor' },
      { id: 'bh2', label: 'Diagrama unifilar na porta do quadro' },
      { id: 'bh3', label: 'Projetado igual ao executado' },
      { id: 'bh4', label: 'Botão de acionamento da portaria liga a bomba' },
      { id: 'bh5', label: 'Bomba ligada diretamente pelo quadro' },
      { id: 'bh6', label: 'Teste mangueira — água lançada no mínimo 5 metros de distância' },
      { id: 'bh7', label: 'Botoeira testada em TODOS os andares' },
      { id: 'bh8', label: 'Etiquetas claras em todos os disjuntores' },
      { id: 'bh9', label: 'Neutro e Terra separados e isolados' },
      { id: 'bh10', label: 'Padrão de cores dos cabos correto' },
      { id: 'bh11', label: 'Corrente por fase equilibrada com alicate amperímetro' },
      { id: 'bh12', label: 'Termografia no quadro com carga' },
    ]},
    { grupo: 'Bomba de Incêndio — Sprinkler', itens: [
      { id: 'bs1', label: 'Diagrama unifilar e bitola do cabo correspondem ao disjuntor' },
      { id: 'bs2', label: 'Diagrama unifilar na porta do quadro' },
      { id: 'bs3', label: 'Projetado igual ao executado' },
      { id: 'bs4', label: 'Bomba jockey em automático — abrir dreno, pressão cai e jockey entra' },
      { id: 'bs5', label: 'Abrir mais o dreno — bomba principal entra' },
      { id: 'bs6', label: 'Fechar dreno, desligar principal — jockey pressuriza e desliga automaticamente' },
      { id: 'bs7', label: 'Etiquetas claras em todos os disjuntores' },
      { id: 'bs8', label: 'Neutro e Terra separados e isolados' },
      { id: 'bs9', label: 'Padrão de cores dos cabos correto' },
      { id: 'bs10', label: 'Corrente por fase equilibrada com alicate amperímetro' },
      { id: 'bs11', label: 'Termografia no quadro com carga' },
    ]},
  ],

  // BOMBAS DE RECALQUE
  '13': [
    { grupo: 'Quadro Elétrico — Bomba de Recalque', itens: [
      { id: 're1', label: 'Diagrama unifilar e bitola do cabo correspondem ao disjuntor' },
      { id: 're2', label: 'Diagrama unifilar na porta do quadro' },
      { id: 're3', label: 'Projetado igual ao executado' },
      { id: 're4', label: 'Bombas fazem revezamento automático' },
      { id: 're5', label: 'Bóias testadas — acionamento correto no quadro e sinais no quadro sinótico da portaria' },
      { id: 're6', label: 'Etiquetas claras em todos os disjuntores' },
      { id: 're7', label: 'Neutro e Terra separados e isolados' },
      { id: 're8', label: 'DPS instalado corretamente' },
      { id: 're9', label: 'Padrão de cores dos cabos correto' },
      { id: 're10', label: 'Corrente por fase equilibrada com alicate amperímetro' },
      { id: 're11', label: 'Termografia no quadro com carga' },
    ]},
  ],

  // BOMBAS DE PRESSURIZAÇÃO
  '14': [
    { grupo: 'Quadro Elétrico — Bomba de Pressurização', itens: [
      { id: 'pr1', label: 'Diagrama unifilar e bitola do cabo correspondem ao disjuntor' },
      { id: 'pr2', label: 'Diagrama unifilar na porta do quadro' },
      { id: 'pr3', label: 'Projetado igual ao executado' },
      { id: 'pr4', label: 'Bombas fazem revezamento automático' },
      { id: 'pr5', label: 'Abrir ponto de consumo — bomba atua; fechar registro até pressão de projeto; bomba desliga automaticamente' },
      { id: 'pr6', label: 'Etiquetas claras em todos os disjuntores' },
      { id: 'pr7', label: 'Neutro e Terra separados e isolados' },
      { id: 'pr8', label: 'DPS instalado corretamente' },
      { id: 'pr9', label: 'Padrão de cores dos cabos correto' },
      { id: 'pr10', label: 'Corrente por fase equilibrada com alicate amperímetro' },
      { id: 'pr11', label: 'Termografia no quadro com carga' },
    ]},
  ],

  // POÇOS E PRUMADAS
  '16': [
    { grupo: 'Poços e Prumadas (Pluvial, Esgoto e Águas Servidas)', itens: [
      { id: 'poc1', label: 'Diâmetros, interligações e declividade (caimento) conforme projeto' },
      { id: 'poc2', label: 'Caimento mínimo (1% a 2%) confirmado com nível' },
      { id: 'poc3', label: 'Bater nas tubulações — verificar se estão limpas/desentupidas' },
      { id: 'poc4', label: 'Boroscópio nas tubulações acessíveis — confirmar limpeza' },
      { id: 'poc5', label: 'Espaçamento das abraçadeiras nas prumadas correto' },
      { id: 'poc6', label: 'Tampa dos poços — fundo limpo com formato "meia cana"' },
      { id: 'poc7', label: 'Pedestal de escorregamento e corrente de içamento em aço inox fixados' },
      { id: 'poc8', label: 'Válvula de retenção na tubulação de recalque logo após saída do poço' },
    ]},
  ],

  // SISTEMA HIDRÁULICO — Prumada Água Potável
  '17': [
    { grupo: 'Prumada Água Potável — VRP e Pressão', itens: [
      { id: 'hid1', label: 'Zonas de pressão verificadas — pressão máxima 40 m.c.a. (NBR 5626)' },
      { id: 'hid2', label: 'Pressão de entrada e saída de cada VRP conforme projeto' },
      { id: 'hid3', label: 'Prumada pintada/identificada em verde e abraçadeiras firmes' },
      { id: 'hid4', label: 'Cavalete com registros, filtro Y, manômetros e bypass instalados corretamente' },
      { id: 'hid5', label: 'Válvula de alívio a jusante da VRP direcionada para ralo ou dreno seguro' },
      { id: 'hid6', label: 'Ventosas instaladas nos pontos mais altos das prumadas' },
      { id: 'hid7', label: 'Sem vazamentos no sistema' },
    ]},
  ],

  // SISTEMA DE ÁGUA QUENTE
  '18': [
    { grupo: 'Sistema de Água Quente', itens: [
      { id: 'aq1', label: 'Setpoints levantados (boiler, gás, recirculação, pressão do gás)' },
      { id: 'aq2', label: 'Isolamento da tubulação, boiler e trocador de calor OK' },
      { id: 'aq3', label: 'Placas solares — fixação, inclinação, orientação norte, vidros e sombreamento' },
      { id: 'aq4', label: 'Chaminés de exaustão com caimento correto e grelhas de ventilação permanente' },
      { id: 'aq5', label: 'Vasos de expansão pré-calibrados e válvulas de alívio PT no boiler' },
      { id: 'aq6', label: 'Ligar bomba — fluxostato libera ignição; simular falha da bomba desliga queimadores' },
      { id: 'aq7', label: 'Bombas de recirculação dos andares funcionando' },
      { id: 'aq8', label: 'Sem vazamentos no sistema' },
    ]},
  ],

  // SDAI
  '19': [
    { grupo: 'Central e Dispositivos', itens: [
      { id: 'sd1', label: 'Lista de dispositivos (nome e localização) confrontada com a central' },
      { id: 'sd2', label: 'Tipo de laço confirmado: Classe A (anel) ou Classe B (radial)' },
      { id: 'sd3', label: 'Fixação, limpeza, aterramento e baterias de reserva da central OK' },
      { id: 'sd4', label: 'Capas de proteção plástico removidas de todos os detectores' },
      { id: 'sd5', label: 'Acionadores manuais na altura correta (1,10m–1,20m) e sem obstáculos' },
      { id: 'sd6', label: 'Sirenes fixadas corretamente e direcionadas para melhor propagação' },
    ]},
    { grupo: 'Testes Funcionais', itens: [
      { id: 'sd7', label: 'Desligar rede — central opera nas baterias e emite "Falha de Rede"' },
      { id: 'sd8', label: 'Desligar borne da bateria — central emite "Falha de Bateria"' },
      { id: 'sd9', label: 'Todos os detectores de fumaça testados com spray de ensaio aprovado' },
      { id: 'sd10', label: 'Detectores de temperatura (garagens) testados com soprador térmico' },
      { id: 'sd11', label: 'Todos os acionadores manuais testados e retornados à posição original' },
      { id: 'sd12', label: 'Válvulas de fluxo do sistema de SPK testadas' },
      { id: 'sd13', label: 'Nível sonoro das sirenes medido — mín. 65 dB e +10–15 dB acima do ruído de fundo' },
      { id: 'sd14', label: 'Endereçamento validado na central durante os testes (texto correto no display)' },
    ]},
  ],

  // PRESSURIZAÇÃO DE ESCADA
  '20': [
    { grupo: 'Pressurização de Escada', itens: [
      { id: 'pe1', label: 'Captação de ar em local limpo (longe de chaminés, exaustões de gerador)' },
      { id: 'pe2', label: 'Grelhas internas desobstruídas e damper de alívio livre para abrir' },
      { id: 'pe3', label: 'Simular incêndio — pressurização entra em funcionamento automaticamente' },
      { id: 'pe4', label: 'Detector inverso (casa de máquina) — pressurização desliga com fumaça' },
      { id: 'pe5', label: 'Botão de acionamento manual na portaria aciona o sistema' },
      { id: 'pe6', label: 'Pressão medida em andares amostrais (térreo, meio, topo) — entre 50 e 60 Pa' },
      { id: 'pe7', label: 'Simular falha de um ventilador (se múltiplos) — reserva assume automaticamente' },
    ]},
  ],

  // EXAUSTÃO GARAGEM
  '21': [
    { grupo: 'Exaustão da Garagem', itens: [
      { id: 'ex1', label: 'Volume de ar exigido e taxa de renovação conferidos com projeto' },
      { id: 'ex2', label: 'Sensores de CO — área de cobertura e altura correta (~1,50m)' },
      { id: 'ex3', label: 'Fixação dos equipamentos, amortecedores de vibração e conexão flexível' },
      { id: 'ex4', label: 'Fixação dos dutos, vedação das emendas e posição das grelhas de captação' },
      { id: 'ex5', label: 'Teste com gás de calibração no sensor CO — sistema entra em operação' },
      { id: 'ex6', label: 'Tempo de retardo configurado após normalização do CO' },
      { id: 'ex7', label: 'Velocidade do ar nas grelhas medida com anemômetro — conforme projeto' },
    ]},
  ],

  // PORTÕES — Deslizante, Basculante e Pivotante
  '22': [
    { grupo: 'Portão Deslizante', itens: [
      { id: 'pd1', label: 'Peso da folha e ciclos/hora conferidos com especificações do motorredutor' },
      { id: 'pd2', label: 'Modo manual — portão corre livremente sem solavancos ou atrito' },
      { id: 'pd3', label: 'Cremalheira alinhada com pinhão (folga ~2mm); não apoia peso no eixo do motor' },
      { id: 'pd4', label: 'Parafusos/soldas da cremalheira firmes em toda a extensão' },
      { id: 'pd5', label: 'Batentes mecânicos (fim de curso) nas duas extremidades do trilho' },
      { id: 'pd6', label: 'Fotocélula: portão para e inverte ao interromper o feixe' },
      { id: 'pd7', label: 'Laço indutivo (se houver): bloqueia fechamento com veículo sobre o sensor' },
      { id: 'pd8', label: 'Intertravamento: segundo portão não abre com o primeiro aberto' },
      { id: 'pd9', label: 'Sinaleira e bipe sonoro acionados 2 segundos antes do movimento' },
    ]},
    { grupo: 'Portão Basculante', itens: [
      { id: 'pb1', label: 'Peso da folha e ciclos/hora conferidos com especificações do motorredutor' },
      { id: 'pb2', label: 'Altura útil com portão totalmente aberto atende ao projeto' },
      { id: 'pb3', label: 'Modo manual a 45° — portão fica parado no ar (contrapesos corretos)' },
      { id: 'pb4', label: 'Cabos de aço inspecionados — sem fios partidos; roldanas livres e lubrificadas' },
      { id: 'pb5', label: 'Calha guia no prumo; fuso limpo e lubrificado com graxa branca' },
      { id: 'pb6', label: 'Fotocélula: portão para e inverte ao interromper o feixe' },
      { id: 'pb7', label: 'Laço indutivo (se houver): bloqueia fechamento com veículo sobre o sensor' },
      { id: 'pb8', label: 'Intertravamento: segundo portão não abre com o primeiro aberto' },
      { id: 'pb9', label: 'Sinaleira e bipe sonoro acionados 2 segundos antes do movimento' },
    ]},
    { grupo: 'Portão Pivotante', itens: [
      { id: 'pp1', label: 'Tamanho do braço e força do motor adequados para a largura da folha' },
      { id: 'pp2', label: 'Modo manual a 45° — portão fica parado (gonzos no prumo)' },
      { id: 'pp3', label: 'Cabo entre pilar fixo e motor — folga correta, sem risco de esmagamento pelas dobradiças' },
      { id: 'pp4', label: 'Fotocélula: portão para e inverte ao interromper o feixe' },
      { id: 'pp5', label: 'Laço indutivo (se houver): bloqueia fechamento com veículo sobre o sensor' },
      { id: 'pp6', label: 'Intertravamento: segundo portão não abre com o primeiro aberto' },
      { id: 'pp7', label: 'Sinaleira e bipe sonoro acionados 2 segundos antes do movimento' },
    ]},
  ],

  // INTERFONE
  '23': [
    { grupo: 'Interfone', itens: [
      { id: 'if1', label: 'Diagrama unifilar e planilha de ramais (apt → ramal → posição na central) em mãos' },
      { id: 'if2', label: 'Fixação da central, aterramento do chassi e organização dos cabos de saída' },
      { id: 'if3', label: 'Nobreak na central instalado — simulação de queda de energia testada' },
      { id: 'if4', label: 'Shafts de dados — réguas de engate e anilhas/etiquetas por apartamento' },
      { id: 'if5', label: 'Interfones em halls, elevadores, escadarias, áreas técnicas e comuns conforme projeto' },
      { id: 'if6', label: 'Todos os interfones testados com pessoa na portaria recebendo as ligações' },
    ]},
  ],

  // CFTV (AR CONDICIONADO usa id '24' — sem checklist fornecido)
  // IRRIGAÇÃO (id '25' — sem checklist definido)
};

const initialItems: KanbanItem[] = [
  // 1. VISTORIA
  { id: '1', title: 'ÁREAS COMUNS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', title: 'HALLS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '3', title: 'ESCADARIAS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '4', title: 'ÁREAS TÉCNICAS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '5', title: 'ELEVADORES', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '58', title: 'FACHADA', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '66', title: 'GARAGENS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 2. RECEBIMENTO ITENS DE INCÊNDIO (rosa claro)
  { id: '6', title: 'RECEBIMENTO ITENS DE INCÊNDIO', category: 'RECEBIMENTO_INCENDIO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 3. RECEBIMENTO ÁREAS COMUNS (amarelo vivo)
  { id: '7', title: 'RECEBIMENTO ÁREAS COMUNS', category: 'RECEBIMENTO_AREAS', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 4. RECEBIMENTO CHAVES CONDOMÍNIO (amarelo)
  { id: '8', title: 'RECEBIMENTO CHAVES CONDOMÍNIO', category: 'RECEBIMENTO_CHAVES', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 5. CONFERÊNCIA (roxo)
  { id: '55', title: 'ITENS DE BOMBEIRO', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '57', title: 'ACESSIBILIDADE', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '59', title: 'ACESSIBILIDADE ELEVADORES', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '60', title: 'ACESSIBILIDADE ESCADAS', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '61', title: 'ACESSIBILIDADE WCS', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '62', title: 'ACESSIBILIDADE ÁREAS COMUNS', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '63', title: 'ACESSIBILIDADE PISCINA', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '64', title: 'ACESSIBILIDADE ENTRADA DO PRÉDIO', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '65', title: 'MEMORIAL DESCRITIVO', category: 'CONFERENCIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 6. COMISSIONAMENTO
  { id: '9', title: 'GERADOR', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '10', title: 'SISTEMA ELÉTRICO — QGBT, QTA, QUADROS, BARRAMENTOS, TRAFO, BUSWAY', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '11', title: 'SPDA', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '12', title: 'BOMBA INCÊNDIO', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '13', title: 'BOMBAS DE RECALQUE', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '14', title: 'BOMBAS DE PRESSURIZAÇÃO', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '15', title: 'BOMBAS SUBMERSAS', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '16', title: 'POÇOS E PRUMADAS', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '17', title: 'SISTEMA HIDRÁULICO — RESERV., VRP, PRUMADAS, VENTOSAS', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '18', title: 'SIST. ÁGUA QUENTE', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '19', title: 'SDAI', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '20', title: 'PRESS. ESCADA', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '21', title: 'EXAUSTÃO GARAGEM', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '22', title: 'PORTÕES', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '23', title: 'INTERFONE', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '24', title: 'AR CONDICIONADO', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '25', title: 'IRRIGAÇÃO', category: 'COMISSIONAMENTO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 6. DOCUMENTAÇÃO
  { id: '26', title: 'Manual de Uso, Operação e Manutenção específico do empreendimento (NBR-14037)', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '27', title: 'Projetos legais', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '28', title: 'Projetos As Built', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '29', title: 'Auto de conclusão (habite-se)', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '30', title: 'Alvará de aprovação da edificação', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '31', title: 'Alvará de execução da edificação', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '32', title: 'AVCB (Auto de Vistoria do Corpo de Bombeiros)', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '33', title: 'ART de execução do Sistema de prevenção e Combate a Incêndio', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '34', title: 'ART de projeto do Sistema de prevenção e Combate a Incêndio', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '35', title: 'Alvará de Licença de Funcionamento de Elevadores', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '36', title: 'Termo de conclusão e Recebimento da empresa do Elevador', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '37', title: 'ART de execução dos Elevadores', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '38', title: 'Comprovante de Vistorias da Comgás e Laudo de estanqueidade do sistema de gás', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '39', title: 'Atestado de Start-up do gerador', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '40', title: 'Manual de instalação, operação e manutenção do Gerador', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '41', title: 'ART de projeto e execução do gerador', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '42', title: 'Certificado de limpeza dos ralos, poços e redes (esgoto, drenagem e pluvial) das áreas comuns', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '43', title: 'Certificado de limpeza dos ralos das unidades privativas', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '44', title: 'Ensaio de arrancamento dos dispositivos de ancoragem', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '45', title: 'Ordem de Serviço de Start-up e Relatório Técnico das VRPs', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '46', title: 'Manuais de operação e garantia do Sistema de Irrigação de Jardins', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '47', title: 'Certificado de conformidade das instalações elétricas', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '48', title: 'ART de projeto e instalação elétrica', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '49', title: 'Certificado de limpeza dos reservatórios de água potável', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '50', title: 'Análise de potabilidade da água fria', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '51', title: 'Laudo de SPDA com medição ôhmica e ART', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '52', title: 'Memorial descritivo', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '53', title: 'Notas fiscais dos equipamentos instalados no empreendimento', category: 'DOCUMENTACAO', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
];


interface KanbanBoardProps {
  items?: KanbanItem[];
  onAddItem?: (titulo: string) => void;
  onRemoveItem?: (itemId: string) => void;
  contratoId?: string;
  contratoNome?: string;
}

export function KanbanBoard({ contratoId, contratoNome }: KanbanBoardProps = {}) {
  // Ordena o array merged pela ordem do initialItems (items fora do initialItems vão pro final)
  const mergeAndSort = (savedItems: KanbanItem[]): KanbanItem[] => {
    const savedIds = new Set(savedItems.map(i => i.id));
    const newItems = initialItems.filter(i => !savedIds.has(i.id));
    const orderMap = new Map(initialItems.map((item, idx) => [item.id, idx]));
    return [...savedItems, ...newItems].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
      return ai - bi;
    });
  };

  // Carregar items do localStorage se existir, senão usar initialItems
  // Faz merge: adiciona novos items do initialItems que ainda não existem no localStorage
  const getInitialItems = (): KanbanItem[] => {
    if (!contratoId) return initialItems;
    const saved = localStorage.getItem(`kanban_items_${contratoId}`);
    if (saved) {
      try {
        return mergeAndSort(JSON.parse(saved));
      } catch {
        return initialItems;
      }
    }
    return initialItems;
  };

  const [items, setItems] = useState<KanbanItem[]>(getInitialItems);

  // Salvar items no localStorage quando mudar (SEM fotos para evitar QuotaExceededError)
  useEffect(() => {
    if (contratoId && items.length > 0) {
      try {
        // Remover fotos base64 das pendências antes de salvar (muito grandes)
        const itemsSemFotos = items.map(item => ({
          ...item,
          pendencias: item.pendencias?.map(p => ({
            ...p,
            foto_url: p.foto_url?.startsWith('data:') ? null : p.foto_url, // Manter só URLs, não base64
            foto_depois_url: p.foto_depois_url?.startsWith('data:') ? null : p.foto_depois_url
          }))
        }));
        localStorage.setItem(`kanban_items_${contratoId}`, JSON.stringify(itemsSemFotos));
      } catch (e) {
        console.warn('⚠️ Erro ao salvar no localStorage (possivelmente cheio):', e);
        // Tentar limpar dados antigos
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('kanban_items_'));
          if (keys.length > 5) {
            // Manter apenas os 5 mais recentes
            keys.slice(0, keys.length - 5).forEach(k => localStorage.removeItem(k));
          }
        } catch {}
      }
    }
  }, [items, contratoId]);

  // Recarregar items quando o contrato mudar (com merge de novos items)
  useEffect(() => {
    if (contratoId) {
      const saved = localStorage.getItem(`kanban_items_${contratoId}`);
      if (saved) {
        try {
          const savedItems: KanbanItem[] = JSON.parse(saved);
          setItems(mergeAndSort(savedItems));
        } catch {
          setItems(initialItems);
        }
      } else {
        setItems(initialItems);
      }
    }
  }, [contratoId]);
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ item: KanbanItem, newStatus: string } | null>(null);
  const [recebimentoDate, setRecebimentoDate] = useState('');
  const [vistoriaDate, setVistoriaDate] = useState('');

  // Estado para filtro de categoria
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  // Estados para modal de novo item
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('VISTORIA');

  // Estados para modal de correção
  const [showCorrecaoModal, setShowCorrecaoModal] = useState(false);
  const [correcaoText, setCorrecaoText] = useState('');

  // Estados para modal de "Em Andamento" (o que falta)
  const [showAndamentoModal, setShowAndamentoModal] = useState(false);
  const [oQueFaltaText, setOQueFaltaText] = useState('');
  const [dataAndamento, setDataAndamento] = useState('');

  // Estados para modal de checklist VISTORIA
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistVistoria, setChecklistVistoria] = useState(false);
  const [checklistRelatorio, setChecklistRelatorio] = useState(false);

  // Estados para modal de detalhes do card
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanItem | null>(null);

  // Estados para modal de edição de status
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KanbanItem | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<string>('');

  // Estados para pendências (integração com Relatório de Pendências)
  const [showAddPendencia, setShowAddPendencia] = useState(false);
  const [novaPendenciaTipo, setNovaPendenciaTipo] = useState<'CONSTATACAO' | 'PENDENCIA'>('PENDENCIA');
  const [novaPendenciaLocal, setNovaPendenciaLocal] = useState('');
  const [novaPendenciaDescricao, setNovaPendenciaDescricao] = useState('');
  const [novaPendenciaFoto, setNovaPendenciaFoto] = useState<string | null>(null);
  const [salvandoNoSupabase, setSalvandoNoSupabase] = useState(false);

  // Função para salvar pendência no Supabase (cria relatório automaticamente com nome do card)
  const salvarPendenciaNoSupabase = async (
    cardTitle: string,
    cardCategory: string,
    local: string,
    descricao: string,
    fotoUrl: string | null,
    tipo: 'CONSTATACAO' | 'PENDENCIA'
  ) => {
    if (!contratoId) {
      console.log('ContratoId não disponível, salvando apenas localmente');
      return;
    }

    try {
      setSalvandoNoSupabase(true);
      console.log('🔍 ========== SALVANDO PENDÊNCIA NO SUPABASE ==========');
      console.log('🔍 Contrato ID:', contratoId);
      console.log('🔍 Card Title:', cardTitle);
      console.log('🔍 Card Category:', cardCategory);
      console.log('🔍 Tipo:', tipo);

      // 1. Buscar ou criar relatório com o nome do card
      const relatorios = await relatorioPendenciasService.getAll(contratoId);
      console.log('📋 Total de relatórios encontrados:', relatorios.length);
      console.log('📋 Relatórios:', relatorios.map(r => ({ id: r.id, titulo: r.titulo })));

      // Busca case-insensitive e com trim para evitar problemas
      let relatorio = relatorios.find(r =>
        r.titulo?.trim().toLowerCase() === cardTitle?.trim().toLowerCase()
      );
      console.log('🎯 Relatório encontrado (busca normalizada):', relatorio ? relatorio.id : 'NENHUM');

      let relatorioId: string;

      if (!relatorio) {
        // Criar novo relatório com nome do card
        const novoRelatorio = await relatorioPendenciasService.create({
          contrato_id: contratoId,
          titulo: cardTitle.trim()
        });
        relatorioId = novoRelatorio.id;
        console.log('✅ Relatório CRIADO:', relatorioId, '- Título:', cardTitle);
      } else {
        relatorioId = relatorio.id;
        console.log('✅ Relatório EXISTENTE:', relatorioId, '- Título:', relatorio.titulo);
      }

      // 2. Buscar dados frescos do relatório (incluindo seções)
      const relatorioCompleto = await relatorioPendenciasService.getById(relatorioId);
      console.log('📋 Relatório completo carregado:', relatorioCompleto?.id);
      console.log('📋 Seções encontradas:', relatorioCompleto?.secoes?.length || 0);
      if (relatorioCompleto?.secoes) {
        console.log('📋 Detalhe das seções:', relatorioCompleto.secoes.map(s => ({
          id: s.id,
          titulo: s.titulo_principal,
          pendencias: s.pendencias?.length || 0
        })));
      }

      // Buscar seção existente (case-insensitive e com trim)
      const secaoTitulo = cardCategory.trim();
      let secao = relatorioCompleto?.secoes?.find(s =>
        s.titulo_principal?.trim().toLowerCase() === secaoTitulo.toLowerCase()
      );
      console.log('🎯 Seção encontrada (busca normalizada):', secao ? secao.id : 'NENHUMA');

      let secaoId: string;
      let pendenciasExistentes = 0;

      if (!secao) {
        // Criar nova seção com a categoria
        const ordem = (relatorioCompleto?.secoes?.length || 0) + 1;
        const novaSecao = await relatorioPendenciasService.createSecao({
          relatorio_id: relatorioId,
          ordem: ordem,
          titulo_principal: secaoTitulo,
          subtitulo: tipo === 'CONSTATACAO' ? 'Constatações' : 'Pendências',
          tem_subsecoes: false
        });
        secaoId = novaSecao.id;
        pendenciasExistentes = 0;
        console.log('✅ Seção CRIADA:', secaoId, '- Título:', secaoTitulo);
      } else {
        secaoId = secao.id;
        pendenciasExistentes = secao.pendencias?.length || 0;
        console.log('✅ Seção EXISTENTE:', secaoId, '- Título:', secao.titulo_principal, '- Pendências existentes:', pendenciasExistentes);
      }

      // 3. Upload da foto para o Storage (se houver)
      let fotoPublicUrl: string | null = null;
      if (fotoUrl && fotoUrl.startsWith('data:')) {
        console.log('📸 Fazendo upload da foto para o Storage...');
        try {
          const fileName = `kanban-${Date.now()}.jpg`;
          const file = base64ToFile(fotoUrl, fileName);
          const filePath = `kanban-pendencias/${relatorioId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('fotos')
            .upload(filePath, file);

          if (uploadError) {
            console.error('❌ Erro no upload da foto:', uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from('fotos')
              .getPublicUrl(filePath);
            fotoPublicUrl = urlData.publicUrl;
            console.log('✅ Foto uploaded! URL:', fotoPublicUrl);
          }
        } catch (uploadErr) {
          console.error('❌ Erro ao processar upload:', uploadErr);
        }
      } else if (fotoUrl) {
        // Se já é uma URL (não é base64), usar direto
        fotoPublicUrl = fotoUrl;
      }

      // 4. CONSTATAÇÃO = Subseção com grid de fotos | PENDÊNCIA = Pendência normal
      if (tipo === 'CONSTATACAO') {
        // CONSTATAÇÃO: Criar ou atualizar SUBSEÇÃO tipo CONSTATACAO
        console.log('🟢 Criando SUBSEÇÃO tipo CONSTATACAO...');

        // Buscar subseção de constatação existente na seção
        const secaoCompleta = relatorioCompleto?.secoes?.find(s => s.id === secaoId);
        let subsecaoConstatacao = secaoCompleta?.subsecoes?.find(
          (sub: any) => sub.tipo === 'CONSTATACAO'
        );

        if (subsecaoConstatacao) {
          // Subseção já existe: adicionar foto ao array
          console.log('📸 Adicionando foto à subseção existente:', subsecaoConstatacao.id);
          const fotosExistentes = (subsecaoConstatacao as any).fotos_constatacao || [];
          const novasFotos = fotoPublicUrl ? [...fotosExistentes, fotoPublicUrl] : fotosExistentes;
          const novaDescricao = descricao || (subsecaoConstatacao as any).descricao_constatacao || '';

          await relatorioPendenciasService.updateSubsecao(subsecaoConstatacao.id, {
            fotos_constatacao: novasFotos,
            descricao_constatacao: novaDescricao
          });
          console.log('✅ Subseção ATUALIZADA com nova foto');
        } else {
          // Criar nova subseção de constatação
          console.log('🆕 Criando nova subseção de constatação...');
          const ordemSubsecao = (secaoCompleta?.subsecoes?.length || 0);
          const letra = String.fromCharCode(65 + ordemSubsecao); // A, B, C...

          // Marcar seção como tendo subseções
          await relatorioPendenciasService.updateSecao(secaoId, {
            tem_subsecoes: true
          });

          await relatorioPendenciasService.createSubsecao({
            secao_id: secaoId,
            ordem: ordemSubsecao,
            titulo: `${letra} - CONSTATAÇÃO`,
            tipo: 'CONSTATACAO',
            fotos_constatacao: fotoPublicUrl ? [fotoPublicUrl] : [],
            descricao_constatacao: descricao || ''
          });
          console.log('✅ Subseção CONSTATACAO criada');
        }
      } else {
        // PENDÊNCIA: Criar pendência normal
        console.log('🔴 Criando PENDÊNCIA normal...');
        console.log('➕ Ordem:', pendenciasExistentes + 1);

        await relatorioPendenciasService.createPendencia({
          secao_id: secaoId,
          ordem: pendenciasExistentes + 1,
          local: local,
          descricao: descricao,
          foto_url: fotoPublicUrl,
          foto_depois_url: null,
          status: 'PENDENTE'
        });
        console.log('✅ Pendência SALVA no Supabase');
      }

      console.log('🔍 ========== FIM SALVANDO ==========');

    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
      // Não bloquear - dados já estão salvos localmente
    } finally {
      setSalvandoNoSupabase(false);
    }
  };

  // Filtrar itens baseado na categoria selecionada
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'TODOS') return items;
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Recalcular colunas baseado no estado atual dos items filtrados
  const getColumns = () => [
    {
      id: 'aguardando',
      title: 'Aguardando (MP)',
      icon: Search,
      color: 'bg-red-600 text-white',
      items: filteredItems.filter(item => item.status === 'aguardando')
    },
    {
      id: 'em_andamento',
      title: 'Em andamento (MP)',
      icon: Wrench,
      color: 'bg-yellow-500 text-black',
      items: filteredItems.filter(item => item.status === 'em_andamento')
    },
    {
      id: 'em_correcao',
      title: 'Em correção (Construtora)',
      icon: ClipboardList,
      color: 'bg-orange-600 text-white',
      items: filteredItems.filter(item => item.status === 'em_correcao')
    },
    {
      id: 'finalizado',
      title: 'Recebido',
      icon: CheckCircle,
      color: 'bg-emerald-600 text-white',
      items: filteredItems.filter(item => item.status === 'finalizado')
    }
  ];


  const handleDragStart = (item: KanbanItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      console.log('🔄 Movendo item:', draggedItem.title, 'para:', newStatus);

      // Se está movendo para "Em Andamento", pedir o que falta
      if (newStatus === 'em_andamento') {
        setPendingMove({ item: draggedItem, newStatus });
        setShowAndamentoModal(true);
        setDraggedItem(null);
        return;
      }

      // Se está movendo para "Em Correção", pedir o que precisa corrigir
      if (newStatus === 'em_correcao') {
        setPendingMove({ item: draggedItem, newStatus });
        setShowCorrecaoModal(true);
        setDraggedItem(null);
        return;
      }

      // Se está movendo para "Finalizado", verificar se é VISTORIA
      if (newStatus === 'finalizado') {
        // Se for categoria VISTORIA, verificar checklist
        if (draggedItem.category === 'VISTORIA') {
          const checklist = draggedItem.checklistVistoria;
          if (!checklist || !checklist.vistoriaRealizada || !checklist.relatorioGerado) {
            alert('⚠️ Para finalizar um item de VISTORIA, você precisa completar o checklist:\n\n✓ Vistoria Realizada\n✓ Relatório Gerado\n\nClique no card para marcar os itens do checklist.');
            setDraggedItem(null);
            return;
          }
        }
        setPendingMove({ item: draggedItem, newStatus });
        setShowDateModal(true);
        setDraggedItem(null);
        return;
      }

      // Para outros status, mover diretamente
      setItems(prev => prev.map(item =>
        item.id === draggedItem.id
          ? { ...item, status: newStatus as any, updatedAt: new Date().toISOString().split('T')[0] }
          : item
      ));
      setDraggedItem(null);
    }
  };

  const handleConfirmRecebimento = () => {
    if (pendingMove && recebimentoDate) {
      setItems(prev => prev.map(item => {
        if (item.id === pendingMove.item.id) {
          // Se o item tinha correção, criar histórico
          const historicoCorrecao = item.correcao
            ? `Item corrigido em ${new Date().toLocaleDateString('pt-BR')}. Problema inicial: ${item.correcao}`
            : undefined;

          return {
            ...item,
            status: 'finalizado' as any,
            updatedAt: new Date().toISOString().split('T')[0],
            dataRecebimento: recebimentoDate,
            dataCorrecao: item.correcao ? new Date().toISOString().split('T')[0] : undefined,
            historicoCorrecao
          };
        }
        return item;
      }));
      setShowDateModal(false);
      setPendingMove(null);
      setRecebimentoDate('');
    }
  };

  const handleConfirmVistoria = () => {
    if (pendingMove && vistoriaDate) {
      setItems(prev => prev.map(item =>
        item.id === pendingMove.item.id
          ? { ...item, status: 'em_andamento' as any, updatedAt: new Date().toISOString().split('T')[0], dataVistoria: vistoriaDate }
          : item
      ));
      setShowDateModal(false);
      setPendingMove(null);
      setVistoriaDate('');
    }
  };

  // Função para confirmar modal de "Em Andamento"
  const handleConfirmAndamento = () => {
    if (pendingMove && oQueFaltaText.trim() && dataAndamento) {
      setItems(prev => prev.map(item =>
        item.id === pendingMove.item.id
          ? {
            ...item,
            status: 'em_andamento' as any,
            oQueFalta: oQueFaltaText.trim(),
            dataAndamento: dataAndamento,
            updatedAt: new Date().toISOString().split('T')[0]
          }
          : item
      ));
      setOQueFaltaText('');
      setDataAndamento('');
      setShowAndamentoModal(false);
      setPendingMove(null);
    }
  };

  const handleCancelAndamento = () => {
    setOQueFaltaText('');
    setDataAndamento('');
    setShowAndamentoModal(false);
    setPendingMove(null);
  };

  const handleCancelModal = () => {
    setShowDateModal(false);
    setPendingMove(null);
    setRecebimentoDate('');
    setVistoriaDate('');
  };

  // Funções para criar novo item
  const handleCreateNewItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem: KanbanItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      status: 'aguardando', // Novos itens sempre começam em Aguardando
      category: newItemCategory,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setItems(prev => [...prev, newItem]);
    setNewItemTitle('');
    setNewItemCategory('VISTORIA');
    setShowNewItemModal(false);
  };

  const handleCancelNewItem = () => {
    setNewItemTitle('');
    setNewItemCategory('VISTORIA');
    setShowNewItemModal(false);
  };

  // Função para remover item
  const handleRemoveItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item do Kanban?')) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Funções para modal de correção
  const handleConfirmCorrecao = () => {
    if (pendingMove && correcaoText.trim() && vistoriaDate) {
      setItems(prev => prev.map(item =>
        item.id === pendingMove.item.id
          ? {
            ...item,
            status: 'em_correcao' as any,
            correcao: correcaoText.trim(),
            dataCorrecao: vistoriaDate,
            updatedAt: new Date().toISOString().split('T')[0]
          }
          : item
      ));
    }
    setCorrecaoText('');
    setVistoriaDate('');
    setShowCorrecaoModal(false);
    setPendingMove(null);
  };

  const handleCancelCorrecao = () => {
    setCorrecaoText('');
    setVistoriaDate('');
    setShowCorrecaoModal(false);
    setPendingMove(null);
  };

  // Função para abrir modal de edição de status
  const handleEditStatus = (item: KanbanItem) => {
    setEditingItem(item);
    setNewStatusValue(item.status);
    setShowEditStatusModal(true);
  };

  // Função para confirmar mudança de status
  const handleConfirmStatusChange = () => {
    if (!editingItem || !newStatusValue) return;

    // Se está mudando para "Em Andamento", pedir o que falta
    if (newStatusValue === 'em_andamento') {
      setPendingMove({ item: editingItem, newStatus: newStatusValue });
      setShowEditStatusModal(false);
      setShowAndamentoModal(true);
      return;
    }

    // Se está mudando para "Em Correção", pedir o que precisa corrigir
    if (newStatusValue === 'em_correcao') {
      setPendingMove({ item: editingItem, newStatus: newStatusValue });
      setShowEditStatusModal(false);
      setShowCorrecaoModal(true);
      return;
    }

    // Se está mudando para "Finalizado", verificar se é VISTORIA
    if (newStatusValue === 'finalizado') {
      // Se for categoria VISTORIA, verificar checklist
      if (editingItem.category === 'VISTORIA') {
        const checklist = editingItem.checklistVistoria;
        if (!checklist || !checklist.vistoriaRealizada || !checklist.relatorioGerado) {
          alert('⚠️ Para finalizar um item de VISTORIA, você precisa completar o checklist:\n\n✓ Vistoria Realizada\n✓ Relatório Gerado\n\nClique no card para marcar os itens do checklist.');
          setShowEditStatusModal(false);
          setEditingItem(null);
          return;
        }
      }
      setPendingMove({ item: editingItem, newStatus: newStatusValue });
      setShowEditStatusModal(false);
      setShowDateModal(true);
      return;
    }

    // Para outros status, mudar diretamente
    setItems(prev => prev.map(item =>
      item.id === editingItem.id
        ? { ...item, status: newStatusValue as any, updatedAt: new Date().toISOString().split('T')[0] }
        : item
    ));
    setShowEditStatusModal(false);
    setEditingItem(null);
  };

  // Função para mostrar detalhes do card
  const handleShowCardDetails = (item: KanbanItem) => {
    setSelectedCard(item);
    setShowCardDetails(true);
  };

  // Helper para pegar a cor da categoria
  const getCategoryColor = (categoryId: string) => {
    const category = Object.values(CATEGORIES).find(c => c.id === categoryId);
    return category ? category.border : 'border-l-gray-300';
  };

  const getCategoryBadge = (categoryId: string) => {
    const category = Object.values(CATEGORIES).find(c => c.id === categoryId);
    if (!category) return null;

    // Para categorias de RECEBIMENTO, mostrar apenas "RECEBIMENTO"
    let labelText = category.label.split('.')[1].trim();
    if (categoryId.startsWith('RECEBIMENTO_')) {
      labelText = 'RECEBIMENTO';
    }

    return (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${category.color} text-white shadow-sm`}>
        {labelText}
      </span>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban - Implantação de Manutenção Predial</h1>
          <p className="text-gray-600 mt-1">Acompanhe o progresso da implantação dos sistemas prediais</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de Categoria */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-md border border-white/20 shadow-lg">
            <Filter className="w-4 h-4 text-gray-500 ml-2" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] border-0 focus:ring-0 h-8">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas as Categorias</SelectItem>
                {Object.values(CATEGORIES).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowNewItemModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-white mb-3">Resumo do Progresso {selectedCategory !== 'TODOS' && `(${Object.values(CATEGORIES).find(c => c.id === selectedCategory)?.label})`}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getColumns().map((column) => {
            const Icon = column.icon;
            return (
              <div key={column.id} className="text-center glass p-3 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-300">{column.title}</span>
                </div>
                <div className="text-2xl font-bold text-white">{column.items.length}</div>
                <div className="text-xs text-gray-400">itens</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getColumns().map((column) => {
          const Icon = column.icon;
          return (
            <div
              key={column.id}
              className="flex flex-col glass-kanban-column"
              style={{ height: 'calc(100vh - 350px)', minHeight: '700px' }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`flex items-center gap-2 p-3 rounded-t-lg ${column.color}`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="outline" className="ml-auto text-black">
                  {column.items.length}
                </Badge>
              </div>

              {/* Column Items - Scrollable Area */}
              <div className="flex-1 p-2 overflow-y-auto">
                <div className="space-y-3 min-h-full pb-32">
                  {column.items.map((item) => (
                    <Card
                      key={item.id}
                      className={`cursor-move hover:shadow-lg transition-all glass-kanban-card border-l-4 ${getCategoryColor(item.category)}`}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onClick={() => handleShowCardDetails(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <div className="mb-1">
                              {getCategoryBadge(item.category)}
                            </div>
                            <h4 className="font-medium text-gray-900 text-sm leading-tight">
                              {item.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.correcao && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full" title="Em correção"></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id);
                              }}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-500/20 p-1 h-6 w-6"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            {/* Edit Status Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStatus(item);
                              }}
                              className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 p-1 h-6 w-6"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          {item.dataVistoria && (
                            <div className="text-[10px] text-white bg-orange-600 px-2 py-0.5 rounded">
                              Vistoria: {new Date(item.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {item.dataRecebimento && (
                            <div className="text-[10px] text-white bg-blue-600 px-2 py-0.5 rounded">
                              Recebido: {new Date(item.dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {item.fotos && item.fotos.length > 0 && (
                            <div className="text-[10px] text-white bg-green-600 px-2 py-0.5 rounded flex items-center gap-1">
                              📸 {item.fotos.length} {item.fotos.length === 1 ? 'foto' : 'fotos'}
                            </div>
                          )}
                        </div>

                        {/* Progress Bar do Checklist */}
                        {(() => {
                          let total = 0;
                          let filled = 0;

                          if (COMISSIONAMENTO_CHECKLISTS[item.id]) {
                            const grupos = COMISSIONAMENTO_CHECKLISTS[item.id];
                            grupos.forEach(g => { total += g.itens.length; });
                            const cl = item.checklistComissionamento || {};
                            filled = Object.keys(cl).length;
                          } else if (item.id === '55') {
                            const fields = ['temExtintor','extintorValidade','temMangueira','mangueirasValidade','temEngates','temChaveStorz','temBico'] as const;
                            total = fields.length;
                            const cl = item.checklistConferenciaIncendio || {};
                            filled = fields.filter(f => cl[f]).length;
                          } else if (item.id === '65') {
                            const fields = ['mdAreasEquipamentos','mdAcabamentos','mdMobiliario','mvAreasEquipamentos','mvAcabamentos','mvMobiliario'] as const;
                            total = fields.length;
                            const cl = item.checklistConferenciaMemorial || {};
                            filled = fields.filter(f => cl[f]).length;
                          }

                          if (total === 0) return null;

                          const pct = Math.round((filled / total) * 100);
                          const barColor = pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-gray-300';
                          const textColor = pct === 100 ? 'text-green-600' : pct > 0 ? 'text-yellow-600' : 'text-gray-400';

                          return (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400">Checklist</span>
                                <span className={`text-[10px] font-semibold ${textColor}`}>{filled}/{total}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Empty state */}
                  {column.items.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      Nenhum item nesta coluna
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Data */}
      {
        showDateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-modal p-6 w-96 max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">
                  {pendingMove?.newStatus === 'finalizado' ? 'Data de Recebimento' : 'Data de Vistoria'}
                </h3>
              </div>

              <p className="text-gray-300 mb-4">
                Informe a data {pendingMove?.newStatus === 'finalizado' ? 'de recebimento' : 'de vistoria'} para o item: <strong className="text-white">{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {pendingMove?.newStatus === 'finalizado' ? 'Data de Recebimento' : 'Data de Vistoria'}
                </label>
                <input
                  type="date"
                  value={pendingMove?.newStatus === 'finalizado' ? recebimentoDate : vistoriaDate}
                  onChange={(e) => {
                    if (pendingMove?.newStatus === 'finalizado') {
                      setRecebimentoDate(e.target.value);
                    } else {
                      setVistoriaDate(e.target.value);
                    }
                  }}
                  className="glass-input w-full px-3 py-2"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelModal}
                  className="text-gray-300 border-white/20 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={pendingMove?.newStatus === 'finalizado' ? handleConfirmRecebimento : handleConfirmVistoria}
                  disabled={pendingMove?.newStatus === 'finalizado' ? !recebimentoDate : !vistoriaDate}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600"
                >
                  {pendingMove?.newStatus === 'finalizado' ? 'Confirmar Recebimento' : 'Confirmar Vistoria'}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal para Novo Item */}
      {
        showNewItemModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-modal p-6 w-96 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Novo Item</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelNewItem}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-gray-300 mb-4">
                Crie um novo item que será adicionado automaticamente na coluna "AG Vistoria".
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="newItemTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Item
                  </Label>
                  <Input
                    id="newItemTitle"
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Digite o título do novo item..."
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="newItemCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </Label>
                  <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CATEGORIES).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelNewItem}
                  className="text-gray-300 border-white/20 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateNewItem}
                  disabled={!newItemTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600"
                >
                  Criar Item
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal para Correção */}
      {
        showCorrecaoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-modal p-6 w-96 max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Qual correção?</h3>
              </div>

              <p className="text-gray-300 mb-4">
                Descreva qual correção precisa ser feita no item: <strong className="text-white">{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4 space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-300 mb-2">
                    Data da Correção
                  </Label>
                  <input
                    type="date"
                    value={vistoriaDate}
                    onChange={(e) => setVistoriaDate(e.target.value)}
                    className="glass-input w-full px-3 py-2"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-300 mb-2">
                    Motivo da Correção
                  </Label>
                  <textarea
                    value={correcaoText}
                    onChange={(e) => setCorrecaoText(e.target.value)}
                    placeholder="Descreva qual correção precisa ser feita..."
                    className="glass-input w-full px-3 py-2 h-32 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelCorrecao}
                  className="text-gray-300 border-white/20 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmCorrecao}
                  disabled={!correcaoText.trim() || !vistoriaDate}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600"
                >
                  Confirmar Correção
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal para "Em Andamento" (O que falta?) */}
      {
        showAndamentoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-modal p-6 w-96 max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">O que falta?</h3>
              </div>

              <p className="text-gray-300 mb-4">
                Descreva o que falta para concluir o item: <strong className="text-white">{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4 space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-300 mb-2">
                    Data
                  </Label>
                  <input
                    type="date"
                    value={dataAndamento}
                    onChange={(e) => setDataAndamento(e.target.value)}
                    className="glass-input w-full px-3 py-2"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-300 mb-2">
                    O que falta para concluir?
                  </Label>
                  <textarea
                    value={oQueFaltaText}
                    onChange={(e) => setOQueFaltaText(e.target.value)}
                    placeholder="Descreva o que ainda falta fazer..."
                    className="glass-input w-full px-3 py-2 h-32 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelAndamento}
                  className="text-gray-300 border-white/20 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmAndamento}
                  disabled={!oQueFaltaText.trim() || !dataAndamento}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal de Detalhes do Card */}
      {
        showCardDetails && selectedCard && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-modal w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className={`p-4 ${getCategoryColor(selectedCard.category).replace('border-l-4', 'border-l-8')} border-l-solid bg-white/5 flex justify-between items-start shrink-0`}>
                <div>
                  <div className="mb-2">
                    {getCategoryBadge(selectedCard.category)}
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedCard.title}</h2>
                  <p className="text-sm text-gray-400">ID: {selectedCard.id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCardDetails(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-1 font-semibold">Status Atual</h3>
                    <Badge className={`
                    ${selectedCard.status === 'aguardando' ? 'bg-red-600 text-white' : ''}
                    ${selectedCard.status === 'em_andamento' ? 'bg-yellow-500 text-black' : ''}
                    ${selectedCard.status === 'em_correcao' ? 'bg-orange-600 text-white' : ''}
                    ${selectedCard.status === 'finalizado' ? 'bg-emerald-600 text-white' : ''}
                  `}>
                      {selectedCard.status === 'aguardando' && 'Aguardando (MP)'}
                      {selectedCard.status === 'em_andamento' && 'Em andamento (MP)'}
                      {selectedCard.status === 'em_correcao' && 'Em correção (Construtora)'}
                      {selectedCard.status === 'finalizado' && 'Recebido'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-1 font-semibold">Categoria</h3>
                    <span className="text-white font-bold text-base">
                      {Object.values(CATEGORIES).find(c => c.id === selectedCard.category)?.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-1 font-semibold">Data de Criação</h3>
                    <p className="text-white font-bold text-base">
                      {new Date(selectedCard.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-1 font-semibold">Última Atualização</h3>
                    <p className="text-white font-bold text-base">
                      {new Date(selectedCard.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {selectedCard.dataVistoria && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-300 font-semibold">Data da Vistoria</h3>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const novaData = prompt('Nova data de vistoria (DD/MM/YYYY):', new Date(selectedCard.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR'));
                            if (novaData) {
                              const partes = novaData.split('/');
                              if (partes.length === 3) {
                                const dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                                setItems(prev => prev.map(item =>
                                  item.id === selectedCard.id
                                    ? { ...item, dataVistoria: dataFormatada, updatedAt: new Date().toISOString().split('T')[0] }
                                    : item
                                ));
                                setSelectedCard({ ...selectedCard, dataVistoria: dataFormatada });
                              }
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 h-7 px-3"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-white font-bold text-base">
                        {new Date(selectedCard.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {selectedCard.dataRecebimento && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-300 font-semibold">Data de Recebimento</h3>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const novaData = prompt('Nova data de recebimento (DD/MM/YYYY):', new Date(selectedCard.dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR'));
                            if (novaData) {
                              const partes = novaData.split('/');
                              if (partes.length === 3) {
                                const dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                                setItems(prev => prev.map(item =>
                                  item.id === selectedCard.id
                                    ? { ...item, dataRecebimento: dataFormatada, updatedAt: new Date().toISOString().split('T')[0] }
                                    : item
                                ));
                                setSelectedCard({ ...selectedCard, dataRecebimento: dataFormatada });
                              }
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 h-7 px-3"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-white font-bold text-base">
                        {new Date(selectedCard.dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Checklist para VISTORIA */}
                {selectedCard.category === 'VISTORIA' && (
                  <div className="bg-black border-2 border-blue-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Vistoria
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCard.checklistVistoria?.vistoriaRealizada || false}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistVistoria: {
                                vistoriaRealizada: e.target.checked,
                                relatorioGerado: selectedCard.checklistVistoria?.relatorioGerado || false,
                                observacoes: selectedCard.checklistVistoria?.observacoes || '',
                                dataVistoria: selectedCard.checklistVistoria?.dataVistoria || '',
                                dataEntregaRelatorio: selectedCard.checklistVistoria?.dataEntregaRelatorio || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <span className="text-white font-bold">✓ Vistoria Realizada</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCard.checklistVistoria?.relatorioGerado || false}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistVistoria: {
                                vistoriaRealizada: selectedCard.checklistVistoria?.vistoriaRealizada || false,
                                relatorioGerado: e.target.checked,
                                observacoes: selectedCard.checklistVistoria?.observacoes || '',
                                dataVistoria: selectedCard.checklistVistoria?.dataVistoria || '',
                                dataEntregaRelatorio: selectedCard.checklistVistoria?.dataEntregaRelatorio || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <span className="text-white font-bold">✓ Criação de Relatório</span>
                      </label>

                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações (Acompanhamento, etc.)
                        </label>
                        <textarea
                          value={selectedCard.checklistVistoria?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistVistoria: {
                                vistoriaRealizada: selectedCard.checklistVistoria?.vistoriaRealizada || false,
                                relatorioGerado: selectedCard.checklistVistoria?.relatorioGerado || false,
                                observacoes: e.target.value,
                                dataVistoria: selectedCard.checklistVistoria?.dataVistoria || '',
                                dataEntregaRelatorio: selectedCard.checklistVistoria?.dataEntregaRelatorio || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações sobre acompanhamento, pendências, etc..."
                          className="w-full px-3 py-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>

                      {/* Data da Vistoria */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📅 Data da Vistoria
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistVistoria?.dataVistoria || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistVistoria: {
                                vistoriaRealizada: selectedCard.checklistVistoria?.vistoriaRealizada || false,
                                relatorioGerado: selectedCard.checklistVistoria?.relatorioGerado || false,
                                observacoes: selectedCard.checklistVistoria?.observacoes || '',
                                dataVistoria: e.target.value,
                                dataEntregaRelatorio: selectedCard.checklistVistoria?.dataEntregaRelatorio || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-900 font-medium"
                        />
                      </div>

                      {/* Data da Entrega do Relatório */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📄 Data da Entrega do Relatório
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistVistoria?.dataEntregaRelatorio || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistVistoria: {
                                vistoriaRealizada: selectedCard.checklistVistoria?.vistoriaRealizada || false,
                                relatorioGerado: selectedCard.checklistVistoria?.relatorioGerado || false,
                                observacoes: selectedCard.checklistVistoria?.observacoes || '',
                                dataVistoria: selectedCard.checklistVistoria?.dataVistoria || '',
                                dataEntregaRelatorio: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistVistoria?.vistoriaRealizada &&
                     selectedCard.checklistVistoria?.relatorioGerado && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Pode mover para Finalizado
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para RECEBIMENTO_INCENDIO */}
                {selectedCard.category === 'RECEBIMENTO_INCENDIO' && (
                  <div className="bg-black border-2 border-yellow-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Recebimento de Incêndio
                    </h3>
                    <div className="space-y-3">
                      {/* EXTINTORES */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoIncendio?.extintores || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoIncendio: {
                                  ...selectedCard.checklistRecebimentoIncendio,
                                  extintores: e.target.checked,
                                  dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                  mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                  dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                  engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                  dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                  tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                  dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                  chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                  dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                  bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                  dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                  observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIDO EXTINTORES</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoIncendio?.dataExtintores || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: e.target.value,
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* MANGUEIRAS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoIncendio?.mangueiras || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoIncendio: {
                                  ...selectedCard.checklistRecebimentoIncendio,
                                  extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                  dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                  mangueiras: e.target.checked,
                                  dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                  engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                  dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                  tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                  dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                  chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                  dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                  bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                  dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                  observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIDO MANGUEIRAS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoIncendio?.dataMangueiras || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: e.target.value,
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ENGATES */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoIncendio?.engates || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoIncendio: {
                                  ...selectedCard.checklistRecebimentoIncendio,
                                  extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                  dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                  mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                  dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                  engates: e.target.checked,
                                  dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                  tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                  dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                  chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                  dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                  bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                  dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                  observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIDO ENGATES</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoIncendio?.dataEngates || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: e.target.value,
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* TAMPAS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoIncendio?.tampas || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoIncendio: {
                                  ...selectedCard.checklistRecebimentoIncendio,
                                  extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                  dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                  mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                  dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                  engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                  dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                  tampas: e.target.checked,
                                  dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                  chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                  dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                  bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                  dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                  observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIDO TAMPAS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoIncendio?.dataTampas || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: e.target.value,
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* CHAVES STORZ */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoIncendio?.chavesStorz || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoIncendio: {
                                  ...selectedCard.checklistRecebimentoIncendio,
                                  extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                  dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                  mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                  dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                  engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                  dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                  tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                  dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                  chavesStorz: e.target.checked,
                                  dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                  bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                  dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                  observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIDO CHAVES STORZ</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: e.target.value,
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* BICOS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoIncendio?.bicos || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoIncendio: {
                                  ...selectedCard.checklistRecebimentoIncendio,
                                  extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                  dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                  mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                  dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                  engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                  dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                  tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                  dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                  chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                  dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                  bicos: e.target.checked,
                                  dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                  observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIDO BICOS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoIncendio?.dataBicos || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: e.target.value,
                                observacoes: selectedCard.checklistRecebimentoIncendio?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistRecebimentoIncendio?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoIncendio: {
                                ...selectedCard.checklistRecebimentoIncendio,
                                extintores: selectedCard.checklistRecebimentoIncendio?.extintores || false,
                                dataExtintores: selectedCard.checklistRecebimentoIncendio?.dataExtintores || '',
                                mangueiras: selectedCard.checklistRecebimentoIncendio?.mangueiras || false,
                                dataMangueiras: selectedCard.checklistRecebimentoIncendio?.dataMangueiras || '',
                                engates: selectedCard.checklistRecebimentoIncendio?.engates || false,
                                dataEngates: selectedCard.checklistRecebimentoIncendio?.dataEngates || '',
                                tampas: selectedCard.checklistRecebimentoIncendio?.tampas || false,
                                dataTampas: selectedCard.checklistRecebimentoIncendio?.dataTampas || '',
                                chavesStorz: selectedCard.checklistRecebimentoIncendio?.chavesStorz || false,
                                dataChavesStorz: selectedCard.checklistRecebimentoIncendio?.dataChavesStorz || '',
                                bicos: selectedCard.checklistRecebimentoIncendio?.bicos || false,
                                dataBicos: selectedCard.checklistRecebimentoIncendio?.dataBicos || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre o recebimento..."
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistRecebimentoIncendio?.extintores &&
                     selectedCard.checklistRecebimentoIncendio?.mangueiras &&
                     selectedCard.checklistRecebimentoIncendio?.engates &&
                     selectedCard.checklistRecebimentoIncendio?.tampas &&
                     selectedCard.checklistRecebimentoIncendio?.chavesStorz &&
                     selectedCard.checklistRecebimentoIncendio?.bicos && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens recebidos
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Áreas Comuns para RECEBIMENTO_AREAS */}
                {selectedCard.category === 'RECEBIMENTO_AREAS' && (() => {
                  const AREAS_PADRAO = [
                    'Academia', 'Churrasqueira', 'Espaço Gourmet', 'Salão de Festas',
                    'Playground', 'Piscina', 'Quadra Esportiva', 'Sauna',
                    'Brinquedoteca', 'Salão de Jogos'
                  ];
                  const areas = selectedCard.checklistRecebimentoAreas?.areas ||
                    AREAS_PADRAO.map((nome, i) => ({ id: String(i), nome, status: 'pendente' as const, data: '' }));

                  const updateAreas = (newAreas: typeof areas) => {
                    const updated = { ...selectedCard, checklistRecebimentoAreas: { areas: newAreas } };
                    setItems(prev => prev.map(item => item.id === selectedCard.id ? updated : item));
                    setSelectedCard(updated);
                  };

                  const todasRecebidas = areas.length > 0 && areas.every(a => a.status === 'recebido');

                  return (
                    <div className="bg-black border-2 border-yellow-500 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Lista das Áreas do Condomínio
                      </h3>

                      <div className="space-y-2">
                        {areas.map((area, index) => (
                          <div
                            key={area.id}
                            className={`rounded-md px-3 py-2 border flex items-center gap-3 flex-wrap transition-colors ${
                              area.status === 'recebido'
                                ? 'bg-green-900/30 border-green-600'
                                : 'bg-gray-900 border-gray-700'
                            }`}
                          >
                            {/* Checkbox clicável */}
                            <input
                              type="checkbox"
                              checked={area.status === 'recebido'}
                              onChange={(e) => {
                                const newAreas = [...areas];
                                const hoje = new Date().toISOString().split('T')[0];
                                newAreas[index] = {
                                  ...area,
                                  status: e.target.checked ? 'recebido' : 'pendente',
                                  data: e.target.checked ? (area.data || hoje) : area.data
                                };
                                updateAreas(newAreas);
                              }}
                              className="w-5 h-5 cursor-pointer accent-green-500"
                            />

                            {/* Nome da área — clicar no nome também marca */}
                            <label
                              className={`text-sm font-semibold flex-1 cursor-pointer select-none ${
                                area.status === 'recebido' ? 'text-green-400 line-through' : 'text-white'
                              }`}
                              onClick={() => {
                                const newAreas = [...areas];
                                const hoje = new Date().toISOString().split('T')[0];
                                const novoStatus = area.status === 'recebido' ? 'pendente' : 'recebido';
                                newAreas[index] = {
                                  ...area,
                                  status: novoStatus,
                                  data: novoStatus === 'recebido' ? (area.data || hoje) : area.data
                                };
                                updateAreas(newAreas);
                              }}
                            >
                              {area.nome}
                            </label>

                            {/* Badge de status */}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              area.status === 'recebido'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {area.status === 'recebido' ? '✓ Recebido' : 'Pendente'}
                            </span>

                            {/* Data */}
                            <input
                              type="date"
                              value={area.data || ''}
                              onChange={(e) => {
                                const newAreas = [...areas];
                                newAreas[index] = { ...area, data: e.target.value };
                                updateAreas(newAreas);
                              }}
                              className="text-xs px-1 py-0.5 border border-yellow-500 rounded bg-black text-white w-28"
                            />

                            {/* Remover */}
                            <button
                              onClick={() => updateAreas(areas.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-400 font-bold text-base leading-none"
                              title="Remover área"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Botão adicionar área */}
                      <button
                        onClick={() => {
                          const novaArea = prompt('Nome da nova área:');
                          if (novaArea && novaArea.trim()) {
                            updateAreas([...areas, { id: Date.now().toString(), nome: novaArea.trim(), status: 'pendente', data: '' }]);
                          }
                        }}
                        className="mt-3 flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-bold"
                      >
                        <span className="w-6 h-6 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-base leading-none">+</span>
                        Adicionar área
                      </button>

                      {todasRecebidas && (
                        <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                          ✅ Todas as áreas recebidas
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Checklist para CONFERENCIA - ITENS DE BOMBEIRO */}
                {selectedCard.id === '55' && (() => {
                  type SNX = 'sim' | 'nao' | 'x' | undefined;
                  const ci = selectedCard.checklistConferenciaIncendio || {};

                  const updateCI = (field: string, val: SNX) => {
                    const updated = {
                      ...selectedCard,
                      checklistConferenciaIncendio: { ...ci, [field]: val }
                    };
                    setItems(prev => prev.map(item => item.id === selectedCard.id ? updated : item));
                    setSelectedCard(updated);
                  };

                  const SnxBtns = ({ field, value }: { field: string; value: SNX }) => (
                    <div className="flex gap-1">
                      {(['sim', 'nao', 'x'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateCI(field, value === opt ? undefined : opt)}
                          className={`px-3 py-1 rounded text-xs font-bold border-2 transition-colors ${
                            value === opt
                              ? opt === 'sim' ? 'bg-green-600 border-green-500 text-white'
                              : opt === 'nao' ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-gray-500 border-gray-400 text-white'
                              : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          {opt === 'sim' ? 'Sim' : opt === 'nao' ? 'Não' : 'X'}
                        </button>
                      ))}
                    </div>
                  );

                  const secoes = [
                    {
                      titulo: 'Extintores',
                      itens: [
                        { label: 'Todos os andares têm extintor?', field: 'temExtintor' },
                        { label: 'Os extintores estão dentro da validade (mínimo 1 ano)?', field: 'extintorValidade' },
                      ]
                    },
                    {
                      titulo: 'Hidrantes',
                      itens: [
                        { label: 'Todos os hidrantes têm mangueira?', field: 'temMangueira' },
                        { label: 'As mangueiras estão dentro da validade (mínimo 1 ano)?', field: 'mangueirasValidade' },
                        { label: 'Todos os hidrantes têm conexões de engate nas tubulações?', field: 'temEngates' },
                        { label: 'Todos os hidrantes têm chave storz?', field: 'temChaveStorz' },
                        { label: 'Todos os hidrantes têm bico?', field: 'temBico' },
                      ]
                    }
                  ];

                  return (
                    <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Conferência de Itens de Bombeiro
                      </h3>
                      <div className="space-y-4">
                        {secoes.map(({ titulo, itens }) => (
                          <div key={titulo} className="bg-gray-900 rounded-md p-3 border border-gray-700">
                            <div className="text-purple-300 font-bold text-xs mb-3 uppercase">{titulo}</div>
                            <div className="space-y-3">
                              {itens.map(({ label, field }) => (
                                <div key={field} className="flex items-center justify-between gap-3">
                                  <span className="text-white text-xs flex-1">{label}</span>
                                  <SnxBtns field={field} value={(ci as Record<string, SNX>)[field]} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Checklist para CONFERENCIA - MEMORIAL DESCRITIVO */}
                {selectedCard.id === '65' && (() => {
                  type SN = 'sim' | 'nao' | undefined;
                  const cm = selectedCard.checklistConferenciaMemorial || {};

                  const updateCM = (field: string, val: SN | string) => {
                    const updated = {
                      ...selectedCard,
                      checklistConferenciaMemorial: { ...cm, [field]: val }
                    };
                    setItems(prev => prev.map(item => item.id === selectedCard.id ? updated : item));
                    setSelectedCard(updated);
                  };

                  const SnBtns = ({ field, value }: { field: string; value: SN }) => (
                    <div className="flex gap-1">
                      {(['sim', 'nao'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateCM(field, value === opt ? undefined : opt)}
                          className={`px-4 py-1 rounded text-xs font-bold border-2 transition-colors ${
                            value === opt
                              ? opt === 'sim' ? 'bg-green-600 border-green-500 text-white'
                                             : 'bg-red-600 border-red-500 text-white'
                              : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          {opt === 'sim' ? 'Sim' : 'Não'}
                        </button>
                      ))}
                    </div>
                  );

                  const secoes = [
                    {
                      titulo: 'Conferência Memorial Descritivo',
                      itens: [
                        { label: 'Áreas e Equipamentos', field: 'mdAreasEquipamentos' },
                        { label: 'Acabamentos (piso, pintura, pedra, metais, etc)', field: 'mdAcabamentos' },
                        { label: 'Mobiliário', field: 'mdMobiliario' },
                      ]
                    },
                    {
                      titulo: 'Conferência Memorial de Vendas',
                      itens: [
                        { label: 'Áreas e Equipamentos', field: 'mvAreasEquipamentos' },
                        { label: 'Acabamentos (piso, pintura, pedra, metais, etc)', field: 'mvAcabamentos' },
                        { label: 'Mobiliário', field: 'mvMobiliario' },
                      ]
                    }
                  ];

                  return (
                    <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Conferência Memorial Descritivo
                      </h3>
                      <div className="space-y-4">
                        {secoes.map(({ titulo, itens }) => (
                          <div key={titulo} className="bg-gray-900 rounded-md p-3 border border-gray-700">
                            <div className="text-purple-300 font-bold text-xs mb-3 uppercase">{titulo}</div>
                            <div className="space-y-3">
                              {itens.map(({ label, field }) => (
                                <div key={field} className="flex items-center justify-between gap-3">
                                  <span className="text-white text-xs flex-1">{label}</span>
                                  <SnBtns field={field} value={(cm as Record<string, SN>)[field]} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="mt-1">
                          <label className="block text-white font-bold text-xs mb-2">📝 Observações</label>
                          <textarea
                            value={cm.observacoes || ''}
                            onChange={(e) => updateCM('observacoes', e.target.value)}
                            placeholder="Digite observações sobre o memorial..."
                            className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none text-white bg-gray-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Checklist para RECEBIMENTO_CHAVES */}
                {selectedCard.category === 'RECEBIMENTO_CHAVES' && (
                  <div className="bg-black border-2 border-yellow-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Recebimento de Chaves do Condomínio
                    </h3>
                    <div className="space-y-3">
                      {/* RECEBIMENTO CHAVES ÁREAS COMUNS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoChaves?.chavesAreasComuns || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoChaves: {
                                  chavesAreasComuns: e.target.checked,
                                  dataChavesAreasComuns: selectedCard.checklistRecebimentoChaves?.dataChavesAreasComuns || '',
                                  chavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.chavesAreasTecnicas || false,
                                  dataChavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.dataChavesAreasTecnicas || '',
                                  observacoes: selectedCard.checklistRecebimentoChaves?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIMENTO CHAVES ÁREAS COMUNS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoChaves?.dataChavesAreasComuns || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoChaves: {
                                chavesAreasComuns: selectedCard.checklistRecebimentoChaves?.chavesAreasComuns || false,
                                dataChavesAreasComuns: e.target.value,
                                chavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.chavesAreasTecnicas || false,
                                dataChavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.dataChavesAreasTecnicas || '',
                                observacoes: selectedCard.checklistRecebimentoChaves?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* RECEBIMENTO CHAVES ÁREAS TÉCNICAS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoChaves?.chavesAreasTecnicas || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoChaves: {
                                  chavesAreasComuns: selectedCard.checklistRecebimentoChaves?.chavesAreasComuns || false,
                                  dataChavesAreasComuns: selectedCard.checklistRecebimentoChaves?.dataChavesAreasComuns || '',
                                  chavesAreasTecnicas: e.target.checked,
                                  dataChavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.dataChavesAreasTecnicas || '',
                                  observacoes: selectedCard.checklistRecebimentoChaves?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ RECEBIMENTO CHAVES ÁREAS TÉCNICAS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoChaves?.dataChavesAreasTecnicas || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoChaves: {
                                chavesAreasComuns: selectedCard.checklistRecebimentoChaves?.chavesAreasComuns || false,
                                dataChavesAreasComuns: selectedCard.checklistRecebimentoChaves?.dataChavesAreasComuns || '',
                                chavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.chavesAreasTecnicas || false,
                                dataChavesAreasTecnicas: e.target.value,
                                observacoes: selectedCard.checklistRecebimentoChaves?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistRecebimentoChaves?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoChaves: {
                                chavesAreasComuns: selectedCard.checklistRecebimentoChaves?.chavesAreasComuns || false,
                                dataChavesAreasComuns: selectedCard.checklistRecebimentoChaves?.dataChavesAreasComuns || '',
                                chavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.chavesAreasTecnicas || false,
                                dataChavesAreasTecnicas: selectedCard.checklistRecebimentoChaves?.dataChavesAreasTecnicas || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre o recebimento de chaves..."
                          className="w-full px-3 py-2 border-2 border-yellow-500 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistRecebimentoChaves?.chavesAreasComuns &&
                     selectedCard.checklistRecebimentoChaves?.chavesAreasTecnicas && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todas as chaves recebidas
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para ACESSIBILIDADE ELEVADORES */}
                {selectedCard.title === 'ACESSIBILIDADE ELEVADORES' && (
                  <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Acessibilidade - Elevadores
                    </h3>
                    <div className="space-y-3">
                      {/* BRAILE NOS DOIS BATENTES */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeElevadores: {
                                  braileBatentes: e.target.checked,
                                  dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                  brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                  dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                  pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                  dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                  identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                  dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                  intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                  dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ BRAILE NOS DOIS BATENTES DO ELEVADOR</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeElevadores: {
                                braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                dataBraileBatentes: e.target.value,
                                brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* BRAILE NA PLACA DE ADVERTÊNCIA */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeElevadores: {
                                  braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                  dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                  brailePlacaAdvertencia: e.target.checked,
                                  dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                  pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                  dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                  identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                  dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                  intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                  dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ BRAILE NA PLACA DE ADVERTÊNCIA E USO</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeElevadores: {
                                braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                dataBrailePlacaAdvertencia: e.target.value,
                                pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* PISO TÁTIL NA PORTA */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeElevadores: {
                                  braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                  dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                  brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                  dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                  pisoTatil: e.target.checked,
                                  dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                  identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                  dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                  intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                  dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ PISO TÁTIL NA PORTA DO ELEVADOR</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeElevadores: {
                                braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                dataPisoTatil: e.target.value,
                                identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* IDENTIFICAÇÃO SONORA DO ANDAR */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeElevadores: {
                                  braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                  dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                  brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                  dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                  pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                  dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                  identificacaoSonora: e.target.checked,
                                  dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                  intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                  dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ IDENTIFICAÇÃO SONORA DO ANDAR</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeElevadores: {
                                braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                dataIdentificacaoSonora: e.target.value,
                                intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* INTERCOMUNICADOR (ALTURA ENTRE 80CM E 1,20M) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeElevadores: {
                                  braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                  dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                  brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                  dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                  pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                  dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                  identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                  dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                  intercomunicador: e.target.checked,
                                  dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ INTERCOMUNICADOR (ALTURA ENTRE 80CM E 1,20M)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeElevadores: {
                                braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                dataIntercomunicador: e.target.value,
                                observacoes: selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistAcessibilidadeElevadores?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeElevadores: {
                                braileBatentes: selectedCard.checklistAcessibilidadeElevadores?.braileBatentes || false,
                                dataBraileBatentes: selectedCard.checklistAcessibilidadeElevadores?.dataBraileBatentes || '',
                                brailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia || false,
                                dataBrailePlacaAdvertencia: selectedCard.checklistAcessibilidadeElevadores?.dataBrailePlacaAdvertencia || '',
                                pisoTatil: selectedCard.checklistAcessibilidadeElevadores?.pisoTatil || false,
                                dataPisoTatil: selectedCard.checklistAcessibilidadeElevadores?.dataPisoTatil || '',
                                identificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora || false,
                                dataIdentificacaoSonora: selectedCard.checklistAcessibilidadeElevadores?.dataIdentificacaoSonora || '',
                                intercomunicador: selectedCard.checklistAcessibilidadeElevadores?.intercomunicador || false,
                                dataIntercomunicador: selectedCard.checklistAcessibilidadeElevadores?.dataIntercomunicador || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre acessibilidade..."
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistAcessibilidadeElevadores?.braileBatentes &&
                     selectedCard.checklistAcessibilidadeElevadores?.brailePlacaAdvertencia &&
                     selectedCard.checklistAcessibilidadeElevadores?.pisoTatil &&
                     selectedCard.checklistAcessibilidadeElevadores?.identificacaoSonora &&
                     selectedCard.checklistAcessibilidadeElevadores?.intercomunicador && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens de acessibilidade conferidos
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para ACESSIBILIDADE ESCADAS */}
                {selectedCard.title === 'ACESSIBILIDADE ESCADAS' && (
                  <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Acessibilidade - Escadas
                    </h3>
                    <div className="space-y-3">
                      {/* CORRIMÃO DUPLO */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: e.target.checked,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ CORRIMÃO DUPLO (INFERIOR: 70CM, SUPERIOR: 92CM)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: e.target.value,
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* BRAILE NO CORRIMÃO */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: e.target.checked,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ BRAILE NO CORRIMÃO (DOIS LADOS E NOS DOIS CORRIMÃOS)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: e.target.value,
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* PISO TÁTIL NO INÍCIO E FIM DAS ESCADAS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: e.target.checked,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ PISO TÁTIL NO INÍCIO E FIM DAS ESCADAS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: e.target.value,
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* FITA FOTOLUMINESCENTE NOS DEGRAUS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: e.target.checked,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ FITA FOTOLUMINESCENTE NOS DEGRAUS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: e.target.value,
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* DEMARCAÇÃO ÁREA DE RESGATE (MÍNIMO 15 X 15CM) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: e.target.checked,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ DEMARCAÇÃO ÁREA DE RESGATE (MÍNIMO 15 X 15CM)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: e.target.value,
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ÁREA DE RESGATE (DIMENSÕES 80CM X 1,20M) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: e.target.checked,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ÁREA DE RESGATE (DIMENSÕES 80CM X 1,20M)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: e.target.value,
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ALARME/INTERCOMUNICADOR ÁREA DE RESGATE */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEscadas: {
                                  corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                  dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                  braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                  dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                  pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                  dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                  fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                  dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                  demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                  dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                  areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                  dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                  alarmeIntercomunicador: e.target.checked,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ALARME E/OU INTERCOMUNICADOR (ALTURA ENTRE 80CM E 1,20M)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: e.target.value,
                                observacoes: selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistAcessibilidadeEscadas?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEscadas: {
                                corrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo || false,
                                dataCorrimaoDuplo: selectedCard.checklistAcessibilidadeEscadas?.dataCorrimaoDuplo || '',
                                braileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao || false,
                                dataBraileCorrimao: selectedCard.checklistAcessibilidadeEscadas?.dataBraileCorrimao || '',
                                pisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas || false,
                                dataPisoTatilEscadas: selectedCard.checklistAcessibilidadeEscadas?.dataPisoTatilEscadas || '',
                                fitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente || false,
                                dataFitaFotoluminescente: selectedCard.checklistAcessibilidadeEscadas?.dataFitaFotoluminescente || '',
                                demarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate || false,
                                dataDemarcacaoAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataDemarcacaoAreaResgate || '',
                                areaResgate: selectedCard.checklistAcessibilidadeEscadas?.areaResgate || false,
                                dataAreaResgate: selectedCard.checklistAcessibilidadeEscadas?.dataAreaResgate || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeEscadas?.dataAlarmeIntercomunicador || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre acessibilidade das escadas..."
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistAcessibilidadeEscadas?.corrimaoDuplo &&
                     selectedCard.checklistAcessibilidadeEscadas?.braileCorrimao &&
                     selectedCard.checklistAcessibilidadeEscadas?.pisoTatilEscadas &&
                     selectedCard.checklistAcessibilidadeEscadas?.fitaFotoluminescente &&
                     selectedCard.checklistAcessibilidadeEscadas?.demarcacaoAreaResgate &&
                     selectedCard.checklistAcessibilidadeEscadas?.areaResgate &&
                     selectedCard.checklistAcessibilidadeEscadas?.alarmeIntercomunicador && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens de acessibilidade das escadas conferidos
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para ACESSIBILIDADE WCS */}
                {selectedCard.title === 'ACESSIBILIDADE WCS' && (
                  <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Acessibilidade - WCs
                    </h3>
                    <div className="space-y-3">
                      {/* REVESTIMENTO RESISTENTE A IMPACTO NA PORTA (MÍNIMO 40CM) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: e.target.checked,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ REVESTIMENTO RESISTENTE A IMPACTO NA PORTA (MÍNIMO 40CM)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: e.target.value,
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: e.target.checked,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: e.target.value,
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* LARGURA DA PORTA (MÍNIMO 80CM) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: e.target.checked,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ LARGURA DA PORTA (MÍNIMO 80CM)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: e.target.value,
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* PORTA FECHADA COM TRANQUETA */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: e.target.checked,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ PORTA FECHADA COM TRANQUETA</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: e.target.value,
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* BARRAS NA PORTA, LAVATÓRIO E VASO SANITÁRIO */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.barras || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: e.target.checked,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ BARRAS NA PORTA, LAVATÓRIO E VASO SANITÁRIO</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataBarras || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: e.target.value,
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ALARME DE EMERGÊNCIA / INTERCOMUNICADOR */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: e.target.checked,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ALARME DE EMERGÊNCIA / INTERCOMUNICADOR</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: e.target.value,
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* LAVATÓRIO SEM COLUNA ABAIXO (ALTURA ENTRE 78 E 80CM) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.lavatorio || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: e.target.checked,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ LAVATÓRIO SEM COLUNA ABAIXO (ALTURA ENTRE 78 E 80CM)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: e.target.value,
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ÁREA DE MANOBRA (MÍNIMO 1,5M DE DIÂMETRO) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeWCs?.areaManobra || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeWCs: {
                                  revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                  dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                  larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                  portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                  dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                  barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                  dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                  lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                  dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                  areaManobra: e.target.checked,
                                  dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                  observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ÁREA DE MANOBRA (MÍNIMO 1,5M DE DIÂMETRO)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: e.target.value,
                                observacoes: selectedCard.checklistAcessibilidadeWCs?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistAcessibilidadeWCs?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeWCs: {
                                revestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta || false,
                                dataRevestimentoPorta: selectedCard.checklistAcessibilidadeWCs?.dataRevestimentoPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeWCs?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeWCs?.dataDesnivelPiso || '',
                                larguraPorta: selectedCard.checklistAcessibilidadeWCs?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeWCs?.dataLarguraPorta || '',
                                portaTranqueta: selectedCard.checklistAcessibilidadeWCs?.portaTranqueta || false,
                                dataPortaTranqueta: selectedCard.checklistAcessibilidadeWCs?.dataPortaTranqueta || '',
                                barras: selectedCard.checklistAcessibilidadeWCs?.barras || false,
                                dataBarras: selectedCard.checklistAcessibilidadeWCs?.dataBarras || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeWCs?.dataAlarmeIntercomunicador || '',
                                lavatorio: selectedCard.checklistAcessibilidadeWCs?.lavatorio || false,
                                dataLavatorio: selectedCard.checklistAcessibilidadeWCs?.dataLavatorio || '',
                                areaManobra: selectedCard.checklistAcessibilidadeWCs?.areaManobra || false,
                                dataAreaManobra: selectedCard.checklistAcessibilidadeWCs?.dataAreaManobra || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre acessibilidade dos WCs..."
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistAcessibilidadeWCs?.revestimentoPorta &&
                     selectedCard.checklistAcessibilidadeWCs?.desnivelPiso &&
                     selectedCard.checklistAcessibilidadeWCs?.larguraPorta &&
                     selectedCard.checklistAcessibilidadeWCs?.portaTranqueta &&
                     selectedCard.checklistAcessibilidadeWCs?.barras &&
                     selectedCard.checklistAcessibilidadeWCs?.alarmeIntercomunicador &&
                     selectedCard.checklistAcessibilidadeWCs?.lavatorio &&
                     selectedCard.checklistAcessibilidadeWCs?.areaManobra && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens de acessibilidade dos WCs conferidos
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para ACESSIBILIDADE ÁREAS COMUNS */}
                {selectedCard.title === 'ACESSIBILIDADE ÁREAS COMUNS' && (
                  <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Acessibilidade - Áreas Comuns
                    </h3>
                    <div className="space-y-3">
                      {/* LARGURA DA PORTA */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeAreasComuns: {
                                  larguraPorta: e.target.checked,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                  areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                  dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                  observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ LARGURA DA PORTA</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeAreasComuns: {
                                larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                dataLarguraPorta: e.target.value,
                                desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeAreasComuns: {
                                  larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                  desnivelPiso: e.target.checked,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                  areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                  dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                  observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeAreasComuns: {
                                larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                dataDesnivelPiso: e.target.value,
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ALARME DE EMERGÊNCIA / INTERCOMUNICADOR */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeAreasComuns: {
                                  larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                  alarmeIntercomunicador: e.target.checked,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                  areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                  dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                  observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ALARME DE EMERGÊNCIA / INTERCOMUNICADOR</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeAreasComuns: {
                                larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: e.target.value,
                                areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ÁREA DE CIRCULAÇÃO (MAIOR DE 90CM DE LARGURA) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeAreasComuns: {
                                  larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                  dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                  alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                  dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                  areaCirculacao: e.target.checked,
                                  dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                  observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ÁREA DE CIRCULAÇÃO (MAIOR DE 90CM DE LARGURA)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeAreasComuns: {
                                larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                dataAreaCirculacao: e.target.value,
                                observacoes: selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistAcessibilidadeAreasComuns?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeAreasComuns: {
                                larguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta || false,
                                dataLarguraPorta: selectedCard.checklistAcessibilidadeAreasComuns?.dataLarguraPorta || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeAreasComuns?.dataDesnivelPiso || '',
                                alarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador || false,
                                dataAlarmeIntercomunicador: selectedCard.checklistAcessibilidadeAreasComuns?.dataAlarmeIntercomunicador || '',
                                areaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao || false,
                                dataAreaCirculacao: selectedCard.checklistAcessibilidadeAreasComuns?.dataAreaCirculacao || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre acessibilidade das áreas comuns..."
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistAcessibilidadeAreasComuns?.larguraPorta &&
                     selectedCard.checklistAcessibilidadeAreasComuns?.desnivelPiso &&
                     selectedCard.checklistAcessibilidadeAreasComuns?.alarmeIntercomunicador &&
                     selectedCard.checklistAcessibilidadeAreasComuns?.areaCirculacao && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens de acessibilidade das áreas comuns conferidos
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para ACESSIBILIDADE PISCINA */}
                {selectedCard.title === 'ACESSIBILIDADE PISCINA' && (
                  <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Acessibilidade - Piscina
                    </h3>
                    <div className="space-y-3">
                      {/* DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadePiscina: {
                                  desnivelPiso: e.target.checked,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || '',
                                  placaProfundidade: selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false,
                                  dataPlacaProfundidade: selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || '',
                                  cadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false,
                                  dataCadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || '',
                                  observacoes: selectedCard.checklistAcessibilidadePiscina?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadePiscina: {
                                desnivelPiso: selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false,
                                dataDesnivelPiso: e.target.value,
                                placaProfundidade: selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false,
                                dataPlacaProfundidade: selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || '',
                                cadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false,
                                dataCadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || '',
                                observacoes: selectedCard.checklistAcessibilidadePiscina?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* PLACA COM A PROFUNDIDADE DA PISCINA EM BRAILE */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadePiscina: {
                                  desnivelPiso: selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || '',
                                  placaProfundidade: e.target.checked,
                                  dataPlacaProfundidade: selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || '',
                                  cadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false,
                                  dataCadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || '',
                                  observacoes: selectedCard.checklistAcessibilidadePiscina?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ PLACA COM A PROFUNDIDADE DA PISCINA EM BRAILE</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadePiscina: {
                                desnivelPiso: selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || '',
                                placaProfundidade: selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false,
                                dataPlacaProfundidade: e.target.value,
                                cadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false,
                                dataCadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || '',
                                observacoes: selectedCard.checklistAcessibilidadePiscina?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* CADEIRA PARA ACESSO */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadePiscina: {
                                  desnivelPiso: selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || '',
                                  placaProfundidade: selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false,
                                  dataPlacaProfundidade: selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || '',
                                  cadeiraAcesso: e.target.checked,
                                  dataCadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || '',
                                  observacoes: selectedCard.checklistAcessibilidadePiscina?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ CADEIRA PARA ACESSO</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadePiscina: {
                                desnivelPiso: selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || '',
                                placaProfundidade: selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false,
                                dataPlacaProfundidade: selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || '',
                                cadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false,
                                dataCadeiraAcesso: e.target.value,
                                observacoes: selectedCard.checklistAcessibilidadePiscina?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistAcessibilidadePiscina?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadePiscina: {
                                desnivelPiso: selectedCard.checklistAcessibilidadePiscina?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadePiscina?.dataDesnivelPiso || '',
                                placaProfundidade: selectedCard.checklistAcessibilidadePiscina?.placaProfundidade || false,
                                dataPlacaProfundidade: selectedCard.checklistAcessibilidadePiscina?.dataPlacaProfundidade || '',
                                cadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso || false,
                                dataCadeiraAcesso: selectedCard.checklistAcessibilidadePiscina?.dataCadeiraAcesso || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre acessibilidade da piscina..."
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistAcessibilidadePiscina?.desnivelPiso &&
                     selectedCard.checklistAcessibilidadePiscina?.placaProfundidade &&
                     selectedCard.checklistAcessibilidadePiscina?.cadeiraAcesso && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens de acessibilidade da piscina conferidos
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist para ACESSIBILIDADE ENTRADA DO PRÉDIO */}
                {selectedCard.title === 'ACESSIBILIDADE ENTRADA DO PRÉDIO' && (
                  <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Acessibilidade - Entrada do Prédio
                    </h3>
                    <div className="space-y-3">
                      {/* PISO TÁTIL NA CALÇADA (CONTÍNUO E DE PARADA) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEntrada: {
                                  pisoTatilCalcada: e.target.checked,
                                  dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                  calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                  dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                  placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                  dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                  alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                  dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ PISO TÁTIL NA CALÇADA (CONTÍNUO E DE PARADA)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEntrada: {
                                pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                dataPisoTatilCalcada: e.target.value,
                                calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* CALÇADA COM FAIXA LIVRE DE ACESSO (MÍNIMO 1,20 DE LARGURA) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEntrada: {
                                  pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                  dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                  calcadaFaixaLivre: e.target.checked,
                                  dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                  placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                  dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                  alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                  dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ CALÇADA COM FAIXA LIVRE DE ACESSO (MÍNIMO 1,20 DE LARGURA)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEntrada: {
                                pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                dataCalcadaFaixaLivre: e.target.value,
                                placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* PLACA EM BRAILE COM IDENTIFICAÇÃO DOS LOCAIS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEntrada: {
                                  pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                  dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                  calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                  dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                  placaBraile: e.target.checked,
                                  dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                  alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                  dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ PLACA EM BRAILE COM IDENTIFICAÇÃO DOS LOCAIS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEntrada: {
                                pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                dataPlacaBraile: e.target.value,
                                desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO) */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEntrada: {
                                  pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                  dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                  calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                  dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                  placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                  dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                  desnivelPiso: e.target.checked,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                  alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                  dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ DESNÍVEL DO PISO DE ATÉ 5MM (PORTA DE ACESSO)</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEntrada: {
                                pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                dataDesnivelPiso: e.target.value,
                                alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* ALARME SONORO E VISUAL NA SAÍDA DE VEÍCULOS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistAcessibilidadeEntrada: {
                                  pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                  dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                  calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                  dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                  placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                  dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                  desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                  dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                  alarmeSonoro: e.target.checked,
                                  dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                  observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ ALARME SONORO E VISUAL NA SAÍDA DE VEÍCULOS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEntrada: {
                                pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                dataAlarmeSonoro: e.target.value,
                                observacoes: selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white bg-black font-medium"
                        />
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-3">
                        <label className="block text-white font-bold mb-2">
                          📝 Observações Gerais
                        </label>
                        <textarea
                          value={selectedCard.checklistAcessibilidadeEntrada?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistAcessibilidadeEntrada: {
                                pisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada || false,
                                dataPisoTatilCalcada: selectedCard.checklistAcessibilidadeEntrada?.dataPisoTatilCalcada || '',
                                calcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre || false,
                                dataCalcadaFaixaLivre: selectedCard.checklistAcessibilidadeEntrada?.dataCalcadaFaixaLivre || '',
                                placaBraile: selectedCard.checklistAcessibilidadeEntrada?.placaBraile || false,
                                dataPlacaBraile: selectedCard.checklistAcessibilidadeEntrada?.dataPlacaBraile || '',
                                desnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso || false,
                                dataDesnivelPiso: selectedCard.checklistAcessibilidadeEntrada?.dataDesnivelPiso || '',
                                alarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro || false,
                                dataAlarmeSonoro: selectedCard.checklistAcessibilidadeEntrada?.dataAlarmeSonoro || '',
                                observacoes: e.target.value
                              }
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="Digite observações gerais sobre acessibilidade da entrada do prédio..."
                          className="w-full px-3 py-2 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none text-white bg-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    {selectedCard.checklistAcessibilidadeEntrada?.pisoTatilCalcada &&
                     selectedCard.checklistAcessibilidadeEntrada?.calcadaFaixaLivre &&
                     selectedCard.checklistAcessibilidadeEntrada?.placaBraile &&
                     selectedCard.checklistAcessibilidadeEntrada?.desnivelPiso &&
                     selectedCard.checklistAcessibilidadeEntrada?.alarmeSonoro && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens de acessibilidade da entrada do prédio conferidos
                      </div>
                    )}
                  </div>
                )}

                {selectedCard.oQueFalta && (
                  <div className="bg-black border-2 border-yellow-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      O que falta para concluir
                    </h3>
                    <p className="text-white text-sm whitespace-pre-wrap font-medium">
                      {selectedCard.oQueFalta}
                    </p>
                    {selectedCard.dataAndamento && (
                      <div className="mt-3 border-t-2 border-yellow-600 pt-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-white">Data de Início do Andamento</h4>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const novaData = prompt('Nova data de andamento (DD/MM/YYYY):', new Date(selectedCard.dataAndamento + 'T00:00:00').toLocaleDateString('pt-BR'));
                              if (novaData) {
                                const partes = novaData.split('/');
                                if (partes.length === 3) {
                                  const dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                                  setItems(prev => prev.map(item =>
                                    item.id === selectedCard.id
                                      ? { ...item, dataAndamento: dataFormatada, updatedAt: new Date().toISOString().split('T')[0] }
                                      : item
                                  ));
                                  setSelectedCard({ ...selectedCard, dataAndamento: dataFormatada });
                                }
                              }
                            }}
                            className="bg-black hover:bg-gray-800 text-white p-2 h-6 px-3 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                        <p className="text-black text-sm font-bold">
                          {new Date(selectedCard.dataAndamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedCard.correcao && (
                  <div className="bg-orange-600 border-2 border-orange-700 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Correção Necessária
                    </h3>
                    <p className="text-white text-sm whitespace-pre-wrap font-medium">
                      {selectedCard.correcao}
                    </p>
                    {selectedCard.dataCorrecao && (
                      <div className="mt-3 border-t-2 border-orange-600 pt-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-white">Data da Correção</h4>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const novaData = prompt('Nova data de correção (DD/MM/YYYY):', new Date(selectedCard.dataCorrecao + 'T00:00:00').toLocaleDateString('pt-BR'));
                              if (novaData) {
                                const partes = novaData.split('/');
                                if (partes.length === 3) {
                                  const dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                                  setItems(prev => prev.map(item =>
                                    item.id === selectedCard.id
                                      ? { ...item, dataCorrecao: dataFormatada, updatedAt: new Date().toISOString().split('T')[0] }
                                      : item
                                  ));
                                  setSelectedCard({ ...selectedCard, dataCorrecao: dataFormatada });
                                }
                              }
                            }}
                            className="bg-white hover:bg-gray-100 text-orange-700 p-2 h-6 px-3 text-xs font-bold"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                        <p className="text-white text-sm font-bold">
                          {new Date(selectedCard.dataCorrecao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedCard.historicoCorrecao && (
                  <div className="bg-black border-2 border-gray-600 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-2">Histórico de Correções</h3>
                    <p className="text-white text-sm whitespace-pre-wrap font-medium">
                      {selectedCard.historicoCorrecao}
                    </p>
                  </div>
                )}

                {/* Seção de Fotos */}
                {selectedCard.category !== 'DOCUMENTACAO' && (
                  <div className="bg-black border-2 border-gray-600 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-4">📸 Fotos do Card</h3>
                    <KanbanPhotoUpload
                      fotos={selectedCard.fotos || []}
                      onFotosChange={(novasFotos) => {
                        const updated = { ...selectedCard, fotos: novasFotos };
                        setItems(prev => prev.map(item =>
                          item.id === selectedCard.id ? updated : item
                        ));
                        setSelectedCard(updated);
                      }}
                      maxFotos={40}
                    />
                  </div>
                )}

                {/* Checklist para COMISSIONAMENTO */}
                {selectedCard.category === 'COMISSIONAMENTO' && (() => {
                  const grupos = COMISSIONAMENTO_CHECKLISTS[selectedCard.id];
                  if (!grupos) return null;

                  type SNX = 'sim' | 'nao' | 'x' | undefined;
                  const cc: Record<string, SNX> = (selectedCard.checklistComissionamento || {}) as Record<string, SNX>;

                  const updateCC = (itemId: string, val: SNX) => {
                    const newVal = cc[itemId] === val ? undefined : val;
                    const updated = {
                      ...selectedCard,
                      checklistComissionamento: { ...cc, [itemId]: newVal }
                    };
                    setItems(prev => prev.map(item => item.id === selectedCard.id ? updated : item));
                    setSelectedCard(updated);
                  };

                  const SnxBtns = ({ itemId }: { itemId: string }) => (
                    <div className="flex gap-1 shrink-0">
                      {(['sim', 'nao', 'x'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateCC(itemId, opt)}
                          className={`px-2 py-1 rounded text-xs font-bold border-2 transition-colors ${
                            cc[itemId] === opt
                              ? opt === 'sim' ? 'bg-green-600 border-green-500 text-white'
                              : opt === 'nao' ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-gray-500 border-gray-400 text-white'
                              : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          {opt === 'sim' ? 'Sim' : opt === 'nao' ? 'Não' : 'X'}
                        </button>
                      ))}
                    </div>
                  );

                  const allItems = grupos.flatMap(g => g.itens);
                  const total = allItems.length;
                  const simCount = allItems.filter(i => cc[i.id] === 'sim').length;
                  const naoCount = allItems.filter(i => cc[i.id] === 'nao').length;
                  const xCount = allItems.filter(i => cc[i.id] === 'x').length;
                  const respondidos = simCount + naoCount + xCount;
                  const allOk = total > 0 && simCount === total;

                  return (
                    <div className="bg-black border-2 border-orange-500 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Checklist de Comissionamento
                        </h3>
                        {allOk && (
                          <span className="text-xs bg-green-700 text-green-100 px-2 py-0.5 rounded-full font-bold">
                            ✅ Tudo OK
                          </span>
                        )}
                      </div>

                      {/* Barra de progresso */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full transition-all duration-300"
                            style={{ width: total > 0 ? `${(respondidos / total) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{respondidos}/{total}</span>
                        {simCount > 0 && <span className="text-xs text-green-400 shrink-0">✓{simCount}</span>}
                        {naoCount > 0 && <span className="text-xs text-red-400 shrink-0">✗{naoCount}</span>}
                        {xCount > 0 && <span className="text-xs text-gray-400 shrink-0">X{xCount}</span>}
                      </div>

                      <div className="space-y-4">
                        {grupos.map(({ grupo, itens }) => (
                          <div key={grupo} className="bg-gray-900 rounded-md p-3 border border-gray-700">
                            <div className="text-orange-300 font-bold text-xs mb-3 uppercase">{grupo}</div>
                            <div className="space-y-3">
                              {itens.map(({ id: itemId, label }) => (
                                <div key={itemId} className="flex items-start justify-between gap-3">
                                  <span className="text-white text-xs flex-1 leading-relaxed">{label}</span>
                                  <SnxBtns itemId={itemId} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Seção de Link do Documento (DOCUMENTAÇÃO) */}
                {selectedCard.category === 'DOCUMENTACAO' && (
                  <div className="bg-black border-2 border-green-600 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Link do Documento (Google Drive)
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white font-bold mb-2 text-sm">
                          Cole aqui o link do Google Drive para este documento:
                        </label>
                        <input
                          type="url"
                          value={selectedCard.documentoUrl || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              documentoUrl: e.target.value
                            };
                            setItems(prev => prev.map(item =>
                              item.id === selectedCard.id ? updated : item
                            ));
                            setSelectedCard(updated);
                          }}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full px-3 py-2 border-2 border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white bg-gray-900 font-medium text-sm"
                        />
                      </div>
                      {selectedCard.documentoUrl && (
                        <Button
                          onClick={() => window.open(selectedCard.documentoUrl, '_blank')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Abrir Documento no Drive
                        </Button>
                      )}
                      {!selectedCard.documentoUrl && (
                        <p className="text-gray-500 text-xs text-center">
                          Nenhum link cadastrado. Cole o link do Google Drive acima para acessar o documento diretamente.
                        </p>
                      )}

                      {/* Conferido */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span className="text-white text-sm font-bold">Conferido:</span>
                        <div className="flex gap-2">
                          {(['sim', 'nao'] as const).map(opt => (
                            <button
                              key={opt}
                              onClick={() => {
                                const newVal = selectedCard.documentoConferido === opt ? undefined : opt;
                                const updated = { ...selectedCard, documentoConferido: newVal };
                                setItems(prev => prev.map(item => item.id === selectedCard.id ? updated : item));
                                setSelectedCard(updated);
                              }}
                              className={`px-4 py-1.5 rounded text-sm font-bold border-2 transition-colors ${
                                selectedCard.documentoConferido === opt
                                  ? opt === 'sim'
                                    ? 'bg-green-600 border-green-500 text-white'
                                    : 'bg-red-600 border-red-500 text-white'
                                  : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              {opt === 'sim' ? 'Sim' : 'Não'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção de Constatações e Pendências */}
                <div className="bg-black border-2 border-orange-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-orange-400">📋 Registros (Constatações e Pendências)</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowAddPendencia(!showAddPendencia)}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                    >
                      {showAddPendencia ? 'Cancelar' : '+ Adicionar Registro'}
                    </Button>
                  </div>

                  {/* Formulário para adicionar novo registro */}
                  {showAddPendencia && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
                      {/* Seletor de Tipo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Registro</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setNovaPendenciaTipo('CONSTATACAO')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                              novaPendenciaTipo === 'CONSTATACAO'
                                ? 'bg-green-600 border-green-500 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-green-500'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Constatação (OK)</span>
                          </button>
                          <button
                            onClick={() => setNovaPendenciaTipo('PENDENCIA')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                              novaPendenciaTipo === 'PENDENCIA'
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-red-500'
                            }`}
                          >
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Pendência</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Local
                        </label>
                        <input
                          type="text"
                          value={novaPendenciaLocal}
                          onChange={(e) => setNovaPendenciaLocal(e.target.value)}
                          placeholder="Ex: Parede da sala de estar, 3º andar"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {novaPendenciaTipo === 'CONSTATACAO' ? 'Descrição da Constatação' : 'Descrição da Pendência'}
                        </label>
                        <textarea
                          value={novaPendenciaDescricao}
                          onChange={(e) => setNovaPendenciaDescricao(e.target.value)}
                          placeholder={novaPendenciaTipo === 'CONSTATACAO'
                            ? 'Ex: Verificado e em conformidade'
                            : 'Ex: Trinca na parede, necessário reparo'}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Foto (opcional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNovaPendenciaFoto(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-sm text-gray-400"
                        />
                        {novaPendenciaFoto && (
                          <img src={novaPendenciaFoto} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded" />
                        )}
                      </div>
                      <Button
                        disabled={salvandoNoSupabase}
                        onClick={async () => {
                          if (!novaPendenciaLocal.trim() || !novaPendenciaDescricao.trim()) {
                            alert('Preencha o local e a descrição');
                            return;
                          }
                          const novaPendencia: KanbanPendencia = {
                            id: `pend-${Date.now()}`,
                            tipo: novaPendenciaTipo,
                            local: novaPendenciaLocal,
                            descricao: novaPendenciaDescricao,
                            foto_url: novaPendenciaFoto,
                            foto_depois_url: null,
                            status: novaPendenciaTipo === 'CONSTATACAO' ? 'RECEBIDO' : 'PENDENTE',
                            created_at: new Date().toISOString()
                          };
                          const pendenciasAtuais = selectedCard.pendencias || [];
                          const updated = {
                            ...selectedCard,
                            pendencias: [...pendenciasAtuais, novaPendencia]
                          };
                          setItems(prev => prev.map(item =>
                            item.id === selectedCard.id ? updated : item
                          ));
                          setSelectedCard(updated);

                          // Salvar no Supabase (cria relatório automaticamente)
                          await salvarPendenciaNoSupabase(
                            selectedCard.title,
                            selectedCard.category,
                            novaPendenciaLocal,
                            novaPendenciaDescricao,
                            novaPendenciaFoto,
                            novaPendenciaTipo
                          );

                          // Limpar formulário
                          setNovaPendenciaTipo('PENDENCIA');
                          setNovaPendenciaLocal('');
                          setNovaPendenciaDescricao('');
                          setNovaPendenciaFoto(null);
                          setShowAddPendencia(false);
                        }}
                        className={`w-full text-white ${
                          novaPendenciaTipo === 'CONSTATACAO'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {salvandoNoSupabase ? 'Salvando...' : (novaPendenciaTipo === 'CONSTATACAO' ? 'Salvar Constatação' : 'Salvar Pendência')}
                      </Button>
                    </div>
                  )}

                  {/* Lista de registros existentes */}
                  {selectedCard.pendencias && selectedCard.pendencias.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCard.pendencias.map((pend, idx) => (
                        <div key={pend.id} className={`bg-gray-900 border rounded-lg p-3 ${
                          pend.tipo === 'CONSTATACAO' ? 'border-green-600' : 'border-red-600'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-xs ${
                                  pend.tipo === 'CONSTATACAO' ? 'text-green-400' : 'text-red-400'
                                }`}>#{idx + 1}</span>
                                {/* Badge do Tipo */}
                                <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                                  pend.tipo === 'CONSTATACAO'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}>
                                  {pend.tipo === 'CONSTATACAO' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                  {pend.tipo === 'CONSTATACAO' ? 'OK' : 'PENDÊNCIA'}
                                </span>
                                {/* Badge do Status (só para pendências) */}
                                {pend.tipo === 'PENDENCIA' && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    pend.status === 'PENDENTE' ? 'bg-yellow-600 text-white' :
                                    pend.status === 'RECEBIDO' ? 'bg-green-600 text-white' :
                                    'bg-gray-600 text-white'
                                  }`}>
                                    {pend.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 text-xs mb-1">
                                <strong>Local:</strong> {pend.local}
                              </p>
                              <p className="text-white text-sm">
                                <strong>Descrição:</strong> {pend.descricao}
                              </p>
                            </div>
                            {pend.foto_url && (
                              <img src={pend.foto_url} alt="Foto" className="w-16 h-16 object-cover rounded ml-3" />
                            )}
                          </div>
                          {/* Ações (só para pendências) */}
                          <div className="flex gap-2 mt-2">
                            {pend.tipo === 'PENDENCIA' && pend.status === 'PENDENTE' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const updated = {
                                      ...selectedCard,
                                      pendencias: selectedCard.pendencias?.map(p =>
                                        p.id === pend.id
                                          ? { ...p, status: 'RECEBIDO' as const, data_recebimento: new Date().toISOString().split('T')[0] }
                                          : p
                                      )
                                    };
                                    setItems(prev => prev.map(item =>
                                      item.id === selectedCard.id ? updated : item
                                    ));
                                    setSelectedCard(updated);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                >
                                  Marcar Recebido
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const updated = {
                                      ...selectedCard,
                                      pendencias: selectedCard.pendencias?.map(p =>
                                        p.id === pend.id
                                          ? { ...p, status: 'NAO_FARAO' as const }
                                          : p
                                      )
                                    };
                                    setItems(prev => prev.map(item =>
                                      item.id === selectedCard.id ? updated : item
                                    ));
                                    setSelectedCard(updated);
                                  }}
                                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs"
                                >
                                  Não Farão
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Remover esta pendência?')) {
                                  const updated = {
                                    ...selectedCard,
                                    pendencias: selectedCard.pendencias?.filter(p => p.id !== pend.id)
                                  };
                                  setItems(prev => prev.map(item =>
                                    item.id === selectedCard.id ? updated : item
                                  ));
                                  setSelectedCard(updated);
                                }
                              }}
                              className="text-xs"
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Nenhuma pendência registrada ainda.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end shrink-0">
                <Button onClick={() => setShowCardDetails(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )
      }
      {/* Status Edit Modal */}
      {showEditStatusModal && editingItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Alterar Status</h3>
            <Select onValueChange={setNewStatusValue} defaultValue={editingItem.status}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aguardando">Aguardando (MP)</SelectItem>
                <SelectItem value="em_andamento">Em andamento (MP)</SelectItem>
                <SelectItem value="em_correcao">Em correção (Construtora)</SelectItem>
                <SelectItem value="finalizado">Recebido</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditStatusModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmStatusChange}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
