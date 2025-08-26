import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contrato } from '@/types';
import { X, FileText, User, MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';

interface ContratoModalProps {
  contrato?: Contrato | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contrato: Contrato) => void;
  onVoltarContratos?: () => void;
}

export function ContratoModal({
  contrato,
  isOpen,
  onClose,
  onSave,
  onVoltarContratos
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
      id: contrato?.id || '', // ID vazio para novos contratos
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {contrato ? 'Editar Contrato' : 'Novo Contrato'}
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
            <select
              value={formData.periodicidade}
              onChange={(e) => handleInputChange('periodicidade', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="DIARIA">Diária</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINZENAL">Quinzenal</option>
              <option value="MENSAL">Mensal</option>
              <option value="BIMESTRAL">Bimestral</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
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
            {onVoltarContratos && (
              <Button type="button" variant="outline" onClick={onVoltarContratos} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Contratos
              </Button>
            )}
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
    </div>
  );
}
