import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ClipboardList, 
  Search, 
  Wrench, 
  CheckCircle, 
  Plus,
  Calendar,
  X,
  Trash2
} from 'lucide-react';

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: 'recebido' | 'vistoria' | 'correcao' | 'implantado';
  createdAt: string;
  updatedAt: string;
  dataVistoria?: string;
  dataRecebimento?: string;
  correcao?: string;
  dataCorrecao?: string;
  historicoCorrecao?: string;
}

const initialItems: KanbanItem[] = [
  // Sistemas Elétricos
  {
    id: '1',
    title: 'QGBT (Quadro Geral de Baixa Tensão)',
    status: 'vistoria',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    title: "QD's (Quadros de Distribuição por andar)",
    status: 'vistoria',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '3',
    title: 'QTA (Quadro de Transferência Automática)',
    status: 'vistoria',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '4',
    title: 'Gerador de energia',
    status: 'vistoria',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20'
  },
  {
    id: '5',
    title: 'Centro de Medição / Transformador',
    status: 'vistoria',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-18'
  },
  {
    id: '6',
    title: 'SPDA (Sistema de Proteção contra Descargas Atmosféricas)',
    status: 'vistoria',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-22'
  },
  {
    id: '7',
    title: 'Iluminação de emergência',
    status: 'vistoria',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-25'
  },
  // Sistemas Hidráulicos
  {
    id: '8',
    title: 'Bombas de recalque',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '9',
    title: 'Bombas de pressurização',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '10',
    title: 'Bombas de drenagem / águas pluviais',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '11',
    title: 'Reservatório inferior',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '12',
    title: 'Reservatório superior',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '13',
    title: 'VRP – Válvulas Redutoras de Pressão',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '14',
    title: 'Rede de água fria',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '15',
    title: 'Rede de água quente',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '16',
    title: 'Rede de esgoto sanitário',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '17',
    title: 'Sistema de drenagem (ralos, grelhas, calhas)',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '18',
    title: 'Barrilete hidráulico (válvulas, registros e etiquetas)',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '19',
    title: 'Sistema de reúso / reaproveitamento de água (quando houver)',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '20',
    title: 'Bombas elevatórias de esgoto',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '21',
    title: 'Bombas de águas pluviais',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  {
    id: '22',
    title: 'Testes de estanqueidade e vazão',
    status: 'vistoria',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  },
  // Sistemas de Combate a Incêndio
  {
    id: '23',
    title: 'Bombas de incêndio',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '24',
    title: 'Rede de hidrantes e mangotinhos',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '25',
    title: 'Sistema de detecção e alarme de incêndio',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '26',
    title: 'Extintores e suportes',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '27',
    title: 'Sinalização de rota de fuga',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '28',
    title: 'Pressurização de escadas',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '29',
    title: 'Mangueiras e esguichos certificados',
    status: 'vistoria',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  // Sistema de Ar Condicionado e Ventilação
  {
    id: '30',
    title: 'Sistema de distribuição de ar (dutos)',
    status: 'vistoria',
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30'
  },
  {
    id: '31',
    title: 'Ventiladores centrífugos e axiais',
    status: 'vistoria',
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30'
  },
  {
    id: '32',
    title: 'Sistema de controle e automação',
    status: 'vistoria',
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30'
  },
  {
    id: '33',
    title: 'Sistema de recuperação de calor',
    status: 'vistoria',
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30'
  },
  // Sistema de Gás - Central de GLP / GN
  {
    id: '34',
    title: 'Central de GN (gás natural)',
    status: 'vistoria',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01'
  },
  {
    id: '35',
    title: 'Medidores de gás',
    status: 'vistoria',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01'
  },
  {
    id: '36',
    title: 'Ventilação da central de gás',
    status: 'vistoria',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01'
  },
  {
    id: '37',
    title: 'Testes de pressão e estanqueidade',
    status: 'vistoria',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01'
  },
  // Portões Automáticos e Clausuras
  {
    id: '38',
    title: 'Portões automáticos de entrada',
    status: 'vistoria',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05'
  },
  {
    id: '39',
    title: 'Portões automáticos de garagem',
    status: 'vistoria',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05'
  },
  {
    id: '40',
    title: 'Clausuras e cancelas',
    status: 'vistoria',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05'
  },
  {
    id: '41',
    title: 'Sistema de acionamento remoto',
    status: 'vistoria',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05'
  },
  {
    id: '42',
    title: 'Sistema de controle de acesso',
    status: 'vistoria',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05'
  },
  {
    id: '43',
    title: 'Interfones e campainhas',
    status: 'vistoria',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-05'
  }
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
  const [pendingMove, setPendingMove] = useState<{item: KanbanItem, newStatus: string} | null>(null);
  const [recebimentoDate, setRecebimentoDate] = useState('');
  const [vistoriaDate, setVistoriaDate] = useState('');
  
  // Estados para modal de novo item
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  
  // Estados para modal de correção
  const [showCorrecaoModal, setShowCorrecaoModal] = useState(false);
  const [correcaoText, setCorrecaoText] = useState('');
  
  // Estados para modal de detalhes do card
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanItem | null>(null);

  // Kanban usa apenas a lista original de sistemas de manutenção

  // Recalcular colunas baseado no estado atual dos items
  const getColumns = () => [
    {
      id: 'vistoria',
      title: 'AG Vistoria',
      icon: Search,
      color: 'bg-red-100 text-red-700',
      items: items.filter(item => item.status === 'vistoria')
    },
    {
      id: 'correcao',
      title: 'Em Correção',
      icon: Wrench,
      color: 'bg-orange-100 text-orange-700',
      items: items.filter(item => item.status === 'correcao')
    },
    {
      id: 'recebido',
      title: 'Recebido',
      icon: ClipboardList,
      color: 'bg-blue-100 text-blue-700',
      items: items.filter(item => item.status === 'recebido')
    },
    {
      id: 'implantado',
      title: 'Implantado',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
      items: items.filter(item => item.status === 'implantado')
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
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    setItems(prev => [...prev, newItem]);
    setNewItemTitle('');
    setShowNewItemModal(false);
  };

  const handleCancelNewItem = () => {
    setNewItemTitle('');
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


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban - Implantação de Manutenção Predial</h1>
          <p className="text-gray-600 mt-1">Acompanhe o progresso da implantação dos sistemas prediais</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowNewItemModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Resumo do Progresso</h3>
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
            <div key={column.id} className="space-y-4">
              {/* Column Header */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${column.color}`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="outline" className="ml-auto text-black">
                  {column.items.length}
                </Badge>
              </div>

              {/* Column Items */}
              <div
                className="space-y-3 min-h-[400px] p-2 border-2 border-dashed border-gray-200 rounded-lg"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {column.items.map((item) => (
                  <Card
                    key={item.id}
                    className={`cursor-move hover:shadow-md transition-shadow bg-white ${
                      item.correcao ? 'border-l-4 border-l-orange-500' : ''
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onClick={() => handleShowCardDetails(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {item.correcao && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
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
                      
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {item.dataVistoria && (
                          <div className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Vistoria: {new Date(item.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {item.dataRecebimento && (
                          <div className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded">
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
          );
        })}
      </div>

      {/* Modal para Data */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      )}

      {/* Modal para Novo Item */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
            
            <div className="mb-4">
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newItemTitle.trim()) {
                    handleCreateNewItem();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
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
      )}

      {/* Modal para Correção */}
      {showCorrecaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">O que precisa corrigir?</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Descreva o que precisa ser corrigido no item: <strong>{pendingMove?.item.title}</strong>
            </p>
            
            <div className="mb-4">
              <Label htmlFor="vistoriaDate" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vistoria
              </Label>
              <input
                id="vistoriaDate"
                type="date"
                value={vistoriaDate}
                onChange={(e) => setVistoriaDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="correcaoText" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Correção
              </Label>
              <textarea
                id="correcaoText"
                value={correcaoText}
                onChange={(e) => setCorrecaoText(e.target.value)}
                placeholder="Descreva o que precisa ser corrigido..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={4}
              />
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
      )}

      {/* Modal para Detalhes do Card */}
      {showCardDetails && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Item</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCardDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Título</Label>
                <p className="text-gray-900">{selectedCard.title}</p>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Status</Label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedCard.status === 'vistoria' ? 'bg-red-100 text-red-700' :
                  selectedCard.status === 'correcao' ? 'bg-orange-100 text-orange-700' :
                  selectedCard.status === 'recebido' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {selectedCard.status === 'vistoria' ? 'AG Vistoria' :
                   selectedCard.status === 'correcao' ? 'Em Correção' :
                   selectedCard.status === 'recebido' ? 'Recebido' : 'Implantado'}
                </span>
              </div>
              
              {selectedCard.dataVistoria && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Data de Vistoria</Label>
                  <p className="text-gray-900">{new Date(selectedCard.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              
              {selectedCard.dataRecebimento && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Data de Recebimento</Label>
                  <p className="text-gray-900">{new Date(selectedCard.dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              
              {selectedCard.correcao && selectedCard.status !== 'recebido' && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">O que precisa corrigir</Label>
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                    <p className="text-orange-800 text-sm">{selectedCard.correcao}</p>
                  </div>
                </div>
              )}
              
              {selectedCard.historicoCorrecao && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Histórico de Correção</Label>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm">{selectedCard.historicoCorrecao}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setShowCardDetails(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
