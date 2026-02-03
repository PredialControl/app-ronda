import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KanbanPhotoUpload } from '@/components/KanbanPhotoUpload';
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
  Edit
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
  // Checklist para cards de RECEBIMENTO_AREAS
  checklistRecebimentoAreas?: {
    conferenciaMemorial: boolean;
    dataConferenciaMemorial?: string;
    conferenciaChaves: boolean;
    dataConferenciaChaves?: string;
    testeEquipamentos: boolean;
    dataTesteEquipamentos?: string;
    conferenciaEstetica: boolean;
    dataConferenciaEstetica?: string;
    observacoes?: string;
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
  // Fotos do card (até 40 fotos em WebP ou AVIF)
  fotos?: string[]; // Array de URLs base64 ou URLs das imagens
}

const initialItems: KanbanItem[] = [
  // 1. VISTORIA
  { id: '1', title: 'ÁREAS COMUNS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', title: 'HALLS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '3', title: 'ESCADARIAS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '4', title: 'ÁREAS TÉCNICAS', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '5', title: 'ELEVADORES', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '58', title: 'FACHADA', category: 'VISTORIA', status: 'aguardando', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

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
}

export function KanbanBoard({ }: KanbanBoardProps = {}) {
  const [items, setItems] = useState<KanbanItem[]>(initialItems);
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

  // Filtrar itens baseado na categoria selecionada
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'TODOS') return items;
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Recalcular colunas baseado no estado atual dos items filtrados
  const getColumns = () => [
    {
      id: 'aguardando',
      title: 'Não recebido',
      icon: Search,
      color: 'bg-red-600 text-white',
      items: filteredItems.filter(item => item.status === 'aguardando')
    },
    {
      id: 'em_andamento',
      title: 'Em Andamento',
      icon: Wrench,
      color: 'bg-yellow-500 text-black',
      items: filteredItems.filter(item => item.status === 'em_andamento')
    },
    {
      id: 'em_correcao',
      title: 'Em Correção',
      icon: ClipboardList,
      color: 'bg-orange-600 text-white',
      items: filteredItems.filter(item => item.status === 'em_correcao')
    },
    {
      id: 'finalizado',
      title: 'Finalizado',
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
          <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-gray-200 shadow-sm">
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
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Resumo do Progresso {selectedCategory !== 'TODOS' && `(${Object.values(CATEGORIES).find(c => c.id === selectedCategory)?.label})`}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getColumns().map((column) => {
            const Icon = column.icon;
            return (
              <div key={column.id} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">{column.title}</span>
                </div>
                <div className="text-2xl font-bold text-white">{column.items.length}</div>
                <div className="text-xs text-gray-500">itens</div>
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
              className="flex flex-col border-2 border-dashed border-gray-200 rounded-lg"
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
                      className={`cursor-move hover:shadow-md transition-shadow bg-white border-l-4 ${getCategoryColor(item.category)}`}
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
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 h-6 w-6"
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
                              className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1 h-6 w-6"
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
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingMove?.newStatus === 'finalizado' ? 'Data de Recebimento' : 'Data de Vistoria'}
                </h3>
              </div>

              <p className="text-gray-600 mb-4">
                Informe a data {pendingMove?.newStatus === 'finalizado' ? 'de recebimento' : 'de vistoria'} para o item: <strong>{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelModal}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={pendingMove?.newStatus === 'finalizado' ? handleConfirmRecebimento : handleConfirmVistoria}
                  disabled={pendingMove?.newStatus === 'finalizado' ? !recebimentoDate : !vistoriaDate}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
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
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Novo Item</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelNewItem}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-gray-600 mb-4">
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
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateNewItem}
                  disabled={!newItemTitle.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
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
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Qual correção?</h3>
              </div>

              <p className="text-gray-600 mb-4">
                Descreva qual correção precisa ser feita no item: <strong>{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4 space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Correção
                  </Label>
                  <input
                    type="date"
                    value={vistoriaDate}
                    onChange={(e) => setVistoriaDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Correção
                  </Label>
                  <textarea
                    value={correcaoText}
                    onChange={(e) => setCorrecaoText(e.target.value)}
                    placeholder="Descreva qual correção precisa ser feita..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelCorrecao}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmCorrecao}
                  disabled={!correcaoText.trim() || !vistoriaDate}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300"
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
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">O que falta?</h3>
              </div>

              <p className="text-gray-600 mb-4">
                Descreva o que falta para concluir o item: <strong>{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4 space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </Label>
                  <input
                    type="date"
                    value={dataAndamento}
                    onChange={(e) => setDataAndamento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    O que falta para concluir?
                  </Label>
                  <textarea
                    value={oQueFaltaText}
                    onChange={(e) => setOQueFaltaText(e.target.value)}
                    placeholder="Descreva o que ainda falta fazer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelAndamento}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmAndamento}
                  disabled={!oQueFaltaText.trim() || !dataAndamento}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300"
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
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-black rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-gray-700">
              <div className={`p-4 ${getCategoryColor(selectedCard.category).replace('border-l-4', 'border-l-8')} border-l-solid bg-gray-900 flex justify-between items-start shrink-0`}>
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
                      {selectedCard.status === 'aguardando' && 'Não recebido'}
                      {selectedCard.status === 'em_andamento' && 'Em Andamento'}
                      {selectedCard.status === 'em_correcao' && 'Em Correção'}
                      {selectedCard.status === 'finalizado' && 'Finalizado'}
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

                {/* Checklist para RECEBIMENTO_AREAS */}
                {selectedCard.category === 'RECEBIMENTO_AREAS' && (
                  <div className="bg-black border-2 border-yellow-500 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Checklist de Recebimento de Áreas Comuns
                    </h3>
                    <div className="space-y-3">
                      {/* CONFERÊNCIA MEMORIAL DESCRITIVO */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoAreas: {
                                  conferenciaMemorial: e.target.checked,
                                  dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                  conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                  dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                  testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                  dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                  conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                  dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                  observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ CONFERÊNCIA MEMORIAL DESCRITIVO</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoAreas: {
                                conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                dataConferenciaMemorial: e.target.value,
                                conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
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

                      {/* CONFERÊNCIA DAS CHAVES */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoAreas: {
                                  conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                  dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                  conferenciaChaves: e.target.checked,
                                  dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                  testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                  dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                  conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                  dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                  observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ CONFERÊNCIA DAS CHAVES</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoAreas: {
                                conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                dataConferenciaChaves: e.target.value,
                                testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
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

                      {/* TESTE DE TODOS EQUIPAMENTOS INSTALADOS */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoAreas: {
                                  conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                  dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                  conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                  dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                  testeEquipamentos: e.target.checked,
                                  dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                  conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                  dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                  observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ TESTE DE TODOS EQUIPAMENTOS INSTALADOS</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoAreas: {
                                conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                dataTesteEquipamentos: e.target.value,
                                conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
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

                      {/* CONFERÊNCIA ESTÉTICA DO AMBIENTE */}
                      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedCard,
                                checklistRecebimentoAreas: {
                                  conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                  dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                  conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                  dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                  testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                  dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                  conferenciaEstetica: e.target.checked,
                                  dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
                                  observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
                                }
                              };
                              setItems(prev => prev.map(item =>
                                item.id === selectedCard.id ? updated : item
                              ));
                              setSelectedCard(updated);
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-white font-bold">✓ CONFERÊNCIA ESTÉTICA DO AMBIENTE</span>
                        </label>
                        <input
                          type="date"
                          value={selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoAreas: {
                                conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                dataConferenciaEstetica: e.target.value,
                                observacoes: selectedCard.checklistRecebimentoAreas?.observacoes || ''
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
                          value={selectedCard.checklistRecebimentoAreas?.observacoes || ''}
                          onChange={(e) => {
                            const updated = {
                              ...selectedCard,
                              checklistRecebimentoAreas: {
                                conferenciaMemorial: selectedCard.checklistRecebimentoAreas?.conferenciaMemorial || false,
                                dataConferenciaMemorial: selectedCard.checklistRecebimentoAreas?.dataConferenciaMemorial || '',
                                conferenciaChaves: selectedCard.checklistRecebimentoAreas?.conferenciaChaves || false,
                                dataConferenciaChaves: selectedCard.checklistRecebimentoAreas?.dataConferenciaChaves || '',
                                testeEquipamentos: selectedCard.checklistRecebimentoAreas?.testeEquipamentos || false,
                                dataTesteEquipamentos: selectedCard.checklistRecebimentoAreas?.dataTesteEquipamentos || '',
                                conferenciaEstetica: selectedCard.checklistRecebimentoAreas?.conferenciaEstetica || false,
                                dataConferenciaEstetica: selectedCard.checklistRecebimentoAreas?.dataConferenciaEstetica || '',
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
                    {selectedCard.checklistRecebimentoAreas?.conferenciaMemorial &&
                     selectedCard.checklistRecebimentoAreas?.conferenciaChaves &&
                     selectedCard.checklistRecebimentoAreas?.testeEquipamentos &&
                     selectedCard.checklistRecebimentoAreas?.conferenciaEstetica && (
                      <div className="mt-3 bg-green-600 text-white border-2 border-green-500 px-3 py-1 rounded text-xs font-bold">
                        ✅ Checklist Completo - Todos os itens conferidos
                      </div>
                    )}
                  </div>
                )}

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
                <SelectItem value="aguardando">Não recebido</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="em_correcao">Em Correção</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
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
