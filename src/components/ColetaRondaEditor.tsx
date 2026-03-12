import { useState, useEffect, useRef } from 'react';
import { Camera, Save, ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, AlertTriangle, XCircle, Mic, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { supabase } from '@/lib/supabase';
import { AreaTecnica, OutroItemCorrigido } from '@/types';

interface ColetaRondaEditorProps {
  rondaId: string;
  onVoltar: () => void;
  usuarioLogado: any;
}

interface Ronda {
  id: string;
  nome: string;
  contrato_id: string;
  data: string;
  hora: string;
  tipo_visita?: 'RONDA' | 'REUNIAO' | 'OUTROS';
  observacoes_gerais?: string;
  responsavel?: string;
}

export function ColetaRondaEditor({ rondaId, onVoltar, usuarioLogado }: ColetaRondaEditorProps) {
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const [areasTecnicas, setAreasTecnicas] = useState<AreaTecnica[]>([]);
  const [itensChamado, setItensChamado] = useState<OutroItemCorrigido[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Modal states
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaTecnica | null>(null);
  const [editingItem, setEditingItem] = useState<OutroItemCorrigido | null>(null);

  // Form states - Área Técnica
  const [areaNome, setAreaNome] = useState('');
  const [areaStatus, setAreaStatus] = useState<'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO'>('ATIVO');
  const [areaObservacoes, setAreaObservacoes] = useState('');
  const [areaFotos, setAreaFotos] = useState<string[]>([]);

  // Form states - Item de Chamado
  const [itemNome, setItemNome] = useState('');
  const [itemLocal, setItemLocal] = useState('');
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemTipo, setItemTipo] = useState<'CIVIL' | 'ELÉTRICA' | 'HIDRÁULICA' | 'MECÂNICA'>('CIVIL');
  const [itemPrioridade, setItemPrioridade] = useState<'BAIXA' | 'MÉDIA' | 'ALTA'>('MÉDIA');
  const [itemFotos, setItemFotos] = useState<string[]>([]);

  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [currentVoiceField, setCurrentVoiceField] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Auto-save
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    carregarRonda();
    initVoiceRecognition();

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [rondaId]);

  const initVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceResult(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const startVoiceCapture = (field: string) => {
    if (recognitionRef.current) {
      setCurrentVoiceField(field);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleVoiceResult = (text: string) => {
    switch (currentVoiceField) {
      case 'areaNome':
        setAreaNome(text);
        break;
      case 'areaObservacoes':
        setAreaObservacoes(prev => prev + (prev ? ' ' : '') + text);
        break;
      case 'itemNome':
        setItemNome(text);
        break;
      case 'itemLocal':
        setItemLocal(text);
        break;
      case 'itemDescricao':
        setItemDescricao(prev => prev + (prev ? ' ' : '') + text);
        break;
    }
  };

  const carregarRonda = async () => {
    try {
      setLoading(true);

      // Carregar dados da ronda
      const { data: rondaData, error: rondaError } = await supabase
        .from('rondas')
        .select('*')
        .eq('id', rondaId)
        .single();

      if (rondaError) throw rondaError;
      setRonda(rondaData);

      // Carregar áreas técnicas
      const { data: areasData, error: areasError } = await supabase
        .from('areas_tecnicas')
        .select('*')
        .eq('ronda_id', rondaId)
        .order('created_at', { ascending: true });

      if (!areasError && areasData) {
        const areasFormatadas = areasData.map((area: any) => ({
          id: area.id,
          nome: area.nome,
          status: area.status,
          testeStatus: area.teste_status,
          contrato: rondaData.contrato_id,
          endereco: '',
          data: rondaData.data,
          hora: rondaData.hora,
          foto: area.fotos?.[0] || null,
          fotos: area.fotos || [],
          observacoes: area.observacoes
        }));
        setAreasTecnicas(areasFormatadas);
      }

      // Carregar itens de chamado
      const { data: itensData, error: itensError } = await supabase
        .from('outros_itens_corrigidos')
        .select('*')
        .eq('ronda_id', rondaId)
        .eq('categoria', 'CHAMADO')
        .order('created_at', { ascending: true });

      if (!itensError && itensData) {
        const itensFormatados = itensData.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao,
          local: item.local,
          tipo: item.tipo,
          prioridade: item.prioridade,
          status: item.status,
          contrato: rondaData.contrato_id,
          endereco: '',
          data: rondaData.data,
          hora: rondaData.hora,
          foto: item.fotos?.[0] || null,
          fotos: item.fotos || [],
          categoria: 'CHAMADO' as const,
          observacoes: item.observacoes
        }));
        setItensChamado(itensFormatados);
      }

    } catch (error) {
      console.error('Erro ao carregar ronda:', error);
      mostrarMensagem('Erro ao carregar dados da ronda');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensagem = (msg: string) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(''), 3000);
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCapturarFotoArea = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment' as any;
    input.multiple = true;

    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        try {
          const compressed = await compressImage(file);
          setAreaFotos(prev => [...prev, compressed]);
        } catch (error) {
          mostrarMensagem('Erro ao processar foto');
        }
      }
    };

    input.click();
  };

  const handleCapturarFotoItem = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment' as any;
    input.multiple = true;

    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        try {
          const compressed = await compressImage(file);
          setItemFotos(prev => [...prev, compressed]);
        } catch (error) {
          mostrarMensagem('Erro ao processar foto');
        }
      }
    };

    input.click();
  };

  const abrirModalArea = (area?: AreaTecnica) => {
    if (area) {
      setEditingArea(area);
      setAreaNome(area.nome);
      setAreaStatus(area.status);
      setAreaObservacoes(area.observacoes || '');
      setAreaFotos(area.fotos || []);
    } else {
      setEditingArea(null);
      setAreaNome('');
      setAreaStatus('ATIVO');
      setAreaObservacoes('');
      setAreaFotos([]);
    }
    setShowAreaModal(true);
  };

  const abrirModalItem = (item?: OutroItemCorrigido) => {
    if (item) {
      setEditingItem(item);
      setItemNome(item.nome);
      setItemLocal(item.local);
      setItemDescricao(item.descricao);
      setItemTipo(item.tipo as any);
      setItemPrioridade(item.prioridade);
      setItemFotos(item.fotos || []);
    } else {
      setEditingItem(null);
      setItemNome('');
      setItemLocal('');
      setItemDescricao('');
      setItemTipo('CIVIL');
      setItemPrioridade('MÉDIA');
      setItemFotos([]);
    }
    setShowItemModal(true);
  };

  const salvarArea = async () => {
    if (!areaNome.trim()) {
      mostrarMensagem('Digite o nome da área');
      return;
    }

    try {
      setSalvando(true);

      const areaData = {
        ronda_id: rondaId,
        nome: areaNome.trim(),
        status: areaStatus,
        fotos: areaFotos,
        observacoes: areaObservacoes.trim() || null
      };

      if (editingArea) {
        // Atualizar área existente
        const { error } = await supabase
          .from('areas_tecnicas')
          .update(areaData)
          .eq('id', editingArea.id);

        if (error) throw error;
        mostrarMensagem('Área atualizada!');
      } else {
        // Criar nova área
        const { error } = await supabase
          .from('areas_tecnicas')
          .insert([areaData]);

        if (error) throw error;
        mostrarMensagem('Área criada!');
      }

      setShowAreaModal(false);
      await carregarRonda();
    } catch (error) {
      console.error('Erro ao salvar área:', error);
      mostrarMensagem('Erro ao salvar área');
    } finally {
      setSalvando(false);
    }
  };

  const salvarItem = async () => {
    if (!itemNome.trim() || !itemLocal.trim()) {
      mostrarMensagem('Preencha nome e local');
      return;
    }

    try {
      setSalvando(true);

      const itemData = {
        ronda_id: rondaId,
        nome: itemNome.trim(),
        local: itemLocal.trim(),
        descricao: itemDescricao.trim(),
        tipo: itemTipo,
        prioridade: itemPrioridade,
        status: 'PENDENTE',
        fotos: itemFotos,
        categoria: 'CHAMADO'
      };

      if (editingItem) {
        // Atualizar item existente
        const { error } = await supabase
          .from('outros_itens_corrigidos')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        mostrarMensagem('Item atualizado!');
      } else {
        // Criar novo item
        const { error } = await supabase
          .from('outros_itens_corrigidos')
          .insert([itemData]);

        if (error) throw error;
        mostrarMensagem('Item criado!');
      }

      setShowItemModal(false);
      await carregarRonda();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      mostrarMensagem('Erro ao salvar item');
    } finally {
      setSalvando(false);
    }
  };

  const deletarArea = async (areaId: string) => {
    if (!confirm('Deletar esta área técnica?')) return;

    try {
      const { error } = await supabase
        .from('areas_tecnicas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;

      mostrarMensagem('Área deletada!');
      await carregarRonda();
    } catch (error) {
      console.error('Erro ao deletar área:', error);
      mostrarMensagem('Erro ao deletar área');
    }
  };

  const deletarItem = async (itemId: string) => {
    if (!confirm('Deletar este item?')) return;

    try {
      const { error } = await supabase
        .from('outros_itens_corrigidos')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      mostrarMensagem('Item deletado!');
      await carregarRonda();
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      mostrarMensagem('Erro ao deletar item');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ATENÇÃO':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'EM MANUTENÇÃO':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'ATENÇÃO':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'EM MANUTENÇÃO':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={onVoltar}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-xl font-bold text-white">{ronda?.nome}</h1>
          <p className="text-sm text-gray-400">
            {new Date(ronda?.data || '').toLocaleDateString('pt-BR')} • {ronda?.hora}
          </p>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {mensagem && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {mensagem}
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4 space-y-6">
        {/* Áreas Técnicas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Áreas Técnicas</h2>
            <Button
              onClick={() => abrirModalArea()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Área
            </Button>
          </div>

          <div className="space-y-3">
            {areasTecnicas.map(area => (
              <Card key={area.id} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(area.status)}
                        <h3 className="font-semibold text-white">{area.nome}</h3>
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getStatusColor(area.status)}`}>
                        {area.status}
                      </div>
                      {area.observacoes && (
                        <p className="text-sm text-gray-400 mt-2">{area.observacoes}</p>
                      )}
                      {area.fotos && area.fotos.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {area.fotos.map((foto, idx) => (
                            <img
                              key={idx}
                              src={foto}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => abrirModalArea(area)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deletarArea(area.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {areasTecnicas.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhuma área técnica cadastrada</p>
            )}
          </div>
        </div>

        {/* Itens para Abertura de Chamado */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Itens para Abertura de Chamado</h2>
            <Button
              onClick={() => abrirModalItem()}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </div>

          <div className="space-y-3">
            {itensChamado.map(item => (
              <Card key={item.id} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{item.nome}</h3>
                      <p className="text-sm text-gray-400 mb-2">📍 {item.local}</p>
                      {item.descricao && (
                        <p className="text-sm text-gray-300 mb-2">{item.descricao}</p>
                      )}
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                          {item.tipo}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded border ${
                          item.prioridade === 'ALTA' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          item.prioridade === 'MÉDIA' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                          {item.prioridade}
                        </span>
                      </div>
                      {item.fotos && item.fotos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {item.fotos.map((foto, idx) => (
                            <img
                              key={idx}
                              src={foto}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => abrirModalItem(item)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deletarItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {itensChamado.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum item cadastrado</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Área Técnica */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingArea ? 'Editar Área' : 'Nova Área'}
              </h3>
              <Button
                onClick={() => setShowAreaModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Nome */}
              <div>
                <Label className="text-gray-300">Nome da Área</Label>
                <div className="flex gap-2">
                  <Input
                    value={areaNome}
                    onChange={(e) => setAreaNome(e.target.value)}
                    placeholder="Ex: Gerador"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {recognitionRef.current && (
                    <Button
                      type="button"
                      onClick={() => startVoiceCapture('areaNome')}
                      variant="outline"
                      size="sm"
                      className={`border-gray-700 ${isListening && currentVoiceField === 'areaNome' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                    >
                      {isListening && currentVoiceField === 'areaNome' ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="text-gray-300 mb-2 block">Status</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => setAreaStatus('ATIVO')}
                    className={`w-full justify-start ${areaStatus === 'ATIVO' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ATIVO
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAreaStatus('ATENÇÃO')}
                    className={`w-full justify-start ${areaStatus === 'ATENÇÃO' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    ATENÇÃO
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAreaStatus('EM MANUTENÇÃO')}
                    className={`w-full justify-start ${areaStatus === 'EM MANUTENÇÃO' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    EM MANUTENÇÃO
                  </Button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-gray-300">Observações</Label>
                <div className="space-y-2">
                  <Textarea
                    value={areaObservacoes}
                    onChange={(e) => setAreaObservacoes(e.target.value)}
                    placeholder="Observações sobre a área..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  />
                  {recognitionRef.current && (
                    <Button
                      type="button"
                      onClick={() => startVoiceCapture('areaObservacoes')}
                      variant="outline"
                      size="sm"
                      className={`w-full border-gray-700 ${isListening && currentVoiceField === 'areaObservacoes' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                    >
                      {isListening && currentVoiceField === 'areaObservacoes' ? <Volume2 className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                      {isListening && currentVoiceField === 'areaObservacoes' ? 'Gravando...' : 'Gravar por voz'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Fotos */}
              <div>
                <Label className="text-gray-300 mb-2 block">Fotos</Label>
                <Button
                  type="button"
                  onClick={handleCapturarFotoArea}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Adicionar Fotos
                </Button>
                {areaFotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {areaFotos.map((foto, idx) => (
                      <div key={idx} className="relative">
                        <img src={foto} alt="" className="w-full h-24 object-cover rounded" />
                        <Button
                          type="button"
                          onClick={() => setAreaFotos(prev => prev.filter((_, i) => i !== idx))}
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-6 h-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setShowAreaModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={salvarArea}
                  disabled={salvando}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Item de Chamado */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </h3>
              <Button
                onClick={() => setShowItemModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Nome */}
              <div>
                <Label className="text-gray-300">Nome do Item</Label>
                <div className="flex gap-2">
                  <Input
                    value={itemNome}
                    onChange={(e) => setItemNome(e.target.value)}
                    placeholder="Ex: Vazamento no banheiro"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {recognitionRef.current && (
                    <Button
                      type="button"
                      onClick={() => startVoiceCapture('itemNome')}
                      variant="outline"
                      size="sm"
                      className={`border-gray-700 ${isListening && currentVoiceField === 'itemNome' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                    >
                      {isListening && currentVoiceField === 'itemNome' ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Local */}
              <div>
                <Label className="text-gray-300">Local</Label>
                <div className="flex gap-2">
                  <Input
                    value={itemLocal}
                    onChange={(e) => setItemLocal(e.target.value)}
                    placeholder="Ex: Banheiro 2º andar"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {recognitionRef.current && (
                    <Button
                      type="button"
                      onClick={() => startVoiceCapture('itemLocal')}
                      variant="outline"
                      size="sm"
                      className={`border-gray-700 ${isListening && currentVoiceField === 'itemLocal' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                    >
                      {isListening && currentVoiceField === 'itemLocal' ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-gray-300">Descrição</Label>
                <div className="space-y-2">
                  <Textarea
                    value={itemDescricao}
                    onChange={(e) => setItemDescricao(e.target.value)}
                    placeholder="Descreva o problema..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  />
                  {recognitionRef.current && (
                    <Button
                      type="button"
                      onClick={() => startVoiceCapture('itemDescricao')}
                      variant="outline"
                      size="sm"
                      className={`w-full border-gray-700 ${isListening && currentVoiceField === 'itemDescricao' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                    >
                      {isListening && currentVoiceField === 'itemDescricao' ? <Volume2 className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                      {isListening && currentVoiceField === 'itemDescricao' ? 'Gravando...' : 'Gravar por voz'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Tipo */}
              <div>
                <Label className="text-gray-300">Especialidade</Label>
                <select
                  value={itemTipo}
                  onChange={(e) => setItemTipo(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2"
                >
                  <option value="CIVIL">Civil</option>
                  <option value="ELÉTRICA">Elétrica</option>
                  <option value="HIDRÁULICA">Hidráulica</option>
                  <option value="MECÂNICA">Mecânica</option>
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <Label className="text-gray-300">Prioridade</Label>
                <select
                  value={itemPrioridade}
                  onChange={(e) => setItemPrioridade(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-2"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MÉDIA">Média</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>

              {/* Fotos */}
              <div>
                <Label className="text-gray-300 mb-2 block">Fotos</Label>
                <Button
                  type="button"
                  onClick={handleCapturarFotoItem}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Adicionar Fotos
                </Button>
                {itemFotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {itemFotos.map((foto, idx) => (
                      <div key={idx} className="relative">
                        <img src={foto} alt="" className="w-full h-24 object-cover rounded" />
                        <Button
                          type="button"
                          onClick={() => setItemFotos(prev => prev.filter((_, i) => i !== idx))}
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-6 h-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setShowItemModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={salvarItem}
                  disabled={salvando}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
