import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ronda, Contrato } from '@/types';
import { Calendar, Users, CheckCircle, AlertTriangle, Eye, FileText, Trash2, Droplets, Zap, Flame } from 'lucide-react';

interface TabelaRondasProps {
  rondas: Ronda[];
  contrato: Contrato;
  onSelectRonda: (ronda: Ronda) => void;
  onNovaRonda: () => void;
  onDeletarRonda: (id: string) => void;
}

export function TabelaRondas({ rondas, contrato, onSelectRonda, onNovaRonda, onDeletarRonda }: TabelaRondasProps) {
  const [activeTab, setActiveTab] = useState<'rondas' | 'medicoes'>('rondas');
  
  // Dados de exemplo para medições (você pode integrar com o estado real depois)
  const [medicoes, setMedicoes] = useState([
    {
      id: '1',
      data: '2024-01-15',
      agua: '150',
      luz: '250',
      gas: '45',
      observacoes: 'Consumo normal para o período'
    },
    {
      id: '2',
      data: '2024-02-15',
      agua: '165',
      luz: '280',
      gas: '52',
      observacoes: 'Aumento no consumo de água'
    }
  ]);

  const getStatusColor = (status: string) => {
    return status === 'ATIVO' ? 'success' : 'warning';
  };

  const getStatusLabel = (status: string) => {
    return status === 'ATIVO' ? 'Ativo' : 'Em Manutenção';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const calcularEstatisticas = (ronda: Ronda) => {
    const total = ronda.areasTecnicas.length;
    const ativos = ronda.areasTecnicas.filter(at => at.status === 'ATIVO').length;
    const manutencao = ronda.areasTecnicas.filter(at => at.status === 'EM MANUTENÇÃO').length;
    const itensChamado = ronda.fotosRonda.length;
    
    return { total, ativos, manutencao, itensChamado };
  };

  if (rondas.length === 0 && activeTab === 'rondas') {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Contrato: {contrato.nome}
            </CardTitle>
          </div>
          
          {/* Abas */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('rondas')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'rondas'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Rondas Realizadas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('medicoes')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'rondas'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Medições (Água, Luz, Gás)
              </div>
            </button>
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
          {activeTab === 'rondas' && (
            <Button onClick={onNovaRonda} className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Nova Ronda
            </Button>
          )}
          {activeTab === 'medicoes' && (
            <Button onClick={() => alert('Funcionalidade de nova medição será implementada em breve')} className="bg-blue-600 hover:bg-blue-700">
              <Droplets className="w-4 h-4 mr-2" />
              Nova Medição
            </Button>
          )}
        </div>
        
        {/* Abas */}
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('rondas')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'rondas'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Rondas Realizadas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('medicoes')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'medicoes'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Medições (Água, Luz, Gás)
            </div>
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'rondas' && (
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSelectRonda(ronda)}
                              className="h-8 px-3"
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
                              className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
              <div className="grid grid-cols-5 gap-4 text-center">
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
                    {rondas.reduce((total, ronda) => total + ronda.fotosRonda.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Itens Chamado</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Aba de Medições */}
        {activeTab === 'medicoes' && (
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
                        <Droplets className="w-4 h-4 text-blue-600" />
                        Água (m³)
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        Luz (kWh)
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-600" />
                        Gás (m³)
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Observações
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicoes.map((medicao) => (
                    <tr key={medicao.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {new Date(medicao.data).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {medicao.agua}
                          </Badge>
                          <span className="text-sm text-gray-600">m³</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {medicao.luz}
                          </Badge>
                          <span className="text-sm text-gray-600">kWh</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {medicao.gas}
                          </Badge>
                          <span className="text-sm text-gray-600">m³</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {medicao.observacoes}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alert('Funcionalidade de edição será implementada em breve')}
                            className="h-8 px-3"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir esta medição?`)) {
                                setMedicoes(prev => prev.filter(m => m.id !== medicao.id));
                              }
                            }}
                            className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Resumo das Medições */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {medicoes.length}
                  </div>
                  <div className="text-sm text-gray-600">Total de Medições</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {medicoes.reduce((total, m) => total + parseInt(m.agua), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Água (m³)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {medicoes.reduce((total, m) => total + parseInt(m.luz), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Luz (kWh)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {medicoes.reduce((total, m) => total + parseInt(m.gas), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Gás (m³)</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
