import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OutroItemCorrigido } from '@/types';
import { Camera, X, Upload, MapPin, AlertTriangle, Wrench, Star } from 'lucide-react';

interface OutroItemCorrigidoModalProps {
  item?: OutroItemCorrigido | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: OutroItemCorrigido) => void;
  contratoRonda?: string;
  enderecoRonda?: string;
}

export function OutroItemCorrigidoModal({ 
  item, 
  isOpen, 
  onClose, 
  onSave,
  contratoRonda = '',
  enderecoRonda = ''
}: OutroItemCorrigidoModalProps) {
  
  const [formData, setFormData] = useState<Omit<OutroItemCorrigido, 'id'>>({
    nome: item?.nome || '',
    descricao: item?.descricao || '',
    local: item?.local || '',
    tipo: item?.tipo || 'CORREÇÃO',
    prioridade: item?.prioridade || 'MÉDIA',
    status: item?.status || 'PENDENTE',
    contrato: item?.contrato || contratoRonda,
    endereco: item?.endereco || enderecoRonda,
    data: item?.data || new Date().toISOString().split('T')[0],
    hora: item?.hora || new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    foto: item?.foto || null,
    observacoes: item?.observacoes || '',
    responsavel: item?.responsavel || ''
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(item?.foto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFotoPreview(result);
        setFormData(prev => ({ ...prev, foto: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.descricao || !formData.local) {
      alert('Por favor, preencha o nome, descrição e local do item');
      return;
    }

    const itemToSave: OutroItemCorrigido = {
      id: item?.id || Date.now().toString(),
      ...formData
    };

    onSave(itemToSave);
    onClose();

    // Reset form
    setFormData({
      nome: '',
      descricao: '',
      local: '',
      tipo: 'CORREÇÃO',
      prioridade: 'MÉDIA',
      status: 'PENDENTE',
      contrato: contratoRonda,
      endereco: enderecoRonda,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      foto: null,
      observacoes: '',
      responsavel: ''
    });
    setFotoPreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            {item ? 'Editar Item Corrigido' : 'Novo Item Corrigido'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Item *</label>
              <Input
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Reparo na iluminação"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local *</label>
              <Input
                value={formData.local}
                onChange={(e) => handleInputChange('local', e.target.value)}
                placeholder="Ex: Área de lazer"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição *</label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva detalhadamente o item corrigido"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORREÇÃO">Correção</SelectItem>
                  <SelectItem value="MELHORIA">Melhoria</SelectItem>
                  <SelectItem value="MANUTENÇÃO">Manutenção</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prioridade</label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => handleInputChange('prioridade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MÉDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUÍDO">Concluído</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contrato</label>
              <Input
                value={formData.contrato}
                onChange={(e) => handleInputChange('contrato', e.target.value)}
                placeholder="Número do contrato"
              />
              {contratoRonda && (
                <p className="text-xs text-gray-500 mt-1">
                  Contrato da ronda: {contratoRonda}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsável</label>
              <Input
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora</label>
              <Input
                type="time"
                value={formData.hora}
                onChange={(e) => handleInputChange('hora', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Foto</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {fotoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
              </Button>
              {fotoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFotoPreview(null);
                    setFormData(prev => ({ ...prev, foto: null }));
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Remover
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
            />
            {fotoPreview && (
              <div className="mt-2">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o item"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {item ? 'Atualizar' : 'Salvar'} Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
