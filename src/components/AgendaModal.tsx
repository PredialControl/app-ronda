import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Repeat, CalendarDays } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { AgendaItem, Contrato } from '@/types';
import { agendaService, contratoService } from '@/lib/supabaseService';

interface AgendaModalProps {
  item?: (AgendaItem & { isInstanceEdit?: boolean; originalId?: string; selectedDate?: Date }) | null;
  onClose: () => void;
  selectedDate?: Date | null;
  contratoSelecionado?: Contrato | null;
}

const DIAS_SEMANA = [
  { value: 'SEGUNDA', label: 'Segunda-feira' },
  { value: 'TERÇA', label: 'Terça-feira' },
  { value: 'QUARTA', label: 'Quarta-feira' },
  { value: 'QUINTA', label: 'Quinta-feira' },
  { value: 'SEXTA', label: 'Sexta-feira' },
  { value: 'SÁBADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
];

export const AgendaModal: React.FC<AgendaModalProps> = ({ item, onClose, selectedDate, contratoSelecionado }) => {
  const [loading, setLoading] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  // Função para obter string de data local (sem fuso horário)
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [formData, setFormData] = useState({
    contratoId: '',
    contratoNome: '',
    endereco: '',
    diaSemana: 'SEGUNDA' as 'SEGUNDA' | 'TERÇA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SÁBADO' | 'DOMINGO',
    horarioInicio: '08:00',
    horarioFim: '09:00',
    observacoes: '',
    ativo: true,
    // Campos de recorrência simplificados
    temRecorrencia: false,
    tipoRecorrencia: 'DIARIO' as 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL',
    intervaloRecorrencia: 1,
    dataInicioRecorrencia: '',
    dataFimRecorrencia: ''
  });

  useEffect(() => {
    loadContratos();

    // Definir data padrão se não houver item
    const defaultDate = selectedDate || new Date();
    const defaultDateString = getLocalDateString(defaultDate); // Usar função local
    // Corrigir mapeamento do dia da semana para corresponder ao calendário
    const defaultDayOfWeek = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'][defaultDate.getDay()];

    console.log('🔍 Debug AgendaModal - Data selecionada:', {
      selectedDate,
      defaultDate,
      defaultDateString,
      dayOfWeek: defaultDate.getDay(),
      defaultDayOfWeek
    });

    // Definir data limite padrão (31 de dezembro do ano vigente)
    const currentYear = new Date().getFullYear();
    const defaultEndDate = getLocalDateString(new Date(currentYear, 11, 31)); // Usar função local

    if (item) {
      setFormData({
        contratoId: item.contratoId,
        contratoNome: item.contratoNome,
        endereco: item.endereco,
        diaSemana: item.diaSemana,
        horarioInicio: item.horario,
        horarioFim: item.horario, // Para compatibilidade
        observacoes: item.observacoes || '',
        ativo: item.ativo,
        temRecorrencia: !!item.recorrencia,
        tipoRecorrencia: item.recorrencia?.tipo || 'DIARIO',
        intervaloRecorrencia: item.recorrencia?.intervalo || 1,
        dataInicioRecorrencia: item.recorrencia?.dataInicio || defaultDateString,
        dataFimRecorrencia: item.recorrencia?.dataFim || ''
      });
    } else {
      // Se há contrato selecionado, usar ele
      if (contratoSelecionado) {
        setFormData(prev => ({
          ...prev,
          contratoId: contratoSelecionado.id,
          contratoNome: contratoSelecionado.nome,
          endereco: contratoSelecionado.endereco,
          diaSemana: defaultDayOfWeek as any,
          dataInicioRecorrencia: defaultDateString,
          dataFimRecorrencia: defaultEndDate
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          diaSemana: defaultDayOfWeek as any,
          dataInicioRecorrencia: defaultDateString,
          dataFimRecorrencia: defaultEndDate
        }));
      }
    }
  }, [item, selectedDate]);

  const loadContratos = async () => {
    try {
      const contratosData = await contratoService.getAll();
      console.log('Contratos carregados no modal:', contratosData);
      setContratos(contratosData);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    }
  };

  const handleContratoChange = (contratoId: string) => {
    console.log('Contrato selecionado ID:', contratoId);
    console.log('Lista de contratos disponíveis:', contratos);
    const contratoSelecionado = contratos.find(c => c.id === contratoId);
    console.log('Contrato encontrado:', contratoSelecionado);
    if (contratoSelecionado) {
      setFormData(prev => ({
        ...prev,
        contratoId: contratoSelecionado.id,
        contratoNome: contratoSelecionado.nome,
        endereco: contratoSelecionado.endereco
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contratoId) {
      alert('Por favor, selecione um contrato');
      return;
    }

    // Validação de recorrência removida - agora é opcional

    setLoading(true);

    try {
      const agendaData = {
        contratoId: formData.contratoId,
        contratoNome: formData.contratoNome,
        endereco: formData.endereco,
        diaSemana: formData.diaSemana || 'SEGUNDA',
        horario: formData.horarioInicio || '08:00', // Usar horário de início ou padrão
        observacoes: formData.observacoes,
        ativo: formData.ativo,
        recorrencia: formData.temRecorrencia ? {
          tipo: formData.tipoRecorrencia,
          intervalo: formData.intervaloRecorrencia,
          dataInicio: formData.dataInicioRecorrencia || getLocalDateString(new Date()),
          dataFim: formData.dataFimRecorrencia || undefined
        } : undefined
      };

      if (item && item.isInstanceEdit) {
        // Se é edição de instância específica, criar um novo item não recorrente
        // O item original recorrente permanece intacto
        const selectedDate = (item as any).selectedDate;
        const instanceData = {
          ...agendaData,
          recorrencia: undefined, // Remove recorrência para instância específica
          // Usar a data selecionada para esta instância
          diaSemana: selectedDate ? DIAS_SEMANA[selectedDate.getDay()].value as any : agendaData.diaSemana,
          // Adicionar identificador único para esta instância
          observacoes: agendaData.observacoes + ` [${selectedDate?.toLocaleDateString('pt-BR')}]`
        };
        console.log('Criando instância específica:', instanceData);
        console.log('Item original:', item);
        console.log('Data selecionada:', selectedDate);
        await agendaService.create(instanceData);
      } else if (item) {
        // Se é edição normal, atualizar o item existente
        console.log('Atualizando item existente:', item.id, agendaData);
        await agendaService.update(item.id, agendaData);
      } else {
        // Se é novo item, criar normalmente
        console.log('Criando novo item:', agendaData);
        await agendaService.create(agendaData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agenda:', error);
      alert('Erro ao salvar item da agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'temRecorrencia' ? value === 'true' :
        field === 'ativo' ? value === 'true' : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {item ? (item.isInstanceEdit ? 'Editar Visita Específica' : 'Editar Agenda') : 'Nova Agenda'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Aviso para edição de instância */}
        {item?.isInstanceEdit && (
          <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <p className="text-sm text-yellow-800">
                <strong>Editando visita específica:</strong> Esta alteração afetará apenas esta data.
                As outras ocorrências da série recorrente permanecerão inalteradas.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contrato */}
          <div className="space-y-2">
            <Label htmlFor="contrato" className="text-sm font-medium text-gray-700">
              Contrato/Prédio
            </Label>
            <Select
              value={formData.contratoId}
              onValueChange={handleContratoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contrato" />
              </SelectTrigger>
              <SelectContent>
                {contratos.length === 0 ? (
                  <SelectItem value="no-contracts" disabled>
                    Nenhum contrato encontrado
                  </SelectItem>
                ) : (
                  contratos.map(contrato => (
                    <SelectItem key={contrato.id} value={contrato.id}>
                      {contrato.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {contratoSelecionado && (
              <p className="text-xs text-green-600">
                ✓ Contrato pré-selecionado: {contratoSelecionado.nome}
              </p>
            )}
          </div>

          {/* Endereço (preenchido automaticamente) */}
          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-sm font-medium text-gray-700">
              Endereço
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="endereco"
                value={formData.endereco}
                className="pl-10 bg-gray-50"
                placeholder="Endereço do prédio"
                readOnly={true} // Sempre somente leitura - preenchido automaticamente
              />
            </div>
          </div>


          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horarioInicio" className="text-sm font-medium text-gray-700">
                Início
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="horarioInicio"
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) => handleInputChange('horarioInicio', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horarioFim" className="text-sm font-medium text-gray-700">
                Término
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="horarioFim"
                  type="time"
                  value={formData.horarioFim}
                  onChange={(e) => handleInputChange('horarioFim', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Ex: Manhã, tarde, horário especial, etc."
              rows={3}
            />
          </div>

          {/* Recorrência */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center space-x-2">
              <Repeat className="h-5 w-5 text-blue-600" />
              <Label htmlFor="temRecorrencia" className="text-sm font-medium text-gray-700">
                Evento Recorrente
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="temRecorrencia"
                checked={formData.temRecorrencia}
                onChange={(e) => handleInputChange('temRecorrencia', e.target.checked.toString())}
                className="rounded border-gray-300"
              />
              <Label htmlFor="temRecorrencia" className="text-sm text-gray-600">
                Repetir este evento
              </Label>
            </div>

            {formData.temRecorrencia && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                {/* Opções de Recorrência Rápidas */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Repetir:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formData.tipoRecorrencia === 'DIARIO' && formData.intervaloRecorrencia === 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tipoRecorrencia: 'DIARIO',
                          intervaloRecorrencia: 1
                        }));
                      }}
                      className="text-xs"
                    >
                      Diário
                    </Button>
                    <Button
                      type="button"
                      variant={formData.tipoRecorrencia === 'DIARIO' && formData.intervaloRecorrencia === 7 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tipoRecorrencia: 'DIARIO',
                          intervaloRecorrencia: 7
                        }));
                      }}
                      className="text-xs"
                    >
                      A cada 7 dias
                    </Button>
                    <Button
                      type="button"
                      variant={formData.tipoRecorrencia === 'DIARIO' && formData.intervaloRecorrencia === 14 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tipoRecorrencia: 'DIARIO',
                          intervaloRecorrencia: 14
                        }));
                      }}
                      className="text-xs"
                    >
                      A cada 14 dias
                    </Button>
                    <Button
                      type="button"
                      variant={formData.tipoRecorrencia === 'DIARIO' && formData.intervaloRecorrencia === 30 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tipoRecorrencia: 'DIARIO',
                          intervaloRecorrencia: 30
                        }));
                      }}
                      className="text-xs"
                    >
                      A cada 30 dias
                    </Button>
                  </div>

                  {/* Campo personalizado para dias */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Ou personalizado:
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">A cada</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.intervaloRecorrencia}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tipoRecorrencia: 'DIARIO',
                            intervaloRecorrencia: parseInt(e.target.value) || 1
                          }));
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-600">dias</span>
                    </div>
                  </div>
                </div>

                {/* Data de Início */}
                <div className="space-y-2">
                  <Label htmlFor="dataInicioRecorrencia" className="text-sm font-medium text-gray-700">
                    Data de Início
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="dataInicioRecorrencia"
                      type="date"
                      value={formData.dataInicioRecorrencia}
                      onChange={(e) => handleInputChange('dataInicioRecorrencia', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Data de Fim (opcional) */}
                <div className="space-y-2">
                  <Label htmlFor="dataFimRecorrencia" className="text-sm font-medium text-gray-700">
                    Data de Fim (opcional)
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="dataFimRecorrencia"
                      type="date"
                      value={formData.dataFimRecorrencia}
                      onChange={(e) => handleInputChange('dataFimRecorrencia', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Deixe em branco para repetir indefinidamente
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Status
            </Label>
            <Select
              value={formData.ativo ? 'true' : 'false'}
              onValueChange={(value) => handleInputChange('ativo', value)}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-6 border-t">
            {/* Botão de excluir (apenas para itens existentes) */}
            {item && !item.isInstanceEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (confirm(`Deseja excluir "${item.contratoNome}"?`)) {
                    try {
                      setLoading(true);
                      await agendaService.delete(item.id);
                      onClose();
                    } catch (error) {
                      console.error('Erro ao excluir item:', error);
                      alert('Erro ao excluir item da agenda');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={loading}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Excluir
              </Button>
            )}

            <div className="flex space-x-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  item ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

