import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaTecnica } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS, STATUS_OPTIONS } from '@/data/areasTecnicas';
import { Camera, X, Upload, Wrench } from 'lucide-react';

interface AreaTecnicaModalProps {
  areaTecnica?: AreaTecnica | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (areaTecnica: AreaTecnica) => void;
  contratoRonda?: string;
  enderecoRonda?: string;
  dataRonda?: string;
  horaRonda?: string;
}

export function AreaTecnicaModal({
  areaTecnica,
  isOpen,
  onClose,
  onSave,
  contratoRonda = '',
  enderecoRonda = '',
  dataRonda = '',
  horaRonda = ''
}: AreaTecnicaModalProps) {
  console.log('AreaTecnicaModal renderizado:', { isOpen, areaTecnica });
  console.log('Props recebidos:', { isOpen, areaTecnica, contratoRonda, enderecoRonda, dataRonda, horaRonda });
  
  const [formData, setFormData] = useState<Partial<AreaTecnica>>({
    nome: areaTecnica?.nome || '',
    status: areaTecnica?.status || 'ATIVO',
    contrato: contratoRonda,
    endereco: enderecoRonda,
    data: dataRonda,
    hora: horaRonda,
    foto: areaTecnica?.foto || null,
    observacoes: areaTecnica?.observacoes || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar formData quando os props mudarem
  useEffect(() => {
    console.log('🔄 useEffect: props mudaram, atualizando formData');
    console.log('🔄 Props atuais:', { contratoRonda, enderecoRonda, dataRonda, horaRonda });
    console.log('🔄 formData antes da atualização:', formData);
    
    setFormData(prev => {
      const novo = {
        ...prev,
        contrato: contratoRonda,
        endereco: enderecoRonda,
        data: dataRonda,
        hora: horaRonda
      };
      console.log('🔄 formData após atualização:', novo);
      return novo;
    });
  }, [contratoRonda, enderecoRonda, dataRonda, horaRonda]);

  // Atualizar formData quando editar uma área técnica existente
  useEffect(() => {
    if (areaTecnica) {
      console.log('🔄 useEffect: areaTecnica mudou, atualizando formData:', areaTecnica);
      console.log('🔄 formData antes da atualização:', formData);
      setFormData({
        nome: areaTecnica.nome,
        status: areaTecnica.status,
        contrato: areaTecnica.contrato,
        endereco: areaTecnica.endereco,
        data: areaTecnica.data,
        hora: areaTecnica.hora,
        foto: areaTecnica.foto,
        observacoes: areaTecnica.observacoes || ''
      });
      console.log('🔄 formData após atualização:', {
        nome: areaTecnica.nome,
        status: areaTecnica.status,
        contrato: areaTecnica.contrato,
        endereco: areaTecnica.endereco,
        data: areaTecnica.data,
        hora: areaTecnica.hora,
        foto: areaTecnica.foto,
        observacoes: areaTecnica.observacoes || ''
      });
    }
  }, [areaTecnica]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    console.log('🔥 handleInputChange chamado:', { field, value, formDataAtual: formData });
    console.log('🔥 Stack trace:', new Error().stack);
    
    setFormData(prev => {
      const novo = { ...prev, [field]: value };
      console.log('🔥 Novo formData:', novo);
      console.log('🔥 Campo alterado:', field, 'de', prev[field], 'para', value);
      return novo;
    });
    
    // Verificar se o estado foi atualizado
    setTimeout(() => {
      console.log('🔥 formData após setState:', formData);
    }, 0);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          foto: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit chamado, formData:', formData);

    if (!formData.nome) {
      alert('Por favor, selecione a área técnica');
      return;
    }

    const areaTecnicaData: AreaTecnica = {
      id: areaTecnica?.id || Date.now().toString(),
      nome: formData.nome,
      status: formData.status as 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO',
      contrato: contratoRonda,
      endereco: enderecoRonda,
      data: dataRonda,
      hora: horaRonda,
      foto: formData.foto || null,
      observacoes: formData.observacoes
    };

    console.log('Salvando área técnica:', areaTecnicaData);
    onSave(areaTecnicaData);
    console.log('onSave chamado, fechando modal...');
    onClose();
  };

  if (!isOpen) {
    console.log('Modal não está aberto, não renderizando');
    return null;
  }

  console.log('Modal está aberto, renderizando...');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border-4 border-red-500">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Editar Área Técnica
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Área Técnica *</label>
            <Select
              value={formData.nome}
              onValueChange={(value) => handleInputChange('nome', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área técnica" />
              </SelectTrigger>
              <SelectContent>
                {AREAS_TECNICAS_PREDEFINIDAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <Select
              value={formData.status}
              onValueChange={(value) => {
                console.log('🎯 Status selecionado:', value);
                console.log('🎯 formData atual:', formData);
                console.log('🎯 Stack trace:', new Error().stack);
                handleInputChange('status', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'ATIVO' ? 'Ativo' : 
                     status === 'EM MANUTENÇÃO' ? 'Em Manutenção' : 
                     status === 'ATENÇÃO' ? 'Atenção' : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Select alternativo para debug */}
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">DEBUG - Select Simples:</label>
              <select 
                value={formData.status} 
                onChange={(e) => {
                  console.log('🎯 Select simples alterado:', e.target.value);
                  handleInputChange('status', e.target.value);
                }}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="ATIVO">Ativo</option>
                <option value="EM MANUTENÇÃO">Em Manutenção</option>
                <option value="ATENÇÃO">Atenção</option>
              </select>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              Status atual: {formData.status}
            </p>
            <p className="text-xs text-red-500 mt-1">
              DEBUG: formData.status = "{formData.status}"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contrato</label>
            <Input
              value={contratoRonda}
              readOnly
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Preenchido automaticamente da ronda
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <Input
              value={enderecoRonda}
              readOnly
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Preenchido automaticamente da ronda
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <Input
                type="date"
                value={dataRonda}
                readOnly
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Data da ronda
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora</label>
              <Input
                type="time"
                value={horaRonda}
                readOnly
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hora da ronda
              </p>
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
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
            />
            {formData.foto && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Foto selecionada
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <Input
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações sobre a área técnica (opcional)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
