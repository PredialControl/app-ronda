/**
 * ColetaLite - App leve de coleta em campo para celular
 * Fluxo: Selecionar Contrato -> Escolher Ação -> Executar
 * Tudo salva no Supabase (mesmo banco do app principal)
 */
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Contrato, RelatorioPendencias, RelatorioPendencia } from '@/types';
import { contratoService } from '@/lib/supabaseService';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { generateRelatorioPendenciasDOCX } from '@/lib/docxRelatorioPendencias';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Building2, FileText, AlertTriangle, Camera, Search,
  Check, X, Upload, Download, ChevronRight, Loader2, Image as ImageIcon,
  Save, Trash2, Edit3, Plus
} from 'lucide-react';

type Tela =
  | 'contratos'
  | 'menu'
  | 'relatorios-lista'
  | 'relatorio-secoes'
  | 'relatorio-pendencias'
  | 'editar-pendencia'
  | 'novo-relatorio'
  | 'nova-secao'
  | 'nova-pendencia'
  | 'nova-ronda';

interface ColetaLiteProps {
  onVoltar: () => void;
}

export function ColetaLite({ onVoltar }: ColetaLiteProps) {
  const [tela, setTela] = useState<Tela>('contratos');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Dados
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Relatórios de pendências
  const [relatorios, setRelatorios] = useState<RelatorioPendencias[]>([]);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<RelatorioPendencias | null>(null);
  const [secaoSelecionada, setSecaoSelecionada] = useState<any>(null);
  const [subsecaoSelecionada, setSubsecaoSelecionada] = useState<any>(null);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState<RelatorioPendencia | null>(null);

  // Edição de pendência
  const [editLocal, setEditLocal] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editStatus, setEditStatus] = useState<'PENDENTE' | 'RECEBIDO' | 'NAO_FARAO'>('PENDENTE');
  const [editDataRecebimento, setEditDataRecebimento] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingFotoDepois, setUploadingFotoDepois] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const fotoDepoisRef = useRef<HTMLInputElement>(null);

  // Novo relatório
  const [novoRelTitulo, setNovoRelTitulo] = useState('');

  // Nova seção
  const [novaSecaoTitulo, setNovaSecaoTitulo] = useState('');
  const [novaSecaoSubtitulo, setNovaSecaoSubtitulo] = useState('');

  // Nova pendência
  const [novaPendLocal, setNovaPendLocal] = useState('');
  const [novaPendDescricao, setNovaPendDescricao] = useState('');
  const [novaPendFoto, setNovaPendFoto] = useState<File | null>(null);
  const [novaPendFotoPreview, setNovaPendFotoPreview] = useState<string | null>(null);
  const novaPendFotoRef = useRef<HTMLInputElement>(null);

  // Autocomplete
  const [showSugestoesLocal, setShowSugestoesLocal] = useState(false);
  const [showSugestoesDescricao, setShowSugestoesDescricao] = useState(false);
  const [showSugestoesEditLocal, setShowSugestoesEditLocal] = useState(false);
  const [showSugestoesEditDescricao, setShowSugestoesEditDescricao] = useState(false);

  // Extrair valores únicos de todas as pendências do relatório para autocomplete
  const getAutocompleteSugestoes = (campo: 'local' | 'descricao') => {
    if (!relatorioSelecionado?.secoes) return [];
    const valores = new Set<string>();
    relatorioSelecionado.secoes.forEach(secao => {
      (secao.pendencias || []).forEach(p => {
        const val = campo === 'local' ? p.local : p.descricao;
        if (val && val.trim()) valores.add(val.trim());
      });
      (secao.subsecoes || []).forEach(sub => {
        (sub.pendencias || []).forEach(p => {
          const val = campo === 'local' ? p.local : p.descricao;
          if (val && val.trim()) valores.add(val.trim());
        });
      });
    });
    return Array.from(valores).sort();
  };

  const filtrarSugestoes = (sugestoes: string[], termo: string) => {
    if (!termo.trim()) return sugestoes;
    const t = termo.toLowerCase();
    return sugestoes.filter(s => s.toLowerCase().includes(t));
  };

  // Geração DOCX
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Carregar contratos
  useEffect(() => {
    loadContratos();
  }, []);

  const loadContratos = async () => {
    setLoading(true);
    try {
      const data = await contratoService.getAll();
      setContratos(data);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      showMsg('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorios = async (contratoId: string) => {
    setLoading(true);
    try {
      const data = await relatorioPendenciasService.getAll(contratoId);
      setRelatorios(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      showMsg('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg: string) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(null), 3000);
  };

  // Upload de foto
  const handleUploadFoto = async (file: File, tipo: 'antes' | 'depois') => {
    if (!pendenciaSelecionada || !relatorioSelecionado) return;

    const setUploading = tipo === 'antes' ? setUploadingFoto : setUploadingFotoDepois;
    setUploading(true);

    try {
      const url = await relatorioPendenciasService.uploadFoto(
        file,
        relatorioSelecionado.id,
        pendenciaSelecionada.id
      );

      const updateData: Partial<RelatorioPendencia> =
        tipo === 'antes' ? { foto_url: url } : { foto_depois_url: url };

      await relatorioPendenciasService.updatePendencia(pendenciaSelecionada.id, updateData);

      // Atualizar estado local
      setPendenciaSelecionada(prev => prev ? { ...prev, ...updateData } : null);
      showMsg('Foto salva!');

      // Recarregar relatório para atualizar dados
      const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
      if (relAtualizado) setRelatorioSelecionado(relAtualizado);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showMsg('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  // Salvar edição da pendência
  const handleSalvarPendencia = async () => {
    if (!pendenciaSelecionada) return;
    setLoading(true);
    try {
      await relatorioPendenciasService.updatePendencia(pendenciaSelecionada.id, {
        local: editLocal,
        descricao: editDescricao,
        status: editStatus,
        data_recebimento: editDataRecebimento || undefined,
      });
      showMsg('Pendência salva!');

      // Recarregar relatório
      if (relatorioSelecionado) {
        const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
        if (relAtualizado) setRelatorioSelecionado(relAtualizado);
      }

      setTela('relatorio-pendencias');
    } catch (error) {
      console.error('Erro ao salvar pendência:', error);
      showMsg('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  // Gerar DOCX simplificado
  const handleGerarDOCX = async () => {
    if (!relatorioSelecionado || !contratoSelecionado) return;
    setIsGeneratingDOCX(true);
    try {
      const relCompleto = await relatorioPendenciasService.getById(relatorioSelecionado.id);
      if (!relCompleto) throw new Error('Relatório não encontrado');

      await generateRelatorioPendenciasDOCX(relCompleto, contratoSelecionado, (msg, current, total) => {
        setProgressMsg(msg);
        setProgressPercent(Math.floor((current / total) * 100));
      });
      showMsg('DOCX gerado!');
    } catch (error) {
      console.error('Erro ao gerar DOCX:', error);
      showMsg('Erro ao gerar documento');
    } finally {
      setIsGeneratingDOCX(false);
      setProgressMsg('');
      setProgressPercent(0);
    }
  };

  // Criar novo relatório
  const handleCriarRelatorio = async () => {
    if (!contratoSelecionado || !novoRelTitulo.trim()) return;
    setLoading(true);
    try {
      const novo = await relatorioPendenciasService.create({
        contrato_id: contratoSelecionado.id,
        titulo: novoRelTitulo.trim(),
      } as any);
      showMsg('Relatório criado!');
      setNovoRelTitulo('');
      // Recarregar e abrir o novo
      await loadRelatorios(contratoSelecionado.id);
      const relCompleto = await relatorioPendenciasService.getById(novo.id);
      if (relCompleto) {
        setRelatorioSelecionado(relCompleto);
        setTela('relatorio-secoes');
      } else {
        setTela('relatorios-lista');
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      showMsg('Erro ao criar relatório');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova seção
  const handleCriarSecao = async () => {
    if (!relatorioSelecionado || !novaSecaoTitulo.trim()) return;
    setLoading(true);
    try {
      const ordemAtual = relatorioSelecionado.secoes?.length || 0;
      await relatorioPendenciasService.createSecao({
        relatorio_id: relatorioSelecionado.id,
        ordem: ordemAtual,
        titulo_principal: novaSecaoTitulo.trim(),
        subtitulo: novaSecaoSubtitulo.trim() || undefined,
      } as any);
      showMsg('Seção criada!');
      setNovaSecaoTitulo('');
      setNovaSecaoSubtitulo('');
      // Recarregar relatório
      const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
      if (relAtualizado) setRelatorioSelecionado(relAtualizado);
      setTela('relatorio-secoes');
    } catch (error) {
      console.error('Erro ao criar seção:', error);
      showMsg('Erro ao criar seção');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova pendência
  const handleCriarPendencia = async () => {
    if (!relatorioSelecionado || !secaoSelecionada) return;
    if (!novaPendLocal.trim() && !novaPendDescricao.trim()) return;
    setLoading(true);
    try {
      const pendenciasAtuais = subsecaoSelecionada
        ? (subsecaoSelecionada.pendencias || [])
        : (secaoSelecionada.pendencias || []);

      const novaPend: any = {
        secao_id: secaoSelecionada.id,
        subsecao_id: subsecaoSelecionada?.id || null,
        ordem: pendenciasAtuais.length,
        local: novaPendLocal.trim(),
        descricao: novaPendDescricao.trim(),
        foto_url: null,
        foto_depois_url: null,
        status: 'PENDENTE',
      };

      const criada = await relatorioPendenciasService.createPendencia(novaPend);

      // Se tem foto, faz upload
      if (novaPendFoto && criada.id) {
        const url = await relatorioPendenciasService.uploadFoto(
          novaPendFoto,
          relatorioSelecionado.id,
          criada.id
        );
        await relatorioPendenciasService.updatePendencia(criada.id, { foto_url: url });
      }

      showMsg('Pendência criada!');
      setNovaPendLocal('');
      setNovaPendDescricao('');
      setNovaPendFoto(null);
      setNovaPendFotoPreview(null);

      // Recarregar relatório
      const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
      if (relAtualizado) {
        setRelatorioSelecionado(relAtualizado);
        // Atualizar seção/subseção selecionada
        const secAtualizada = relAtualizado.secoes?.find(s => s.id === secaoSelecionada.id);
        if (secAtualizada) {
          setSecaoSelecionada(secAtualizada);
          if (subsecaoSelecionada) {
            const subAtualizada = secAtualizada.subsecoes?.find(sub => sub.id === subsecaoSelecionada.id);
            if (subAtualizada) setSubsecaoSelecionada(subAtualizada);
          }
        }
      }
      setTela('relatorio-pendencias');
    } catch (error) {
      console.error('Erro ao criar pendência:', error);
      showMsg('Erro ao criar pendência');
    } finally {
      setLoading(false);
    }
  };

  // Navegar para editar pendência
  const abrirEditarPendencia = (pendencia: RelatorioPendencia) => {
    setPendenciaSelecionada(pendencia);
    setEditLocal(pendencia.local || '');
    setEditDescricao(pendencia.descricao || '');
    setEditStatus(pendencia.status || 'PENDENTE');
    setEditDataRecebimento(pendencia.data_recebimento || '');
    setTela('editar-pendencia');
  };

  // Voltar
  const handleVoltar = () => {
    switch (tela) {
      case 'contratos':
        onVoltar();
        break;
      case 'menu':
        setContratoSelecionado(null);
        setTela('contratos');
        break;
      case 'relatorios-lista':
        setTela('menu');
        break;
      case 'novo-relatorio':
        setNovoRelTitulo('');
        setTela('relatorios-lista');
        break;
      case 'relatorio-secoes':
        setRelatorioSelecionado(null);
        setTela('relatorios-lista');
        break;
      case 'nova-secao':
        setNovaSecaoTitulo('');
        setNovaSecaoSubtitulo('');
        setTela('relatorio-secoes');
        break;
      case 'relatorio-pendencias':
        setSecaoSelecionada(null);
        setSubsecaoSelecionada(null);
        setTela('relatorio-secoes');
        break;
      case 'nova-pendencia':
        setNovaPendLocal('');
        setNovaPendDescricao('');
        setNovaPendFoto(null);
        setNovaPendFotoPreview(null);
        setTela('relatorio-pendencias');
        break;
      case 'editar-pendencia':
        setPendenciaSelecionada(null);
        setTela('relatorio-pendencias');
        break;
      default:
        setTela('contratos');
    }
  };

  // Contratos filtrados
  const contratosFiltrados = contratos.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sindico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obter pendências da seção/subseção selecionada
  const getPendenciasAtuais = (): RelatorioPendencia[] => {
    if (subsecaoSelecionada) {
      return subsecaoSelecionada.pendencias || [];
    }
    if (secaoSelecionada) {
      return secaoSelecionada.pendencias || [];
    }
    return [];
  };

  // Header
  const renderHeader = (titulo: string) => (
    <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
      <button onClick={handleVoltar} className="text-gray-300 hover:text-white p-1">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-base font-semibold text-white truncate flex-1">{titulo}</h1>
      {mensagem && (
        <span className="text-xs text-green-400 animate-pulse">{mensagem}</span>
      )}
    </div>
  );

  // Loading overlay
  if (isGeneratingDOCX) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-6">
        <div className="text-center w-full max-w-sm">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Gerando DOCX</h3>
          <p className="text-gray-400 text-sm mb-4">{progressMsg || 'Processando...'}</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-green-400 text-sm font-bold">{progressPercent}%</p>
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 1: SELECIONAR CONTRATO
  // ============================================
  if (tela === 'contratos') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Coleta em Campo')}

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white text-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {contratosFiltrados.map((contrato) => (
                <button
                  key={contrato.id}
                  onClick={() => {
                    setContratoSelecionado(contrato);
                    setTela('menu');
                  }}
                  className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 hover:border-green-500/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">{contrato.nome}</p>
                      <p className="text-gray-400 text-xs truncate">{contrato.endereco}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
              {contratosFiltrados.length === 0 && (
                <p className="text-center text-gray-500 py-8 text-sm">Nenhum contrato encontrado</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 2: MENU - ESCOLHER AÇÃO
  // ============================================
  if (tela === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader(contratoSelecionado?.nome || 'Contrato')}

        <div className="p-4 space-y-3">
          <p className="text-gray-400 text-xs mb-2">O que deseja fazer?</p>

          <button
            onClick={() => {
              if (contratoSelecionado) {
                loadRelatorios(contratoSelecionado.id);
                setTela('relatorios-lista');
              }
            }}
            className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Relatórios de Pendências</p>
                <p className="text-gray-400 text-xs">Editar fotos e pendências dos relatórios existentes</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </button>

          <button
            onClick={() => setTela('nova-ronda')}
            className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Nova Ronda / Visita</p>
                <p className="text-gray-400 text-xs">Criar nova coleta de dados em campo</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 3: LISTA DE RELATÓRIOS DE PENDÊNCIAS
  // ============================================
  if (tela === 'relatorios-lista') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Relatórios de Pendências')}

        <div className="p-4">
          {/* Botão novo relatório */}
          <button
            onClick={() => {
              setNovoRelTitulo('');
              setTela('novo-relatorio');
            }}
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Relatório
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : relatorios.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Nenhum relatório encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {relatorios.map((rel) => {
                const totalPendencias = rel.secoes?.reduce((acc, sec) => {
                  const diretas = sec.pendencias?.length || 0;
                  const subs = (sec.subsecoes || []).reduce((a, sub) => a + (sub.pendencias?.length || 0), 0);
                  return acc + diretas + subs;
                }, 0) || 0;

                return (
                  <button
                    key={rel.id}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const relCompleto = await relatorioPendenciasService.getById(rel.id);
                        if (relCompleto) {
                          setRelatorioSelecionado(relCompleto);
                          setTela('relatorio-secoes');
                        }
                      } catch (e) {
                        showMsg('Erro ao carregar relatório');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500/30 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      {rel.capa_url ? (
                        <img src={rel.capa_url} className="w-12 h-16 object-cover rounded flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{rel.titulo}</p>
                        <p className="text-gray-400 text-xs">
                          {rel.secoes?.length || 0} seções • {totalPendencias} pendências
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(rel.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRelatorioSelecionado(rel);
                            handleGerarDOCX();
                          }}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-medium">DOCX</span>
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 4: SEÇÕES DO RELATÓRIO
  // ============================================
  if (tela === 'relatorio-secoes') {
    const secoes = relatorioSelecionado?.secoes || [];

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader(relatorioSelecionado?.titulo || 'Relatório')}

        <div className="p-4">
          {/* Botão baixar DOCX */}
          <button
            onClick={handleGerarDOCX}
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            Baixar DOCX
          </button>

          {/* Botão nova seção */}
          <button
            onClick={() => {
              setNovaSecaoTitulo('');
              setNovaSecaoSubtitulo('');
              setTela('nova-secao');
            }}
            className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Seção
          </button>

          {secoes.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">Nenhuma seção encontrada</p>
          ) : (
            <div className="space-y-2">
              {secoes.map((secao, idx) => {
                const temSubsecoes = secao.tem_subsecoes && secao.subsecoes && secao.subsecoes.length > 0;
                const totalPend = temSubsecoes
                  ? (secao.subsecoes || []).reduce((a, sub) => a + (sub.pendencias?.length || 0), 0)
                  : (secao.pendencias?.length || 0);

                return (
                  <button
                    key={secao.id}
                    onClick={() => {
                      setSecaoSelecionada(secao);
                      if (temSubsecoes) {
                        // Mostra subseções como "pendências" (cada subseção é um grupo)
                        setTela('relatorio-pendencias');
                      } else {
                        setTela('relatorio-pendencias');
                      }
                    }}
                    className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500/30 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">
                          {idx + 1}. {secao.titulo_principal}
                        </p>
                        {secao.subtitulo && (
                          <p className="text-gray-400 text-xs truncate">{secao.subtitulo}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {temSubsecoes
                            ? `${secao.subsecoes?.length || 0} subseções • ${totalPend} pendências`
                            : `${totalPend} pendências`
                          }
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 5: PENDÊNCIAS DA SEÇÃO (ou SUBSEÇÕES)
  // ============================================
  if (tela === 'relatorio-pendencias') {
    const temSubsecoes = secaoSelecionada?.tem_subsecoes && secaoSelecionada?.subsecoes?.length > 0;

    // Se tem subseções e nenhuma foi selecionada, mostrar lista de subseções
    if (temSubsecoes && !subsecaoSelecionada) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
          {renderHeader(secaoSelecionada?.titulo_principal || 'Seção')}

          <div className="p-4 space-y-2">
            {(secaoSelecionada.subsecoes || []).map((sub: any, idx: number) => {
              const letra = String.fromCharCode(65 + idx);
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubsecaoSelecionada(sub);
                  }}
                  className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm">
                        {letra}. {sub.titulo}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {sub.tipo === 'CONSTATACAO'
                          ? `${sub.fotos_constatacao?.length || 0} fotos`
                          : `${sub.pendencias?.length || 0} pendências`
                        }
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Listar pendências
    const pendencias = subsecaoSelecionada
      ? (subsecaoSelecionada.pendencias || [])
      : (secaoSelecionada?.pendencias || []);

    const titulo = subsecaoSelecionada
      ? subsecaoSelecionada.titulo
      : secaoSelecionada?.titulo_principal;

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (subsecaoSelecionada) {
                setSubsecaoSelecionada(null);
              } else {
                handleVoltar();
              }
            }}
            className="text-gray-300 hover:text-white p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-white truncate flex-1">{titulo}</h1>
        </div>

        <div className="p-4">
          {/* Botão nova pendência */}
          <button
            onClick={() => {
              setNovaPendLocal('');
              setNovaPendDescricao('');
              setNovaPendFoto(null);
              setNovaPendFotoPreview(null);
              setTela('nova-pendencia');
            }}
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Pendência
          </button>

          {pendencias.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">Nenhuma pendência nesta seção</p>
          ) : (
            <div className="space-y-3">
              {pendencias.map((pend: RelatorioPendencia, idx: number) => (
                <button
                  key={pend.id}
                  onClick={() => abrirEditarPendencia(pend)}
                  className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex">
                    {/* Foto thumbnail */}
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-700">
                      {pend.foto_url ? (
                        <img src={pend.foto_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          pend.status === 'RECEBIDO' ? 'bg-green-500' :
                          pend.status === 'NAO_FARAO' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <p className="text-white text-sm font-medium truncate">{pend.local || `Item ${idx + 1}`}</p>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{pend.descricao}</p>
                      {pend.foto_depois_url && (
                        <span className="inline-block mt-1 text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                          Foto depois
                        </span>
                      )}
                    </div>
                    <div className="flex items-center pr-3">
                      <Edit3 className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 6: EDITAR PENDÊNCIA
  // ============================================
  if (tela === 'editar-pendencia' && pendenciaSelecionada) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Editar Pendência')}

        <div className="p-4 space-y-4 pb-24">
          {/* Fotos lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            {/* Foto Antes */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Foto Antes</p>
              <div
                onClick={() => fotoRef.current?.click()}
                className="relative aspect-square bg-gray-800 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all"
              >
                {pendenciaSelecionada.foto_url ? (
                  <img src={pendenciaSelecionada.foto_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">Tirar foto</span>
                  </div>
                )}
                {uploadingFoto && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFoto(file, 'antes');
                  e.target.value = '';
                }}
              />
            </div>

            {/* Foto Depois */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Foto Depois</p>
              <div
                onClick={() => fotoDepoisRef.current?.click()}
                className="relative aspect-square bg-gray-800 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-green-500/30 transition-all"
              >
                {pendenciaSelecionada.foto_depois_url ? (
                  <img src={pendenciaSelecionada.foto_depois_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">Foto depois</span>
                  </div>
                )}
                {uploadingFotoDepois && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fotoDepoisRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFoto(file, 'depois');
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Campos de edição */}
          <div className="relative">
            <label className="text-xs text-gray-400 mb-1 block">Local</label>
            <Input
              value={editLocal}
              onChange={(e) => {
                setEditLocal(e.target.value);
                setShowSugestoesEditLocal(true);
              }}
              onFocus={() => setShowSugestoesEditLocal(true)}
              onBlur={() => setTimeout(() => setShowSugestoesEditLocal(false), 200)}
              className="bg-gray-800 border-gray-700 text-white text-sm"
              placeholder="Local da pendência"
            />
            {showSugestoesEditLocal && (() => {
              const sugestoes = filtrarSugestoes(getAutocompleteSugestoes('local'), editLocal);
              if (sugestoes.length === 0) return null;
              return (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg max-h-40 overflow-y-auto shadow-lg">
                  {sugestoes.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEditLocal(s);
                        setShowSugestoesEditLocal(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 border-b border-gray-700/50 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="relative">
            <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <Textarea
              value={editDescricao}
              onChange={(e) => {
                setEditDescricao(e.target.value);
                setShowSugestoesEditDescricao(true);
              }}
              onFocus={() => setShowSugestoesEditDescricao(true)}
              onBlur={() => setTimeout(() => setShowSugestoesEditDescricao(false), 200)}
              className="bg-gray-800 border-gray-700 text-white text-sm min-h-[80px]"
              placeholder="Descrição da pendência"
            />
            {showSugestoesEditDescricao && (() => {
              const sugestoes = filtrarSugestoes(getAutocompleteSugestoes('descricao'), editDescricao);
              if (sugestoes.length === 0) return null;
              return (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg max-h-40 overflow-y-auto shadow-lg">
                  {sugestoes.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEditDescricao(s);
                        setShowSugestoesEditDescricao(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 border-b border-gray-700/50 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'PENDENTE' as const, label: 'Pendente', color: 'yellow' },
                { value: 'RECEBIDO' as const, label: 'Recebido', color: 'green' },
                { value: 'NAO_FARAO' as const, label: 'Não farão', color: 'red' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEditStatus(opt.value)}
                  className={`p-2.5 rounded-lg text-xs font-medium transition-all ${
                    editStatus === opt.value
                      ? opt.color === 'yellow' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                      : opt.color === 'green' ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                      : 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {editStatus === 'RECEBIDO' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Data de Recebimento</label>
              <Input
                type="date"
                value={editDataRecebimento}
                onChange={(e) => setEditDataRecebimento(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white text-sm"
              />
            </div>
          )}
        </div>

        {/* Botão salvar fixo no fundo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
          <button
            onClick={handleSalvarPendencia}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // TELA: NOVO RELATÓRIO
  // ============================================
  if (tela === 'novo-relatorio') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Novo Relatório')}

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Título do Relatório *</label>
            <Input
              value={novoRelTitulo}
              onChange={(e) => setNovoRelTitulo(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white text-sm"
              placeholder="Ex: Relatório de Pendências - Bloco A"
              autoFocus
            />
          </div>

          <p className="text-xs text-gray-500">
            O relatório será criado para o contrato: <span className="text-gray-300">{contratoSelecionado?.nome}</span>
          </p>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
          <button
            onClick={handleCriarRelatorio}
            disabled={loading || !novoRelTitulo.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Relatório
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // TELA: NOVA SEÇÃO
  // ============================================
  if (tela === 'nova-secao') {
    const ordemAtual = relatorioSelecionado?.secoes?.length || 0;
    const numeracao = `VIII.${ordemAtual + 1}`;

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Nova Seção')}

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-500">Numeração automática: <span className="text-purple-400 font-mono">{numeracao}</span></p>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Título Principal *</label>
            <Input
              value={novaSecaoTitulo}
              onChange={(e) => setNovaSecaoTitulo(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white text-sm"
              placeholder={`Ex: ${numeracao} – INSTALAÇÕES ELÉTRICAS`}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Subtítulo (opcional)</label>
            <Input
              value={novaSecaoSubtitulo}
              onChange={(e) => setNovaSecaoSubtitulo(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white text-sm"
              placeholder="Ex: Quadros elétricos e disjuntores"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
          <button
            onClick={handleCriarSecao}
            disabled={loading || !novaSecaoTitulo.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Seção
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // TELA: NOVA PENDÊNCIA
  // ============================================
  if (tela === 'nova-pendencia') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Nova Pendência')}

        <div className="p-4 space-y-4 pb-24">
          {/* Foto */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Foto (opcional)</p>
            <div
              onClick={() => novaPendFotoRef.current?.click()}
              className="relative w-full aspect-video bg-gray-800 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all"
            >
              {novaPendFotoPreview ? (
                <img src={novaPendFotoPreview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-sm">Tirar foto ou escolher</span>
                </div>
              )}
            </div>
            <input
              ref={novaPendFotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNovaPendFoto(file);
                  setNovaPendFotoPreview(URL.createObjectURL(file));
                }
                e.target.value = '';
              }}
            />
          </div>

          <div className="relative">
            <label className="text-xs text-gray-400 mb-1 block">Local *</label>
            <Input
              value={novaPendLocal}
              onChange={(e) => {
                setNovaPendLocal(e.target.value);
                setShowSugestoesLocal(true);
              }}
              onFocus={() => setShowSugestoesLocal(true)}
              onBlur={() => setTimeout(() => setShowSugestoesLocal(false), 200)}
              className="bg-gray-800 border-gray-700 text-white text-sm"
              placeholder="Ex: Sala de máquinas, 2º andar..."
            />
            {showSugestoesLocal && (() => {
              const sugestoes = filtrarSugestoes(getAutocompleteSugestoes('local'), novaPendLocal);
              if (sugestoes.length === 0) return null;
              return (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg max-h-40 overflow-y-auto shadow-lg">
                  {sugestoes.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNovaPendLocal(s);
                        setShowSugestoesLocal(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 border-b border-gray-700/50 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="relative">
            <label className="text-xs text-gray-400 mb-1 block">Descrição *</label>
            <Textarea
              value={novaPendDescricao}
              onChange={(e) => {
                setNovaPendDescricao(e.target.value);
                setShowSugestoesDescricao(true);
              }}
              onFocus={() => setShowSugestoesDescricao(true)}
              onBlur={() => setTimeout(() => setShowSugestoesDescricao(false), 200)}
              className="bg-gray-800 border-gray-700 text-white text-sm min-h-[100px]"
              placeholder="Descreva a pendência encontrada..."
            />
            {showSugestoesDescricao && (() => {
              const sugestoes = filtrarSugestoes(getAutocompleteSugestoes('descricao'), novaPendDescricao);
              if (sugestoes.length === 0) return null;
              return (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg max-h-40 overflow-y-auto shadow-lg">
                  {sugestoes.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNovaPendDescricao(s);
                        setShowSugestoesDescricao(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 border-b border-gray-700/50 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <p className="text-xs text-gray-500">
            Seção: <span className="text-gray-300">{secaoSelecionada?.titulo_principal}</span>
            {subsecaoSelecionada && <> / <span className="text-gray-300">{subsecaoSelecionada.titulo}</span></>}
          </p>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
          <button
            onClick={handleCriarPendencia}
            disabled={loading || (!novaPendLocal.trim() && !novaPendDescricao.trim())}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Pendência
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // TELA: NOVA RONDA (placeholder - usa ColetaOffline existente)
  // ============================================
  if (tela === 'nova-ronda') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {renderHeader('Nova Ronda')}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Use o botão "Coleta em Campo" no app principal para criar novas rondas.</p>
            <button
              onClick={() => setTela('menu')}
              className="text-blue-400 text-sm underline"
            >
              Voltar ao menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
