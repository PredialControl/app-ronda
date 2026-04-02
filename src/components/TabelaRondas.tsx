import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ronda, Contrato } from '@/types';
import { Calendar, Users, CheckCircle, AlertTriangle, Eye, FileText, Trash2, Droplets, Zap, Flame, ArrowLeft, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TabelaRondasProps {
  rondas: Ronda[];
  contrato: Contrato;
  onSelectRonda: (ronda: Ronda) => void;
  onNovaRonda: () => void;
  onDeletarRonda: (id: string) => void;
  onVoltarContratos: () => void;
}

export function TabelaRondas({ rondas, contrato, onSelectRonda, onNovaRonda, onDeletarRonda, onVoltarContratos }: TabelaRondasProps) {
  // Estado para filtro de mês/ano
  const mesAtual = new Date().getMonth(); // 0-11
  const anoAtual = new Date().getFullYear();
  const [mesSelecionado, setMesSelecionado] = useState<number>(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoAtual);

  // Filtrar rondas pelo mês/ano selecionado e ordenar por data mais recente
  const rondasFiltradas = rondas
    .filter(ronda => {
      const dataRonda = new Date(ronda.data + 'T00:00:00');
      return dataRonda.getMonth() === mesSelecionado && dataRonda.getFullYear() === anoSelecionado;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());


  const getStatusColor = (status: string) => {
    return status === 'ATIVO' ? 'success' : 'warning';
  };

  const getStatusLabel = (status: string) => {
    return status === 'ATIVO' ? 'Ativo' : 'Em Manutenção';
  };

  const formatarData = (data: string) => {
    // Evita bug de fuso horário ao usar new Date('YYYY-MM-DD') (interpretação UTC)
    const [ano, mes, dia] = data.split('-');
    if (ano && mes && dia) {
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  const calcularEstatisticas = (ronda: Ronda) => {
    const total = ronda.areasTecnicas.length;
    const ativos = ronda.areasTecnicas.filter(at => at.status === 'ATIVO').length;
    const manutencao = ronda.areasTecnicas.filter(at => at.status === 'EM MANUTENÇÃO').length;

    // Debug: Log dos dados da ronda
    console.log('🔍 DEBUG TABELA - Ronda:', ronda.id, {
      outrosItensCorrigidos: ronda.outrosItensCorrigidos?.length || 0,
      fotosRonda: ronda.fotosRonda?.length || 0,
      outrosItensDetalhes: ronda.outrosItensCorrigidos
    });

    // Contar itens de abertura de chamado (outrosItensCorrigidos com categoria CHAMADO ou sem categoria)
    const itensChamado = (ronda.outrosItensCorrigidos || []).filter((item: any) => {
      console.log('🔍 DEBUG TABELA - Verificando item:', item.categoria, item);
      const statusNorm = (item.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const isItemChamado = item.categoria === 'CHAMADO' ||
        (item.categoria === undefined && statusNorm !== 'CONCLUIDO') ||
        (item.categoria === null && statusNorm !== 'CONCLUIDO');
      return isItemChamado && statusNorm !== 'CONCLUIDO';
    }).length;

    // Incluir também fotos de ronda como chamados (para compatibilidade)
    const fotosRondaChamados = ronda.fotosRonda.length;
    const totalItensChamado = itensChamado + fotosRondaChamados;

    console.log('🔍 DEBUG TABELA - Contagem final:', {
      itensChamado,
      fotosRondaChamados,
      totalItensChamado
    });

    const itensAtencao = manutencao + totalItensChamado; // Soma manutenção + chamados

    return { total, ativos, manutencao, itensChamado: totalItensChamado, itensAtencao };
  };

  // Gerar lista de anos disponíveis (últimos 3 anos + próximo ano)
  const anosDisponiveis = [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1];

  return (
    <Card className="w-full">
      <CardHeader className="px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{contrato.nome}</span>
            </CardTitle>

            {/* Filtros de Mês/Ano */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 ml-1 sm:ml-2" />
                <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
                  <SelectTrigger className="w-[100px] sm:w-[140px] h-8 border-0 bg-transparent focus:ring-0 text-xs sm:text-sm">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes, index) => (
                      <SelectItem key={index} value={index.toString()}>{mes}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="w-px h-4 bg-gray-300"></div>

                <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
                  <SelectTrigger className="w-[80px] sm:w-[100px] h-8 border-0 bg-transparent focus:ring-0 text-xs sm:text-sm">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosDisponiveis.map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={onVoltarContratos} variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Voltar</span>
            </Button>
            <Button onClick={onNovaRonda} size="sm" className="bg-green-600 hover:bg-green-700 px-2 sm:px-3">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Nova Ronda</span>
            </Button>
          </div>
        </div>


      </CardHeader>

      <CardContent className="px-2 sm:px-6">
        {/* Conteúdo das Rondas */}
        <>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Responsável
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Áreas Vistoriadas
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Itens Ativos
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      Itens Manutenção
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Itens Chamado
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Itens em Atenção
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rondasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-base mb-2">
                        {rondas.length === 0
                          ? 'Nenhuma ronda realizada ainda para este contrato.'
                          : `Nenhuma ronda encontrada para ${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mesSelecionado]} de ${anoSelecionado}.`
                        }
                      </p>
                      {rondas.length === 0 && (
                        <p className="text-gray-600 text-sm mb-4">
                          Crie sua primeira ronda para começar a documentar as verificações técnicas.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  rondasFiltradas.map((ronda) => {
                    const stats = calcularEstatisticas(ronda);
                    const tipoVisita = ronda.tipoVisita || 'RONDA';
                    const tipoConfig = {
                      RONDA: { label: '🔍 Ronda', color: 'text-blue-700' },
                      REUNIAO: { label: '👥 Reunião', color: 'text-green-700' },
                      OUTROS: { label: '📋 Outros', color: 'text-purple-700' }
                    };
                    const config = tipoConfig[tipoVisita as keyof typeof tipoConfig] || tipoConfig.RONDA;

                    return (
                      <tr key={ronda.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`text-sm font-bold ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {formatarData(ronda.data)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ronda.hora}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {ronda.responsavel || 'Ricardo Oliveira'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {stats.total}/{stats.total}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {ronda.areasTecnicas.length} áreas
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="font-mono">
                              {stats.ativos}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              ativos
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="warning" className="font-mono">
                              {stats.manutencao}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              manutenção
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {stats.itensChamado}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              chamados
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="font-mono">
                              {stats.itensAtencao}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              atenção
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSelectRonda(ronda)}
                              className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/20"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir a ronda "${ronda.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
                                  onDeletarRonda(ronda.id);
                                }
                              }}
                              className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
              </tbody>
            </table>
          </div>

          {/* Resumo das Rondas */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {rondas.length}
                </div>
                <div className="text-sm text-gray-600">Total de Rondas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {rondas.reduce((total, ronda) => total + ronda.areasTecnicas.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Áreas Vistoriadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {rondas.reduce((total, ronda) =>
                    total + ronda.areasTecnicas.filter(at => at.status === 'ATIVO').length, 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Itens Ativos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {rondas.reduce((total, ronda) =>
                    total + ronda.areasTecnicas.filter(at => at.status === 'EM MANUTENÇÃO').length, 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Em Manutenção</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {rondas.reduce((total, ronda) => {
                    const itensChamado = (ronda.outrosItensCorrigidos || []).filter((item: any) => {
                      const statusNorm = (item.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                      const isItemChamado = item.categoria === 'CHAMADO' ||
                        (item.categoria === undefined && statusNorm !== 'CONCLUIDO') ||
                        (item.categoria === null && statusNorm !== 'CONCLUIDO');
                      return isItemChamado && statusNorm !== 'CONCLUIDO';
                    }).length;
                    const fotosRondaChamados = ronda.fotosRonda.length;
                    return total + itensChamado + fotosRondaChamados;
                  }, 0)}
                </div>
                <div className="text-sm text-gray-600">Itens Chamado</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {rondas.reduce((total, ronda) => {
                    const manutencao = ronda.areasTecnicas.filter(at => at.status === 'EM MANUTENÇÃO').length;
                    const itensChamado = (ronda.outrosItensCorrigidos || []).filter((item: any) => {
                      const statusNorm = (item.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                      const isItemChamado = item.categoria === 'CHAMADO' ||
                        (item.categoria === undefined && statusNorm !== 'CONCLUIDO') ||
                        (item.categoria === null && statusNorm !== 'CONCLUIDO');
                      return isItemChamado && statusNorm !== 'CONCLUIDO';
                    }).length;
                    const fotosRondaChamados = ronda.fotosRonda.length;
                    return total + manutencao + itensChamado + fotosRondaChamados;
                  }, 0)}
                </div>
                <div className="text-sm text-gray-600">Itens em Atenção</div>
              </div>
            </div>
          </div>
        </>
      </CardContent>
    </Card>
  );
}
