import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OutroItemCorrigido } from '@/types';
import { otimizarFoto } from '@/lib/utils';
import { Camera, X, Upload } from 'lucide-react';

interface OutroItemModalProps {
  item?: OutroItemCorrigido | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: OutroItemCorrigido) => void;
  contratoRonda?: string;
  enderecoRonda?: string;
  dataRonda?: string;
  horaRonda?: string;
}

export function OutroItemModal({
  item,
  isOpen,
  onClose,
  onSave,
  contratoRonda = '',
  enderecoRonda = '',
  dataRonda = '',
  horaRonda = ''
}: OutroItemModalProps) {
  
  const [formData, setFormData] = useState<Partial<OutroItemCorrigido>>({
    nome: item?.nome || '',
    descricao: item?.descricao || '',
    local: item?.local || '',
    tipo: item?.tipo || 'CORREÇÃO',
    prioridade: item?.prioridade || 'MÉDIA',
    status: item?.status || 'PENDENTE',
    contrato: contratoRonda,
    endereco: enderecoRonda,
    data: dataRonda,
    hora: horaRonda,
    foto: item?.foto || null,
    fotos: item?.fotos || [],
    observacoes: item?.observacoes || '',
    responsavel: item?.responsavel || ''
  });

  const [multiplePhotos, setMultiplePhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar formData quando os props mudarem
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      contrato: contratoRonda,
      endereco: enderecoRonda,
      data: dataRonda,
      hora: horaRonda
    }));
  }, [contratoRonda, enderecoRonda, dataRonda, horaRonda]);

  // Atualizar formData quando editar um item existente
  useEffect(() => {
    if (item) {
      setFormData({
        nome: item.nome,
        descricao: item.descricao,
        local: item.local,
        tipo: item.tipo,
        prioridade: item.prioridade,
        status: item.status,
        contrato: item.contrato,
        endereco: item.endereco,
        data: item.data,
        hora: item.hora,
        foto: item.foto,
        fotos: item.fotos || [],
        observacoes: item.observacoes || '',
        responsavel: item.responsavel || ''
      });
      setMultiplePhotos(item.fotos || []);
    } else {
      setFormData({
        nome: '',
        descricao: '',
        local: '',
        tipo: 'CORREÇÃO',
        prioridade: 'MÉDIA',
        status: 'PENDENTE',
        contrato: contratoRonda,
        endereco: enderecoRonda,
        data: dataRonda,
        hora: horaRonda,
        foto: null,
        fotos: [],
        observacoes: '',
        responsavel: ''
      });
      setMultiplePhotos([]);
    }
  }, [item]);

  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Limitar número de fotos para evitar erro 500
    const MAX_PHOTOS = 5;
    const currentCount = multiplePhotos.length;
    const availableSlots = MAX_PHOTOS - currentCount;
    
    if (availableSlots <= 0) {
      alert(`Limite máximo de ${MAX_PHOTOS} fotos por item. Remova algumas fotos antes de adicionar novas.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    
    if (filesToProcess.length < files.length) {
      alert(`Apenas ${filesToProcess.length} fotos serão adicionadas (limite: ${MAX_PHOTOS}).`);
    }

    const newPhotos: string[] = [];
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (file && file.type.startsWith('image/')) {
        try {
          console.log(`📸 Processando foto ${i + 1}/${filesToProcess.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          // Usar compressão mais agressiva para múltiplas fotos
          const fotoComprimida = await otimizarFoto(file, 800, 800, 0.5); // Qualidade muito menor para evitar erro 500
          newPhotos.push(fotoComprimida);
          
          console.log(`✅ Foto ${i + 1} comprimida com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao processar foto ${i + 1}:`, error);
          // Fallback: usar método original se compressão falhar
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newPhotos.push(base64);
        }
      }
    }

    if (newPhotos.length > 0) {
      setMultiplePhotos(prev => [...prev, ...newPhotos]);
      setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), ...newPhotos] }));
      console.log(`📸 ${newPhotos.length} fotos adicionadas. Total: ${multiplePhotos.length + newPhotos.length}`);
    }
  };

  const removePhoto = (index: number) => {
    setMultiplePhotos(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ 
      ...prev, 
      fotos: (prev.fotos || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Se há fotos selecionadas, apenas as fotos são obrigatórias
    if (multiplePhotos.length > 0) {
      // Campos são opcionais quando há fotos
      console.log('📸 Salvando item apenas com fotos, campos são opcionais');
    } else {
      // Se não há fotos, campos básicos são obrigatórios
      if (!formData.nome || !formData.descricao || !formData.local) {
        alert('Por favor, preencha pelo menos nome, descrição e local, ou selecione fotos');
        return;
      }
    }

    const itemData: OutroItemCorrigido = {
      id: item?.id || crypto.randomUUID(),
      nome: formData.nome || (multiplePhotos.length > 0 ? `Item com ${multiplePhotos.length} foto(s)` : ''),
      descricao: formData.descricao || (multiplePhotos.length > 0 ? 'Item registrado com fotos' : ''),
      local: formData.local || (multiplePhotos.length > 0 ? 'Local a definir' : ''),
      tipo: formData.tipo as 'CORREÇÃO' | 'MELHORIA' | 'MANUTENÇÃO' | 'OUTRO',
      prioridade: formData.prioridade as 'BAIXA' | 'MÉDIA' | 'ALTA' | 'URGENTE',
      status: formData.status as 'PENDENTE' | 'EM ANDAMENTO' | 'CONCLUÍDO' | 'CANCELADO',
      contrato: formData.contrato || '',
      endereco: formData.endereco || '',
      data: formData.data || '',
      hora: formData.hora || '',
      foto: multiplePhotos[0] || null, // Primeira foto como foto principal
      fotos: multiplePhotos,
      categoria: item?.categoria || 'CHAMADO', // Preservar categoria existente, ou definir como chamado se novo item
      observacoes: formData.observacoes || '',
      responsavel: formData.responsavel || ''
    };

    onSave(itemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Editar Item' : 'Novo Item'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome {multiplePhotos.length === 0 ? '*' : '(opcional)'}
              </label>
              <Input
                value={formData.nome || ''}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome do item"
                required={multiplePhotos.length === 0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local {multiplePhotos.length === 0 ? '*' : '(opcional)'}
              </label>
              <Input
                value={formData.local || ''}
                onChange={(e) => handleInputChange('local', e.target.value)}
                placeholder="Local do item"
                required={multiplePhotos.length === 0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição {multiplePhotos.length === 0 ? '*' : '(opcional)'}
            </label>
            <textarea
              value={formData.descricao || ''}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição detalhada do item"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required={multiplePhotos.length === 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsável
            </label>
            <Input
              value={formData.responsavel || ''}
              onChange={(e) => handleInputChange('responsavel', e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>

          {/* Seção de Fotos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos ({multiplePhotos.length}) *
            </label>
            
            {multiplePhotos.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  📸 <strong>Fotos selecionadas!</strong> Os campos acima agora são opcionais. 
                  Você pode preenchê-los agora ou editar depois.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Botão para adicionar fotos */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Adicionar Fotos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-500">
                  {multiplePhotos.length}/5 foto(s) selecionada(s)
                </span>
              </div>

              {/* Grid de fotos */}
              {multiplePhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {multiplePhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {item ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
