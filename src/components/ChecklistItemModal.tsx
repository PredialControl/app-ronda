import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChecklistItem } from '@/types';
import {
  X,
  Save,
  MapPin,
  CheckCircle,
  AlertCircle,
  Camera,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface ChecklistItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ChecklistItem | null;
  roteiro: string[]; // Lista de itens do roteiro para selecionar o tipo
  onSave: (item: ChecklistItem) => void;
}

// Mapeamento de roteiro para tipos simplificados
const getTipoFromRoteiro = (roteiroItem: string): string => {
  const lower = roteiroItem.toLowerCase();
  if (lower.includes('extintor')) return 'Extintor';
  if (lower.includes('mangueira')) return 'Mangueira';
  if (lower.includes('hidrante')) return 'Hidrante';
  if (lower.includes('sinalização')) return 'Sinalização';
  if (lower.includes('porta corta-fogo') || lower.includes('corta fogo')) return 'Porta Corta-Fogo';
  if (lower.includes('gerador')) return 'Gerador';
  if (lower.includes('bomba')) return 'Bomba';
  if (lower.includes('quadro')) return 'Quadro Elétrico';
  if (lower.includes('iluminação')) return 'Iluminação';
  if (lower.includes('cftv')) return 'CFTV';
  if (lower.includes('portão') || lower.includes('cancela')) return 'Portão/Cancela';
  if (lower.includes('hall')) return 'Hall';
  if (lower.includes('escada')) return 'Escadaria';
  if (lower.includes('corrimão') || lower.includes('guarda-corpo')) return 'Corrimão/Guarda-corpo';
  if (lower.includes('piso') || lower.includes('revestimento')) return 'Piso/Revestimento';
  if (lower.includes('corredor')) return 'Corredor';
  return roteiroItem.replace('Verificar ', '').replace('verificar ', '');
};

export function ChecklistItemModal({
  isOpen,
  onClose,
  item,
  roteiro,
  onSave
}: ChecklistItemModalProps) {
  const [step, setStep] = useState<'tipo' | 'detalhes'>('tipo');
  const [formData, setFormData] = useState({
    tipo: '',
    objetivo: '',
    local: '',
    status: 'OK' as 'OK' | 'NAO_OK',
    observacao: '',
    fotos: [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form quando abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Editando item existente
        setFormData({
          tipo: item.tipo || '',
          objetivo: item.objetivo || '',
          local: item.local || '',
          status: item.status || 'OK',
          observacao: item.observacao || '',
          fotos: item.fotos || []
        });
        setStep('detalhes');
      } else {
        // Novo item
        setFormData({
          tipo: '',
          objetivo: '',
          local: '',
          status: 'OK',
          observacao: '',
          fotos: []
        });
        setStep('tipo');
      }
    }
  }, [item, isOpen]);

  // Selecionar tipo do roteiro
  const handleSelectTipo = (roteiroItem: string) => {
    const tipo = getTipoFromRoteiro(roteiroItem);
    setFormData(prev => ({
      ...prev,
      tipo,
      objetivo: roteiroItem
    }));
    setStep('detalhes');
  };

  // Adicionar foto
  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          fotos: [...prev.fotos, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remover foto
  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  // Salvar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.local.trim()) {
      alert('Por favor, informe o local');
      return;
    }

    const now = new Date();
    const savedItem: ChecklistItem = {
      id: item?.id || `checklist-${Date.now()}`,
      rondaId: item?.rondaId || '',
      tipo: formData.tipo,
      objetivo: formData.objetivo,
      local: formData.local,
      fotos: formData.fotos,
      status: formData.status,
      observacao: formData.observacao || undefined,
      data: item?.data || now.toISOString().split('T')[0],
      hora: item?.hora || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    onSave(savedItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="glass-modal w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/5 backdrop-blur-lg border-b border-white/10 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              {step === 'tipo' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Selecione o Tipo
                </>
              ) : (
                <>
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
                    {formData.tipo.charAt(0)}
                  </span>
                  {formData.tipo}
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {step === 'tipo' ? (
            // PASSO 1: Selecionar tipo
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-4">O que você está verificando?</p>
              {roteiro.map((roteiroItem, index) => {
                const tipo = getTipoFromRoteiro(roteiroItem);
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectTipo(roteiroItem)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left group"
                  >
                    <div>
                      <div className="font-medium text-white">{tipo}</div>
                      <div className="text-xs text-gray-500">{roteiroItem}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          ) : (
            // PASSO 2: Detalhes
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Local */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Local *
                </Label>
                <Input
                  value={formData.local}
                  onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                  placeholder="Ex: 3º Andar, Hall B, Escada A..."
                  className="glass-input"
                  autoFocus
                />
              </div>

              {/* Fotos */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  Fotos
                </Label>

                {/* Grid de fotos */}
                {formData.fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {formData.fotos.map((foto, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                        <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleAddPhoto}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full glass-button"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {formData.fotos.length > 0 ? 'Adicionar mais fotos' : 'Tirar foto'}
                </Button>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-gray-300">Status</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: 'OK' }))}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.status === 'OK'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    <CheckCircle className="w-8 h-8" />
                    <span className="font-medium">OK</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: 'NAO_OK' }))}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.status === 'NAO_OK'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    <AlertCircle className="w-8 h-8" />
                    <span className="font-medium">NÃO OK</span>
                  </button>
                </div>
              </div>

              {/* Observação (opcional) */}
              <div className="space-y-2">
                <Label className={`flex items-center gap-2 ${
                  formData.status === 'NAO_OK' ? 'text-red-400' : 'text-gray-300'
                }`}>
                  Observação {formData.status === 'NAO_OK' && <span className="text-xs">(descreva o problema)</span>}
                  {formData.status === 'OK' && <span className="text-xs text-gray-500">(opcional)</span>}
                </Label>
                <Textarea
                  value={formData.observacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder={formData.status === 'NAO_OK'
                    ? "Descreva o problema encontrado..."
                    : "Observação adicional (opcional)"}
                  rows={2}
                  className={`glass-input ${formData.status === 'NAO_OK' ? 'border-red-500/50' : ''}`}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => item ? onClose() : setStep('tipo')}
                  className="flex-1 glass-button"
                >
                  {item ? 'Cancelar' : 'Voltar'}
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 ${
                    formData.status === 'OK'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
