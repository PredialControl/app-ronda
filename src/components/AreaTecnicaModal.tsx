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
              id: areaTecnica?.id || crypto.randomUUID(),
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Editar Área Técnica
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
            <label className="block text-sm font-medium mb-1">Área Técnica *</label>
            <select
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione a área técnica</option>
              {AREAS_TECNICAS_PREDEFINIDAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="ATIVO">Ativo</option>
              <option value="EM MANUTENÇÃO">Em Manutenção</option>
              <option value="ATENÇÃO">Atenção</option>
            </select>
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
            <div className="space-y-2">
              <Input
                value={formData.endereco || enderecoRonda}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Digite o endereço ou capture automaticamente"
                className="bg-white"
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
                              
                              setFormData(prev => ({ ...prev, endereco }));
                              console.log('📍 Endereço obtido:', endereco);
                            } catch (error) {
                              console.error('❌ Erro ao obter endereço:', error);
                              const coordenadas = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                              setFormData(prev => ({ ...prev, endereco: coordenadas }));
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
                  onClick={() => setFormData(prev => ({ ...prev, endereco: enderecoRonda }))}
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
            {formData.foto && (
              <div className="mt-3">
                <p className="text-xs text-green-600 mb-2">
                  ✓ Foto capturada/selecionada
                </p>
                <img
                  src={formData.foto}
                  alt="Preview da foto"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, foto: null }))}
                  className="w-full mt-2 text-red-600 hover:text-red-700"
                >
                  🗑️ Remover Foto
                </Button>
              </div>
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
    </div>
  );
}
