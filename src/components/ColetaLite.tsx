/**
 * ColetaLite - App leve de coleta em campo para celular
 * Fluxo: Selecionar Contrato -> Escolher Ação -> Executar
 * Tudo salva no Supabase (mesmo banco do app principal)
 * Suporte offline: cache local + fila de pendências para sync
 */
import { useState, useEffect, useRef, useCallback } from 'react';
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
  Save, Trash2, Edit3, Plus, Smartphone, WifiOff, RefreshCw
} from 'lucide-react';

// ============================================
// CACHE LOCAL + OFFLINE QUEUE
// ============================================
const CACHE_PREFIX = 'coleta_cache_';
const OFFLINE_QUEUE_KEY = 'coleta_offline_queue';

interface OfflinePendencia {
  id: string; // ID temporário local
  secao_id: string;
  subsecao_id: string | null;
  ordem: number;
  local: string;
  descricao: string;
  status: string;
  foto_base64: string | null;
  relatorio_id: string;
  created_at: string;
}

function saveToCache(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

function getFromCache<T>(key: string, maxAgeMs = 30 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

function getOfflineQueue(): OfflinePendencia[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflinePendencia[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToFile(base64: string, filename: string): File {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new File([ab], filename, { type: mime });
}

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
  const [novaSecaoTemSubsecoes, setNovaSecaoTemSubsecoes] = useState(false);
  const [novaSubsecoes, setNovaSubsecoes] = useState<Array<{ titulo: string; tipo: 'MANUAL' | 'CONSTATACAO' }>>([]);

  // Nova pendência
  const [novaPendLocal, setNovaPendLocal] = useState('');
  const [novaPendDescricao, setNovaPendDescricao] = useState('');
  const [novaPendFoto, setNovaPendFoto] = useState<File | null>(null);
  const [novaPendFotoPreview, setNovaPendFotoPreview] = useState<string | null>(null);
  const novaPendFotoRef = useRef<HTMLInputElement>(null);

  // PWA Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) return; // Já está instalado

    // Verificar se o usuário já dispensou o banner
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Mostrar novamente depois de 7 dias
      if (now.getTime() - dismissedDate.getTime() < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Para iOS que não tem beforeinstallprompt, mostrar instrução manual
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isStandalone) {
      setShowInstallBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

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

  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflinePendencia[]>(getOfflineQueue());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Auto-sync quando voltar online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  // Geração DOCX
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Carregar contratos (com cache)
  useEffect(() => {
    loadContratos();
  }, []);

  const loadContratos = async () => {
    // Tentar cache primeiro para carregamento instantâneo
    const cached = getFromCache<Contrato[]>('contratos', 60 * 60 * 1000); // 1h
    if (cached) {
      setContratos(cached);
      // Atualizar em background se online
      if (navigator.onLine) {
        contratoService.getAll().then(data => {
          setContratos(data);
          saveToCache('contratos', data);
        }).catch(() => {});
      }
      return;
    }

    setLoading(true);
    try {
      const data = await contratoService.getAll();
      setContratos(data);
      saveToCache('contratos', data);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      showMsg('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorios = async (contratoId: string) => {
    // Tentar cache primeiro
    const cached = getFromCache<RelatorioPendencias[]>(`relatorios_${contratoId}`, 30 * 60 * 1000); // 30min
    if (cached) {
      setRelatorios(cached);
      // Atualizar em background se online
      if (navigator.onLine) {
        relatorioPendenciasService.getAll(contratoId).then(data => {
          setRelatorios(data);
          saveToCache(`relatorios_${contratoId}`, data);
        }).catch(() => {});
      }
      return;
    }

    setLoading(true);
    try {
      const data = await relatorioPendenciasService.getAll(contratoId);
      setRelatorios(data);
      saveToCache(`relatorios_${contratoId}`, data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      // Tentar cache mais antigo em caso de erro
      const oldCache = getFromCache<RelatorioPendencias[]>(`relatorios_${contratoId}`, 24 * 60 * 60 * 1000);
      if (oldCache) {
        setRelatorios(oldCache);
        showMsg('Usando dados offline');
      } else {
        showMsg('Erro ao carregar relatórios');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar fila offline
  const syncOfflineQueue = async () => {
    if (syncing || !navigator.onLine) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    showMsg(`Sincronizando ${queue.length} pendência(s)...`);
    const remaining: OfflinePendencia[] = [];

    for (const item of queue) {
      try {
        const novaPend: any = {
          secao_id: item.secao_id,
          subsecao_id: item.subsecao_id,
          ordem: item.ordem,
          local: item.local,
          descricao: item.descricao,
          foto_url: null,
          foto_depois_url: null,
          status: item.status,
        };

        const criada = await relatorioPendenciasService.createPendencia(novaPend);

        // Upload foto se tiver
        if (item.foto_base64 && criada.id) {
          const file = base64ToFile(item.foto_base64, `foto_${criada.id}.jpg`);
          const url = await relatorioPendenciasService.uploadFoto(file, item.relatorio_id, criada.id);
          await relatorioPendenciasService.updatePendencia(criada.id, { foto_url: url });
        }
      } catch (e) {
        console.error('Erro ao sincronizar pendência offline:', e);
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
    setOfflineQueue(remaining);

    // Sync fotos offline também
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('foto_offline_'));
      for (const key of keys) {
        try {
          const fotoData = JSON.parse(localStorage.getItem(key) || '');
          if (fotoData.base64 && fotoData.pendenciaId && fotoData.relatorioId) {
            const file = base64ToFile(fotoData.base64, `foto_${fotoData.pendenciaId}.jpg`);
            const url = await relatorioPendenciasService.uploadFoto(file, fotoData.relatorioId, `${fotoData.pendenciaId}-sync-${Date.now()}`);
            await relatorioPendenciasService.updatePendencia(fotoData.pendenciaId, { [fotoData.campo]: url });
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.error('Erro ao sync foto offline:', e);
        }
      }
    } catch {}

    if (remaining.length === 0) {
      showMsg('Tudo sincronizado!');
    } else {
      showMsg(`${remaining.length} pendência(s) ainda na fila`);
    }

    // Recarregar dados
    if (relatorioSelecionado) {
      try {
        const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
        if (relAtualizado) {
          setRelatorioSelecionado(relAtualizado);
          saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
        }
      } catch {}
    }
    if (contratoSelecionado) {
      loadRelatorios(contratoSelecionado.id);
    }

    setSyncing(false);
  };

  const showMsg = (msg: string) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(null), 3000);
  };

  // Upload de foto (com fallback offline)
  const handleUploadFoto = async (file: File, tipo: 'antes' | 'depois') => {
    if (!pendenciaSelecionada || !relatorioSelecionado) return;

    const setUploading = tipo === 'antes' ? setUploadingFoto : setUploadingFotoDepois;
    setUploading(true);
    const campo = tipo === 'antes' ? 'foto_url' : 'foto_depois_url';

    // Se offline, salvar foto em base64 no localStorage para sync depois
    if (!navigator.onLine) {
      try {
        const base64 = await fileToBase64(file);
        // Salvar preview local
        setPendenciaSelecionada(prev => prev ? { ...prev, [campo]: base64 } : null);
        // Salvar na fila offline para upload depois
        const fotoOfflineKey = `foto_offline_${pendenciaSelecionada.id}_${tipo}`;
        localStorage.setItem(fotoOfflineKey, JSON.stringify({
          pendenciaId: pendenciaSelecionada.id,
          relatorioId: relatorioSelecionado.id,
          campo,
          base64,
        }));
        showMsg(`Foto ${tipo} salva offline!`);
      } catch (e) {
        console.error('Erro ao salvar foto offline:', e);
        showMsg('Erro ao salvar foto');
      } finally {
        setUploading(false);
      }
      return;
    }

    try {
      const timestamp = Date.now();
      const url = await relatorioPendenciasService.uploadFoto(
        file,
        relatorioSelecionado.id,
        `${pendenciaSelecionada.id}-${tipo}-${timestamp}`
      );

      const updateData: Partial<RelatorioPendencia> = { [campo]: url };
      await relatorioPendenciasService.updatePendencia(pendenciaSelecionada.id, updateData);

      setPendenciaSelecionada(prev => prev ? { ...prev, [campo]: url } : null);
      showMsg(`Foto ${tipo === 'antes' ? 'antes' : 'depois'} salva!`);

      try {
        const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
        if (relAtualizado) {
          setRelatorioSelecionado(relAtualizado);
          saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
        }
      } catch {}
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      // Fallback: salvar offline se o upload falhou
      try {
        const base64 = await fileToBase64(file);
        setPendenciaSelecionada(prev => prev ? { ...prev, [campo]: base64 } : null);
        const fotoOfflineKey = `foto_offline_${pendenciaSelecionada.id}_${tipo}`;
        localStorage.setItem(fotoOfflineKey, JSON.stringify({
          pendenciaId: pendenciaSelecionada.id,
          relatorioId: relatorioSelecionado.id,
          campo,
          base64,
        }));
        showMsg(`Foto ${tipo} salva offline (sem sinal)`);
      } catch {
        showMsg(`Erro ao enviar foto ${tipo}`);
      }
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

  // Gerar DOCX simplificado - aceita relatório como parâmetro para evitar race condition
  const handleGerarDOCX = async (relOverride?: RelatorioPendencias) => {
    const rel = relOverride || relatorioSelecionado;
    if (!rel || !contratoSelecionado) return;
    setIsGeneratingDOCX(true);
    try {
      const relCompleto = await relatorioPendenciasService.getById(rel.id);
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
      const secao = await relatorioPendenciasService.createSecao({
        relatorio_id: relatorioSelecionado.id,
        ordem: ordemAtual,
        titulo_principal: novaSecaoTitulo.trim(),
        subtitulo: novaSecaoSubtitulo.trim() || undefined,
        tem_subsecoes: novaSecaoTemSubsecoes,
      } as any);

      // Criar subseções se houver
      if (novaSecaoTemSubsecoes && novaSubsecoes.length > 0) {
        for (let i = 0; i < novaSubsecoes.length; i++) {
          const sub = novaSubsecoes[i];
          if (!sub.titulo.trim()) continue;
          await relatorioPendenciasService.createSubsecao({
            secao_id: secao.id,
            ordem: i,
            titulo: sub.titulo.trim(),
            tipo: sub.tipo,
            fotos_constatacao: sub.tipo === 'CONSTATACAO' ? [] : undefined,
          } as any);
        }
      }

      showMsg('Seção criada!');
      setNovaSecaoTitulo('');
      setNovaSecaoSubtitulo('');
      setNovaSecaoTemSubsecoes(false);
      setNovaSubsecoes([]);
      // Recarregar relatório
      const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
      if (relAtualizado) {
        setRelatorioSelecionado(relAtualizado);
        saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
        // Ir direto para pendências da seção criada
        const secaoCriada = relAtualizado.secoes?.find(s => s.id === secao.id);
        if (secaoCriada) {
          setSecaoSelecionada(secaoCriada);
          setTela('relatorio-pendencias');
          return;
        }
      }
      setTela('relatorio-secoes');
    } catch (error) {
      console.error('Erro ao criar seção:', error);
      showMsg('Erro ao criar seção');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova pendência (online ou offline)
  const handleCriarPendencia = async () => {
    if (!relatorioSelecionado || !secaoSelecionada) return;
    if (!novaPendLocal.trim() && !novaPendDescricao.trim()) return;
    setLoading(true);

    const pendenciasAtuais = subsecaoSelecionada
      ? (subsecaoSelecionada.pendencias || [])
      : (secaoSelecionada.pendencias || []);

    // Se está offline, salvar na fila local
    if (!navigator.onLine) {
      try {
        let fotoBase64: string | null = null;
        if (novaPendFoto) {
          fotoBase64 = await fileToBase64(novaPendFoto);
        }

        const offlineItem: OfflinePendencia = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          secao_id: secaoSelecionada.id,
          subsecao_id: subsecaoSelecionada?.id || null,
          ordem: pendenciasAtuais.length + offlineQueue.filter(q => q.secao_id === secaoSelecionada.id).length,
          local: novaPendLocal.trim(),
          descricao: novaPendDescricao.trim(),
          status: 'PENDENTE',
          foto_base64: fotoBase64,
          relatorio_id: relatorioSelecionado.id,
          created_at: new Date().toISOString(),
        };

        const newQueue = [...offlineQueue, offlineItem];
        saveOfflineQueue(newQueue);
        setOfflineQueue(newQueue);

        showMsg('Salvo offline! Sincroniza quando voltar o sinal.');
        setNovaPendLocal('');
        setNovaPendDescricao('');
        setNovaPendFoto(null);
        setNovaPendFotoPreview(null);
        setTela('relatorio-pendencias');
      } catch (error) {
        console.error('Erro ao salvar offline:', error);
        showMsg('Erro ao salvar');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Online - criar normalmente
    try {
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
        saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
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
        setNovaSecaoTemSubsecoes(false);
        setNovaSubsecoes([]);
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
      {!isOnline && (
        <WifiOff className="w-4 h-4 text-yellow-400 flex-shrink-0" />
      )}
      {syncing && (
        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
      )}
      {offlineQueue.length > 0 && isOnline && !syncing && (
        <button onClick={syncOfflineQueue} className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          {offlineQueue.length}
        </button>
      )}
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
  // Banner de instalação PWA
  const renderInstallBanner = () => {
    if (!showInstallBanner) return null;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
      <div className="mx-4 mt-3 mb-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg relative">
        <button
          onClick={dismissInstallBanner}
          className="absolute top-2 right-2 text-white/60 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Instalar o App</p>
            <p className="text-blue-100 text-xs">
              {isIOS
                ? 'Toque em "Compartilhar" e depois "Adicionar à Tela Inicial"'
                : 'Adicione à tela inicial para acesso rápido'
              }
            </p>
          </div>
        </div>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallApp}
            className="w-full mt-3 bg-white text-blue-700 font-bold text-sm rounded-lg py-2.5 active:scale-[0.98] transition-all"
          >
            Instalar Agora
          </button>
        )}
      </div>
    );
  };

  if (tela === 'contratos') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header com boneco */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#1a3a2a] to-[#0f2318] border-b border-green-500/20 px-4 py-3 flex items-center gap-3">
          <button onClick={onVoltar} className="text-gray-300 hover:text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/avatar-manutencionista.png" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-green-400 text-xs font-bold">Salve Salve Manutencionista</p>
            <p className="text-white text-sm font-semibold">App Coleta MP</p>
          </div>
          {!isOnline && <WifiOff className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
          {syncing && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />}
          {offlineQueue.length > 0 && isOnline && !syncing && (
            <button onClick={syncOfflineQueue} className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />{offlineQueue.length}
            </button>
          )}
          {mensagem && <span className="text-xs text-green-400 animate-pulse">{mensagem}</span>}
        </div>

        {renderInstallBanner()}

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
                // Contar pendências por status
                let pendentes = 0, recebidos = 0, naoFarao = 0;
                rel.secoes?.forEach(sec => {
                  const contarPend = (p: RelatorioPendencia) => {
                    if (p.status === 'RECEBIDO') recebidos++;
                    else if (p.status === 'NAO_FARAO') naoFarao++;
                    else pendentes++;
                  };
                  (sec.pendencias || []).forEach(contarPend);
                  (sec.subsecoes || []).forEach(sub => {
                    (sub.pendencias || []).forEach(contarPend);
                  });
                });
                const totalPendencias = pendentes + recebidos + naoFarao;

                return (
                  <button
                    key={rel.id}
                    onClick={async () => {
                      // Tentar cache primeiro
                      const cached = getFromCache<RelatorioPendencias>(`relatorio_${rel.id}`, 15 * 60 * 1000);
                      if (cached) {
                        setRelatorioSelecionado(cached);
                        setTela('relatorio-secoes');
                        // Atualizar em background
                        if (navigator.onLine) {
                          relatorioPendenciasService.getById(rel.id).then(r => {
                            if (r) {
                              setRelatorioSelecionado(r);
                              saveToCache(`relatorio_${r.id}`, r);
                            }
                          }).catch(() => {});
                        }
                        return;
                      }
                      setLoading(true);
                      try {
                        const relCompleto = await relatorioPendenciasService.getById(rel.id);
                        if (relCompleto) {
                          setRelatorioSelecionado(relCompleto);
                          saveToCache(`relatorio_${relCompleto.id}`, relCompleto);
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
                        {totalPendencias > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            {pendentes > 0 && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">
                                {pendentes} pendente{pendentes > 1 ? 's' : ''}
                              </span>
                            )}
                            {recebidos > 0 && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                                {recebidos} recebido{recebidos > 1 ? 's' : ''}
                              </span>
                            )}
                            {naoFarao > 0 && (
                              <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                                {naoFarao} não farão
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(rel.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGerarDOCX(rel);
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
          {/* Evolução de recebimento */}
          {(() => {
            let total = 0, recebidos = 0, naoFarao = 0;
            relatorioSelecionado?.secoes?.forEach(sec => {
              const contar = (p: any) => {
                total++;
                if (p.status === 'RECEBIDO') recebidos++;
                else if (p.status === 'NAO_FARAO') naoFarao++;
              };
              (sec.pendencias || []).forEach(contar);
              (sec.subsecoes || []).forEach((sub: any) => (sub.pendencias || []).forEach(contar));
            });
            if (total === 0) return null;
            const pendentes = total - recebidos - naoFarao;
            const pctRecebido = Math.round((recebidos / total) * 100);
            const pctNaoFarao = Math.round((naoFarao / total) * 100);
            return (
              <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-medium">Evolução de Recebimento</p>
                  <p className="text-xs text-white font-bold">{pctRecebido}%</p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden flex">
                  {recebidos > 0 && <div className="bg-green-500 h-full transition-all" style={{ width: `${pctRecebido}%` }} />}
                  {naoFarao > 0 && <div className="bg-red-500 h-full transition-all" style={{ width: `${pctNaoFarao}%` }} />}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-300">{recebidos} recebido{recebidos !== 1 ? 's' : ''}</span></span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-gray-300">{pendentes} pendente{pendentes !== 1 ? 's' : ''}</span></span>
                  {naoFarao > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-gray-300">{naoFarao} não farão</span></span>}
                </div>
              </div>
            );
          })()}

          {/* Botão baixar DOCX */}
          <button
            onClick={() => handleGerarDOCX()}
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

          {/* Indicador offline */}
          {!isOnline && (
            <div className="mb-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs">Sem conexão. Pendências criadas serão sincronizadas depois.</p>
            </div>
          )}

          {/* Pendências offline na fila */}
          {offlineQueue.filter(q => q.secao_id === secaoSelecionada?.id && (!subsecaoSelecionada || q.subsecao_id === subsecaoSelecionada?.id)).length > 0 && (
            <div className="mb-3 space-y-2">
              {offlineQueue
                .filter(q => q.secao_id === secaoSelecionada?.id && (!subsecaoSelecionada || q.subsecao_id === subsecaoSelecionada?.id))
                .map((item, idx) => (
                <div key={item.id} className="bg-gray-800 border border-orange-500/30 rounded-lg overflow-hidden opacity-80">
                  <div className="flex">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-700 flex items-center justify-center">
                      {item.foto_base64 ? (
                        <img src={item.foto_base64} className="w-full h-full object-cover" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div className="p-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">offline</span>
                        <p className="text-white text-sm font-medium truncate">{item.local}</p>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{item.descricao}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendencias.length === 0 && offlineQueue.filter(q => q.secao_id === secaoSelecionada?.id).length === 0 ? (
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
                    {/* Número da pendência */}
                    <div className="w-8 flex-shrink-0 flex items-center justify-center bg-gray-800 border-r border-gray-700">
                      <span className="text-gray-400 text-xs font-bold">{idx + 1}</span>
                    </div>
                    {/* Foto thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-700">
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
                  onClick={() => {
                    setEditStatus(opt.value);
                    // Preencher data de recebimento automaticamente com hoje
                    if (opt.value === 'RECEBIDO' && !editDataRecebimento) {
                      setEditDataRecebimento(new Date().toISOString().split('T')[0]);
                    }
                  }}
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

        <div className="p-4 space-y-4 pb-24">
          <p className="text-xs text-gray-500">Numeração automática: <span className="text-purple-400 font-mono">{numeracao}</span></p>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Título da Seção *</label>
            <Input
              value={novaSecaoTitulo}
              onChange={(e) => setNovaSecaoTitulo(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white text-sm"
              placeholder={`Ex: ${numeracao} – INSTALAÇÕES ELÉTRICAS`}
              autoFocus
            />
          </div>

          {/* Toggle subseções */}
          <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div>
              <p className="text-white text-sm font-medium">Tem subseções?</p>
              <p className="text-gray-400 text-xs">Ex: A - Pendências, B - Constatação</p>
            </div>
            <button
              onClick={() => {
                const novo = !novaSecaoTemSubsecoes;
                setNovaSecaoTemSubsecoes(novo);
                if (novo && novaSubsecoes.length === 0) {
                  setNovaSubsecoes([{ titulo: '', tipo: 'MANUAL' }]);
                }
              }}
              className={`w-12 h-6 rounded-full transition-all ${novaSecaoTemSubsecoes ? 'bg-purple-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${novaSecaoTemSubsecoes ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Lista de subseções */}
          {novaSecaoTemSubsecoes && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">Subseções:</p>
              {novaSubsecoes.map((sub, idx) => {
                const letra = String.fromCharCode(65 + idx);
                return (
                  <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold text-sm">{letra}.</span>
                      <Input
                        value={sub.titulo}
                        onChange={(e) => {
                          const updated = [...novaSubsecoes];
                          updated[idx] = { ...updated[idx], titulo: e.target.value };
                          setNovaSubsecoes(updated);
                        }}
                        className="bg-gray-700 border-gray-600 text-white text-sm flex-1"
                        placeholder={`Título da subseção ${letra}`}
                      />
                      {novaSubsecoes.length > 1 && (
                        <button
                          onClick={() => setNovaSubsecoes(novaSubsecoes.filter((_, i) => i !== idx))}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const updated = [...novaSubsecoes];
                          updated[idx] = { ...updated[idx], tipo: 'MANUAL' };
                          setNovaSubsecoes(updated);
                        }}
                        className={`flex-1 py-1.5 rounded text-xs font-medium ${sub.tipo === 'MANUAL' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                      >
                        Pendências
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...novaSubsecoes];
                          updated[idx] = { ...updated[idx], tipo: 'CONSTATACAO' };
                          setNovaSubsecoes(updated);
                        }}
                        className={`flex-1 py-1.5 rounded text-xs font-medium ${sub.tipo === 'CONSTATACAO' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                      >
                        Constatação
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => setNovaSubsecoes([...novaSubsecoes, { titulo: '', tipo: 'MANUAL' }])}
                className="w-full border border-dashed border-gray-600 rounded-lg p-2 text-gray-400 text-xs hover:border-purple-500/30 hover:text-purple-400 transition-all"
              >
                + Adicionar subseção
              </button>
            </div>
          )}
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
