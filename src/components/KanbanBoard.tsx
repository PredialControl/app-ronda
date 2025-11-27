import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Filter
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
  CONFERENCIA: {
    id: 'CONFERENCIA',
    label: '2. CONFERÊNCIA',
    color: 'bg-purple-500',
    border: 'border-l-purple-500',
    text: 'text-purple-700',
    bgLight: 'bg-purple-50'
  },
  COMISSIONAMENTO: {
    id: 'COMISSIONAMENTO',
    label: '3. COMISSIONAMENTO',
    color: 'bg-orange-500',
    border: 'border-l-orange-500',
    text: 'text-orange-700',
    bgLight: 'bg-orange-50'
  },
  DOCUMENTACAO: {
    id: 'DOCUMENTACAO',
    label: '4. DOCUMENTAÇÃO',
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
  status: 'recebido' | 'vistoria' | 'correcao' | 'implantado';
  category: string; // Nova propriedade para categoria
  createdAt: string;
  updatedAt: string;
  dataVistoria?: string;
  dataRecebimento?: string;
  correcao?: string;
  dataCorrecao?: string;
  historicoCorrecao?: string;
}

const initialItems: KanbanItem[] = [
  // 1. VISTORIA
  { id: '1', title: 'ÁREAS COMUNS', category: 'VISTORIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', title: 'HALLS', category: 'VISTORIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '3', title: 'ESCADARIAS', category: 'VISTORIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '4', title: 'ÁREAS TÉCNICAS', category: 'VISTORIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '5', title: 'ELEVADORES', category: 'VISTORIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 2. CONFERÊNCIA
  { id: '6', title: 'CONFERÊNCIA MEMORIAL', category: 'CONFERENCIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '7', title: 'CONFERÊNCIA MANGUEIRAS', category: 'CONFERENCIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '8', title: 'CONFERÊNCIA CHAVE STORZ', category: 'CONFERENCIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '9', title: 'CONFERÊNCIA CONEXÃO', category: 'CONFERENCIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '10', title: 'CONFERÊNCIA ESGUICHO', category: 'CONFERENCIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '11', title: 'CONFERÊNCIA EXTINTORES', category: 'CONFERENCIA', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 3. COMISSIONAMENTO
  { id: '12', title: 'GERADOR', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '13', title: 'SISTEMA ELÉTRICO — QGBT, QTA, QUADROS, BARRAMENTOS, TRAFO, BUSWAY', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '14', title: 'SPDA', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '15', title: 'BOMBA INCÊNDIO', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '16', title: 'BOMBAS DE RECALQUE', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '17', title: 'BOMBAS DE PRESSURIZAÇÃO', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '18', title: 'BOMBAS SUBMERSAS', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '19', title: 'POÇOS E PRUMADAS', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '20', title: 'SISTEMA HIDRÁULICO — RESERV., VRP, PRUMADAS, VENTOSAS', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '21', title: 'SIST. ÁGUA QUENTE', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '22', title: 'SDAI', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '23', title: 'PRESS. ESCADA', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '24', title: 'EXAUSTÃO GARAGEM', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '25', title: 'PORTÕES', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '26', title: 'INTERFONE', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '27', title: 'AR CONDICIONADO', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '28', title: 'IRRIGAÇÃO', category: 'COMISSIONAMENTO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },

  // 4. DOCUMENTAÇÃO
  { id: '29', title: 'Manual de Uso, Operação e Manutenção específico do empreendimento (NBR-14037)', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '30', title: 'Projetos legais', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '31', title: 'Projetos As Built', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '32', title: 'Auto de conclusão (habite-se)', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '33', title: 'Alvará de aprovação da edificação', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '34', title: 'Alvará de execução da edificação', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '35', title: 'AVCB (Auto de Vistoria do Corpo de Bombeiros)', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '36', title: 'ART de execução do Sistema de prevenção e Combate a Incêndio', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '37', title: 'ART de projeto do Sistema de prevenção e Combate a Incêndio', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '38', title: 'Alvará de Licença de Funcionamento de Elevadores', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '39', title: 'Termo de conclusão e Recebimento da empresa do Elevador', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '40', title: 'ART de execução dos Elevadores', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '41', title: 'Comprovante de Vistorias da Comgás e Laudo de estanqueidade do sistema de gás', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '42', title: 'Atestado de Start-up do gerador', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '43', title: 'Manual de instalação, operação e manutenção do Gerador', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '44', title: 'ART de projeto e execução do gerador', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '45', title: 'Certificado de limpeza dos ralos, poços e redes (esgoto, drenagem e pluvial) das áreas comuns', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '46', title: 'Certificado de limpeza dos ralos das unidades privativas', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '47', title: 'Ensaio de arrancamento dos dispositivos de ancoragem', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '48', title: 'Ordem de Serviço de Start-up e Relatório Técnico das VRPs', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '49', title: 'Manuais de operação e garantia do Sistema de Irrigação de Jardins', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '50', title: 'Certificado de conformidade das instalações elétricas', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '51', title: 'ART de projeto e instalação elétrica', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '52', title: 'Certificado de limpeza dos reservatórios de água potável', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '53', title: 'Análise de potabilidade da água fria', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '54', title: 'Laudo de SPDA com medição ôhmica e ART', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '55', title: 'Memorial descritivo', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '56', title: 'Notas fiscais dos equipamentos instalados no empreendimento', category: 'DOCUMENTACAO', status: 'vistoria', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
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

  // Estados para modal de detalhes do card
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanItem | null>(null);

  // Filtrar itens baseado na categoria selecionada
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'TODOS') return items;
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Recalcular colunas baseado no estado atual dos items filtrados
  const getColumns = () => [
    {
      id: 'vistoria',
      title: 'Aguardando',
      icon: Search,
      color: 'bg-red-600 text-white',
      items: filteredItems.filter(item => item.status === 'vistoria')
    },
    {
      id: 'correcao',
      title: 'Em Andamento',
      icon: Wrench,
      color: 'bg-yellow-500 text-black',
      items: filteredItems.filter(item => item.status === 'correcao')
    },
    {
      id: 'recebido',
      title: 'Em Correção',
      icon: ClipboardList,
      color: 'bg-green-600 text-white',
      items: filteredItems.filter(item => item.status === 'recebido')
    },
    {
      id: 'implantado',
      title: 'Finalizado',
      icon: CheckCircle,
      color: 'bg-emerald-600 text-white',
      items: filteredItems.filter(item => item.status === 'implantado')
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

      // Se está movendo para "Recebido", pedir data de recebimento
      if (newStatus === 'recebido') {
        setPendingMove({ item: draggedItem, newStatus });
        setShowDateModal(true);
        setDraggedItem(null);
        return;
      }

      // Se está movendo para "Em Correção", pedir o que precisa corrigir
      if (newStatus === 'correcao') {
        setPendingMove({ item: draggedItem, newStatus });
        setShowCorrecaoModal(true);
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
            status: 'recebido' as any,
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
          ? { ...item, status: 'correcao' as any, updatedAt: new Date().toISOString().split('T')[0], dataVistoria: vistoriaDate }
          : item
      ));
      setShowDateModal(false);
      setPendingMove(null);
      setVistoriaDate('');
    }
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
      status: 'vistoria', // Novos itens sempre começam em AG Vistoria
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
            status: 'correcao' as any,
            correcao: correcaoText.trim(),
            dataVistoria: vistoriaDate,
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

    return (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${category.color} text-white shadow-sm`}>
        {category.label.split('.')[1]}
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
            <div key={column.id} className="flex flex-col" style={{ height: 'calc(100vh - 350px)', minHeight: '700px' }}>
              {/* Column Header */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${column.color}`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="outline" className="ml-auto text-black">
                  {column.items.length}
                </Badge>
              </div>

              {/* Column Items - Full Height Drop Zone */}
              <div
                className="flex-1 p-2 border-2 border-dashed border-gray-200 rounded-lg overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
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
                  {pendingMove?.newStatus === 'recebido' ? 'Data de Recebimento' : 'Data de Vistoria'}
                </h3>
              </div>

              <p className="text-gray-600 mb-4">
                Informe a data {pendingMove?.newStatus === 'recebido' ? 'de recebimento' : 'de vistoria'} para o item: <strong>{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {pendingMove?.newStatus === 'recebido' ? 'Data de Recebimento' : 'Data de Vistoria'}
                </label>
                <input
                  type="date"
                  value={pendingMove?.newStatus === 'recebido' ? recebimentoDate : vistoriaDate}
                  onChange={(e) => {
                    if (pendingMove?.newStatus === 'recebido') {
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
                  onClick={pendingMove?.newStatus === 'recebido' ? handleConfirmRecebimento : handleConfirmVistoria}
                  disabled={pendingMove?.newStatus === 'recebido' ? !recebimentoDate : !vistoriaDate}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {pendingMove?.newStatus === 'recebido' ? 'Confirmar Recebimento' : 'Confirmar Vistoria'}
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
                <h3 className="text-lg font-semibold text-gray-900">O que precisa corrigir?</h3>
              </div>

              <p className="text-gray-600 mb-4">
                Descreva o que precisa ser corrigido no item: <strong>{pendingMove?.item.title}</strong>
              </p>

              <div className="mb-4 space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Vistoria
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
                    Descrição do Problema
                  </Label>
                  <textarea
                    value={correcaoText}
                    onChange={(e) => setCorrecaoText(e.target.value)}
                    placeholder="Descreva o problema encontrado..."
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

      {/* Modal de Detalhes do Card */}
      {
        showCardDetails && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
              <div className={`p-4 ${getCategoryColor(selectedCard.category).replace('border-l-4', 'border-l-8')} border-l-solid bg-gray-50 flex justify-between items-start`}>
                <div>
                  <div className="mb-2">
                    {getCategoryBadge(selectedCard.category)}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCard.title}</h2>
                  <p className="text-sm text-gray-500">ID: {selectedCard.id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCardDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status Atual</h3>
                    <Badge className={`
                    ${selectedCard.status === 'vistoria' ? 'bg-red-100 text-red-800' : ''}
                    ${selectedCard.status === 'correcao' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${selectedCard.status === 'recebido' ? 'bg-green-100 text-green-800' : ''}
                    ${selectedCard.status === 'implantado' ? 'bg-emerald-100 text-emerald-800' : ''}
                  `}>
                      {selectedCard.status === 'vistoria' && 'Aguardando'}
                      {selectedCard.status === 'correcao' && 'Em Andamento'}
                      {selectedCard.status === 'recebido' && 'Em Correção'}
                      {selectedCard.status === 'implantado' && 'Finalizado'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Categoria</h3>
                    <span className="text-gray-900 font-medium">
                      {Object.values(CATEGORIES).find(c => c.id === selectedCard.category)?.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Data de Criação</h3>
                    <p className="text-gray-900">
                      {new Date(selectedCard.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Última Atualização</h3>
                    <p className="text-gray-900">
                      {new Date(selectedCard.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {selectedCard.dataVistoria && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Data da Vistoria</h3>
                      <p className="text-gray-900">
                        {new Date(selectedCard.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {selectedCard.dataRecebimento && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Data de Recebimento</h3>
                      <p className="text-gray-900">
                        {new Date(selectedCard.dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {selectedCard.correcao && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Correção Necessária
                    </h3>
                    <p className="text-orange-900 text-sm whitespace-pre-wrap">
                      {selectedCard.correcao}
                    </p>
                  </div>
                )}

                {selectedCard.historicoCorrecao && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Histórico de Correções</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">
                      {selectedCard.historicoCorrecao}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <Button onClick={() => setShowCardDetails(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
