import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Calendar,
  X,
  Trash2,
  FileText,
  Settings
} from 'lucide-react';

interface LaudoItem {
  id: string;
  title: string;
  description?: string;
  status: 'em-dia' | 'proximo-vencimento' | 'vencidos';
  createdAt: string;
  updatedAt: string;
  dataVencimento?: string;
  dataEmissao?: string;
  observacoes?: string;
}

const initialLaudos: LaudoItem[] = [
  // Laudos em dia
  {
    id: '1',
    title: 'Laudo de Instalações Elétricas',
    status: 'em-dia',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2024-01-10',
    dataVencimento: '2025-01-10'
  },
  {
    id: '2',
    title: 'Laudo de SPDA',
    status: 'em-dia',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2024-01-05',
    dataVencimento: '2025-01-05'
  },
  {
    id: '3',
    title: 'Laudo de Combate a Incêndio',
    status: 'em-dia',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2024-01-01',
    dataVencimento: '2025-01-01'
  },
  // Laudos próximos ao vencimento
  {
    id: '4',
    title: 'Laudo de Elevadores',
    status: 'proximo-vencimento',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2023-12-01',
    dataVencimento: '2024-12-01'
  },
  {
    id: '5',
    title: 'Laudo de Gás',
    status: 'proximo-vencimento',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2023-11-15',
    dataVencimento: '2024-11-15'
  },
  // Laudos vencidos
  {
    id: '6',
    title: 'Laudo de Ar Condicionado',
    status: 'vencidos',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2023-06-01',
    dataVencimento: '2024-06-01'
  },
  {
    id: '7',
    title: 'Laudo de Segurança do Trabalho',
    status: 'vencidos',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    dataEmissao: '2023-03-15',
    dataVencimento: '2024-03-15'
  }
];

interface LaudosKanbanProps {
  contratoSelecionado?: { id: string; nome: string } | null;
}

export function LaudosKanban({ contratoSelecionado }: LaudosKanbanProps) {
  const [items, setItems] = useState<LaudoItem[]>(initialLaudos);
  const [draggedItem, setDraggedItem] = useState<LaudoItem | null>(null);
  
  // Estados para modal de novo item
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDataVencimento, setNewItemDataVencimento] = useState('');
  
  // Estados para modal de detalhes do card
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LaudoItem | null>(null);
  

  // Recalcular colunas baseado no estado atual dos items
  const getColumns = () => [
    {
      id: 'em-dia',
      title: 'Em Dia',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
      items: items.filter(item => item.status === 'em-dia')
    },
    {
      id: 'proximo-vencimento',
      title: 'Próximo ao Vencimento',
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-700',
      items: items.filter(item => item.status === 'proximo-vencimento')
    },
    {
      id: 'vencidos',
      title: 'Vencidos',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-700',
      items: items.filter(item => item.status === 'vencidos')
    }
  ];

  // Funções de drag and drop
  const handleDragStart = (item: LaudoItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      console.log('🔄 Movendo laudo:', draggedItem.title, 'para:', newStatus);
      
      setItems(prev => prev.map(item => 
        item.id === draggedItem.id 
          ? { ...item, status: newStatus as any, updatedAt: new Date().toISOString().split('T')[0] }
          : item
      ));
      setDraggedItem(null);
    }
  };

  // Funções para criar novo item
  const handleCreateNewItem = () => {
    if (!newItemTitle.trim() || !newItemDataVencimento) return;
    
    const statusAutomatico = getStatusAutomatico(newItemDataVencimento);
    
    const newItem: LaudoItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      status: statusAutomatico as any, // Status calculado automaticamente
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: newItemDataVencimento
    };
    
    setItems(prev => [...prev, newItem]);
    setNewItemTitle('');
    setNewItemDataVencimento('');
    setShowNewItemModal(false);
  };

  const handleCancelNewItem = () => {
    setNewItemTitle('');
    setNewItemDataVencimento('');
    setShowNewItemModal(false);
  };

  // Função para remover item
  const handleRemoveItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este laudo?')) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Função para mostrar detalhes do card
  const handleShowCardDetails = (item: LaudoItem) => {
    setSelectedCard(item);
    setShowCardDetails(true);
  };


  // Função para calcular dias até vencimento
  const getDiasVencimento = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Função para calcular status automático baseado na data de vencimento
  const getStatusAutomatico = (dataVencimento: string) => {
    const diasVencimento = getDiasVencimento(dataVencimento);
    
    if (diasVencimento < 0) {
      return 'vencidos';
    } else if (diasVencimento <= 28) {
      return 'proximo-vencimento';
    } else {
      return 'em-dia';
    }
  };

  // Função para atualizar status automático de todos os itens
  const atualizarStatusAutomatico = () => {
    setItems(prev => prev.map(item => {
      if (item.dataVencimento) {
        const novoStatus = getStatusAutomatico(item.dataVencimento);
        return { ...item, status: novoStatus as any };
      }
      return item;
    }));
  };

  // useEffect para atualizar status automaticamente
  React.useEffect(() => {
    atualizarStatusAutomatico();
    
    // Atualizar a cada hora para verificar mudanças de status
    const interval = setInterval(atualizarStatusAutomatico, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laudos - Controle de Vencimentos</h1>
          <p className="text-gray-600 mt-1">Acompanhe o status e vencimentos dos laudos técnicos</p>
          {contratoSelecionado && (
            <p className="text-sm text-blue-600 mt-1 font-medium">
              📋 Contrato: {contratoSelecionado.nome}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            ⚡ Status automático: Próximo ao vencimento (≤28 dias) | Vencidos (data passada)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={atualizarStatusAutomatico}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Atualizar Status
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowNewItemModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Laudo
          </Button>
        </div>
      </div>


      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Resumo dos Laudos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getColumns().map((column) => {
            const Icon = column.icon;
            return (
              <div key={column.id} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">{column.title}</span>
                </div>
                <div className="text-2xl font-bold text-white">{column.items.length}</div>
                <div className="text-xs text-gray-500">laudos</div>
              </div>
            );
          })}
        </div>
        
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {column.items.map((item) => {
                  const diasVencimento = item.dataVencimento ? getDiasVencimento(item.dataVencimento) : 0;
                  return (
                    <Card
                      key={item.id}
                      className="cursor-move hover:shadow-md transition-shadow bg-white"
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
                          {item.dataEmissao && (
                            <div className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Emissão: {new Date(item.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {item.dataVencimento && (
                            <div className={`text-[10px] px-2 py-1 rounded ${
                              diasVencimento < 0 ? 'text-red-600 bg-red-50' :
                              diasVencimento <= 30 ? 'text-yellow-600 bg-yellow-50' :
                              'text-green-600 bg-green-50'
                            }`}>
                              Vencimento: {new Date(item.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {/* Empty state */}
                {column.items.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    Nenhum laudo nesta categoria
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Novo Laudo */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Novo Laudo</h3>
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
              Crie um novo laudo que será adicionado automaticamente na categoria "Em Dia".
            </p>
            
            <div className="mb-4">
              <Label htmlFor="newItemTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Título do Laudo
              </Label>
              <Input
                id="newItemTitle"
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Digite o título do laudo..."
                className="w-full"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="newItemDataVencimento" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento
              </Label>
              <Input
                id="newItemDataVencimento"
                type="date"
                value={newItemDataVencimento}
                onChange={(e) => setNewItemDataVencimento(e.target.value)}
                className="w-full"
                min={new Date().toISOString().split('T')[0]}
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
                disabled={!newItemTitle.trim() || !newItemDataVencimento}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                Criar Laudo
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
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Laudo</h3>
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
                  selectedCard.status === 'em-dia' ? 'bg-green-100 text-green-700' :
                  selectedCard.status === 'proximo-vencimento' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedCard.status === 'em-dia' ? 'Em Dia' :
                   selectedCard.status === 'proximo-vencimento' ? 'Próximo ao Vencimento' : 'Vencido'}
                </span>
              </div>
              
              {selectedCard.dataEmissao && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</Label>
                  <p className="text-gray-900">{new Date(selectedCard.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              
              {selectedCard.dataVencimento && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</Label>
                  <p className="text-gray-900">{new Date(selectedCard.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {(() => {
                      const dias = getDiasVencimento(selectedCard.dataVencimento);
                      if (dias < 0) return `Vencido há ${Math.abs(dias)} dias`;
                      if (dias === 0) return 'Vence hoje';
                      return `${dias} dias restantes`;
                    })()}
                  </p>
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
