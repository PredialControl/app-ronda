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
  onSaveMultiple?: (areas: AreaTecnica[]) => void; // Nova prop para salvar múltiplas áreas
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
  onSaveMultiple,
  contratoRonda = '',
  enderecoRonda = '',
  dataRonda = '',
  horaRonda = ''
}: AreaTecnicaModalProps) {

  const [formData, setFormData] = useState<Partial<AreaTecnica>>({
    nome: areaTecnica?.nome || '',
    status: areaTecnica?.status || 'ATIVO',
    testeStatus: areaTecnica?.testeStatus || 'TESTADO',
    contrato: contratoRonda,
    endereco: enderecoRonda,
    data: dataRonda,
    hora: horaRonda,
    foto: areaTecnica?.foto || null,
    observacoes: areaTecnica?.observacoes || ''
  });

  const [multiplePhotos, setMultiplePhotos] = useState<string[]>([]);
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
        testeStatus: areaTecnica.testeStatus || 'TESTADO',
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

  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

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

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Se estiver editando uma área existente, aceitar apenas 1 foto
    if (areaTecnica) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          foto: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
      return;
    }

    // Se estiver criando nova área, aceitar múltiplas fotos
    const fotosPromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const fotos = await Promise.all(fotosPromises);
    setMultiplePhotos(fotos);
    console.log(`📸 ${fotos.length} fotos selecionadas`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleSubmit chamado!');
    console.log('⚠️⚠️⚠️ TESTE STATUS NO SUBMIT:', formData.testeStatus);
    console.log('🔍 formData:', formData);
    console.log('🔍 multiplePhotos.length:', multiplePhotos.length);
    console.log('🔍 areaTecnica:', areaTecnica);
    console.log('🔍 onSaveMultiple existe?', !!onSaveMultiple);

    // Se tiver múltiplas fotos (criando novas áreas)
    if (multiplePhotos.length > 0 && !areaTecnica && onSaveMultiple) {
      console.log('✅ Entrando no modo de múltiplas fotos!');
      // Validar se selecionou o nome da área
      if (!formData.nome) {
        alert('Por favor, selecione a área técnica antes de salvar as fotos');
        return;
      }

      const areas: AreaTecnica[] = multiplePhotos.map((foto, index) => ({
        id: crypto.randomUUID(),
        nome: formData.nome || `Área ${index + 1}`, // Usa o nome selecionado para TODAS
        status: formData.status as 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO',
        testeStatus: formData.testeStatus as 'TESTADO' | 'NAO_TESTADO' | undefined,
        contrato: contratoRonda,
        endereco: enderecoRonda,
        data: dataRonda,
        hora: horaRonda,
        foto: foto,
        observacoes: formData.observacoes || ''
      }));

      console.log(`Salvando ${areas.length} áreas técnicas com fotos (todas com nome: ${formData.nome})`);
      onSaveMultiple(areas);
      onClose();
      return;
    }

    // Modo normal: uma área por vez
    if (!formData.nome && !areaTecnica) {
      alert('Por favor, selecione a área técnica');
      return;
    }

    const areaTecnicaData: AreaTecnica = {
      id: areaTecnica?.id || crypto.randomUUID(),
      nome: formData.nome || 'Área',
      status: formData.status as 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO',
      testeStatus: formData.testeStatus as 'TESTADO' | 'NAO_TESTADO' | undefined,
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              {areaTecnica ? 'Editar Área Técnica' : 'Adicionar Áreas com Fotos'}
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
            {!areaTecnica && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Selecione a área técnica primeiro, depois escolha várias fotos.
                  Todas as fotos terão o mesmo nome de área que você escolher aqui!
                </p>
              </div>
            )}

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
              <label className="block text-sm font-medium mb-1">Status do Teste *</label>
              <select
                value={formData.testeStatus || 'TESTADO'}
                onChange={(e) => {
                  alert(`STATUS DE TESTE MUDOU PARA: ${e.target.value}`);
                  console.log('⚠️⚠️⚠️ STATUS DE TESTE MUDOU PARA:', e.target.value);
                  handleInputChange('testeStatus', e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="TESTADO">✅ Feito teste de funcionamento do ativo</option>
                <option value="NAO_TESTADO">❌ Não foi possível realizar o teste do ativo</option>
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
                  {areaTecnica ? '📁 Selecionar Arquivo' : '📁 Selecionar Várias Fotos'}
                </Button>
              </div>

              {/* Input para arquivo (oculto) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={!areaTecnica} // Permitir múltiplas fotos apenas ao criar nova área
                onChange={handleFotoChange}
                className="hidden"
              />

              {/* Preview das fotos múltiplas */}
              {multiplePhotos.length > 0 && !areaTecnica && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-600 mb-2">
                    ✓ {multiplePhotos.length} foto(s) selecionada(s)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {multiplePhotos.map((foto, index) => (
                      <div key={index} className="relative">
                        <img
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMultiplePhotos([])}
                    className="w-full mt-2 text-red-600 hover:text-red-700"
                  >
                    🗑️ Remover Todas as Fotos
                  </Button>
                </div>
              )}

              {/* Preview da foto única (modo edição) */}
              {formData.foto && areaTecnica && (
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
