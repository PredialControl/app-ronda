import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ronda, Contrato } from '@/types';
import { Calendar, Users, CheckCircle, AlertTriangle, Eye, FileText, Trash2, Droplets, Zap, Flame, ArrowLeft } from 'lucide-react';

interface TabelaRondasProps {
  rondas: Ronda[];
  contrato: Contrato;
  onSelectRonda: (ronda: Ronda) => void;
  onNovaRonda: () => void;
  onDeletarRonda: (id: string) => void;
  onVoltarContratos: () => void;
}

export function TabelaRondas({ rondas, contrato, onSelectRonda, onNovaRonda, onDeletarRonda, onVoltarContratos }: TabelaRondasProps) {


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
    
    // Contar itens de abertura de chamado (outrosItensCorrigidos com categoria CHAMADO)
    const itensChamado = (ronda.outrosItensCorrigidos || []).filter((item: any) => item.categoria === 'CHAMADO').length;
    
    // Incluir também fotos de ronda como chamados (para compatibilidade)
    const fotosRondaChamados = ronda.fotosRonda.length;
    const totalItensChamado = itensChamado + fotosRondaChamados;
    
    const itensAtencao = manutencao + totalItensChamado; // Soma manutenção + chamados
    
    return { total, ativos, manutencao, itensChamado: totalItensChamado, itensAtencao };
  };

  if (rondas.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Contrato: {contrato.nome}
            </CardTitle>
          </div>
          

        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              Nenhuma ronda realizada ainda para este contrato.
            </p>
            <p className="text-gray-600 mb-4">
              Crie sua primeira ronda para começar a documentar as verificações técnicas.
            </p>
            <Button onClick={onNovaRonda} className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Criar Primeira Ronda
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Contrato: {contrato.nome}
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={onVoltarContratos} variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Contratos
            </Button>
            <Button onClick={onNovaRonda} className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Nova Ronda
            </Button>
          </div>
        </div>
        

      </CardHeader>
      
      <CardContent>
        {/* Conteúdo das Rondas */}
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
                  {rondas.map((ronda) => {
                    const stats = calcularEstatisticas(ronda);
                    return (
                      <tr key={ronda.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Resumo das Rondas */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-6 gap-4 text-center">
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
                      const itensChamado = (ronda.outrosItensCorrigidos || []).filter((item: any) => item.categoria === 'CHAMADO').length;
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
                      const itensChamado = (ronda.outrosItensCorrigidos || []).filter((item: any) => item.categoria === 'CHAMADO').length;
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
