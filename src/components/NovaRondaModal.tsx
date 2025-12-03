import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ronda, Contrato, AreaTecnica, OutroItemCorrigido } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import { OutroItemModal } from '@/components/OutroItemModal';
import { X, Calendar, Clock, User, FileText, Plus, Wrench } from 'lucide-react';

interface NovaRondaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ronda: Ronda) => void;
  contratoSelecionado?: Contrato | null;
}

export function NovaRondaModal({
  isOpen,
  onClose,
  onSave,
  contratoSelecionado
}: NovaRondaModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    contrato: '',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    responsavel: '',
    observacoesGerais: '',
    tipoVisita: 'RONDA' as 'RONDA' | 'REUNIAO' | 'OUTROS'
  });

  const [outrosItensCorrigidos, setOutrosItensCorrigidos] = useState<OutroItemCorrigido[]>([]);
  const [isOutroItemModalOpen, setIsOutroItemModalOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState<OutroItemCorrigido | null>(null);

  useEffect(() => {
    if (contratoSelecionado) {
      setFormData(prev => ({
        ...prev,
        contrato: contratoSelecionado.nome
      }));
    }
  }, [contratoSelecionado]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Atualizar nome automaticamente quando o tipo de visita mudar
    if (field === 'tipoVisita') {
      let novoNome = '';
      if (value === 'RONDA') {
        novoNome = 'VISITA TÉCNICA';
      } else if (value === 'REUNIAO') {
        novoNome = 'REUNIÃO DE ALINHAMENTO';
      } else {
        novoNome = ''; // Para 'OUTROS', deixar em branco para o usuário preencher
      }
      setFormData(prev => ({ ...prev, nome: novoNome, [field]: value as 'RONDA' | 'REUNIAO' | 'OUTROS' }));
    }
  };

  const handleAddOutroItem = () => {
    setItemEditando(null);
    setIsOutroItemModalOpen(true);
  };

  const handleEditOutroItem = (item: OutroItemCorrigido) => {
    setItemEditando(item);
    setIsOutroItemModalOpen(true);
  };

  const handleSaveOutroItem = (item: OutroItemCorrigido) => {
    if (itemEditando) {
      // Editando item existente
      setOutrosItensCorrigidos(prev =>
        prev?.filter(item => item && item.id).map(existingItem =>
          existingItem.id === itemEditando.id ? item : existingItem
        ) || []
      );
    } else {
      // Adicionando novo item
      setOutrosItensCorrigidos(prev => [...prev, item]);
    }
    setIsOutroItemModalOpen(false);
    setItemEditando(null);
  };

  const handleDeleteOutroItem = (id: string) => {
    setOutrosItensCorrigidos(prev => prev?.filter(item => item && item.id !== id) || []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.contrato) {
      alert('Por favor, preencha o nome da ronda e o contrato');
      return;
    }

    // NÃO criar áreas técnicas automaticamente - usuário adiciona manualmente
    const novaRonda: Ronda = {
      id: crypto.randomUUID(),
      nome: formData.nome,
      contrato: formData.contrato,
      data: formData.data,
      hora: formData.hora,
      tipoVisita: formData.tipoVisita,
      responsavel: formData.responsavel,
      observacoesGerais: formData.observacoesGerais,
      areasTecnicas: [], // Começar vazio, usuário adiciona manualmente
      outrosItensCorrigidos: outrosItensCorrigidos,
      fotosRonda: []
    };

    onSave(novaRonda);
    onClose();

    // Reset form
    setFormData({
      nome: '',
      contrato: contratoSelecionado?.nome || '',
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      responsavel: '',
      observacoesGerais: '',
      tipoVisita: 'RONDA'
    });
    setOutrosItensCorrigidos([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {formData.tipoVisita === 'REUNIAO' ? 'Nova Reunião' : formData.tipoVisita === 'OUTROS' ? 'Novo Registro' : 'Nova Ronda'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do formulário */}
        <div className="p-4">

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Visita */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Visita *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('tipoVisita', 'RONDA')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'RONDA'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  🔍 Ronda
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('tipoVisita', 'REUNIAO')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'REUNIAO'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  👥 Reunião
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('tipoVisita', 'OUTROS')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'OUTROS'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  📋 Outros
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nome da {formData.tipoVisita === 'REUNIAO' ? 'Reunião' : formData.tipoVisita === 'OUTROS' ? 'Atividade' : 'Ronda'} *</label>
              <Input
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder={formData.tipoVisita === 'REUNIAO' ? 'Ex: Reunião com Síndico' : formData.tipoVisita === 'OUTROS' ? 'Ex: Vistoria Pontual' : 'Ex: Ronda Matutina - Centro'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contrato *</label>
              <Input
                value={formData.contrato}
                onChange={(e) => handleInputChange('contrato', e.target.value)}
                placeholder="Ex: CT001/2024 - Manutenção Preventiva"
                required
                readOnly={!!contratoSelecionado}
                className={contratoSelecionado ? 'bg-gray-100' : ''}
              />
              {contratoSelecionado && (
                <p className="text-xs text-gray-500 mt-1">
                  Contrato selecionado automaticamente
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Data *
                </label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Hora *
                </label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => handleInputChange('hora', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <User className="w-4 h-4" />
                Responsável
              </label>
              <Input
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável pela ronda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.tipoVisita === 'REUNIAO' ? 'Resumo da Reunião *' : formData.tipoVisita === 'OUTROS' ? 'Descrição da Atividade *' : 'Observações Gerais'}
              </label>
              {formData.tipoVisita !== 'RONDA' ? (
                <textarea
                  value={formData.observacoesGerais}
                  onChange={(e) => handleInputChange('observacoesGerais', e.target.value)}
                  placeholder={formData.tipoVisita === 'REUNIAO' ? 'Descreva o que foi discutido na reunião, decisões tomadas, próximos passos...' : 'Descreva a atividade realizada...'}
                  className="w-full min-h-[120px] p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
                  required={['REUNIAO', 'OUTROS'].includes(formData.tipoVisita)}
                />
              ) : (
                <Input
                  value={formData.observacoesGerais}
                  onChange={(e) => handleInputChange('observacoesGerais', e.target.value)}
                  placeholder="Observações sobre a ronda"
                />
              )}
            </div>


            {/* Info sobre áreas técnicas pré-definidas - apenas para Ronda */}
            {formData.tipoVisita === 'RONDA' && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ✅ Áreas Técnicas serão criadas automaticamente:
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  {AREAS_TECNICAS_PREDEFINIDAS.map((area, index) => (
                    <div key={index}>• {area}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Outros Itens Corrigidos */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Outros Itens Corrigidos
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOutroItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </Button>
              </div>

              {outrosItensCorrigidos.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para incluir correções, melhorias ou manutenções</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outrosItensCorrigidos?.filter(item => item && item.id).map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Item {index + 1}: {item.nome || 'Sem nome'}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOutroItem(item)}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            ✏️
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOutroItem(item.id)}
                            className="h-6 w-6 p-0 text-xs text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      {item.nome && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div><strong>Descrição:</strong> {item.descricao || 'Não informada'}</div>
                          <div><strong>Local:</strong> {item.local || 'Não informado'}</div>
                          <div><strong>Tipo:</strong> {item.tipo}</div>
                          <div><strong>Prioridade:</strong> {item.prioridade}</div>
                          <div><strong>Status:</strong> {item.status}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Criar Ronda
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal para editar itens */}
      <OutroItemModal
        isOpen={isOutroItemModalOpen}
        onClose={() => {
          setIsOutroItemModalOpen(false);
          setItemEditando(null);
        }}
        onSave={handleSaveOutroItem}
        item={itemEditando}
        contratoRonda={formData.contrato}
        enderecoRonda={contratoSelecionado?.endereco || ''}
        dataRonda={formData.data}
        horaRonda={formData.hora}
      />
    </div>
  );
}

