
import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaTecnica, Ronda, Contrato } from '@/types';
import { downloadRelatorioPDF } from '@/lib/pdfReact';
import { ArrowLeft, FileText, AlertTriangle, Edit, Plus, Trash2, Wrench, BarChart3, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { AreaTecnicaCard } from './AreaTecnicaCard';
// Removed bulk import modals per user request

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
  
  // Função para lidar com edição de itens (incluindo fotos individuais)
  const handleEditarItem = (item: any) => {
    // Se é uma foto individual, criar um item separado apenas com essa foto
    if ((item as any).originalId) {
      const itemOriginal = ronda.outrosItensCorrigidos?.find(originalItem => originalItem.id === (item as any).originalId);
      if (itemOriginal) {
        // Criar um item separado apenas com a foto selecionada
        const itemSeparado = {
          ...itemOriginal,
          id: item.id, // Usar o ID único da foto individual
          nome: item.nome, // Usar o nome da foto individual
          foto: item.foto, // Usar apenas a foto específica
          fotos: [item.foto], // Array com apenas essa foto
          categoria: itemOriginal.categoria || 'CHAMADO', // Preservar categoria
          // Adicionar flag para indicar que é uma edição de foto individual
          isIndividualPhotoEdit: true,
          originalItemId: itemOriginal.id // Manter referência ao item original
        };
        
        console.log('🔄 Editando foto individual:', {
          originalItem: itemOriginal,
          itemSeparado: itemSeparado,
          fotoIndividual: item
        });
        
        onEditarOutroItem(itemSeparado);
        return;
      }
    }
    // Caso contrário, usar o item normalmente
    onEditarOutroItem(item);
  };

  // Função para lidar com exclusão de itens
  const handleDeletarItem = (item: any) => {
    // Se é uma foto individual, deletar o item original (todas as fotos)
    if ((item as any).originalId) {
      onDeletarOutroItem((item as any).originalId);
      return;
    }
    // Caso contrário, deletar normalmente
    onDeletarOutroItem(item.id);
  };

  // Função para determinar se um item é um chamado
  const isItemChamado = (item: any) => {
    console.log('🔍 Verificando se item é chamado:', {
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      fotos: item.fotos?.length,
      descricao: item.descricao,
      local: item.local
    });
    
    // SEMPRE usar categoria se definida (prioridade máxima)
    if (item.categoria !== undefined && item.categoria !== null) {
      const isChamado = item.categoria === 'CHAMADO';
      console.log('🔍 Item tem categoria definida:', item.categoria, '→ É chamado:', isChamado);
      return isChamado;
    }
    
    // Lógica alternativa APENAS se categoria não estiver definida
    const isChamadoAlternativo = (
      (item.fotos && item.fotos.length > 1) ||
      item.nome?.includes('Item com') ||
      item.descricao?.includes('Item registrado com fotos') ||
      item.local?.includes('Local a definir')
    );
    
    console.log('🔍 Item sem categoria, usando lógica alternativa → É chamado:', isChamadoAlternativo);
    return isChamadoAlternativo;
  };

  // Função para determinar se um item é corrigido
  const isItemCorrigido = (item: any) => {
    console.log('🔍 Verificando se item é corrigido:', {
      id: item.id,
      nome: item.nome,
      categoria: item.categoria
    });
    
    // SEMPRE usar categoria se definida (prioridade máxima)
    if (item.categoria !== undefined && item.categoria !== null) {
      const isCorrigido = item.categoria === 'CORRIGIDO';
      console.log('🔍 Item tem categoria definida:', item.categoria, '→ É corrigido:', isCorrigido);
      return isCorrigido;
    }
    
    // Lógica alternativa: se não é chamado, é corrigido
    const isCorrigidoAlternativo = !isItemChamado(item);
    console.log('🔍 Item sem categoria, usando lógica alternativa → É corrigido:', isCorrigidoAlternativo);
    return isCorrigidoAlternativo;
  };
  
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
  if (ronda?.fotosRonda && Array.isArray(ronda.fotosRonda)) {
    console.log('📸 Fotos da ronda recebidas:', ronda.fotosRonda);
    ronda.fotosRonda.forEach((foto, index) => {
      if (foto && foto.id) {
      console.log(`📸 Foto ${index + 1}:`, {
        id: foto.id,
        local: foto.local,
        especialidade: foto.especialidade,
        pendencia: foto.pendencia,
        temFoto: !!foto.foto,
        fotoLength: foto.foto?.length || 0
      });
      }
    });
  } else {
    console.log('📸 Nenhuma foto encontrada ou array inválido:', ronda?.fotosRonda);
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
      if (!area || !area.status) return; // Pular áreas nulas ou sem status
      
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
      const criticidade = (item as any).criticidade || 'Média';
      const textoPendencia = item.pendencia ? `Pendência: ${item.pendencia}` : `${item.especialidade} – ${item.local}`;
      
      if (criticidade === 'Alta') {
        criticos.push(`${item.especialidade} (${item.local}): ${textoPendencia}`);
      } else if (criticidade === 'Média') {
        altaRelevancia.push(`${item.especialidade} (${item.local}): ${textoPendencia}`);
      } else {
        chamadosAbertos.push(`${item.especialidade} (${item.local}): ${textoPendencia}`);
      }
    });

    // Analisar itens corrigidos
    ronda.outrosItensCorrigidos.forEach(item => {
      if (!item || !item.status) return; // Pular itens nulos ou sem status
      
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
          <Button 
            onClick={async () => {
              try {
                await downloadRelatorioPDF(ronda, contrato, areasTecnicas, headerImage);
              } catch (error) {
                console.error('Erro ao exportar PDF:', error);
                alert('Erro ao exportar PDF. Tente novamente.');
              }
            }} 
            variant="outline"
          >
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
            <Button onClick={onAdicionarOutroItem} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const itensChamados = ronda.outrosItensCorrigidos?.filter(item => isItemChamado(item)) || [];
            console.log('🔍 DEBUG CHAMADOS - Total de itens:', ronda.outrosItensCorrigidos?.length || 0);
            console.log('🔍 DEBUG CHAMADOS - Itens chamados:', itensChamados.length);
            console.log('🔍 DEBUG CHAMADOS - Lista completa:', ronda.outrosItensCorrigidos);
            console.log('🔍 DEBUG CHAMADOS - Itens filtrados:', itensChamados);
            
            return !ronda.outrosItensCorrigidos || itensChamados.length === 0;
          })() ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                Nenhum item para abertura de chamado registrado ainda.
              </p>
              <p className="text-gray-600 mb-4">
                Registre itens que precisam de atenção, manutenção ou correção durante a ronda.
              </p>
              <Button onClick={onAdicionarOutroItem} className="bg-orange-600 hover:bg-orange-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Registrar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-grid-2x2">
              {ronda.outrosItensCorrigidos?.filter(item => item && item.id && isItemChamado(item)).flatMap((item) => {
                // Se há múltiplas fotos, criar um card para cada foto
                if (item.fotos && item.fotos.length > 1) {
                  return item.fotos.map((foto, fotoIndex) => ({
                    ...item,
                    id: `${item.id}-foto-${fotoIndex}`, // ID único para renderização
                    originalId: item.id, // Manter ID original para edição
                    foto: foto,
                    fotos: [foto], // Apenas uma foto por card
                    nome: `${item.nome} - Foto ${fotoIndex + 1}`
                  }));
                }
                // Se há apenas uma foto ou nenhuma, manter o item original
                return [item];
              }).map((item) => (
                <div key={item.id} className="bg-white border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      {item.nome}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditarItem(item)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Editar item"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletarItem(item)}
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
                      {item.status || 'N/A'}
                    </Badge>
                  </div>
                  
                  {/* Mostrar foto única (cada card agora representa uma foto) */}
                  {item.foto && (
                  <div className="relative">
                      <img 
                        src={item.foto} 
                        alt={`Item corrigido - ${item.nome}`}
                        className="w-full h-32 object-cover rounded-lg border shadow-sm"
                      />
                    </div>
                  )}
                  
                  {/* Sem fotos */}
                  {!item.foto && (
                      <div className="w-full h-32 bg-gray-100 rounded-lg border shadow-sm flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Sem foto</p>
                        </div>
                      </div>
                    )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium">Descrição:</span> {item.descricao}</div>
                    <div><span className="font-medium">Local:</span> {item.local}</div>
                    {item.responsavel && (
                    <div><span className="font-medium">Responsável:</span> {item.responsavel}</div>
                    )}
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
          {(() => {
            const itensCorrigidos = ronda.outrosItensCorrigidos.filter(item => isItemCorrigido(item));
            console.log('🔍 DEBUG CORRIGIDOS - Total de itens:', ronda.outrosItensCorrigidos?.length || 0);
            console.log('🔍 DEBUG CORRIGIDOS - Itens corrigidos:', itensCorrigidos.length);
            console.log('🔍 DEBUG CORRIGIDOS - Lista completa:', ronda.outrosItensCorrigidos);
            console.log('🔍 DEBUG CORRIGIDOS - Itens filtrados:', itensCorrigidos);
            
            return itensCorrigidos.length === 0;
          })() ? (
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
              {ronda.outrosItensCorrigidos?.filter(item => item && item.id && isItemCorrigido(item)).map((item) => (
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
                        onClick={() => handleEditarItem(item)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Editar item"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletarItem(item)}
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
                      {item.status || 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium">Descrição:</span> {item.descricao}</div>
                    <div><span className="font-medium">Local:</span> {item.local}</div>
                    {item.responsavel && (
                      <div><span className="font-medium">Responsável:</span> {item.responsavel}</div>
                    )}
                  </div>
                  
                  {/* Mostrar múltiplas fotos */}
                  {(item.fotos && item.fotos.length > 0) && (
                    <div className="relative">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {item.fotos.map((foto, fotoIndex) => (
                          <img 
                            key={fotoIndex}
                            src={foto} 
                            alt={`${item.nome} - Foto ${fotoIndex + 1}`}
                            className="w-full h-20 object-cover rounded-lg border shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback para foto única (compatibilidade) */}
                  {(!item.fotos || item.fotos.length === 0) && item.foto && (
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
            <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5" />
                ⚠️ Atenção
              </h3>
              <ul className="space-y-2">
                {resumoExecutivo.criticos.map((item, index) => (
                  <li key={index} className="text-orange-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
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
    </>
  );
}
