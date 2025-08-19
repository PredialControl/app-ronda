
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaTecnica, Ronda, Contrato } from '@/types';
import { ArrowLeft, FileText, AlertTriangle, Camera, Edit, Plus, Trash2, Wrench } from 'lucide-react';
import { AreaTecnicaCard } from './AreaTecnicaCard';

interface VisualizarRondaProps {
  ronda: Ronda;
  contrato: Contrato;
  areasTecnicas: AreaTecnica[];
  onVoltar: () => void;
  onEditarArea: (area: AreaTecnica) => void;
  onDeletarArea: (id: string) => void;
  onAdicionarArea: () => void;
  onAdicionarItemChamado: () => void;
  onEditarItemChamado: (item: any) => void;
  onDeletarItemChamado: (id: string) => void;
  onAdicionarOutroItem: () => void;
  onEditarOutroItem: (item: any) => void;
  onDeletarOutroItem: (id: string) => void;
  onEditarRonda: () => void;
  onExportarPDF: () => void;
  onExportarJSON: () => void;
  isPrintMode: boolean;
}

export function VisualizarRonda({
  ronda,
  contrato,
  areasTecnicas,
  onVoltar,
  onEditarArea,
  onDeletarArea,
  onAdicionarArea,
  onAdicionarItemChamado,
  onEditarItemChamado,
  onDeletarItemChamado,
  onAdicionarOutroItem,
  onEditarOutroItem,
  onDeletarOutroItem,
  onEditarRonda,
  onExportarPDF,
  onExportarJSON,
  isPrintMode
}: VisualizarRondaProps) {
  if (isPrintMode) {
    return null; // O PrintRonda será renderizado separadamente
  }

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onVoltar} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às Rondas
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ronda.nome}</h1>
            <p className="text-gray-600">Contrato: {contrato.nome}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onEditarRonda} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar Ronda
          </Button>
          <Button onClick={onExportarPDF} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={onExportarJSON} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Informações da Ronda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Informações da Ronda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Data</div>
              <div className="text-lg font-semibold">{new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Hora</div>
              <div className="text-lg font-semibold">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Responsável</div>
              <div className="text-lg font-semibold">{ronda.responsavel || 'Ricardo Oliveira'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Áreas Verificadas</div>
              <div className="text-lg font-semibold text-blue-600">{areasTecnicas.length}</div>
            </div>
          </div>
          
          {ronda.observacoesGerais && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium text-gray-500 mb-2">Observações Gerais</div>
              <p className="text-gray-700">{ronda.observacoesGerais}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Áreas Técnicas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Áreas Técnicas Verificadas
            </CardTitle>
            <Button onClick={onAdicionarArea} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Área
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {areasTecnicas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma área técnica verificada ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {areasTecnicas.map((area) => (
                <AreaTecnicaCard
                  key={area.id}
                  areaTecnica={area}
                  onEdit={() => onEditarArea(area)}
                  onDelete={() => onDeletarArea(area.id)}
                  isPrintMode={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Divisor e Seção de Itens Abertura de Chamado */}
      <div className="my-12 border-t-2 border-gray-300">
        <div className="flex items-center justify-center -mt-3">
          <div className="bg-white px-6 py-2">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              Itens Abertura de Chamado
            </h2>
          </div>
        </div>
      </div>

      {/* Grid de Itens Abertura de Chamado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Itens para Abertura de Chamado
            </CardTitle>
            <Button onClick={onAdicionarItemChamado} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ronda.fotosRonda.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                Nenhum item para abertura de chamado registrado ainda.
              </p>
              <p className="text-gray-600 mb-4">
                Registre itens que precisam de atenção, manutenção ou correção durante a ronda.
              </p>
              <Button onClick={onAdicionarItemChamado} className="bg-orange-600 hover:bg-orange-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Registrar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ronda.fotosRonda.map((item) => (
                <div key={item.id} className="bg-white border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Item Abertura de Chamado
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditarItemChamado(item)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Editar item"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletarItemChamado(item.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        title="Excluir item"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {item.pendencia}
                    </Badge>
                  </div>
                  
                  <div className="relative">
                    <img 
                      src={item.foto} 
                      alt={`Item da ronda - ${item.local}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {item.especialidade}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium">Local:</span> {item.local}</div>
                    <div><span className="font-medium">Especialidade:</span> {item.especialidade}</div>
                    <div><span className="font-medium">Pendência:</span> {item.pendencia}</div>
                  </div>
                  
                  {item.observacoes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Observações:</span> {item.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Outros Itens Corrigidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-green-600" />
              Outros Itens Corrigidos
            </CardTitle>
            <Button onClick={onAdicionarOutroItem} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ronda.outrosItensCorrigidos.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                Nenhum item corrigido registrado ainda.
              </p>
              <p className="text-gray-600 mb-4">
                Registre correções, melhorias e manutenções realizadas durante a ronda.
              </p>
              <Button onClick={onAdicionarOutroItem} className="bg-green-600 hover:bg-green-700">
                <Wrench className="w-4 h-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ronda.outrosItensCorrigidos.map((item) => (
                <div key={item.id} className="bg-white border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-green-600" />
                      {item.nome}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditarOutroItem(item)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Editar item"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletarOutroItem(item.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        title="Excluir item"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {item.tipo}
                    </Badge>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {item.prioridade}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium">Descrição:</span> {item.descricao}</div>
                    <div><span className="font-medium">Local:</span> {item.local}</div>
                    {item.responsavel && (
                      <div><span className="font-medium">Responsável:</span> {item.responsavel}</div>
                    )}
                  </div>
                  
                  {item.foto && (
                    <div className="relative">
                      <img 
                        src={item.foto} 
                        alt={`Item corrigido - ${item.nome}`}
                        className="w-full h-32 object-cover rounded-lg border shadow-sm"
                      />
                    </div>
                  )}
                  
                  {item.observacoes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Observações:</span> {item.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
