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
    tipo: item?.tipo || 'CIVIL',
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
        tipo: 'CIVIL',
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
      const updatedPhotos = [...multiplePhotos, ...newPhotos];
      setMultiplePhotos(updatedPhotos);
      setFormData(prev => ({
        ...prev,
        foto: updatedPhotos[0], // Primeira foto como foto principal
        fotos: updatedPhotos
      }));
      console.log(`📸 ${newPhotos.length} fotos adicionadas. Total: ${updatedPhotos.length}`);
    }

    // Resetar o input para permitir selecionar a mesma foto novamente ou disparar o evento corretamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = multiplePhotos.filter((_, i) => i !== index);
    setMultiplePhotos(updatedPhotos);
    setFormData(prev => ({
      ...prev,
      foto: updatedPhotos[0] || null, // Primeira foto restante ou null se não houver mais fotos
      fotos: updatedPhotos
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios: Local, Pendência (Descrição) e Fotos
    if (!formData.local || !formData.descricao) {
      alert('Por favor, preencha Local e Pendência');
      return;
    }

    if (multiplePhotos.length === 0) {
      alert('Por favor, adicione pelo menos uma foto');
      return;
    }

    const itemData: OutroItemCorrigido = {
      id: item?.id || crypto.randomUUID(),
      nome: formData.nome || `Item - ${formData.local}`, // Valor padrão baseado no local
      descricao: formData.descricao || '',
      local: formData.local || '',
      tipo: formData.tipo || 'CORREÇÃO', // Valor padrão
      prioridade: formData.prioridade || 'MÉDIA', // Valor padrão
      status: formData.status || 'PENDENTE', // Valor padrão
      contrato: formData.contrato || '',
      endereco: formData.endereco || '',
      data: formData.data || '',
      hora: formData.hora || '',
      foto: multiplePhotos[0] || null,
      fotos: multiplePhotos,
      categoria: item?.categoria || 'CHAMADO',
      observacoes: formData.observacoes || '',
      responsavel: formData.responsavel || ''
    };

    onSave(itemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-2 border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {item ? 'Editar Item' : 'Novo Item'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Local *
            </label>
            <Input
              value={formData.local || ''}
              onChange={(e) => handleInputChange('local', e.target.value)}
              placeholder="Local do item"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Pendência (Descrição) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pendência *
            </label>
            <textarea
              value={formData.descricao || ''}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva a pendência ou problema identificado"
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white placeholder:text-gray-500"
              rows={3}
              required
            />
          </div>

          {/* Grid com Especialidade e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Especialidade */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Especialidade *
              </label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange('tipo', value)}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="CIVIL" className="text-white hover:bg-gray-800">Civil</SelectItem>
                  <SelectItem value="ELÉTRICA" className="text-white hover:bg-gray-800">Elétrica</SelectItem>
                  <SelectItem value="HIDRÁULICA" className="text-white hover:bg-gray-800">Hidráulica</SelectItem>
                  <SelectItem value="MECÂNICA" className="text-white hover:bg-gray-800">Mecânica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prioridade *
              </label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => handleInputChange('prioridade', value)}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="ALTA" className="text-white hover:bg-gray-800">Alta</SelectItem>
                  <SelectItem value="MÉDIA" className="text-white hover:bg-gray-800">Média</SelectItem>
                  <SelectItem value="BAIXA" className="text-white hover:bg-gray-800">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais (opcional)"
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Responsável
            </label>
            <Input
              value={formData.responsavel || ''}
              onChange={(e) => handleInputChange('responsavel', e.target.value)}
              placeholder="Nome do responsável (opcional)"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Seção de Fotos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fotos ({multiplePhotos.length}) *
            </label>

            <div className="space-y-4">
              {/* Botão para adicionar fotos */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
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
                <span className="text-sm text-gray-400">
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
                        className="w-full h-24 object-cover rounded-lg border border-gray-700"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {item ? 'Atualizar' : 'Registrar Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
