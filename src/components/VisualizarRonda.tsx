
import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaTecnica, Ronda, Contrato } from '@/types';
import { downloadRelatorioPDF, RelatorioPDF, preparePdfData } from '@/lib/pdfReact';
import { PDFViewer } from '@react-pdf/renderer';
import { ArrowLeft, FileText, AlertTriangle, Edit, Plus, Trash2, Wrench, BarChart3, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
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
  onExportarJSON,
  isPrintMode
}: VisualizarRondaProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Carregar logo salvo uma única vez
  useEffect(() => {
    const saved = localStorage.getItem('pdf_header_image');
    if (saved && saved.trim() !== '') {
      setHeaderImage(saved);
    } else {
      setHeaderImage(`${window.location.origin}/manu.png`);
    }
  }, []);

  // Persistir alterações
  useEffect(() => {
    if (headerImage) {
      localStorage.setItem('pdf_header_image', headerImage);
    }
  }, [headerImage]);
  // Debug: Log das props recebidas
  console.log('🔄 VisualizarRonda renderizado com:', {
    rondaId: ronda?.id,
    rondaNome: ronda?.nome,
    fotosRonda: ronda?.fotosRonda?.length || 0,
    areasTecnicas: areasTecnicas?.length || 0,
    outrosItens: ronda?.outrosItensCorrigidos?.length || 0
  });

  // Debug: Log detalhado das fotos
  if (ronda?.fotosRonda) {
    console.log('📸 Fotos da ronda recebidas:', ronda.fotosRonda);
    ronda.fotosRonda.forEach((foto, index) => {
      console.log(`📸 Foto ${index + 1}:`, {
        id: foto.id,
        local: foto.local,
        especialidade: foto.especialidade,
        pendencia: foto.pendencia,
        temFoto: !!foto.foto
      });
    });
  }

  if (isPrintMode) {
    return null; // O PrintRonda será renderizado separadamente
  }

  // Lógica para gerar resumo executivo
  const resumoExecutivo = useMemo(() => {
    const criticos: string[] = [];
    const altaRelevancia: string[] = [];
    const chamadosAbertos: string[] = [];
    const situacaoNormal: string[] = [];
    const itensCorrigidos: string[] = [];

    // Analisar áreas técnicas
    areasTecnicas.forEach(area => {
      if (area.status === 'ATENÇÃO') {
        criticos.push(`${area.nome}: ${area.observacoes || 'Status crítico'}`);
      } else if (area.status === 'EM MANUTENÇÃO') {
        altaRelevancia.push(`${area.nome}: ${area.observacoes || 'Em manutenção'}`);
      } else {
        situacaoNormal.push(`${area.nome}: Operacional`);
      }
    });

    // Analisar itens de chamado
    ronda.fotosRonda.forEach(item => {
      if (item.pendencia === 'URGENTE') {
        criticos.push(`${item.especialidade} (${item.local}): ${item.observacoes || 'Pendência urgente'}`);
      } else if (item.pendencia === 'ALTA') {
        altaRelevancia.push(`${item.especialidade} (${item.local}): ${item.observacoes || 'Pendência alta'}`);
      } else {
        chamadosAbertos.push(`${item.especialidade} (${item.local}): ${item.observacoes || 'Pendência média/baixa'}`);
      }
    });

    // Analisar itens corrigidos
    ronda.outrosItensCorrigidos.forEach(item => {
      if (item.status === 'CONCLUÍDO') {
        itensCorrigidos.push(`${item.nome} (${item.local}): ${item.observacoes || 'Item corrigido'}`);
      }
    });

    return {
      criticos,
      altaRelevancia,
      chamadosAbertos,
      situacaoNormal,
      itensCorrigidos
    };
  }, [areasTecnicas, ronda.fotosRonda, ronda.outrosItensCorrigidos]);

  return (
    <>
    <div id="print-container" className="space-y-6 print-container">
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
        
        <div className="flex gap-2 items-center">
          {/* Seletor de imagem do cabeçalho */}
          <input ref={headerInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => setHeaderImage(reader.result as string);
            reader.readAsDataURL(file);
          }} />
          <Button variant="outline" onClick={() => headerInputRef.current?.click()}>
            Escolher Logo
          </Button>
          {headerImage && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              Logo carregado
            </span>
          )}
          <Button variant="ghost" onClick={() => setHeaderImage(`${window.location.origin}/manu.png`)}>
            Usar padrão
          </Button>
          <Button onClick={onEditarRonda} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar Ronda
          </Button>
          <Button onClick={async () => {
            // garantir que as imagens sejam normalizadas na prévia também
            const { rondaNormalized, areasNormalized } = await preparePdfData(ronda, areasTecnicas);
            // substitui dados apenas no viewer, sem alterar estado global
            (window as any).__pdfPreviewData = { ronda: rondaNormalized, areas: areasNormalized };
            ;(window as any).__pdfHeaderImage = headerImage;
            setShowPdfPreview(true);
          }} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Prévia PDF
          </Button>
          <Button onClick={() => downloadRelatorioPDF(ronda, contrato, areasTecnicas, headerImage)} className="bg-blue-600 hover:bg-blue-700">
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
      <Card className="print-section avoid-break">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-grid-2-per-page">
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
      <Card className="print-section avoid-break">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-grid-2x2">
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
                    <div><span className="font-medium">Pendência:</span> {item.pendencia}</div>
                    <div><span className="font-medium">Criticidade:</span> {item.pendencia}</div>
                    <div><span className="font-medium">Responsável:</span> {item.responsavel}</div>
                    <div><span className="font-medium">Especialidade:</span> {item.especialidade}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-grid-2x2">
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

      {/* Resumo Executivo */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="w-6 h-6" />
            📊 Resumo Executivo – Pontos Críticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Críticos */}
          {resumoExecutivo.criticos.length > 0 && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5" />
                🚨 Críticos
              </h3>
              <ul className="space-y-2">
                {resumoExecutivo.criticos.map((item, index) => (
                  <li key={index} className="text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alta Relevância */}
          {resumoExecutivo.altaRelevancia.length > 0 && (
            <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5" />
                ⚠️ Alta Relevância
              </h3>
              <ul className="space-y-2">
                {resumoExecutivo.altaRelevancia.map((item, index) => (
                  <li key={index} className="text-orange-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chamados Abertos */}
          {resumoExecutivo.chamadosAbertos.length > 0 && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                🔧 Chamados Abertos
              </h3>
              <ul className="space-y-2">
                {resumoExecutivo.chamadosAbertos.map((item, index) => (
                  <li key={index} className="text-yellow-700 flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Situação Normal */}
          {resumoExecutivo.situacaoNormal.length > 0 && (
            <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5" />
                ✅ Situação Normal
              </h3>
              <ul className="space-y-2">
                {resumoExecutivo.situacaoNormal.map((item, index) => (
                  <li key={index} className="text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Itens Corrigidos */}
          {resumoExecutivo.itensCorrigidos.length > 0 && (
            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                <Wrench className="w-5 h-5" />
                🛠 Itens Corrigidos
              </h3>
              <ul className="space-y-2">
                {resumoExecutivo.itensCorrigidos.map((item, index) => (
                  <li key={index} className="text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumo vazio */}
          {resumoExecutivo.criticos.length === 0 && 
           resumoExecutivo.altaRelevancia.length === 0 && 
           resumoExecutivo.chamadosAbertos.length === 0 && (
            <div className="text-center py-8">
              <Info className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <p className="text-blue-600 font-medium">
                Todas as áreas estão operacionais. Nenhum ponto crítico identificado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    {showPdfPreview && (
      <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
        <div className="bg-white p-2 flex justify-end">
          <Button variant="outline" onClick={() => setShowPdfPreview(false)}>Fechar</Button>
        </div>
        <div className="flex-1">
          <PDFViewer style={{ width: '100%', height: '100%' }}>
            <RelatorioPDF
              ronda={(window as any).__pdfPreviewData?.ronda || ronda}
              contrato={contrato}
              areas={(window as any).__pdfPreviewData?.areas || areasTecnicas}
              headerImage={(window as any).__pdfHeaderImage || `${window.location.origin}/manu.png`}
            />
          </PDFViewer>
        </div>
      </div>
    )}
    </>
  );
}
