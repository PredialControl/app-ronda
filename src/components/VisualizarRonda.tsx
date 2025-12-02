// src/components/VisualizarRonda.tsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaTecnica, Ronda, Contrato } from '@/types';
import { downloadRelatorioPDF } from '@/lib/pdfReact';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Edit,
  Plus,
  Trash2,
  Wrench,
  BarChart3,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';
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
  isPrintMode,
}: VisualizarRondaProps) {
  // ---------- Handlers ----------
  const handleEditarItem = (item: any) => {
    if ((item as any).originalId) {
      const original = ronda.outrosItensCorrigidos?.find(i => i.id === (item as any).originalId);
      if (original) {
        const novo = {
          ...original,
          id: item.id,
          nome: item.nome,
          foto: item.foto,
          fotos: [item.foto],
          categoria: original.categoria || 'CHAMADO',
          isIndividualPhotoEdit: true,
          originalItemId: original.id,
        };
        onEditarOutroItem(novo);
        return;
      }
    }
    onEditarOutroItem(item);
  };

  const handleDeletarItem = (item: any) => {
    console.log('🗑️ handleDeletarItem clicado:', item);
    // Se é uma foto individual (item splitado)
    if ((item as any).originalId) {
      const original = ronda.outrosItensCorrigidos?.find(i => i.id === (item as any).originalId);
      if (original && original.fotos && original.fotos.length > 1) {
        // Se tem mais de uma foto, remover apenas a foto específica
        const fotoParaRemover = item.foto;
        const novasFotos = original.fotos.filter((f: string) => f !== fotoParaRemover);

        // Atualizar o item com as novas fotos
        const itemAtualizado = {
          ...original,
          fotos: novasFotos,
          foto: novasFotos[0] // Atualizar a foto principal para a primeira das restantes
        };

        onEditarOutroItem(itemAtualizado);
        return;
      }
      // Se é a última foto ou não encontrou, deletar o item original
      onDeletarOutroItem((item as any).originalId);
    } else {
      // Item normal
      onDeletarOutroItem(item.id);
    }
  };

  const isItemChamado = (item: any) => {
    if (item.categoria !== undefined && item.categoria !== null) {
      return item.categoria === 'CHAMADO';
    }
    // fallback heuristic
    return (
      (item.fotos && item.fotos.length > 1) ||
      item.nome?.includes('Item') ||
      item.descricao?.includes('Item') ||
      item.local?.includes('Local')
    );
  };

  const isItemCorrigido = (item: any) => {
    if (item.categoria !== undefined && item.categoria !== null) {
      return item.categoria === 'CORRIGIDO';
    }
    return !isItemChamado(item);
  };

  // ---------- Header Image State ----------
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pdf_header_image');
    if (saved && saved.trim() !== '') {
      setHeaderImage(saved);
    } else {
      setHeaderImage(`${window.location.origin}/manu.png`);
    }
  }, []);

  useEffect(() => {
    if (headerImage) {
      localStorage.setItem('pdf_header_image', headerImage);
    }
  }, [headerImage]);

  // ---------- Executive Summary Logic ----------
  const resumoExecutivo = useMemo(() => {
    const equipamentosAtencao: string[] = [];
    const equipamentosNormais: string[] = [];
    const chamadosAbertos: string[] = [];
    const itensCorrigidos: string[] = [];

    // áreas técnicas
    areasTecnicas.forEach(area => {
      if (!area || !area.status) return;
      if (area.status === 'ATENÇÃO' || area.status === 'EM MANUTENÇÃO') {
        equipamentosAtencao.push(`${area.nome}: ${area.observacoes || area.status}`);
      } else {
        equipamentosNormais.push(`${area.nome}: Operacional`);
      }
    });

    // fotos da ronda (itens de chamado)
    ronda.fotosRonda.forEach(item => {
      const criticidade = (item as any).criticidade || 'Média';
      const texto = item.pendencia ? `Pendência: ${item.pendencia}` : `${item.especialidade} – ${item.local}`;
      if (criticidade === 'Alta' || criticidade === 'ALTA') {
        equipamentosAtencao.push(`${item.especialidade} (${item.local}): ${texto}`);
      } else {
        chamadosAbertos.push(`${item.especialidade} (${item.local}): ${texto}`);
      }
    });

    // outros itens (chamados ou corrigidos)
    ronda.outrosItensCorrigidos?.forEach(item => {
      if (!item) return;
      const isChamado = item.categoria === 'CHAMADO' || (!item.categoria && item.status === 'PENDENTE');
      if (isChamado && item.status === 'PENDENTE') {
        const prioridade = item.prioridade || 'MÉDIA';
        const especialidade = item.tipo || 'Geral';
        chamadosAbertos.push(`${especialidade} (${item.local}): ${item.descricao || item.nome} - Prioridade: ${prioridade}`);
      } else if (item.status === 'CONCLUÍDO') {
        itensCorrigidos.push(`${item.nome} (${item.local}): ${item.observacoes || item.descricao || 'Item corrigido'}`);
      }
    });

    return { equipamentosAtencao, equipamentosNormais, chamadosAbertos, itensCorrigidos };
  }, [areasTecnicas, ronda.fotosRonda, ronda.outrosItensCorrigidos]);

  if (isPrintMode) return null;

  return (
    <>
      <div id="print-container" className="space-y-6 print-container">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onVoltar} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Rondas
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{ronda.nome}</h1>
                <Badge variant="outline" className={`
                  ${(ronda.tipoVisita === 'REUNIAO') ? 'bg-green-100 text-green-800 border-green-200' :
                    (ronda.tipoVisita === 'OUTROS') ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'}
                `}>
                  {ronda.tipoVisita === 'REUNIAO' ? '👥 Reunião' :
                    ronda.tipoVisita === 'OUTROS' ? '📋 Outros' :
                      '🔍 Ronda'}
                </Badge>
              </div>
              <p className="text-gray-600">Contrato: {contrato.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={headerInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setHeaderImage(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
            <Button onClick={onEditarRonda} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Editar Ronda
            </Button>
            <Button
              onClick={async () => {
                try {
                  await downloadRelatorioPDF(ronda, contrato, areasTecnicas, headerImage);
                } catch (e) {
                  console.error(e);
                  alert('Erro ao exportar PDF');
                }
              }}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
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
                <div className="text-lg font-semibold">
                  {ronda.data ? (() => {
                    const [ano, mes, dia] = ronda.data.split('-');
                    return `${dia}/${mes}/${ano}`;
                  })() : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Hora</div>
                <div className="text-lg font-semibold">{ronda.hora || 'N/A'}</div>
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
                {areasTecnicas.map(area => (
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

        {/* Itens Abertura de Chamado */}
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
              const itensChamados = ronda.outrosItensCorrigidos?.filter(isItemChamado) || [];
              return itensChamados.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">Nenhum item para abertura de chamado registrado ainda.</p>
                  <p className="text-gray-600 mb-4">Registre itens que precisam de atenção, manutenção ou correção durante a ronda.</p>
                  <Button onClick={onAdicionarOutroItem} className="bg-orange-600 hover:bg-orange-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Registrar Primeiro Item
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-grid-2x2">
                  {ronda.outrosItensCorrigidos?.filter(isItemChamado).flatMap((item) => {
                    // Se há múltiplas fotos, criar um card para cada foto
                    if (item.fotos && item.fotos.length > 1) {
                      return item.fotos.map((foto: string, fotoIndex: number) => ({
                        ...item,
                        id: `${item.id}-foto-${fotoIndex}`, // ID único para renderização
                        originalId: item.id, // Manter ID original para edição
                        foto: foto, // Foto específica deste card
                        fotoIndex: fotoIndex, // Índice da foto para exclusão precisa
                        nome: `${item.nome} (${fotoIndex + 1}/${item.fotos.length})` // Indicador visual
                      }));
                    }
                    return [item];
                  }).map(item => (
                    <Card key={item.id} className="border">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">{item.nome}</CardTitle>
                        {/* Badges de Especialidade e Prioridade */}
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {item.tipo || 'Geral'}
                          </Badge>
                          <Badge variant="outline" className={`text-xs font-normal ${item.prioridade === 'ALTA' ? 'border-red-500 text-red-600' :
                            item.prioridade === 'MÉDIA' ? 'border-yellow-500 text-yellow-600' :
                              'border-green-500 text-green-600'
                            }`}>
                            {item.prioridade || 'Média'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {/* Imagem do Item */}
                        {item.foto && (
                          <div className="mb-3 rounded-md overflow-hidden h-40 bg-gray-100 border border-gray-200">
                            <img
                              src={item.foto}
                              alt={item.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Local:</span> {item.local}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Pendência:</span> {item.descricao || 'Não informada'}
                          </div>
                          {item.observacoes && (
                            <div>
                              <span className="font-semibold text-gray-700">Obs:</span> {item.observacoes}
                            </div>
                          )}
                          {item.responsavel && (
                            <div>
                              <span className="font-semibold text-gray-700">Resp:</span> {item.responsavel}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEditarItem(item)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleDeletarItem(item);
                          }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card >
                  ))
                  }
                </div >
              );
            })()}
          </CardContent >
        </Card >

        {/* Itens Corrigidos */}
        {
          resumoExecutivo.itensCorrigidos.length > 0 && (
            <Card className="print-section avoid-break mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Itens Corrigidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {resumoExecutivo.itensCorrigidos.map((i, idx) => (
                    <li key={idx} className="text-blue-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        }

        {/* Resumo Executivo */}
        <Card className="mt-8 print-section avoid-break">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Resumo Executivo – Pontos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Equipamentos em Atenção / Manutenção */}
            {resumoExecutivo.equipamentosAtencao.length > 0 && (
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5" />
                  ⚠️ Equipamentos em Atenção / Em Manutenção
                </h3>
                <ul className="space-y-2">
                  {resumoExecutivo.equipamentosAtencao.map((i, idx) => (
                    <li key={idx} className="text-orange-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Equipamentos Status Normal */}
            {resumoExecutivo.equipamentosNormais.length > 0 && (
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Equipamentos Status Normal
                </h3>
                <ul className="space-y-2">
                  {resumoExecutivo.equipamentosNormais.map((i, idx) => (
                    <li key={idx} className="text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{i}</span>
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
                  🔧 Itens para Abertura de Chamado
                </h3>
                <ul className="space-y-2">
                  {resumoExecutivo.chamadosAbertos.map((i, idx) => (
                    <li key={idx} className="text-yellow-700 flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Empty summary */}
            {resumoExecutivo.equipamentosAtencao.length === 0 &&
              resumoExecutivo.equipamentosNormais.length === 0 &&
              resumoExecutivo.chamadosAbertos.length === 0 &&
              resumoExecutivo.itensCorrigidos.length === 0 && (
                <div className="text-center py-8">
                  <Info className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <p className="text-blue-600 font-medium">Nenhuma informação registrada ainda.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div >
    </>
  );
}
