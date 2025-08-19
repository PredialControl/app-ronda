import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, X, Upload } from 'lucide-react';

interface FotoRonda {
  id: string;
  foto: string;
  local: string;
  pendencia: string;
  especialidade: string;
  responsavel: 'CONSTRUTORA' | 'CONDOMÍNIO';
  observacoes?: string;
  data: string;
  hora: string;
}

interface FotoRondaModalProps {
  fotoRonda?: FotoRonda | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (fotoRonda: FotoRonda) => void;
}

const ESPECIALIDADES = [
  'Elétrica',
  'Hidráulica',
  'Ar Condicionado',
  'Incêndio',
  'Segurança',
  'Limpeza',
  'Jardinagem',
  'Outros'
];

const PENDENCIAS = [
  'Nenhuma',
  'Pequena',
  'Média',
  'Alta',
  'Crítica'
];

export function FotoRondaModal({
  fotoRonda,
  isOpen,
  onClose,
  onSave
}: FotoRondaModalProps) {
  const [formData, setFormData] = useState<Partial<FotoRonda>>({
    local: '',
    pendencia: 'Nenhuma',
    especialidade: 'Outros',
    responsavel: 'CONDOMÍNIO',
    observacoes: '',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    foto: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar formData quando editar uma foto existente
  useEffect(() => {
    console.log('🔄 FotoRondaModal useEffect:', { fotoRonda, isOpen });
    
    if (fotoRonda) {
      // Editando item existente
      console.log('🔄 Editando item existente:', fotoRonda);
      setFormData({
        local: fotoRonda.local,
        pendencia: fotoRonda.pendencia,
        especialidade: fotoRonda.especialidade,
        responsavel: fotoRonda.responsavel,
        observacoes: fotoRonda.observacoes || '',
        data: fotoRonda.data,
        hora: fotoRonda.hora,
        foto: fotoRonda.foto
      });
    } else {
      // Criando novo item - limpar todos os dados
      console.log('🔄 Criando novo item - limpando dados');
      setFormData({
        local: '',
        pendencia: 'Nenhuma',
        especialidade: 'Outros',
        responsavel: 'CONDOMÍNIO',
        observacoes: '',
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        foto: ''
      });
    }
  }, [fotoRonda]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.foto || !formData.local || !formData.especialidade) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const fotoRondaData: FotoRonda = {
      id: fotoRonda?.id || Date.now().toString(),
      foto: formData.foto,
      local: formData.local,
      pendencia: formData.pendencia as string,
      especialidade: formData.especialidade,
      responsavel: formData.responsavel as 'CONSTRUTORA' | 'CONDOMÍNIO',
      observacoes: formData.observacoes,
      data: formData.data as string,
      hora: formData.hora as string
    };

    onSave(fotoRondaData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {fotoRonda ? 'Editar Item de Chamado' : 'Novo Item de Chamado'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Foto/Evidência *</label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Foto/Evidência
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
              <div className="mt-2">
                <img 
                  src={formData.foto} 
                  alt="Preview" 
                  className="w-full h-24 object-cover rounded border"
                />
                <p className="text-xs text-green-600 mt-1">
                  ✓ Foto selecionada
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Local *</label>
            <Input
              value={formData.local}
              onChange={(e) => handleInputChange('local', e.target.value)}
              placeholder="Local onde a foto foi tirada"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Especialidade *</label>
            <Select
              value={formData.especialidade}
              onValueChange={(value) => handleInputChange('especialidade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((especialidade) => (
                  <SelectItem key={especialidade} value={especialidade}>
                    {especialidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Responsável *</label>
            <Select
              value={formData.responsavel}
              onValueChange={(value) => handleInputChange('responsavel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONSTRUTORA">CONSTRUTORA</SelectItem>
                <SelectItem value="CONDOMÍNIO">CONDOMÍNIO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nível de Pendência</label>
            <Select
              value={formData.pendencia}
              onValueChange={(value) => handleInputChange('pendencia', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de pendência" />
              </SelectTrigger>
              <SelectContent>
                {PENDENCIAS.map((pendencia) => (
                  <SelectItem key={pendencia} value={pendencia}>
                    {pendencia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <label className="block text-sm font-medium mb-1">Observações</label>
            <Input
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações sobre a foto (opcional)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {fotoRonda ? 'Salvar Alterações' : 'Registrar Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
