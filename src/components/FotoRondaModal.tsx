import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, X, Upload, FileImage, Info } from 'lucide-react';
import { otimizarFoto, calcularTamanhoBase64, formatarTamanho } from '@/lib/utils';
import { PhotoUpload } from '@/components/PhotoUpload';

interface FotoRonda {
  id: string;
  foto: string;
  fotos?: string[];
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
    foto: '',
    fotos: []
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
        foto: fotoRonda.foto,
        fotos: fotoRonda.fotos || (fotoRonda.foto ? [fotoRonda.foto] : [])
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
        foto: '',
        fotos: []
      });
    }
  }, [fotoRonda]);

  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

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

      // Resetar o input para permitir selecionar a mesma foto novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se tem pelo menos uma foto
    const temFotos = (formData.fotos && formData.fotos.length > 0) || formData.foto;

    if (!temFotos || !formData.local || !formData.pendencia) {
      alert('Por favor, preencha todos os campos obrigatórios (Foto, Local e Pendência)');
      return;
    }

    const fotoRondaData: any = {
      id: fotoRonda?.id || crypto.randomUUID(),
      foto: formData.foto || (formData.fotos && formData.fotos[0]) || '', // Retrocompatibilidade
      fotos: formData.fotos || [], // Array de fotos
      local: formData.local,
      pendencia: formData.pendencia as string,
      criticidade: formData.criticidade || 'Média', // Valor padrão
      especialidade: formData.especialidade || 'Outros', // Valor padrão
      responsavel: formData.responsavel as 'CONSTRUTORA' | 'CONDOMÍNIO',
      observacoes: formData.observacoes,
      data: formData.data || new Date().toISOString().split('T')[0], // Valor padrão
      hora: formData.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) // Valor padrão
    };

    onSave(fotoRondaData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-modal p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            {fotoRonda ? 'Editar Item de Chamado' : 'Novo Item de Chamado'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload de Fotos */}
          <div className="space-y-4 glass p-4">
            <PhotoUpload
              photos={formData.fotos || []}
              onPhotosChange={(novasFotos) => {
                setFormData(prev => ({
                  ...prev,
                  fotos: novasFotos,
                  foto: novasFotos[0] || '' // Manter retrocompatibilidade
                }));
              }}
              maxPhotos={40}
              label="📸 Fotos da Ronda"
              showCounter={true}
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Local *</label>
            <Input
              value={formData.local}
              onChange={(e) => handleInputChange('local', e.target.value)}
              placeholder="Local onde a foto foi tirada"
              required
              className="glass-input"
            />
          </div>

          {/* Pendência */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Pendência *</label>
            <Input
              value={formData.pendencia}
              onChange={(e) => handleInputChange('pendencia', e.target.value)}
              placeholder="Ex.: Pintura de parede, troca de lâmpada..."
              required
              className="glass-input"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Observações</label>
            <Input
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais (opcional)"
              className="glass-input"
            />
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Responsável *</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => handleInputChange('responsavel', 'CONDOMÍNIO')}
                className={`h-12 ${
                  formData.responsavel === 'CONDOMÍNIO'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-400'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                }`}
              >
                🏢 CONDOMÍNIO
              </Button>
              <Button
                type="button"
                onClick={() => handleInputChange('responsavel', 'CONSTRUTORA')}
                className={`h-12 ${
                  formData.responsavel === 'CONSTRUTORA'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-400'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                }`}
              >
                🏗️ CONSTRUTORA
              </Button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {fotoRonda ? 'Salvar Alterações' : 'Registrar Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
