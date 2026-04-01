// Componente que mostra rondas pendentes baseado na periodicidade
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ronda } from '@/types';
import {
  AlertTriangle,
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  Flame,
  Building2,
  Wrench
} from 'lucide-react';

interface RondasPendentesProps {
  rondas: Ronda[];
  onIniciarRonda: (template: 'SEMANAL' | 'MENSAL' | 'BIMESTRAL') => void;
}

interface RondaPendente {
  tipo: 'SEMANAL' | 'MENSAL' | 'BIMESTRAL';
  nome: string;
  emoji: string;
  icon: any;
  cor: string;
  diasDesdeUltima: number;
  periodicidadeDias: number;
  status: 'PENDENTE' | 'ATENCAO' | 'OK';
  ultimaData: string | null;
  mensagem: string;
}

// Configuração das rondas
const CONFIG_RONDAS = {
  SEMANAL: {
    nome: 'Ronda Semanal',
    emoji: '📅',
    icon: Wrench,
    cor: 'emerald',
    periodicidadeDias: 7,
    descricao: 'Equipamentos'
  },
  MENSAL: {
    nome: 'Ronda Mensal',
    emoji: '🔥',
    icon: Flame,
    cor: 'blue',
    periodicidadeDias: 30,
    descricao: 'Incêndio'
  },
  BIMESTRAL: {
    nome: 'Ronda Bimestral',
    emoji: '🏢',
    icon: Building2,
    cor: 'purple',
    periodicidadeDias: 60,
    descricao: 'Áreas Comuns'
  }
};

// Calcular dias entre duas datas
const calcularDiasEntre = (dataInicio: string, dataFim: Date): number => {
  const inicio = new Date(dataInicio);
  const diffTime = dataFim.getTime() - inicio.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export function RondasPendentes({ rondas, onIniciarRonda }: RondasPendentesProps) {
  const rondasPendentes = useMemo(() => {
    const hoje = new Date();
    const resultado: RondaPendente[] = [];

    // Para cada tipo de ronda, verificar a última feita
    (Object.keys(CONFIG_RONDAS) as Array<keyof typeof CONFIG_RONDAS>).forEach(tipo => {
      const config = CONFIG_RONDAS[tipo];

      // Encontrar a última ronda deste tipo
      const rondasDoTipo = rondas
        .filter(r => r.templateRonda === tipo)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      const ultimaRonda = rondasDoTipo[0];
      const ultimaData = ultimaRonda?.data || null;

      let diasDesdeUltima = ultimaData ? calcularDiasEntre(ultimaData, hoje) : 999;
      let status: 'PENDENTE' | 'ATENCAO' | 'OK' = 'OK';
      let mensagem = '';

      if (!ultimaData) {
        // Nunca foi feita
        status = 'PENDENTE';
        mensagem = 'Nunca realizada - Iniciar agora!';
        diasDesdeUltima = 999;
      } else if (diasDesdeUltima >= config.periodicidadeDias) {
        // Passou do prazo
        status = 'PENDENTE';
        const diasAtrasado = diasDesdeUltima - config.periodicidadeDias;
        mensagem = `Atrasada ${diasAtrasado} dia${diasAtrasado > 1 ? 's' : ''}!`;
      } else if (diasDesdeUltima >= config.periodicidadeDias - 3) {
        // Próxima de vencer (3 dias antes)
        status = 'ATENCAO';
        const diasRestantes = config.periodicidadeDias - diasDesdeUltima;
        mensagem = `Vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;
      } else {
        // Tudo OK
        status = 'OK';
        const diasRestantes = config.periodicidadeDias - diasDesdeUltima;
        mensagem = `Próxima em ${diasRestantes} dias`;
      }

      resultado.push({
        tipo,
        nome: config.nome,
        emoji: config.emoji,
        icon: config.icon,
        cor: config.cor,
        diasDesdeUltima,
        periodicidadeDias: config.periodicidadeDias,
        status,
        ultimaData,
        mensagem
      });
    });

    // Ordenar: PENDENTE primeiro, depois ATENCAO, depois OK
    return resultado.sort((a, b) => {
      const ordem = { PENDENTE: 0, ATENCAO: 1, OK: 2 };
      return ordem[a.status] - ordem[b.status];
    });
  }, [rondas]);

  // Contar pendentes
  const totalPendentes = rondasPendentes.filter(r => r.status === 'PENDENTE').length;
  const totalAtencao = rondasPendentes.filter(r => r.status === 'ATENCAO').length;

  // Se não tem nada pendente ou em atenção, não mostrar
  if (totalPendentes === 0 && totalAtencao === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-orange-500/30 mb-6">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Rondas Programadas</h3>
            <p className="text-sm text-gray-400">
              {totalPendentes > 0 && (
                <span className="text-red-400">{totalPendentes} pendente{totalPendentes > 1 ? 's' : ''}</span>
              )}
              {totalPendentes > 0 && totalAtencao > 0 && ' • '}
              {totalAtencao > 0 && (
                <span className="text-yellow-400">{totalAtencao} próxima{totalAtencao > 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>

        {/* Lista de rondas */}
        <div className="space-y-2">
          {rondasPendentes.map(ronda => {
            const Icon = ronda.icon;
            const isPendente = ronda.status === 'PENDENTE';
            const isAtencao = ronda.status === 'ATENCAO';

            return (
              <div
                key={ronda.tipo}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isPendente
                    ? 'bg-red-500/10 border-red-500/30'
                    : isAtencao
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPendente
                      ? 'bg-red-500/20'
                      : isAtencao
                      ? 'bg-yellow-500/20'
                      : 'bg-white/10'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isPendente
                        ? 'text-red-400'
                        : isAtencao
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{ronda.nome}</span>
                      {isPendente && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">PENDENTE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={isPendente ? 'text-red-300' : isAtencao ? 'text-yellow-300' : ''}>
                        {ronda.mensagem}
                      </span>
                      {ronda.ultimaData && (
                        <>
                          <span>•</span>
                          <span>Última: {new Date(ronda.ultimaData).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(isPendente || isAtencao) && (
                  <Button
                    size="sm"
                    onClick={() => onIniciarRonda(ronda.tipo)}
                    className={`${
                      isPendente
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Iniciar
                  </Button>
                )}

                {!isPendente && !isAtencao && (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
