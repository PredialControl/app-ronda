import { AgendaItem } from '@/types';

export interface RecurrenceRule {
  tipo: 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
  intervalo: number;
  dataInicio: string;
  dataFim?: string;
  diasSemana?: string[];
}

// Parse seguro para datas no formato 'YYYY-MM-DD' em horário local (evita UTC)
function parseLocalDateString(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  // Espera 'YYYY-MM-DD'
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export class RecurrenceGenerator {
  /**
   * Gera eventos recorrentes baseado na regra de recorrência
   */
  static generateRecurringEvents(
    baseEvent: Omit<AgendaItem, 'id' | 'dataCriacao' | 'dataAtualizacao'>,
    rule: RecurrenceRule,
    maxEvents: number = 100
  ): AgendaItem[] {
    const events: AgendaItem[] = [];
    const startDate = parseLocalDateString(rule.dataInicio) as Date;
    const endDate = parseLocalDateString(rule.dataFim);
    
    let currentDate = new Date(startDate);
    let eventCount = 0;

    while (eventCount < maxEvents && (!endDate || currentDate <= endDate)) {
      // Verificar se a data atual está dentro do período válido
      if (currentDate >= startDate && (!endDate || currentDate <= endDate)) {
        const event: AgendaItem = {
          ...baseEvent,
          id: `recurring-${baseEvent.contratoId}-${currentDate.toISOString()}`,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          recorrencia: {
            tipo: rule.tipo,
            intervalo: rule.intervalo,
            dataInicio: rule.dataInicio,
            dataFim: rule.dataFim,
            diasSemana: rule.diasSemana
          }
        };

        events.push(event);
        eventCount++;
      }

      // Avançar para a próxima data baseado no tipo de recorrência
      currentDate = this.getNextRecurrenceDate(currentDate, rule);
    }

    return events;
  }

  /**
   * Calcula a próxima data de recorrência
   */
  private static getNextRecurrenceDate(currentDate: Date, rule: RecurrenceRule): Date {
    const nextDate = new Date(currentDate);

    switch (rule.tipo) {
      case 'DIARIO':
        nextDate.setDate(currentDate.getDate() + rule.intervalo);
        break;
        
      case 'SEMANAL':
        nextDate.setDate(currentDate.getDate() + (7 * rule.intervalo));
        break;
      
      case 'QUINZENAL':
        nextDate.setDate(currentDate.getDate() + (14 * rule.intervalo));
        break;
      
      case 'MENSAL':
        nextDate.setMonth(currentDate.getMonth() + rule.intervalo);
        break;
    }

    return nextDate;
  }

  /**
   * Verifica se uma data específica corresponde a um evento recorrente
   */
  static isRecurringDate(
    date: Date,
    baseEvent: AgendaItem,
    rule: RecurrenceRule
  ): boolean {
    // Se há exclusões específicas, respeitar
    if (rule.diasSemana || rule.tipo) {
      const localDateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if ((rule as any).exclusoes && Array.isArray((rule as any).exclusoes)) {
        if ((rule as any).exclusoes.includes(localDateStr)) return false;
      }
    }
    const startDate = parseLocalDateString(rule.dataInicio) as Date;
    const endDate = parseLocalDateString(rule.dataFim);

    // Verificar se a data está dentro do período de recorrência
    if (date < startDate || (endDate && date > endDate)) {
      return false;
    }

    // Verificar se a data corresponde ao padrão de recorrência
    switch (rule.tipo) {
      case 'DIARIO':
        return this.isDailyRecurrence(date, startDate, rule.intervalo);
        
      case 'SEMANAL':
        return this.isWeeklyRecurrence(date, startDate, rule.intervalo);
      
      case 'QUINZENAL':
        return this.isBiweeklyRecurrence(date, startDate, rule.intervalo);
      
      case 'MENSAL':
        return this.isMonthlyRecurrence(date, startDate, rule.intervalo);
      
      default:
        return false;
    }
  }

  /**
   * Verifica recorrência diária
   */
  private static isDailyRecurrence(
    date: Date,
    startDate: Date,
    interval: number
  ): boolean {
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % interval === 0;
  }

  /**
   * Verifica recorrência semanal
   */
  private static isWeeklyRecurrence(
    date: Date,
    startDate: Date,
    interval: number
  ): boolean {
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % (7 * interval) === 0;
  }

  /**
   * Verifica recorrência quinzenal
   */
  private static isBiweeklyRecurrence(
    date: Date,
    startDate: Date,
    interval: number
  ): boolean {
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % (14 * interval) === 0;
  }

  /**
   * Verifica recorrência mensal
   */
  private static isMonthlyRecurrence(
    date: Date,
    startDate: Date,
    interval: number
  ): boolean {
    // Verificar se é o mesmo dia do mês
    if (date.getDate() !== startDate.getDate()) {
      return false;
    }

    // Calcular diferença em meses
    const yearDiff = date.getFullYear() - startDate.getFullYear();
    const monthDiff = date.getMonth() - startDate.getMonth();
    const totalMonthDiff = yearDiff * 12 + monthDiff;

    return totalMonthDiff >= 0 && totalMonthDiff % interval === 0;
  }

  /**
   * Gera eventos recorrentes para um período específico
   */
  static generateEventsForPeriod(
    baseEvent: Omit<AgendaItem, 'id' | 'dataCriacao' | 'dataAtualizacao'>,
    rule: RecurrenceRule,
    startPeriod: Date,
    endPeriod: Date
  ): AgendaItem[] {
    const events: AgendaItem[] = [];
    const ruleStartDate = parseLocalDateString(rule.dataInicio) as Date;
    const ruleEndDate = parseLocalDateString(rule.dataFim);

    // Ajustar período de busca para incluir eventos que começam antes mas se estendem até o período
    const searchStartDate = new Date(Math.min(startPeriod.getTime(), ruleStartDate.getTime()));
    const searchEndDate = new Date(Math.max(endPeriod.getTime(), ruleEndDate?.getTime() || endPeriod.getTime()));

    let currentDate = new Date(searchStartDate);

    while (currentDate <= searchEndDate) {
      if (this.isRecurringDate(currentDate, baseEvent as AgendaItem, rule)) {
        const event: AgendaItem = {
          ...baseEvent,
          id: `recurring-${baseEvent.contratoId}-${currentDate.toISOString()}`,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          recorrencia: {
            tipo: rule.tipo,
            intervalo: rule.intervalo,
            dataInicio: rule.dataInicio,
            dataFim: rule.dataFim,
            diasSemana: rule.diasSemana
          }
        };

        events.push(event);
      }

      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
  }

  /**
   * Converte string de dia da semana para número
   */
  static getDayOfWeekNumber(diaSemana: string): number {
    const dias = {
      'DOMINGO': 0,
      'SEGUNDA': 1,
      'TERÇA': 2,
      'QUARTA': 3,
      'QUINTA': 4,
      'SEXTA': 5,
      'SÁBADO': 6
    };
    return dias[diaSemana as keyof typeof dias] ?? 0;
  }

  /**
   * Converte número para string de dia da semana
   */
  static getDayOfWeekString(dayNumber: number): string {
    const dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    return dias[dayNumber] || 'DOMINGO';
  }
}
