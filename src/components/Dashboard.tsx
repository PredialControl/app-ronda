import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ronda, Contrato, AreaTecnica, FotoRonda, OutroItemCorrigido } from '@/types';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  Eye,
  Wrench,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface DashboardProps {
  contrato: Contrato;
  rondas: Ronda[];
  areasTecnicas: AreaTecnica[];
}

export function Dashboard({ contrato, rondas, areasTecnicas }: DashboardProps) {
  
  // Calcular métricas do dashboard
  const metricas = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Filtrar rondas do mês atual
    const rondasMes = rondas.filter(ronda => {
      const dataRonda = new Date(ronda.data);
      return dataRonda.getMonth() === mesAtual && dataRonda.getFullYear() === anoAtual;
    });
    
    // Calcular itens críticos e atenção do mês
    const itensCriticos = rondasMes.flatMap(ronda => 
      ronda.fotosRonda.filter(foto => foto.pendencia === 'Crítica')
    );
    
    const itensAtencao = rondasMes.flatMap(ronda => 
      ronda.fotosRonda.filter(foto => foto.pendencia === 'Alta')
    );
    
    // Calcular chamados abertos vs corrigidos
    const chamadosAbertos = rondasMes.flatMap(ronda => 
      ronda.fotosRonda.filter(foto => 
        foto.pendencia !== 'Nenhuma' && foto.pendencia !== 'Pequena'
      )
    );
    
    const itensCorrigidos = rondasMes.flatMap(ronda => 
      ronda.outrosItensCorrigidos
    );
    
    // Status da última visita por equipamento
    const statusEquipamentos = areasTecnicas.map(area => {
      const ultimaRonda = rondas
        .filter(r => r.areasTecnicas.some(a => a.id === area.id))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
      
      return {
        ...area,
        ultimaVisita: ultimaRonda ? ultimaRonda.data : 'Nunca visitado',
        statusUltimaVisita: ultimaRonda ? ultimaRonda.areasTecnicas.find(a => a.id === area.id)?.status : 'NÃO VISITADO'
      };
    });
    
    return {
      totalRondasMes: rondasMes.length,
      itensCriticos: itensCriticos.length,
      itensAtencao: itensAtencao.length,
      chamadosAbertos: chamadosAbertos.length,
      itensCorrigidos: itensCorrigidos.length,
      statusEquipamentos,
      tendenciaChamados: chamadosAbertos.length > itensCorrigidos.length ? 'aumentando' : 'diminuindo'
    };
  }, [rondas, areasTecnicas]);
  
  // Dados para gráficos
  const dadosGrafico = useMemo(() => {
    const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      return {
        mes: data.toLocaleDateString('pt-BR', { month: 'short' }),
        ano: data.getFullYear(),
        data: data
      };
    }).reverse();
    
    return ultimos6Meses.map(({ mes, ano, data }) => {
      const rondasMes = rondas.filter(ronda => {
        const dataRonda = new Date(ronda.data);
        return dataRonda.getMonth() === data.getMonth() && dataRonda.getFullYear() === data.getFullYear();
      });
      
      const criticos = rondasMes.flatMap(r => 
        r.fotosRonda.filter(f => f.pendencia === 'Crítica')
      ).length;
      
      const atencao = rondasMes.flatMap(r => 
        r.fotosRonda.filter(f => f.pendencia === 'Alta')
      ).length;
      
      return { mes, criticos, atencao };
    });
  }, [rondas]);
  
  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do contrato {contrato.nome}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>
      
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Rondas</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metricas.totalRondasMes}</div>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metricas.itensCriticos}</div>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metricas.itensAtencao}</div>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados vs Corrigidos</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metricas.chamadosAbertos}/{metricas.itensCorrigidos}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {metricas.tendenciaChamados === 'aumentando' ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <span className={metricas.tendenciaChamados === 'aumentando' ? 'text-red-600' : 'text-green-600'}>
                {metricas.tendenciaChamados}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Tendência de Itens Críticos e Atenção (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dadosGrafico.map((dado, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-gray-600">{dado.mes}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Críticos: {dado.criticos}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Atenção: {dado.atencao}</span>
                  </div>
                </div>
                <div className="w-32 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    Total: {dado.criticos + dado.atencao}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Status dos Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gray-600" />
            Status da Última Visita nos Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricas.statusEquipamentos.map((equipamento) => (
              <div key={equipamento.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{equipamento.nome}</h3>
                  <Badge 
                    variant={equipamento.statusUltimaVisita === 'ATIVO' ? 'default' : 
                           equipamento.statusUltimaVisita === 'MANUTENÇÃO' ? 'secondary' : 'destructive'}
                  >
                    {equipamento.statusUltimaVisita}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Última visita: {equipamento.ultimaVisita}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Status: {equipamento.statusUltimaVisita}</span>
                  </div>
                </div>
                
                {equipamento.observacoes && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {equipamento.observacoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Resumo Executivo */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="w-6 h-6" />
            📊 Resumo Executivo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{metricas.itensCriticos}</div>
              <div className="text-sm text-red-700">Itens Críticos</div>
              <div className="text-xs text-red-600">Requerem ação imediata</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{metricas.itensAtencao}</div>
              <div className="text-sm text-orange-700">Itens Atenção</div>
              <div className="text-xs text-orange-600">Monitorar de perto</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metricas.itensCorrigidos}</div>
              <div className="text-sm text-green-700">Itens Corrigidos</div>
              <div className="text-xs text-green-600">Problemas resolvidos</div>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-700">
              {metricas.chamadosAbertos > metricas.itensCorrigidos 
                ? `⚠️ ${metricas.chamadosAbertos - metricas.itensCorrigidos} chamados ainda em aberto`
                : `✅ Todos os chamados foram corrigidos!`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
