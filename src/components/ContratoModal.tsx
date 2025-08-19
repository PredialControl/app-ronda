import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contrato } from '@/types';
import { X, FileText, User, MapPin, Calendar, Clock } from 'lucide-react';

interface ContratoModalProps {
  contrato?: Contrato | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contrato: Contrato) => void;
}

export function ContratoModal({
  contrato,
  isOpen,
  onClose,
  onSave
}: ContratoModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    sindico: '',
    endereco: '',
    periodicidade: 'MENSAL' as Contrato['periodicidade'],
    observacoes: ''
  });

  useEffect(() => {
    if (contrato) {
      setFormData({
        nome: contrato.nome,
        sindico: contrato.sindico,
        endereco: contrato.endereco,
        periodicidade: contrato.periodicidade,
        observacoes: contrato.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        sindico: '',
        endereco: '',
        periodicidade: 'MENSAL',
        observacoes: ''
      });
    }
  }, [contrato]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.sindico || !formData.endereco) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const contratoData: Contrato = {
      id: contrato?.id || Date.now().toString(),
      nome: formData.nome,
      sindico: formData.sindico,
      endereco: formData.endereco,
      periodicidade: formData.periodicidade,
      observacoes: formData.observacoes,
      dataCriacao: contrato?.dataCriacao || new Date().toISOString()
    };

    console.log('📝 Modal - Dados do contrato a serem salvos:', contratoData);
    console.log('📝 Modal - Contrato original:', contrato);
    console.log('📝 Modal - É edição?', !!contrato);

    onSave(contratoData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {contrato ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Contrato *</label>
            <Input
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: CT001/2024 - Manutenção Preventiva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <User className="w-4 h-4" />
              Síndico *
            </label>
            <Input
              value={formData.sindico}
              onChange={(e) => handleInputChange('sindico', e.target.value)}
              placeholder="Nome do síndico responsável"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Endereço *
            </label>
            <Input
              value={formData.endereco}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
              placeholder="Endereço completo do local"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Periodicidade *
            </label>
            <Select
              value={formData.periodicidade}
              onValueChange={(value) => handleInputChange('periodicidade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a periodicidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIARIA">Diária</SelectItem>
                <SelectItem value="SEMANAL">Semanal</SelectItem>
                <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                <SelectItem value="MENSAL">Mensal</SelectItem>
                <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                <SelectItem value="ANUAL">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <Input
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o contrato"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {contrato ? 'Salvar Alterações' : 'Criar Contrato'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
