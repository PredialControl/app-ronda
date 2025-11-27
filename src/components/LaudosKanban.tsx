import React, { useState, useEffect } from 'react';
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
  Settings,
  Edit,
  Pencil,
  RefreshCw,
  Mail,
  Server
} from 'lucide-react';
import { emailService, EmailDestinatario } from '@/lib/emailService';
import { laudoService, Laudo } from '@/lib/laudoService';
import { googleScriptService } from '@/lib/googleScriptService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LaudosKanbanProps {
  contratoSelecionado?: { id: string; nome: string } | null;
}

export function LaudosKanban({ contratoSelecionado }: LaudosKanbanProps) {
  const [items, setItems] = useState<Laudo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Laudo | null>(null);

  // Estados para modal de novo item
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDataVencimento, setNewItemDataVencimento] = useState('');
  const [newItemPeriodicidade, setNewItemPeriodicidade] = useState('Anual');
  const [editingItem, setEditingItem] = useState<Laudo | null>(null);

  // Estados para modal de detalhes do card
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Laudo | null>(null);

  // Estados para modal de configuração de email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailName, setEmailName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [recipients, setRecipients] = useState<EmailDestinatario[]>([]);

  // Estados para modal de configuração do servidor de email
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  // Carregar dados ao mudar contrato
  useEffect(() => {
    if (contratoSelecionado) {
      loadLaudos();
      loadEmailConfig();
    } else {
      setItems([]);
      setRecipients([]);
    }
  }, [contratoSelecionado?.id]);

  // Carregar URL do servidor ao montar
  useEffect(() => {
    const url = googleScriptService.obterUrl();
    if (url) setServerUrl(url);
  }, []);

  const loadLaudos = async () => {
    if (!contratoSelecionado) return;

    setIsLoading(true);
    try {
      let data = await laudoService.getByContrato(contratoSelecionado.id);

      // Se não tiver laudos, inicializar com os padrões (seed)
      if (data.length === 0) {
        console.log('⚠️ Nenhum laudo encontrado, inicializando padrões...');
        data = await laudoService.initializeDefaults(contratoSelecionado.id);
      }

      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar laudos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailConfig = () => {
    if (!contratoSelecionado) return;
    const config = emailService.obterConfiguracaoEmail(contratoSelecionado.id);
    if (config) {
      setRecipients(config.destinatarios);
    } else {
      setRecipients([]);
    }
  };

  const handleAddRecipient = () => {
    if (!emailName.trim() || !emailAddress.trim()) return;
    if (recipients.length >= 4) {
      alert('Limite de 4 destinatários atingido.');
      return;
    }

    const newRecipient: EmailDestinatario = {
      id: Date.now().toString(),
      nome: emailName.trim(),
      email: emailAddress.trim(),
      ativo: true
    };

    const newRecipients = [...recipients, newRecipient];
    setRecipients(newRecipients);

    // Salvar automaticamente
    if (contratoSelecionado) {
      emailService.configurarEmails(contratoSelecionado.id, contratoSelecionado.nome, newRecipients);
    }

    setEmailName('');
    setEmailAddress('');
  };

  const handleRemoveRecipient = (id: string) => {
    const newRecipients = recipients.filter(r => r.id !== id);
    setRecipients(newRecipients);

    // Salvar automaticamente
    if (contratoSelecionado) {
      emailService.configurarEmails(contratoSelecionado.id, contratoSelecionado.nome, newRecipients);
    }
  };

  const handleSaveServerUrl = () => {
    if (serverUrl.trim()) {
      googleScriptService.salvarUrl(serverUrl.trim());
      alert('URL do servidor salva com sucesso!');
      setShowServerModal(false);
    }
  };

  // Recalcular colunas baseado no estado atual dos items
  const getColumns = () => [
    {
      id: 'em-dia',
      title: 'Em Dia',
      icon: CheckCircle,
      color: 'bg-green-600 text-white',
      items: items.filter(item => item.status === 'em-dia')
    },
    {
      id: 'proximo-vencimento',
      title: 'Próximo ao Vencimento',
      icon: AlertTriangle,
      color: 'bg-yellow-500 text-black',
      items: items.filter(item => item.status === 'proximo-vencimento')
    },
    {
      id: 'vencidos',
      title: 'Vencidos',
      icon: AlertTriangle,
      color: 'bg-red-600 text-white',
      items: items.filter(item => item.status === 'vencidos')
    }
  ];

  // Funções de drag and drop
  const handleDragStart = (item: Laudo) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem && contratoSelecionado) {
      console.log('🔄 Movendo laudo:', draggedItem.titulo, 'para:', newStatus);

      // Atualização otimista
      const updatedItems = items.map(item =>
        item.id === draggedItem.id
          ? { ...item, status: newStatus as any }
          : item
      );
      setItems(updatedItems);

      try {
        await laudoService.update(draggedItem.id, { status: newStatus as any });

        // Verificar envio de email
        if (newStatus === 'vencidos' || newStatus === 'proximo-vencimento') {
          console.log('📧 Verificando envio de email para mudança de status...');

          const laudoEmail = {
            id: draggedItem.id,
            title: draggedItem.titulo,
            dataVencimento: draggedItem.data_vencimento || new Date().toISOString(),
            status: newStatus as any,
            diasVencimento: draggedItem.data_vencimento ? getDiasVencimento(draggedItem.data_vencimento) : 0
          };

          const laudosVencidos = newStatus === 'vencidos' ? [laudoEmail] : [];
          const laudosProximos = newStatus === 'proximo-vencimento' ? [laudoEmail] : [];

          await emailService.enviarEmailLaudos(
            contratoSelecionado.id,
            laudosVencidos,
            laudosProximos
          );
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        loadLaudos(); // Reverter em caso de erro
      }

      setDraggedItem(null);
    }
  };

  // Funções para criar/editar item
  const handleCreateNewItem = async () => {
    if (!newItemTitle.trim() || !contratoSelecionado) return;

    // Se tiver data de vencimento, calcula status. Se não, assume 'vencidos' como padrão pedido ou 'em-dia'?
    // O usuário pediu "deixe todos em vencidos", mas para novos manuais vamos calcular.
    let status: any = 'vencidos';
    if (newItemDataVencimento) {
      status = getStatusAutomatico(newItemDataVencimento);
    }

    try {
      if (editingItem) {
        const updated = await laudoService.update(editingItem.id, {
          titulo: newItemTitle.trim(),
          data_vencimento: newItemDataVencimento,
          periodicidade: newItemPeriodicidade,
          status: status
        });

        if (updated) {
          setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
        }
      } else {
        const novo = await laudoService.create({
          contrato_id: contratoSelecionado.id,
          titulo: newItemTitle.trim(),
          status: status,
          data_vencimento: newItemDataVencimento,
          periodicidade: newItemPeriodicidade,
          data_emissao: new Date().toISOString().split('T')[0] // Data de hoje como emissão padrão
        });

        if (novo) {
          setItems(prev => [...prev, novo]);
        }
      }
      handleCancelNewItem();
    } catch (error) {
      console.error('Erro ao salvar laudo:', error);
      alert('Erro ao salvar laudo.');
    }
  };

  const handleEditItem = (item: Laudo) => {
    setEditingItem(item);
    setNewItemTitle(item.titulo);
    setNewItemDataVencimento(item.data_vencimento || '');
    setNewItemPeriodicidade(item.periodicidade || 'Anual');
    setShowNewItemModal(true);
  };

  const handleCancelNewItem = () => {
    setNewItemTitle('');
    setNewItemDataVencimento('');
    setNewItemPeriodicidade('Anual');
    setEditingItem(null);
    setShowNewItemModal(false);
  };

  // Função para remover item
  const handleRemoveItem = async (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este laudo?')) {
      try {
        await laudoService.delete(itemId);
        setItems(prev => prev.filter(item => item.id !== itemId));
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  // Função para mostrar detalhes do card
  const handleShowCardDetails = (item: Laudo) => {
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

  // Função para calcular status automático
  const getStatusAutomatico = (dataVencimento: string) => {
    const diasVencimento = getDiasVencimento(dataVencimento);
    if (diasVencimento < 0) return 'vencidos';
    if (diasVencimento <= 30) return 'proximo-vencimento';
    return 'em-dia';
  };

  const atualizarStatusAutomatico = async () => {
    // Recalcular status de todos baseado na data atual
    if (!items.length || !contratoSelecionado) return;

    let mudou = false;
    const laudosVencidos: any[] = [];
    const laudosProximos: any[] = [];

    const updates = items.map(async (item) => {
      if (item.data_vencimento) {
        const novoStatus = getStatusAutomatico(item.data_vencimento);
        if (novoStatus !== item.status) {
          mudou = true;
          // Atualizar no banco
          await laudoService.update(item.id, { status: novoStatus as any });

          // Preparar para email
          const laudoEmail = {
            id: item.id,
            title: item.titulo,
            dataVencimento: item.data_vencimento,
            status: novoStatus as any,
            diasVencimento: getDiasVencimento(item.data_vencimento)
          };

          if (novoStatus === 'vencidos') laudosVencidos.push(laudoEmail);
          if (novoStatus === 'proximo-vencimento') laudosProximos.push(laudoEmail);

          return { ...item, status: novoStatus as any };
        }
      }
      return item;
    });

    if (mudou) {
      const newItems = await Promise.all(updates);
      setItems(newItems);

      // Enviar email com resumo das mudanças
      if (laudosVencidos.length > 0 || laudosProximos.length > 0) {
        console.log('📧 Enviando email de atualização automática...');
        await emailService.enviarEmailLaudos(
          contratoSelecionado.id,
          laudosVencidos,
          laudosProximos
        );
        alert(`Status atualizados e emails enviados! (${laudosVencidos.length} vencidos, ${laudosProximos.length} próximos)`);
      } else {
        alert('Status atualizados com sucesso!');
      }
    } else {
      alert('Todos os status já estão atualizados.');
    }
  };

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
            ⚡ Status automático: Próximo ao vencimento (≤30 dias) | Vencidos (data passada)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={() => setShowEmailModal(true)}
            disabled={isLoading || !contratoSelecionado}
          >
            <Mail className="w-4 h-4 mr-2" />
            Configurar Emails
          </Button>
          <Button
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={atualizarStatusAutomatico}
            disabled={isLoading}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Atualizar Status
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowNewItemModal(true)}
            disabled={isLoading || !contratoSelecionado}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Laudo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando laudos...</div>
      ) : (
        <>
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
                    <div className="text-2xl font-bold text-gray-900">{column.items.length}</div>
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
                    <Badge variant="outline" className="ml-auto text-black bg-white/20 border-0">
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
                      const diasVencimento = item.data_vencimento ? getDiasVencimento(item.data_vencimento) : 0;
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
                                {item.titulo}
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item);
                                  }}
                                  className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1 h-6 w-6"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3 flex-wrap">
                              {item.data_emissao && (
                                <div className="text-[10px] text-white bg-blue-900 px-2 py-1 rounded">
                                  Emissão: {new Date(item.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {item.data_vencimento && (
                                <div className={`text-[10px] px-2 py-1 rounded ${diasVencimento < 0 ? 'text-white bg-red-600' :
                                  diasVencimento <= 30 ? 'text-black bg-yellow-500' :
                                    'text-white bg-green-600'
                                  }`}>
                                  Vencimento: {new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {item.periodicidade && (
                                <div className="text-[10px] font-medium text-white bg-purple-600 px-2 py-1 rounded border border-purple-700">
                                  {item.periodicidade}
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
        </>
      )}

      {/* Modal para Novo Laudo */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Editar Laudo' : 'Novo Laudo'}
                </h3>
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
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="newItemPeriodicidade" className="block text-sm font-medium text-gray-700 mb-2">
                Periodicidade
              </Label>
              <Select value={newItemPeriodicidade} onValueChange={setNewItemPeriodicidade}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Bimestral">Bimestral</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                  <SelectItem value="A cada 2 anos">A cada 2 anos</SelectItem>
                  <SelectItem value="A cada 3 anos">A cada 3 anos</SelectItem>
                  <SelectItem value="A cada 5 anos">A cada 5 anos</SelectItem>
                  <SelectItem value="Periódico (Variável)">Periódico (Variável)</SelectItem>
                </SelectContent>
              </Select>
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
                {editingItem ? 'Salvar Alterações' : 'Criar Laudo'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Detalhes do Card */}
      {showCardDetails && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
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
                <p className="text-gray-900">{selectedCard.titulo}</p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Status</Label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectedCard.status === 'em-dia' ? 'bg-green-600 text-white' :
                  selectedCard.status === 'proximo-vencimento' ? 'bg-yellow-500 text-black' :
                    'bg-red-600 text-white'
                  }`}>
                  {selectedCard.status === 'em-dia' ? 'Em Dia' :
                    selectedCard.status === 'proximo-vencimento' ? 'Próximo ao Vencimento' : 'Vencido'}
                </span>
              </div>

              {selectedCard.data_emissao && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</Label>
                  <p className="text-gray-900">{new Date(selectedCard.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              )}

              {selectedCard.data_vencimento && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</Label>
                  <p className="text-gray-900">{new Date(selectedCard.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {(() => {
                      const dias = getDiasVencimento(selectedCard.data_vencimento);
                      if (dias < 0) return `Vencido há ${Math.abs(dias)} dias`;
                      if (dias === 0) return 'Vence hoje';
                      return `${dias} dias restantes`;
                    })()}
                  </p>
                </div>
              )}

              {selectedCard.periodicidade && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</Label>
                  <p className="text-gray-900">{selectedCard.periodicidade}</p>
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

      {/* Modal para Configuração de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Configurar Emails</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Adicione até 4 pessoas para receberem alertas sobre vencimentos deste contrato.
            </p>

            <div className="space-y-4 mb-6">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{recipient.nome}</p>
                    <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {recipients.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded">
                  Nenhum destinatário configurado
                </div>
              )}
            </div>

            {recipients.length < 4 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900">Adicionar Novo</h4>
                <div>
                  <Label htmlFor="emailName" className="sr-only">Nome</Label>
                  <Input
                    id="emailName"
                    type="text"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    placeholder="Nome da pessoa"
                    className="w-full mb-2"
                  />
                  <Label htmlFor="emailAddress" className="sr-only">Email</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="E-mail"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleAddRecipient}
                  disabled={!emailName.trim() || !emailAddress.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Destinatário
                </Button>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
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
