import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OutroItemCorrigido } from '@/types';
import { Camera, X, Upload, MapPin, AlertTriangle, Wrench, Star } from 'lucide-react';
import { otimizarFoto, calcularTamanhoBase64, formatarTamanho } from '@/lib/utils';

interface OutroItemCorrigidoModalProps {
  item?: OutroItemCorrigido | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: OutroItemCorrigido) => void;
  contratoRonda?: string;
  enderecoRonda?: string;
}

export function OutroItemCorrigidoModal({
  item,
  isOpen,
  onClose,
  onSave,
  contratoRonda = '',
  enderecoRonda = ''
}: OutroItemCorrigidoModalProps) {
  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  const [formData, setFormData] = useState<Omit<OutroItemCorrigido, 'id'>>({
    nome: item?.nome || '',
    descricao: item?.descricao || '',
    local: item?.local || '',
    tipo: item?.tipo || 'CORREÇÃO',
    prioridade: item?.prioridade || 'MÉDIA',
    status: item?.status || 'PENDENTE',
    contrato: item?.contrato || contratoRonda,
    endereco: item?.endereco || enderecoRonda,
    data: item?.data || new Date().toISOString().split('T')[0],
    hora: item?.hora || new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    foto: item?.foto || null,
    fotos: item?.fotos || [],
    observacoes: item?.observacoes || '',
    responsavel: item?.responsavel || ''
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(item?.foto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Mostrar loading
        setFotoPreview('Carregando...');

        console.log(`📸 Foto selecionada: ${file.name} (${formatarTamanho(file.size)})`);

        // Otimizar foto
        const fotoOtimizada = await otimizarFoto(file, 1200, 1200, 0.8);

        // Calcular tamanho otimizado
        const tamanhoOriginal = file.size;
        const tamanhoOtimizado = calcularTamanhoBase64(fotoOtimizada);
        const economia = ((tamanhoOriginal - tamanhoOtimizado) / tamanhoOriginal * 100).toFixed(1);

        console.log(`✅ Otimização concluída: ${formatarTamanho(tamanhoOriginal)} → ${formatarTamanho(tamanhoOtimizado)} (${economia}% de economia)`);

        setFotoPreview(fotoOtimizada);
        setFormData(prev => ({ ...prev, foto: fotoOtimizada }));

        // Mostrar alerta de economia
        if (parseFloat(economia) > 20) {
          alert(`🎉 Foto otimizada com sucesso!\n\nTamanho original: ${formatarTamanho(tamanhoOriginal)}\nTamanho otimizado: ${formatarTamanho(tamanhoOtimizado)}\nEconomia: ${economia}%`);
        }

      } catch (error) {
        console.error('❌ Erro ao otimizar foto:', error);
        alert('Erro ao otimizar foto. Usando foto original.');

        // Fallback para método original
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFotoPreview(result);
          setFormData(prev => ({ ...prev, foto: result }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.descricao || !formData.local) {
      alert('Por favor, preencha o nome, descrição e local do item');
      return;
    }

    // Log detalhado antes de salvar
    console.log('🔄 Dados do formulário antes de salvar:', formData);
    console.log('🔄 Ronda selecionada:', contratoRonda);
    console.log('🔄 Endereço da ronda:', enderecoRonda);

    const itemToSave: OutroItemCorrigido = {
      id: item?.id || crypto.randomUUID(),
      ...formData
    };

    console.log('🔄 Item completo para salvar:', itemToSave);

    onSave(itemToSave);
    onClose();

    // Reset form
    setFormData({
      nome: '',
      descricao: '',
      local: '',
      tipo: 'CORREÇÃO',
      prioridade: 'MÉDIA',
      status: 'PENDENTE',
      contrato: contratoRonda,
      endereco: enderecoRonda,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      foto: null,
      fotos: [],
      observacoes: '',
      responsavel: ''
    });
    setFotoPreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            {item ? 'Editar Item Corrigido' : 'Novo Item Corrigido'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Item *</label>
              <Input
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Reparo na iluminação"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local *</label>
              <Input
                value={formData.local}
                onChange={(e) => handleInputChange('local', e.target.value)}
                placeholder="Ex: Área de lazer"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição *</label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva detalhadamente o item corrigido"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <label className="block text-sm font-medium mb-1">Prioridade</label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => handleInputChange('prioridade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contrato</label>
              <Input
                value={formData.contrato}
                onChange={(e) => handleInputChange('contrato', e.target.value)}
                placeholder="Número do contrato"
              />
              {contratoRonda && (
                <p className="text-xs text-gray-500 mt-1">
                  Contrato da ronda: {contratoRonda}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsável</label>
              <Input
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Local *</label>
            <div className="space-y-2">
              <Input
                value={formData.local}
                onChange={(e) => handleInputChange('local', e.target.value)}
                placeholder="Ex: Área de lazer"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords;
                            console.log('📍 Coordenadas capturadas:', { latitude, longitude });

                            // Tentar obter endereço via coordenadas
                            try {
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                              );
                              const data = await response.json();
                              const endereco = data.display_name || `${latitude}, ${longitude}`;

                              setFormData(prev => ({ ...prev, local: endereco }));
                              console.log('📍 Endereço obtido:', endereco);
                            } catch (error) {
                              console.error('❌ Erro ao obter endereço:', error);
                              const coordenadas = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                              setFormData(prev => ({ ...prev, local: coordenadas }));
                            }
                          },
                          (error) => {
                            console.error('❌ Erro de geolocalização:', error);
                            alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                        );
                      } else {
                        alert('Geolocalização não é suportada neste navegador.');
                      }
                    } catch (error) {
                      console.error('❌ Erro ao capturar localização:', error);
                      alert('Erro ao capturar localização.');
                    }
                  }}
                  className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  📍 Capturar Localização
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, local: enderecoRonda }))}
                  className="flex-1"
                >
                  🔄 Usar da Ronda
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use "Capturar Localização" para obter endereço automático via GPS
            </p>
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
            <label className="block text-sm font-medium mb-1">Foto</label>
            <div className="space-y-3">
              {/* Botão para tirar foto */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment'; // Usar câmera traseira
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFotoChange({ target: { files: [file] } } as any);
                  };
                  input.click();
                }}
                className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Camera className="w-4 h-4 mr-2" />
                📸 Tirar Foto Agora
              </Button>

              {/* Botão para selecionar arquivo */}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                📁 Selecionar Arquivo
              </Button>
            </div>

            {/* Input para arquivo (oculto) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
            />

            {/* Preview da foto */}
            {fotoPreview && (
              <div className="mt-3">
                <p className="text-xs text-green-600 mb-2">
                  ✓ Foto capturada/selecionada
                </p>
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFotoPreview(null);
                    setFormData(prev => ({ ...prev, foto: null }));
                  }}
                  className="w-full mt-2 text-red-600 hover:text-red-700"
                >
                  🗑️ Remover Foto
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o item"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {item ? 'Atualizar' : 'Salvar'} Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
