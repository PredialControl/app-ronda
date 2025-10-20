import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Building, Repeat, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AgendaItem, Contrato } from '@/types';
import { agendaService, contratoService } from '@/lib/supabaseService';
import { AgendaModal } from './AgendaModal';
import { RecurrenceGenerator } from '@/lib/recurrenceUtils';

interface CalendarViewProps {
  contrato?: Contrato | null;
  onSelectContrato?: (contrato: Contrato) => void;
}

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const CalendarView: React.FC<CalendarViewProps> = ({ contrato, onSelectContrato }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoFiltro, setContratoFiltro] = useState<string>('todos');
  const [observacoes, setObservacoes] = useState<{[key: string]: string}>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{ id: string; isRecurring: boolean; originalId?: string; dateStringForInstance?: string } | null>(null);

  useEffect(() => {
    loadAgenda();
    loadContratos();
  }, [currentDate]);

  const loadAgenda = async () => {
    try {
      setLoading(true);
      const items = await agendaService.getAll();
      setAgendaItems(items);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo de exclusão com opções
  const openDeleteOptions = (id: string, isRecurring: boolean, originalId?: string, dateStringForInstance?: string) => {
    if (!isRecurring) {
      // Não recorrente: excluir direto
      handleDelete(id, false);
      return;
    }
    setDeleteContext({ id, isRecurring, originalId, dateStringForInstance });
    setDeleteDialogOpen(true);
  };

  const loadContratos = async () => {
    try {
      const contratosData = await contratoService.getAll();
      setContratos(contratosData);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    }
  };

  const handleCreateNew = (date?: Date) => {
    setEditingItem(null);
    setSelectedDate(date || null);
    setShowModal(true);
  };

  const handleEdit = (item: AgendaItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string, isRecurring: boolean = false, originalId?: string, dateStringForInstance?: string, modeParam?: 'single' | 'future' | 'all') => {
    console.log('🗑️ Tentando excluir item com ID:', id);
    console.log('🔄 É evento recorrente:', isRecurring);
    console.log('📋 Total de itens na agenda antes da exclusão:', agendaItems.length);
    
    // Modo vindo do diálogo
    let mode: 'single' | 'future' | 'all' = modeParam || 'single';

    if (window.confirm('Tem certeza que deseja remover?')) {
      try {
        if (!isRecurring || mode === 'all') {
          // Excluir item único ou toda a série
          console.log('🗑️ Excluindo item/série diretamente:', isRecurring ? originalId || id : id);
          await agendaService.delete(isRecurring ? (originalId || id) : id);
        } else if (mode === 'single') {
          // Excluir apenas esta instância: criar uma instância específica inativa
          if (!originalId || !dateStringForInstance) {
            console.warn('Faltando originalId ou dateString para exclusão de instância. Revertendo para delete direto.');
            await agendaService.delete(id);
          } else {
            // Criar override local: um item sem recorrência, ativo=false, com ID único
            const original = agendaItems.find(a => a.id === originalId);
            if (original) {
              await agendaService.create({
                contratoId: original.contratoId,
                contratoNome: original.contratoNome,
                endereco: original.endereco,
                diaSemana: original.diaSemana,
                horario: original.horario,
                observacoes: (original.observacoes ? original.observacoes + ' ' : '') + `[CANCELADO ${dateStringForInstance}]`,
                ativo: false,
                recorrencia: undefined
              });
            } else {
              await agendaService.delete(id);
            }
          }
        } else if (mode === 'future') {
          // Excluir esta e todas as próximas: ajustar dataFim da recorrência para dia anterior
          if (!originalId || !dateStringForInstance) {
            await agendaService.delete(id);
          } else {
            const original = agendaItems.find(a => a.id === originalId);
            if (original && original.recorrencia) {
              // Definir dataFim como dia anterior à instância
              const d = parseLocalDate(dateStringForInstance);
              d.setDate(d.getDate() - 1);
              const stopDate = getLocalDateString(d);
              await agendaService.update(original.id, {
                recorrencia: {
                  ...original.recorrencia,
                  dataFim: stopDate
                }
              });
            } else {
              await agendaService.delete(id);
            }
          }
        }
        
        console.log('✅ Item excluído com sucesso. Recarregando agenda...');
        await loadAgenda();
        console.log('📋 Total de itens na agenda após a exclusão:', agendaItems.length);
      } catch (error) {
        console.error('❌ Erro ao deletar item:', error);
        alert('Erro ao deletar item da agenda');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setSelectedDate(null);
    loadAgenda();
  };

  const handleClearCanceled = async () => {
    if (window.confirm('Deseja limpar todos os itens cancelados da agenda?')) {
      try {
        await agendaService.clearCanceledItems();
        await loadAgenda();
        console.log('✅ Itens cancelados removidos com sucesso');
      } catch (error) {
        console.error('❌ Erro ao limpar itens cancelados:', error);
      }
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAgendaForDate = (date: Date) => {
    const dayOfWeek = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'][date.getDay()];
    const dateString = getLocalDateString(date); // Usar função local em vez de toISOString
    
    // Debug: verificar dias específicos
    if (dateString === '2025-10-14' || dateString === '2025-10-15') {
      console.log('🔍 Debug getAgendaForDate:', {
        date,
        dateString,
        dayOfWeek,
        dayNumber: date.getDay()
      });
    }
    
    // Verificar se a data está dentro do limite (até dezembro do ano vigente)
    const currentYear = new Date().getFullYear();
    const endOfYear = new Date(currentYear, 11, 31); // 31 de dezembro
    if (date > endOfYear) {
      return []; // Não mostrar eventos após dezembro do ano vigente
    }
    
    // Primeiro, buscar instâncias específicas para esta data
    const specificInstances = agendaItems.filter(item => {
      // Verificar se é uma instância específica para esta data
      return item.id.includes(dateString) && !item.recorrencia && item.ativo !== false;
    });

    // Se há instâncias específicas, retornar apenas elas
    if (specificInstances.length > 0) {
      // Debug: verificar instâncias específicas
      if (dateString === '2025-10-14') {
        console.log('🔍 Debug getAgendaForDate 14/10/2025 - Instâncias específicas:', specificInstances);
      }
      
      if (contratoFiltro !== 'todos') {
        return specificInstances.filter(item => item.contratoId === contratoFiltro);
      }
      return specificInstances;
    }

    // Se não há instâncias específicas, buscar eventos regulares
    const regularEvents = agendaItems.filter(item => 
      item.diaSemana === dayOfWeek && !item.recorrencia && item.ativo !== false
    );
    
    // Debug: verificar eventos regulares
    if (dateString === '2025-10-14' || dateString === '2025-10-15') {
      console.log('🔍 Debug eventos regulares:', {
        dayOfWeek,
        regularEvents: regularEvents.map(e => ({
          id: e.id,
          contratoNome: e.contratoNome,
          diaSemana: e.diaSemana
        }))
      });
    }

    // Buscar eventos recorrentes (apenas os que não têm instâncias específicas)
    const recurringEvents = agendaItems.filter(item => {
      if (!item.recorrencia) return false;
      if (item.ativo === false) return false;
      
      // Verificar se já existe uma instância específica para esta data
      const hasSpecificInstance = agendaItems.some(specificItem => 
        specificItem.id.includes(dateString) && 
        specificItem.contratoId === item.contratoId &&
        !specificItem.recorrencia &&
        specificItem.ativo !== false
      );
      
      if (hasSpecificInstance) return false;

      // Verificar se há uma exclusão/cancelamento para esta data (override ativo=false)
      const hasCancellation = agendaItems.some(si => 
        si.ativo === false &&
        !si.recorrencia &&
        si.contratoId === item.contratoId &&
        (si.id.includes(dateString) || (si.observacoes || '').includes(`[CANCELADO ${dateString}]`))
      );

      if (hasCancellation) return false;
      
      return RecurrenceGenerator.isRecurringDate(date, item, item.recorrencia);
    });

    // Combinar eventos regulares e recorrentes
    const allEvents = [...regularEvents, ...recurringEvents];

    // Debug: verificar eventos recorrentes
    if (dateString === '2025-10-14') {
      console.log('🔍 Debug getAgendaForDate 14/10/2025 - Eventos recorrentes:', recurringEvents);
      console.log('🔍 Debug getAgendaForDate 14/10/2025 - Todos os eventos:', allEvents);
    }

    // Aplicar filtro por contrato se selecionado
    if (contratoFiltro !== 'todos') {
      return allEvents.filter(item => item.contratoId === contratoFiltro);
    }

    return allEvents;
  };

  const getAgendaForSpecificDate = (date: Date) => {
    // Para eventos específicos de data (futuro)
    return agendaItems.filter(item => {
      // Se o item tem uma data específica, comparar
      if (item.dataCriacao) {
        const itemDate = new Date(item.dataCriacao);
        return itemDate.toDateString() === date.toDateString();
      }
      return false;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para criar data local sem problemas de fuso horário
  const createLocalDate = (year: number, month: number, day: number) => {
    return new Date(year, month, day);
  };

  // Função para converter string de data para Date local
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month é 0-indexed
  };

  // Função para obter string de data local (sem fuso horário)
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Função para obter próximas visitas (usando a mesma lógica do calendário)
  const getUpcomingVisits = () => {
    const visits: Array<{
      id: string;
      data: string;
      horario: string;
      contratoNome: string;
      endereco: string;
      tipoVisita: string;
      recorrente: boolean;
      originalId: string;
    }> = [];

    // Buscar visitas até dezembro do ano vigente
    const currentYear = new Date().getFullYear();
    const endOfYear = new Date(currentYear, 11, 31); // 31 de dezembro
    const today = new Date();
    
    // Corrigir loop para evitar mutação de Date
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Parar se passou do fim do ano
      if (date > endOfYear) break;
      
      const dayAgenda = getAgendaForDate(date);
      
      dayAgenda.forEach(item => {
        // Usar a mesma função formatDate do calendário para garantir consistência
        const dataFormatada = formatDate(date);
        
        const dateString = getLocalDateString(date); // Usar função local
        const tipoVisita = item.observacoes || 'Visita Técnica';
        
        // Debug: verificar se há discrepância
        if (dataFormatada === '14/10/2025' || dataFormatada === '07/10/2025') {
          console.log('🔍 Debug data:', {
            dataFormatada,
            itemId: item.id,
            contratoNome: item.contratoNome,
            dateString,
            originalDate: date,
            i: i,
            dayAgendaLength: dayAgenda.length
          });
        }
        
        // Usar o ID original do item (mesmo que o calendário)
        const uniqueId = item.id;
        
        visits.push({
          id: uniqueId,
          data: dataFormatada,
          horario: formatTime(item.horario),
          contratoNome: item.contratoNome,
          endereco: item.endereco,
          tipoVisita: tipoVisita,
          recorrente: !!item.recorrencia,
          originalId: item.id
        });
      });
    }

    return visits.sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'));
      const dateB = new Date(b.data.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mês
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Dia
          </Button>
        </div>
        
        {/* Filtro por contrato */}
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-600" />
          <select
            value={contratoFiltro}
            onChange={(e) => setContratoFiltro(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os contratos</option>
            {contratos.map(contrato => (
              <option key={contrato.id} value={contrato.id}>
                {contrato.nome}
              </option>
            ))}
          </select>
        </div>
        
        <Button
          onClick={() => handleCreateNew()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Visita
        </Button>
      </div>

      {/* Calendário Mensal */}
      {viewMode === 'month' && (
        <Card className="p-6">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="p-2 text-center text-sm font-medium text-gray-500">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentDate).map((date, index) => {
              if (!date) {
                return <div key={index} className="h-24 border border-gray-200"></div>;
              }

              const dayAgenda = getAgendaForDate(date);
              const isCurrentDay = isToday(date);
              const isSelectedDay = isSelected(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
                    isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
                  } ${isSelectedDay ? 'bg-blue-100 border-blue-400' : ''}`}
                  onClick={() => {
                    setSelectedDate(date);
                    // Se há eventos neste dia, abrir modal para editar
                    if (dayAgenda.length > 0) {
                      // Verificar se é uma instância específica ou evento recorrente
                      const event = dayAgenda[0];
                      if (event.id.includes(getLocalDateString(date))) {
                        // É uma instância específica, editar normalmente
                        handleEdit(event);
                      } else {
                        // É um evento recorrente, SEMPRE criar instância específica
                        const eventToEdit: AgendaItem & { isInstanceEdit?: boolean; originalId?: string; selectedDate?: Date } = { ...event };
                        (eventToEdit as any).isInstanceEdit = true;
                        (eventToEdit as any).originalId = event.id;
                        eventToEdit.id = `${event.id}_${getLocalDateString(date)}`;
                        (eventToEdit as any).selectedDate = date;
                        // Limpar recorrência para forçar criação de instância específica
                        eventToEdit.recorrencia = undefined;
                        console.log('Evento para edição de instância:', eventToEdit);
                        handleEdit(eventToEdit);
                      }
                    } else {
                      // Se não há eventos, criar novo
                      handleCreateNew(date);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </span>
                    {dayAgenda.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayAgenda.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAgenda.slice(0, 2).map(item => (
                      <div
                        key={item.id}
                        className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const ds = getLocalDateString(date);
                          openDeleteOptions(item.id, !!item.recorrencia, item.id, ds);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <Clock className="h-2 w-2" />
                          <span>{formatTime(item.horario)}</span>
                          {item.recorrencia && (
                            <Repeat className="h-2 w-2" />
                          )}
                        </div>
                        <div className="truncate">{item.contratoNome}</div>
                      </div>
                    ))}
                    {dayAgenda.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayAgenda.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Visualização Semanal */}
      {viewMode === 'week' && (
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date(currentDate);
              const startOfWeek = date.getDate() - date.getDay();
              date.setDate(startOfWeek + i);
              
              const dayAgenda = getAgendaForDate(date);
              const isCurrentDay = isToday(date);

              return (
                <div key={i} className="space-y-2">
                  <div className={`text-center p-2 rounded ${
                    isCurrentDay ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                  }`}>
                    <div className="text-sm font-medium">{DIAS_SEMANA[i]}</div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </div>
                  
                  <div className="space-y-2">
                    {dayAgenda.map(item => (
                      <div
                        key={item.id}
                        className="p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100"
                        onClick={() => handleEdit(item)}
                      >
                        <div className="flex items-center space-x-1 text-xs text-blue-600 mb-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(item.horario)}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.contratoNome}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {item.endereco}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Visualização Diária */}
      {viewMode === 'day' && (
        <Card className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
          </div>
          
          <div className="space-y-4">
            {getAgendaForDate(currentDate).map(item => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEdit(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">
                        {formatTime(item.horario)}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.contratoNome}
                    </h4>
                    
                    <div className="flex items-center space-x-1 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{item.endereco}</span>
                    </div>
                    
                    {item.observacoes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, !!item.recorrencia, item.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {getAgendaForDate(currentDate).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhuma visita agendada para este dia</p>
                <Button
                  onClick={() => handleCreateNew(currentDate)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Visita
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Resumo das Próximas Visitas */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Visitas Programadas</h3>
          </div>
          <Button
            onClick={handleClearCanceled}
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Limpar Cancelados
          </Button>
        </div>
        
        {/* Lista de visitas dos próximos dias */}
        <div className="space-y-3">
          {getUpcomingVisits().slice(0, 5).map((visit, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-red-600 text-lg">
                      {visit.data} - {visit.horario} às 09:00
                    </div>
                    <div className="text-sm text-black font-medium">
                      {visit.contratoNome}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Observação */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-black">Observação:</span>
                    <input
                      type="text"
                      value={observacoes[visit.data] || visit.tipoVisita}
                      onChange={(e) => {
                        const newObservacoes = { ...observacoes };
                        newObservacoes[visit.data] = e.target.value;
                        setObservacoes(newObservacoes);
                      }}
                      onBlur={async () => {
                        // Salvar observação quando sair do campo
                        try {
                          const observacao = observacoes[visit.data] || visit.tipoVisita;
                          console.log('Salvando observação:', observacao, 'para data:', visit.data);
                          
                          // Aqui você pode implementar a lógica para salvar no banco
                          // Por enquanto, apenas log
                        } catch (error) {
                          console.error('Erro ao salvar observação:', error);
                        }
                      }}
                      className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Manhã, tarde, etc."
                    />
                  </div>
                  
                  {/* Indicador de Recorrência */}
                  {visit.recorrente && (
                    <div className="flex items-center space-x-1 text-xs text-gray-800">
                      <Repeat className="h-3 w-3" />
                      <span>Recorrente</span>
                    </div>
                  )}
                  
                  {/* Botão de Excluir */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔍 Excluindo visita específica:', {
                        id: visit.id,
                        contrato: visit.contratoNome,
                        data: visit.data,
                        recorrente: visit.recorrente,
                        originalId: visit.originalId
                      });
                      // Abrir opções de exclusão (somente esta / próximas / série)
                      const parts = visit.data.split('/');
                      const dateStringForInstance = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      openDeleteOptions(visit.id, visit.recorrente, visit.originalId, dateStringForInstance);
                    }}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    title="Excluir visita"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {getUpcomingVisits().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma visita agendada para os próximos dias</p>
            </div>
          )}
          
          {getUpcomingVisits().length > 5 && (
            <div className="text-center pt-3">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                Ver todas as {getUpcomingVisits().length} visitas
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <AgendaModal
          item={editingItem}
          onClose={handleModalClose}
          selectedDate={selectedDate}
          contratoSelecionado={contrato}
        />
      )}

  {/* Diálogo simples de opções de exclusão */}
  {deleteDialogOpen && deleteContext && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h4 className="text-lg font-semibold mb-4">Excluir evento recorrente</h4>
        <div className="space-y-2">
          <Button className="w-full" variant="destructive" onClick={() => { setDeleteDialogOpen(false); handleDelete(deleteContext.id, true, deleteContext.originalId, deleteContext.dateStringForInstance, 'single'); }}>Somente esta ocorrência</Button>
          <Button className="w-full" variant="outline" onClick={() => { setDeleteDialogOpen(false); handleDelete(deleteContext.id, true, deleteContext.originalId, deleteContext.dateStringForInstance, 'future'); }}>Esta e próximas</Button>
          <Button className="w-full" variant="outline" onClick={() => { setDeleteDialogOpen(false); handleDelete(deleteContext.id, true, deleteContext.originalId, deleteContext.dateStringForInstance, 'all'); }}>Toda a série</Button>
        </div>
        <div className="mt-4 text-right">
          <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};
