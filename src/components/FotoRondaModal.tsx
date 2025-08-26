import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, X, Upload, FileImage, Info } from 'lucide-react';
import { otimizarFoto, calcularTamanhoBase64, formatarTamanho } from '@/lib/utils';

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
  'Civil',
  'Jardinagem',
  'Outros'
];

const CRITICIDADES = ['Baixa', 'Média', 'Alta'];

export function FotoRondaModal({
  fotoRonda,
  isOpen,
  onClose,
  onSave
}: FotoRondaModalProps) {
  const [formData, setFormData] = useState<Partial<FotoRonda> & { criticidade?: 'Baixa' | 'Média' | 'Alta' }>({
    local: '',
    pendencia: '',
    criticidade: 'Média',
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
        criticidade: (fotoRonda as any).criticidade || 'Média',
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
        pendencia: '',
        criticidade: 'Média',
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

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Mostrar loading
        setFormData(prev => ({ ...prev, foto: 'Carregando...' }));
        
        console.log(`📸 Foto selecionada: ${file.name} (${formatarTamanho(file.size)})`);
        
        // Otimizar foto
        const fotoOtimizada = await otimizarFoto(file, 1200, 1200, 0.8);
        
        // Calcular tamanho otimizado
        const tamanhoOriginal = file.size;
        const tamanhoOtimizado = calcularTamanhoBase64(fotoOtimizada);
        const economia = ((tamanhoOriginal - tamanhoOtimizado) / tamanhoOriginal * 100).toFixed(1);
        
        console.log(`✅ Otimização concluída: ${formatarTamanho(tamanhoOriginal)} → ${formatarTamanho(tamanhoOtimizado)} (${economia}% de economia)`);
        
        setFormData(prev => ({
          ...prev,
          foto: fotoOtimizada
        }));
        
        // Mostrar alerta de economia
        if (parseFloat(economia) > 20) {
          alert(`🎉 Foto otimizada com sucesso!\n\nTamanho original: ${formatarTamanho(tamanhoOriginal)}\nTamanho otimizado: ${formatarTamanho(tamanhoOtimizado)}\nEconomia: ${economia}%`);
        }
        
      } catch (error) {
        console.error('❌ Erro ao otimizar foto:', error);
        alert('Erro ao otimizar foto. Usando foto original.');
        
        // Fallback para método original
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({
            ...prev,
            foto: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.foto || !formData.local || !formData.especialidade) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const fotoRondaData: any = {
              id: fotoRonda?.id || crypto.randomUUID(),
      foto: formData.foto,
      local: formData.local,
      pendencia: formData.pendencia as string,
      criticidade: formData.criticidade,
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Foto da Ronda</span>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="hidden"
                      />
                      
                      {formData.foto && formData.foto !== 'Carregando...' ? (
                        <div className="space-y-3">
                          <img 
                            src={formData.foto} 
                            alt="Preview da foto" 
                            className="mx-auto max-w-full h-48 object-cover rounded-lg border shadow-sm"
                          />
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Info className="w-4 h-4" />
                            <span>Foto otimizada automaticamente para economizar espaço</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Trocar Foto
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-sm text-gray-600">
                              {formData.foto === 'Carregando...' ? 'Otimizando foto...' : 'Clique para selecionar uma foto'}
                            </p>
                            {formData.foto === 'Carregando...' && (
                              <p className="text-xs text-blue-600 mt-1">Reduzindo tamanho automaticamente...</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={formData.foto === 'Carregando...'}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Selecionar Foto
                          </Button>
                        </div>
                      )}
                    </div>
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
            <label className="block text-sm font-medium mb-1">Pendência (descreva)</label>
            <Input
              value={formData.pendencia}
              onChange={(e) => handleInputChange('pendencia', e.target.value)}
              placeholder="Ex.: Pintura de parede, troca de lâmpada..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Criticidade</label>
            <Select
              value={formData.criticidade}
              onValueChange={(value) => handleInputChange('criticidade' as any, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a criticidade" />
              </SelectTrigger>
              <SelectContent>
                {CRITICIDADES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
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
