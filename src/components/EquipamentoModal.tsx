import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Equipamento } from '@/types';
import { Camera, X, Upload } from 'lucide-react';

interface EquipamentoModalProps {
  equipamento?: any | null; // Temporariamente comentado
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipamento: any) => void;
  contratoRonda?: string;
}

export function EquipamentoModal({ 
  equipamento, 
  isOpen, 
  onClose, 
  onSave,
  contratoRonda = ''
}: EquipamentoModalProps) {
  const [formData, setFormData] = useState<Partial<any>>({
    nome: equipamento?.nome || '',
    status: equipamento?.status || 'ATIVO',
    contrato: equipamento?.contrato || contratoRonda,
    endereco: equipamento?.endereco || '',
    data: equipamento?.data || new Date().toISOString().split('T')[0],
    hora: equipamento?.hora || new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    foto: equipamento?.foto || null,
    observacoes: equipamento?.observacoes || ''
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(equipamento?.foto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
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
    
    if (!formData.nome || !formData.contrato || !formData.endereco) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const equipamentoData: any = {
      id: equipamento?.id || Date.now().toString(),
      nome: formData.nome!,
      status: formData.status as 'ATIVO' | 'EM MANUTENÇÃO',
      contrato: formData.contrato!,
      endereco: formData.endereco!,
      data: formData.data!,
      hora: formData.hora!,
      foto: formData.foto,
      observacoes: formData.observacoes
    };

    onSave(equipamentoData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {equipamento ? 'Editar Equipamento' : 'Novo Equipamento'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Equipamento *</label>
            <Input
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Gerador"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">ATIVO</SelectItem>
                <SelectItem value="EM MANUTENÇÃO">EM MANUTENÇÃO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contrato *</label>
            <Input
              value={formData.contrato}
              onChange={(e) => handleInputChange('contrato', e.target.value)}
              placeholder="Número do contrato"
              required
            />
            {contratoRonda && (
              <p className="text-xs text-gray-500 mt-1">
                Contrato da ronda: {contratoRonda}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Endereço *</label>
            <Input
              value={formData.endereco}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
              placeholder="Endereço completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data *</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora *</label>
              <Input
                type="time"
                value={formData.hora}
                onChange={(e) => handleInputChange('hora', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Foto</label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Foto
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>
            {fotoPreview && (
              <div className="mt-2">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <Input
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {equipamento ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
