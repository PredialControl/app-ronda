// src/components/VisualizarRonda.tsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AreaTecnica, Ronda, Contrato, SecaoRonda, ChecklistItem } from '@/types';
import { downloadRelatorioPDF } from '@/lib/pdfReact';
import { rondaService } from '@/lib/supabaseService';
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
  Save,
  X,
  ClipboardList,
} from 'lucide-react';
import { AreaTecnicaCard } from './AreaTecnicaCard';
import { ChecklistRondaCard } from './ChecklistRondaCard';
import { ChecklistItemModal } from './ChecklistItemModal';

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

// Componente para gerenciar as seções do relatório
function SecoesRelatorio({ ronda }: { ronda: Ronda }) {
  const numerosRomanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

  // Objetivo padrão (quando não tem objetivo específico do template)
  const objetivoPadrao = 'O presente relatório tem como finalidade apresentar de forma clara, técnica e organizada o status atual dos equipamentos e das áreas comuns do empreendimento. Seu intuito é fornecer uma visão consolidada das condições operacionais, de conservação e de segurança de cada sistema inspecionado, permitindo identificar pendências, riscos potenciais e necessidades de manutenção preventiva ou corretiva.\n\nAlém de registrar as constatações verificadas durante a vistoria, este relatório busca auxiliar a gestão predial no planejamento das ações necessárias, apoiando a tomada de decisão e garantindo maior controle sobre o desempenho e a vida útil dos equipamentos. Dessa forma, o documento contribui para a manutenção da qualidade, segurança e funcionalidade das instalações, promovendo a continuidade das operações e o bem-estar dos usuários.';

  // Título dinâmico baseado no tipo de ronda
  const getTituloObjetivo = () => {
    if (ronda.templateRonda === 'SEMANAL') return 'Objetivo do Relatório de Vistoria Semanal de Equipamentos';
    if (ronda.templateRonda === 'MENSAL') return 'Objetivo do Relatório de Inspeção de Sistemas de Incêndio';
    if (ronda.templateRonda === 'BIMESTRAL') return 'Objetivo do Relatório de Vistoria das Áreas Comuns';
    return 'Objetivo do Relatório de Status de Equipamentos e Áreas Comuns';
  };

  const secoesPadrao: SecaoRonda[] = [{
    id: 'objetivo-default',
    ordem: 1,
    titulo: getTituloObjetivo(),
    conteudo: ronda.objetivoRelatorio || objetivoPadrao
  }];

  const [secoes, setSecoes] = useState<SecaoRonda[]>(() => {
    console.log('🔄 INICIALIZANDO seções - ronda.secoes:', ronda.secoes);
    return ronda.secoes || secoesPadrao;
  });

  const [editandoSecao, setEditandoSecao] = useState<string | null>(null);
  const [novaSecao, setNovaSecao] = useState({ titulo: '', conteudo: '' });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  // Atualizar seções quando a ronda mudar (ao voltar para a tela)
  useEffect(() => {
    console.log('🔄 USEEFFECT DISPARADO - Ronda ID:', ronda.id);
    console.log('🔄 Seções vindas dos props (ronda.secoes):', ronda.secoes);

    if (ronda.secoes) {
      console.log('🔄 ATUALIZANDO seções com dados dos props:', ronda.secoes);
      setSecoes(ronda.secoes);
    } else {
      console.log('🔄 Sem seções nos props, usando padrão');
      setSecoes(secoesPadrao);
    }
  }, [ronda.id, ronda.secoes]);

  const adicionarSecao = async () => {
    if (!novaSecao.titulo.trim()) {
      alert('Por favor, preencha o título da seção');
      return;
    }

    const novaOrdem = secoes.length + 1;
    const secao: SecaoRonda = {
      id: `secao-${Date.now()}`,
      ordem: novaOrdem,
      titulo: novaSecao.titulo,
      conteudo: novaSecao.conteudo
    };

    const novasSecoes = [...secoes, secao];

    console.log('🔥 ADICIONANDO SEÇÃO');
    console.log('🔥 Ronda ID:', ronda.id);
    console.log('🔥 Nova seção:', secao);
    console.log('🔥 Total de seções (antes):', secoes.length);
    console.log('🔥 Total de seções (depois):', novasSecoes.length);

    // SALVAR NO SUPABASE
    try {
      console.log('🔍 Verificando tipo de ronda - ID:', ronda.id);
      console.log('🔍 Começa com local-?', ronda.id.startsWith('local-'));

      if (!ronda.id.startsWith('local-')) {
        console.log('💾 Salvando seções no Supabase...');
        console.log('💾 Ronda ID:', ronda.id);
        console.log('💾 Seções a salvar:', JSON.stringify(novasSecoes, null, 2));

        const resultado = await rondaService.update(ronda.id, { secoes: novasSecoes });
        console.log('✅ Resultado do Supabase:', resultado);
        console.log('✅ Seções salvas no Supabase!');
      } else {
        console.log('🏠 Ronda local - salvando no localStorage');
        // SALVAR IMEDIATAMENTE no localStorage para rondas locais
        const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
        const index = rondas.findIndex((r: Ronda) => r.id === ronda.id);

        if (index !== -1) {
          rondas[index] = {
            ...rondas[index],
            secoes: novasSecoes
          };
          localStorage.setItem('rondas', JSON.stringify(rondas));
          console.log('✅ Seções salvas no localStorage!');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar seções:', error);
      alert('Erro ao salvar seção. Tente novamente.');
      return;
    }

    setSecoes(novasSecoes);
    setNovaSecao({ titulo: '', conteudo: '' });
    setMostrandoFormulario(false);

    alert(`Seção "${secao.titulo}" adicionada com sucesso!\n\nTotal de seções: ${novasSecoes.length}`);
  };

  const editarSecao = async (id: string, titulo: string, conteudo: string) => {
    const secoesAtualizadas = secoes.map(s =>
      s.id === id ? { ...s, titulo, conteudo } : s
    );

    console.log('✏️ EDITANDO SEÇÃO:', id);
    console.log('✏️ Novo título:', titulo);
    console.log('✏️ Novo conteúdo:', conteudo);

    // SALVAR NO SUPABASE OU LOCALSTORAGE
    try {
      if (!ronda.id.startsWith('local-')) {
        console.log('💾 Salvando seções editadas no Supabase...');
        await rondaService.update(ronda.id, { secoes: secoesAtualizadas });
        console.log('✅ Seções editadas salvas no Supabase!');
      } else {
        const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
        const index = rondas.findIndex((r: Ronda) => r.id === ronda.id);

        if (index !== -1) {
          rondas[index] = {
            ...rondas[index],
            secoes: secoesAtualizadas
          };
          localStorage.setItem('rondas', JSON.stringify(rondas));
          console.log('✏️ EDITADO E SALVO NO LOCALSTORAGE!');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar edição:', error);
      alert('Erro ao salvar edição. Tente novamente.');
      return;
    }

    setSecoes(secoesAtualizadas);
    setEditandoSecao(null);
  };

  const deletarSecao = async (id: string) => {
    const secoesAtualizadas = secoes.filter(s => s.id !== id);
    // Reordenar
    const secoesReordenadas = secoesAtualizadas.map((s, index) => ({
      ...s,
      ordem: index + 1
    }));

    console.log('🗑️ DELETANDO SEÇÃO:', id);

    // SALVAR NO SUPABASE OU LOCALSTORAGE
    try {
      if (!ronda.id.startsWith('local-')) {
        console.log('💾 Salvando seções após deletar no Supabase...');
        await rondaService.update(ronda.id, { secoes: secoesReordenadas });
        console.log('✅ Seções deletadas salvas no Supabase!');
      } else {
        const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
        const index = rondas.findIndex((r: Ronda) => r.id === ronda.id);

        if (index !== -1) {
          rondas[index] = {
            ...rondas[index],
            secoes: secoesReordenadas
          };
          localStorage.setItem('rondas', JSON.stringify(rondas));
          console.log('🗑️ DELETADO E SALVO NO LOCALSTORAGE!');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar após deletar:', error);
      alert('Erro ao deletar seção. Tente novamente.');
      return;
    }

    setSecoes(secoesReordenadas);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Seções do Relatório
          </CardTitle>
          <Button onClick={() => setMostrandoFormulario(!mostrandoFormulario)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Seção
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para nova seção */}
        {mostrandoFormulario && (
          <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50 space-y-3">
            <div>
              <label className="text-sm font-bold mb-1 block" style={{ color: '#000000' }}>
                Título da Seção
              </label>
              <Input
                value={novaSecao.titulo}
                onChange={(e) => setNovaSecao({ ...novaSecao, titulo: e.target.value })}
                placeholder="Ex: Observações, Recomendações, etc."
                className="w-full border-2"
                style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#666666' }}
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-1 block" style={{ color: '#000000' }}>
                Conteúdo
              </label>
              <Textarea
                value={novaSecao.conteudo}
                onChange={(e) => setNovaSecao({ ...novaSecao, conteudo: e.target.value })}
                placeholder="Digite o conteúdo da seção..."
                rows={4}
                className="w-full border-2"
                style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#666666' }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setMostrandoFormulario(false);
                setNovaSecao({ titulo: '', conteudo: '' });
              }}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={adicionarSecao} className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Seção
              </Button>
            </div>
          </div>
        )}

        {/* Lista de seções */}
        <div className="space-y-3">
          {secoes.sort((a, b) => a.ordem - b.ordem).map((secao) => (
            <div key={secao.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
              {editandoSecao === secao.id ? (
                <EditarSecaoForm
                  secao={secao}
                  onSalvar={(titulo, conteudo) => editarSecao(secao.id, titulo, conteudo)}
                  onCancelar={() => setEditandoSecao(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800">
                        {numerosRomanos[secao.ordem - 1] || secao.ordem} - {secao.titulo}
                      </h4>
                      <div className="mt-2 text-gray-700 whitespace-pre-wrap text-sm">
                        {secao.conteudo}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditandoSecao(secao.id)}>
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      {secao.id !== 'objetivo-default' && (
                        <Button variant="ghost" size="sm" onClick={() => deletarSecao(secao.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {secoes.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma seção criada ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente auxiliar para editar seção
function EditarSecaoForm({
  secao,
  onSalvar,
  onCancelar
}: {
  secao: SecaoRonda;
  onSalvar: (titulo: string, conteudo: string) => void;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(secao.titulo);
  const [conteudo, setConteudo] = useState(secao.conteudo);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-bold mb-1 block" style={{ color: '#000000' }}>
          Título da Seção
        </label>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full border-2"
          style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#666666' }}
        />
      </div>
      <div>
        <label className="text-sm font-bold mb-1 block" style={{ color: '#000000' }}>
          Conteúdo
        </label>
        <Textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={4}
          className="w-full border-2"
          style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#666666' }}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancelar}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={() => onSalvar(titulo, conteudo)} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  );
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

  // ---------- DEBUG: Log quando ronda muda ----------
  useEffect(() => {
    console.log('🔍 VisualizarRonda RENDER - ronda props:', {
      id: ronda.id,
      nome: ronda.nome,
      templateRonda: ronda.templateRonda,
      roteiro: ronda.roteiro,
      roteiroLength: ronda.roteiro?.length || 0
    });
  }, [ronda.id, ronda.roteiro]);

  // ---------- Checklist State ----------
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(ronda.checklistItems || []);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItem | null>(null);

  // Atualizar checklist quando ronda mudar
  useEffect(() => {
    setChecklistItems(ronda.checklistItems || []);
  }, [ronda.checklistItems]);

  // Salvar checklist item
  const handleSaveChecklistItem = async (item: ChecklistItem) => {
    const updatedItem = { ...item, rondaId: ronda.id };
    let novaLista: ChecklistItem[];

    if (editingChecklistItem) {
      novaLista = checklistItems.map(i => i.id === item.id ? updatedItem : i);
    } else {
      novaLista = [...checklistItems, updatedItem];
    }

    setChecklistItems(novaLista);

    // Salvar no Supabase ou localStorage
    try {
      if (!ronda.id.startsWith('local-')) {
        await rondaService.update(ronda.id, { checklistItems: novaLista });
      } else {
        const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
        const index = rondas.findIndex((r: Ronda) => r.id === ronda.id);
        if (index !== -1) {
          rondas[index] = { ...rondas[index], checklistItems: novaLista };
          localStorage.setItem('rondas', JSON.stringify(rondas));
        }
      }
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
    }

    setEditingChecklistItem(null);
  };

  // Deletar checklist item
  const handleDeleteChecklistItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    const novaLista = checklistItems.filter(i => i.id !== id);
    setChecklistItems(novaLista);

    try {
      if (!ronda.id.startsWith('local-')) {
        await rondaService.update(ronda.id, { checklistItems: novaLista });
      } else {
        const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
        const index = rondas.findIndex((r: Ronda) => r.id === ronda.id);
        if (index !== -1) {
          rondas[index] = { ...rondas[index], checklistItems: novaLista };
          localStorage.setItem('rondas', JSON.stringify(rondas));
        }
      }
    } catch (error) {
      console.error('Erro ao deletar item do checklist:', error);
    }
  };

  // Editar item existente
  const handleEditChecklistItem = (item: ChecklistItem) => {
    setEditingChecklistItem(item);
    setChecklistModalOpen(true);
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button onClick={onVoltar} variant="outline" size="sm" className="px-2 sm:px-3 flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Voltar</span>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{ronda.nome}</h1>
                <Badge variant="outline" className={`flex-shrink-0 text-xs
                  ${(ronda.tipoVisita === 'REUNIAO') ? 'bg-green-100 text-green-800 border-green-200' :
                    (ronda.tipoVisita === 'OUTROS') ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'}
                `}>
                  {ronda.tipoVisita === 'REUNIAO' ? '👥 Reunião' :
                    ronda.tipoVisita === 'OUTROS' ? '📋 Outros' :
                      '🔍 Ronda'}
                </Badge>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm truncate">{contrato.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
            <Button onClick={onEditarRonda} variant="outline" size="sm">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Editar</span>
            </Button>
            <Button
              onClick={async () => {
                try {
                  // Buscar a ronda atualizada do localStorage
                  const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
                  const rondaAtualizada = rondas.find((r: Ronda) => r.id === ronda.id) || ronda;

                  console.log('📄 Gerando PDF com seções:', rondaAtualizada.secoes);
                  await downloadRelatorioPDF(rondaAtualizada, contrato, areasTecnicas, headerImage);
                } catch (e) {
                  console.error(e);
                  alert('Erro ao exportar PDF');
                }
              }}
              variant="outline"
              size="sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">PDF</span>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <div className="text-xs sm:text-sm font-medium text-gray-500">Data</div>
                <div className="text-sm sm:text-lg font-semibold">
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
                {ronda.roteiro && ronda.roteiro.length > 0 ? (
                  <>
                    <div className="text-sm font-medium text-gray-500">Itens do Checklist</div>
                    <div className="text-lg font-semibold text-emerald-600">
                      {checklistItems.filter(i => i.status === 'OK').length}/{ronda.roteiro.length}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-500">Áreas Verificadas</div>
                    <div className="text-lg font-semibold text-blue-600">{areasTecnicas.length}</div>
                  </>
                )}
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

        {/* Seções do Relatório */}
        <SecoesRelatorio ronda={ronda} />

        {/* Áreas Técnicas - NÃO mostrar quando ronda tem roteiro/template */}
        {!(ronda.roteiro && ronda.roteiro.length > 0) && (
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
        )}

        {/* Checklist da Ronda (se tem roteiro) */}
        {ronda.roteiro && ronda.roteiro.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  Checklist da Ronda
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {checklistItems.length} registros
                  </Badge>
                </CardTitle>
                <Button
                  onClick={() => {
                    setEditingChecklistItem(null);
                    setChecklistModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {checklistItems.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Nenhum registro ainda</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Clique em "Adicionar" para registrar extintores, mangueiras, hidrantes...
                  </p>
                  <Button
                    onClick={() => {
                      setEditingChecklistItem(null);
                      setChecklistModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Registro
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {checklistItems.map(item => (
                    <ChecklistRondaCard
                      key={item.id}
                      item={item}
                      onEdit={handleEditChecklistItem}
                      onDelete={handleDeleteChecklistItem}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Itens Abertura de Chamado - NÃO mostrar quando ronda tem roteiro/template */}
        {!(ronda.roteiro && ronda.roteiro.length > 0) && (
          <>
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
          </>
        )}

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
                    <li key={idx} className="flex items-start gap-2" style={{ color: '#000000' }}>
                      <span className="mt-1" style={{ color: '#000000' }}>•</span>
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
                <h3 className="font-bold flex items-center gap-2 mb-3" style={{ color: '#000000' }}>
                  <AlertCircle className="w-5 h-5" />
                  ⚠️ Equipamentos em Atenção / Em Manutenção
                </h3>
                <ul className="space-y-2">
                  {resumoExecutivo.equipamentosAtencao.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2" style={{ color: '#000000' }}>
                      <span className="mt-1" style={{ color: '#000000' }}>•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Equipamentos Status Normal */}
            {resumoExecutivo.equipamentosNormais.length > 0 && (
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h3 className="font-bold flex items-center gap-2 mb-3" style={{ color: '#000000' }}>
                  <CheckCircle className="w-5 h-5" />
                  ✅ Equipamentos Status Normal
                </h3>
                <ul className="space-y-2">
                  {resumoExecutivo.equipamentosNormais.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2" style={{ color: '#000000' }}>
                      <span className="mt-1" style={{ color: '#000000' }}>•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Chamados Abertos */}
            {resumoExecutivo.chamadosAbertos.length > 0 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h3 className="font-bold flex items-center gap-2 mb-3" style={{ color: '#000000' }}>
                  <AlertTriangle className="w-5 h-5" />
                  🔧 Itens para Abertura de Chamado
                </h3>
                <ul className="space-y-2">
                  {resumoExecutivo.chamadosAbertos.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2" style={{ color: '#000000' }}>
                      <span className="mt-1" style={{ color: '#000000' }}>•</span>
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

      {/* Modal do Checklist */}
      <ChecklistItemModal
        isOpen={checklistModalOpen}
        onClose={() => {
          setChecklistModalOpen(false);
          setEditingChecklistItem(null);
        }}
        item={editingChecklistItem}
        roteiro={ronda.roteiro || []}
        onSave={handleSaveChecklistItem}
      />
    </>
  );
}
