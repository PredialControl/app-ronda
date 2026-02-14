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
import { Contrato, RelatorioPendencias, RelatorioPendencia, UsuarioAutorizado } from '@/types';
import { contratoService } from '@/lib/supabaseService';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { generateRelatorioPendenciasDOCX } from '@/lib/docxRelatorioPendencias';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Building2, FileText, AlertTriangle, Camera, Search,
  Check, X, Upload, Download, ChevronRight, Loader2, Image as ImageIcon,
  Save, Trash2, Edit3, Plus, Smartphone, WifiOff, RefreshCw, Settings, LogOut, User
} from 'lucide-react';

// ============================================
// CACHE LOCAL + OFFLINE QUEUE
// ============================================
const CACHE_PREFIX = 'coleta_cache_';
const OFFLINE_QUEUE_KEY = 'coleta_offline_queue';
const OFFLINE_SECOES_KEY = 'coleta_offline_secoes';

interface OfflineSecao {
  id: string; // offline_sec_xxx
  relatorio_id: string;
  ordem: number;
  titulo_principal: string;
  subtitulo: string;
  tem_subsecoes: boolean;
  subsecoes: Array<{
    id: string; // offline_sub_xxx
    ordem: number;
    titulo: string;
    tipo: string;
    fotos_constatacao?: any[];
  }>;
}

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
    // Limpeza única das pendências travadas de versões anteriores
    if (!localStorage.getItem('offline_queue_cleaned_v3')) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      localStorage.removeItem(OFFLINE_SECOES_KEY);
      localStorage.setItem('offline_queue_cleaned_v3', '1');
      return [];
    }
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflinePendencia[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function getOfflineSecoes(): OfflineSecao[] {
  try {
    const raw = localStorage.getItem(OFFLINE_SECOES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOfflineSecoes(secoes: OfflineSecao[]) {
  localStorage.setItem(OFFLINE_SECOES_KEY, JSON.stringify(secoes));
}

// Comprimir imagem antes de converter para base64 (máx 800px, qualidade 0.6)
function compressImage(file: File, maxSize = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function fileToBase64(file: File): Promise<string> {
  // Comprimir para evitar estouro de storage
  return compressImage(file, 800, 0.6);
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

// Salvar foto na galeria/downloads do celular (usa Blob para evitar erro de fetch em mobile)
function saveToGallery(base64: string, filename: string) {
  try {
    const [header, data] = base64.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 300);
  } catch (e) {
    console.warn('Erro ao salvar na galeria:', e);
  }
}

// ============================================
// IndexedDB para fotos offline (localStorage é pequeno demais)
// ============================================
const IDB_NAME = 'coleta_offline_db';
const IDB_STORE = 'fotos_offline';

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveOfflineFoto(key: string, data: any): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ key, ...data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getOfflineFotos(): Promise<any[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteOfflineFoto(key: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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
  onLogout?: () => void;
  usuario?: UsuarioAutorizado | null;
}

export function ColetaLite({ onVoltar, onLogout, usuario }: ColetaLiteProps) {
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

  // Refs para sync (evita stale closures nos useEffects de auto-sync)
  const relatoriosRef = useRef(relatorios);
  relatoriosRef.current = relatorios;
  const relatorioSelecionadoRef = useRef(relatorioSelecionado);
  relatorioSelecionadoRef.current = relatorioSelecionado;
  const secaoSelecionadaRef = useRef(secaoSelecionada);
  secaoSelecionadaRef.current = secaoSelecionada;
  const subsecaoSelecionadaRef = useRef(subsecaoSelecionada);
  subsecaoSelecionadaRef.current = subsecaoSelecionada;
  const contratoSelecionadoRef = useRef(contratoSelecionado);
  contratoSelecionadoRef.current = contratoSelecionado;

  // Ref para fotos de constatação
  const constatacaoFotoRef = useRef<HTMLInputElement>(null);

  // Edição de pendência
  const [editLocal, setEditLocal] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editStatus, setEditStatus] = useState<'PENDENTE' | 'RECEBIDO' | 'NAO_FARAO'>('PENDENTE');
  const [editDataRecebimento, setEditDataRecebimento] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingFotoDepois, setUploadingFotoDepois] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const fotoGaleriaRef = useRef<HTMLInputElement>(null);
  const fotoDepoisRef = useRef<HTMLInputElement>(null);
  const fotoDepoisGaleriaRef = useRef<HTMLInputElement>(null);

  // Novo relatório
  const [novoRelTitulo, setNovoRelTitulo] = useState('');

  // Nova seção
  const [novaSecaoTitulo, setNovaSecaoTitulo] = useState('');
  const [novaSecaoSubtitulo, setNovaSecaoSubtitulo] = useState('');
  const [novaSecaoTemSubsecoes, setNovaSecaoTemSubsecoes] = useState(false);
  const [novaSubsecoes, setNovaSubsecoes] = useState<Array<{ titulo: string; tipo: 'MANUAL' | 'CONSTATACAO' }>>([]);

  // Nova subseção (para adicionar a seção existente)
  const [novaSubTitulo, setNovaSubTitulo] = useState('');
  const [novaSubTipo, setNovaSubTipo] = useState<'MANUAL' | 'CONSTATACAO'>('MANUAL');

  // Nova pendência
  const [novaPendLocal, setNovaPendLocal] = useState('');
  const [novaPendDescricao, setNovaPendDescricao] = useState('');
  const [novaPendFoto, setNovaPendFoto] = useState<File | null>(null);
  const [novaPendFotoPreview, setNovaPendFotoPreview] = useState<string | null>(null);
  const novaPendFotoRef = useRef<HTMLInputElement>(null);
  const novaPendFotoGaleriaRef = useRef<HTMLInputElement>(null);

  // Mapa de fotos offline: pendenciaId -> { foto_url?: base64, foto_depois_url?: base64 }
  const [offlineFotosMap, setOfflineFotosMap] = useState<Record<string, { foto_url?: string; foto_depois_url?: string }>>({});

  // Carregar fotos offline do IndexedDB
  const loadOfflineFotos = useCallback(async () => {
    try {
      const fotos = await getOfflineFotos();
      const map: Record<string, { foto_url?: string; foto_depois_url?: string }> = {};
      for (const foto of fotos) {
        if (foto.pendenciaId && foto.base64) {
          const campo = foto.campo || 'foto_url';
          if (!map[foto.pendenciaId]) map[foto.pendenciaId] = {};
          if (campo === 'foto_depois_url') {
            map[foto.pendenciaId].foto_depois_url = foto.base64;
          } else {
            map[foto.pendenciaId].foto_url = foto.base64;
          }
        }
      }
      // Também carregar fotos de itens offline (pendencia_foto_xxx)
      for (const foto of fotos) {
        if (foto.key?.startsWith('pendencia_foto_') && foto.base64 && foto.pendenciaId) {
          if (!map[foto.pendenciaId]) map[foto.pendenciaId] = {};
          map[foto.pendenciaId].foto_url = foto.base64;
        }
      }
      setOfflineFotosMap(map);
    } catch (e) {
      console.warn('Erro ao carregar fotos offline:', e);
    }
  }, []);

  // Recarregar fotos offline ao trocar de tela ou relatório
  useEffect(() => {
    loadOfflineFotos();
  }, [tela, relatorioSelecionado]);

  // PWA Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Capturar beforeinstallprompt (evento é capturado globalmente no index.html)
  useEffect(() => {
    // Handler para capturar se disparar enquanto componente está montado
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
      console.log('✅ beforeinstallprompt capturado no React!');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Recuperar prompt já capturado pelo index.html (antes do React montar)
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
      console.log('✅ Recuperou prompt do index.html');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    const prompt = deferredPrompt || (window as any).__pwaInstallPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setShowSettings(false);
        }
      } catch (e) {
        console.error('Erro ao mostrar prompt de instalação:', e);
      }
      setDeferredPrompt(null);
      (window as any).__pwaInstallPrompt = null;
    }
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

  // Auto-sync quando voltar online ou app ficar visível
  useEffect(() => {
    if (isOnline) {
      // Sempre tentar sync ao voltar online (lê fila fresca do localStorage)
      syncOfflineQueue();
    }
  }, [isOnline]);

  // Sync quando app volta ao foco (tab visível / desbloqueio de tela)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncOfflineQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Polling periódico: tenta sync a cada 30s se tem itens na fila
  // (resolve dados móveis onde o evento 'online' nem sempre dispara)
  useEffect(() => {
    const interval = setInterval(() => {
      const queue = getOfflineQueue();
      if (queue.length > 0 && navigator.onLine) {
        setOfflineQueue(queue); // Atualizar state (pode ter limpado itens velhos)
        syncOfflineQueue();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Sincronizar fila offline (com lock para evitar duplicação)
  const syncLockRef = useRef(false);
  const syncOfflineQueue = async () => {
    if (syncLockRef.current || !navigator.onLine) {
      console.log('[SYNC] Bloqueado - lock:', syncLockRef.current, 'online:', navigator.onLine);
      return;
    }
    syncLockRef.current = true;
    console.log('[SYNC] Iniciando sincronização...');

    try {
      // Ler fila FRESCA do localStorage (evita processar itens já removidos)
      const queue = getOfflineQueue();
      console.log('[SYNC] Fila:', queue.length, 'itens');

      // Ler refs para ter valores frescos (evita stale closures)
      const currentRelatorios = relatoriosRef.current;
      const currentRelSelecionado = relatorioSelecionadoRef.current;
      const currentContrato = contratoSelecionadoRef.current;
      const currentSecao = secaoSelecionadaRef.current;
      const currentSubsecao = subsecaoSelecionadaRef.current;

      // Verificar se há QUALQUER coisa para sincronizar
      let temFotosOrfas = false;
      try {
        const fotos = await getOfflineFotos();
        temFotosOrfas = fotos.some(f => f.base64 && f.pendenciaId && !f.key?.startsWith('pendencia_foto_'));
      } catch {}
      const temRelOffline = currentRelatorios.some(r => r.id?.startsWith('offline_rel_'));
      const offlineSecoes = getOfflineSecoes();
      const temSecaoOffline = offlineSecoes.length > 0;

      console.log('[SYNC] fila:', queue.length, 'fotosOrfas:', temFotosOrfas, 'relOff:', temRelOffline, 'secOff:', offlineSecoes.length);
      console.log('[SYNC] relSelecionado:', currentRelSelecionado?.id, 'contrato:', currentContrato?.id);

      if (queue.length === 0 && !temFotosOrfas && !temRelOffline && !temSecaoOffline) {
        console.log('[SYNC] Nada para sincronizar, saindo.');
        setOfflineQueue([]);
        return;
      }

      setSyncing(true);

      // 0. Sincronizar relatórios offline primeiro
      const relIdMap: Record<string, string> = {}; // offline_rel_xxx -> real_id
      // Ler relatorios do ref (valores frescos)
      const relatoriosAtuais = [...currentRelatorios];
      for (const rel of relatoriosAtuais.filter(r => r.id?.startsWith('offline_rel_'))) {
        try {
          const novo = await relatorioPendenciasService.create({
            contrato_id: (rel as any).contrato_id || currentContrato?.id,
            titulo: rel.titulo,
          } as any);
          relIdMap[rel.id] = novo.id;
          // Se é o relatório selecionado, atualizar
          if (currentRelSelecionado?.id === rel.id) {
            const relCompleto = await relatorioPendenciasService.getById(novo.id);
            if (relCompleto) {
              setRelatorioSelecionado(relCompleto);
              saveToCache(`relatorio_${relCompleto.id}`, relCompleto);
            }
          }
        } catch (e) {
          console.error('Erro sync relatório offline:', e);
        }
      }
      // Atualizar lista de relatórios
      if (Object.keys(relIdMap).length > 0) {
        setRelatorios(prev => prev.filter(r => !r.id?.startsWith('offline_rel_')));
        if (currentContrato) {
          try { await loadRelatorios(currentContrato.id); } catch {}
        }
      }

      // 1. Sincronizar seções offline do localStorage (fonte de verdade)
      const secaoIdMap: Record<string, string> = {}; // offline_sec_xxx -> real_id
      const subIdMap: Record<string, string> = {}; // offline_sub_xxx -> real_id
      const secoesParaSync = [...offlineSecoes]; // Já lido do localStorage acima
      for (const secLocal of secoesParaSync) {
        try {
          // Mapear relatorio_id offline para real se necessário
          const realRelId = relIdMap[secLocal.relatorio_id] || secLocal.relatorio_id;
          if (realRelId.startsWith('offline_')) {
            console.log('[SYNC] Seção', secLocal.id, 'tem relatorio offline, pulando');
            continue; // Relatório ainda não sincronizado
          }

          console.log('[SYNC] Criando seção', secLocal.id, 'no relatório', realRelId);
          const secao = await relatorioPendenciasService.createSecao({
            relatorio_id: realRelId,
            ordem: secLocal.ordem ?? 0,
            titulo_principal: secLocal.titulo_principal || '',
            subtitulo: secLocal.subtitulo || '',
            tem_subsecoes: secLocal.tem_subsecoes || false,
          } as any);
          secaoIdMap[secLocal.id] = secao.id;
          console.log('[SYNC] Seção criada:', secLocal.id, '->', secao.id);

          // Criar subseções
          if (secLocal.tem_subsecoes && secLocal.subsecoes) {
            for (const subLocal of secLocal.subsecoes) {
              try {
                const subCriada = await relatorioPendenciasService.createSubsecao({
                  secao_id: secao.id,
                  ordem: subLocal.ordem ?? 0,
                  titulo: subLocal.titulo || '',
                  tipo: subLocal.tipo || 'MANUAL',
                  fotos_constatacao: subLocal.fotos_constatacao || [],
                } as any);
                subIdMap[subLocal.id] = subCriada.id;
              } catch (e) {
                console.error('Erro sync subseção offline:', e);
              }
            }
          }

          // Remover seção do localStorage IMEDIATAMENTE após sucesso
          const secoesRestantes = getOfflineSecoes().filter(s => s.id !== secLocal.id);
          saveOfflineSecoes(secoesRestantes);
        } catch (e) {
          console.error('Erro sync seção offline:', e);
        }
      }

      showMsg(`Sincronizando ${queue.length} pendência(s)...`);
      const remaining: OfflinePendencia[] = [];

      for (const item of queue) {
        try {
          // Substituir IDs offline por IDs reais do banco
          const realRelId = relIdMap[item.relatorio_id] || item.relatorio_id;
          const realSecaoId = secaoIdMap[item.secao_id] || item.secao_id;
          const realSubId = item.subsecao_id ? (subIdMap[item.subsecao_id] || item.subsecao_id) : null;

          console.log('[SYNC] Processando pendência:', item.id, 'relId:', realRelId, 'secaoId:', realSecaoId, 'subId:', realSubId);

          // Se seção ou relatório ainda é offline (sync falhou), manter na fila
          if (realSecaoId.startsWith('offline_') || realRelId.startsWith('offline_')) {
            console.log('[SYNC] IDs ainda offline, mantendo na fila');
            remaining.push(item);
            continue;
          }

          const novaPend: any = {
            secao_id: realSecaoId,
            subsecao_id: realSubId,
            ordem: item.ordem,
            local: item.local,
            descricao: item.descricao,
            foto_url: null,
            foto_depois_url: null,
            status: item.status,
          };

          const criada = await relatorioPendenciasService.createPendencia(novaPend);
          console.log('[SYNC] Pendência criada no banco:', criada.id);

          // Upload foto se tiver
          if (item.foto_base64 && criada.id) {
            try {
              let base64Data = item.foto_base64;
              let fotoKeyToDelete: string | null = null;
              if (item.foto_base64.startsWith('pendencia_foto_')) {
                const fotos = await getOfflineFotos();
                const fotoEntry = fotos.find(f => f.key === item.foto_base64);
                if (fotoEntry?.base64) {
                  base64Data = fotoEntry.base64;
                  fotoKeyToDelete = item.foto_base64;
                } else {
                  base64Data = '';
                }
              }
              if (base64Data && base64Data.startsWith('data:')) {
                const file = base64ToFile(base64Data, `foto_${criada.id}.jpg`);
                const url = await relatorioPendenciasService.uploadFoto(file, realRelId, criada.id);
                await relatorioPendenciasService.updatePendencia(criada.id, { foto_url: url });
                // Só deletar APÓS upload+DB confirmados
                if (fotoKeyToDelete) await deleteOfflineFoto(fotoKeyToDelete);
              }
            } catch (fotoErr) {
              console.error('Erro upload foto da pendência:', fotoErr);
            }
          }

          // Item processado com sucesso - salvar fila atualizada IMEDIATAMENTE
          // (evita reprocessar se o próximo item falhar)
          const currentQueue = getOfflineQueue().filter(q => q.id !== item.id);
          saveOfflineQueue(currentQueue);
        } catch (e) {
          console.error('Erro ao sincronizar pendência offline:', e);
          remaining.push(item);
        }
      }

      // Atualizar state com o que realmente sobrou no localStorage
      setOfflineQueue(getOfflineQueue());

      // Sync fotos órfãs do IndexedDB (de uploads que falharam)
      await syncOrphanFotos(relIdMap);

      // Limpar fotos antigas do localStorage (migração)
      try {
        const oldKeys = Object.keys(localStorage).filter(k => k.startsWith('foto_offline_'));
        for (const key of oldKeys) {
          try {
            const fotoData = JSON.parse(localStorage.getItem(key) || '');
            if (fotoData.base64 && fotoData.pendenciaId && fotoData.relatorioId) {
              const file = base64ToFile(fotoData.base64, `foto_${fotoData.pendenciaId}.jpg`);
              const url = await relatorioPendenciasService.uploadFoto(file, fotoData.relatorioId, `${fotoData.pendenciaId}-sync-${Date.now()}`);
              await relatorioPendenciasService.updatePendencia(fotoData.pendenciaId, { [fotoData.campo]: url });
            }
            localStorage.removeItem(key);
        } catch (e) {
          console.error('Erro ao sync foto localStorage antigo:', e);
        }
      }
    } catch {}

      const queueLeft = getOfflineQueue();
      if (queueLeft.length === 0) {
        showMsg('Tudo sincronizado!');
      } else {
        showMsg(`${queueLeft.length} pendência(s) ainda na fila`);
      }

      // Recarregar dados (usar refs para valores frescos)
      const curRelId = relatorioSelecionadoRef.current?.id;
      const relIdParaReload = (curRelId && relIdMap[curRelId]) || curRelId;
      if (relIdParaReload && !relIdParaReload.startsWith('offline_')) {
        try {
          const relAtualizado = await relatorioPendenciasService.getById(relIdParaReload);
          if (relAtualizado) {
            setRelatorioSelecionado(relAtualizado);
            saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
            // Atualizar seção/subseção selecionada com dados frescos
            const secAtual = secaoSelecionadaRef.current;
            if (secAtual) {
              const secFresca = relAtualizado.secoes?.find(s =>
                s.id === secAtual.id || s.id === secaoIdMap[secAtual.id]
              );
              if (secFresca) {
                setSecaoSelecionada(secFresca);
                const subAtual = subsecaoSelecionadaRef.current;
                if (subAtual) {
                  const subFresca = secFresca.subsecoes?.find(sub =>
                    sub.id === subAtual.id || sub.id === subIdMap[subAtual.id]
                  );
                  if (subFresca) setSubsecaoSelecionada(subFresca);
                }
              }
            }
          }
        } catch {}
      }
      const contratoAtual = contratoSelecionadoRef.current;
      if (contratoAtual) {
        try { await loadRelatorios(contratoAtual.id); } catch {}
      }

      loadOfflineFotos();
      setSyncing(false);
    } finally {
      syncLockRef.current = false;
    }
  };

  // Sync fotos órfãs do IndexedDB (fotos de uploads que falharam, não de pendências offline)
  const syncOrphanFotos = async (relIdMap: Record<string, string> = {}) => {
    try {
      const offlineFotos = await getOfflineFotos();
      // Filtrar: só fotos que NÃO são de pendências offline (pendencia_foto_xxx)
      // Fotos de handleUploadFoto têm key tipo "foto_{pendenciaId}_{tipo}_{timestamp}"
      const fotosParaSync = offlineFotos.filter(f =>
        f.base64 && f.pendenciaId && f.relatorioId &&
        !f.key?.startsWith('pendencia_foto_') &&
        !f.pendenciaId.startsWith('offline_')
      );
      for (const foto of fotosParaSync) {
        try {
          // Mapear relatorioId offline para real se necessário
          const realRelId = relIdMap[foto.relatorioId] || foto.relatorioId;
          if (realRelId.startsWith('offline_')) continue; // Relatório ainda não sincronizado
          const file = base64ToFile(foto.base64, `foto_${foto.pendenciaId}.jpg`);
          const url = await relatorioPendenciasService.uploadFoto(file, realRelId, `${foto.pendenciaId}-sync-${Date.now()}`);
          await relatorioPendenciasService.updatePendencia(foto.pendenciaId, { [foto.campo]: url });
          // Só deletar APÓS confirmar upload+DB
          await deleteOfflineFoto(foto.key);
        } catch (e) {
          console.error('Erro ao sync foto offline:', e);
        }
      }
    } catch {}
  };

  const showMsg = (msg: string) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(null), 3000);
  };

  // Upload de foto (SEMPRE salva no IndexedDB primeiro, depois tenta upload)
  const handleUploadFoto = async (file: File, tipo: 'antes' | 'depois') => {
    if (!pendenciaSelecionada || !relatorioSelecionado) return;

    const setUploading = tipo === 'antes' ? setUploadingFoto : setUploadingFotoDepois;
    setUploading(true);
    const campo = tipo === 'antes' ? 'foto_url' : 'foto_depois_url';

    // Comprimir foto primeiro (funciona offline também)
    let base64: string;
    try {
      base64 = await compressImage(file, 800, 0.6);
    } catch (e) {
      console.error('Erro ao comprimir foto:', e);
      showMsg('Erro ao processar foto');
      setUploading(false);
      return;
    }

    // Mostrar preview imediatamente
    setPendenciaSelecionada(prev => prev ? { ...prev, [campo]: base64 } : null);

    // Salvar na galeria do celular
    const ts = Date.now();
    saveToGallery(base64, `ronda_${tipo}_${ts}.jpg`);

    // SEMPRE salvar no IndexedDB primeiro (proteção contra perda de sinal)
    const fotoKey = `foto_${pendenciaSelecionada.id}_${tipo}_${ts}`;
    try {
      await saveOfflineFoto(fotoKey, {
        pendenciaId: pendenciaSelecionada.id,
        relatorioId: relatorioSelecionado.id,
        campo,
        base64,
      });
    } catch (e) {
      console.error('Erro ao salvar foto no IndexedDB:', e);
    }

    // Se offline, parar aqui (sync vai enviar depois)
    if (!navigator.onLine) {
      loadOfflineFotos();
      showMsg(`Foto ${tipo} salva offline!`);
      setUploading(false);
      return;
    }

    // Online: tentar upload com timeout de 15s (sinal fraco trava sem timeout)
    try {
      const fotoFile = base64ToFile(base64, `foto_${tipo}_${ts}.jpg`);
      const uploadPromise = relatorioPendenciasService.uploadFoto(
        fotoFile,
        relatorioSelecionado.id,
        `${pendenciaSelecionada.id}-${tipo}-${ts}`
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout (15s)')), 15000)
      );
      const url = await Promise.race([uploadPromise, timeoutPromise]);

      const updatePromise = relatorioPendenciasService.updatePendencia(pendenciaSelecionada.id, { [campo]: url });
      const updateTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB update timeout (10s)')), 10000)
      );
      await Promise.race([updatePromise, updateTimeout]);

      setPendenciaSelecionada(prev => prev ? { ...prev, [campo]: url } : null);

      // Upload + DB confirmados => remover do IndexedDB e do mapa
      try { await deleteOfflineFoto(fotoKey); } catch {}
      loadOfflineFotos();

      showMsg(`Foto ${tipo} salva!`);

      // Atualizar cache em background
      try {
        const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
        if (relAtualizado) {
          setRelatorioSelecionado(relAtualizado);
          saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
        }
      } catch {}
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      // Foto já está segura no IndexedDB, sync vai enviar depois
      loadOfflineFotos();
      showMsg(`Foto salva localmente! Envia quando tiver sinal.`);
    } finally {
      setUploading(false);
    }
  };

  // Excluir foto (antes ou depois)
  const handleDeleteFoto = async (tipo: 'antes' | 'depois') => {
    if (!pendenciaSelecionada || !relatorioSelecionado) return;
    const campo = tipo === 'antes' ? 'foto_url' : 'foto_depois_url';

    // Limpar preview imediatamente
    setPendenciaSelecionada(prev => prev ? { ...prev, [campo]: null } : null);

    // Se online, salvar no banco
    if (navigator.onLine) {
      try {
        await relatorioPendenciasService.updatePendencia(pendenciaSelecionada.id, { [campo]: null });
        showMsg(`Foto ${tipo} removida!`);
        // Atualizar cache
        try {
          const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
          if (relAtualizado) {
            setRelatorioSelecionado(relAtualizado);
            saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
          }
        } catch {}
      } catch (error) {
        console.error('Erro ao remover foto:', error);
        showMsg('Erro ao remover foto');
      }
    } else {
      showMsg(`Foto ${tipo} removida (sync quando online)`);
    }
  };

  // Salvar edição da pendência
  const handleSalvarPendencia = async () => {
    if (!pendenciaSelecionada) return;
    setLoading(true);
    try {
      const dadosUpdate: any = {
        local: editLocal,
        descricao: editDescricao,
        status: editStatus,
      };
      if (editDataRecebimento) {
        dadosUpdate.data_recebimento = editDataRecebimento;
      }
      console.log('📝 Salvando pendência:', pendenciaSelecionada.id, dadosUpdate);

      // Timeout para não travar com sinal fraco
      const savePromise = relatorioPendenciasService.updatePendencia(pendenciaSelecionada.id, dadosUpdate);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Save timeout')), 10000)
      );
      const resultado = await Promise.race([savePromise, timeoutPromise]);
      console.log('✅ Resultado update:', resultado);

      // Sincronizar com tabela evolucao_recebimentos (usada pela aba Evolução no PC)
      try {
        const secao = secaoSelecionada;
        const rel = relatorioSelecionado;
        if (rel) {
          const situacaoMap: Record<string, string> = { 'RECEBIDO': 'RECEBIDO', 'NAO_FARAO': 'NAO_FARA', 'PENDENTE': 'PENDENTE' };
          await supabase.from('evolucao_recebimentos').upsert({
            pendencia_id: pendenciaSelecionada.id,
            relatorio_id: rel.id,
            contrato_id: contratoSelecionado?.id,
            situacao: situacaoMap[editStatus] || 'PENDENTE',
            data_recebido: editDataRecebimento || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'pendencia_id' });
        }
      } catch (e) {
        console.warn('Aviso: não sincronizou evolucao_recebimentos:', e);
      }

      showMsg(`Salvo! Status: ${editStatus}`);

      // Recarregar relatório (preservando fotos que estão em base64 local/IndexedDB)
      if (relatorioSelecionado) {
        try {
          const relAtualizado = await relatorioPendenciasService.getById(relatorioSelecionado.id);
          if (relAtualizado) {
            // Se a pendência atual tem foto em base64 (ainda não subiu pro Supabase),
            // preservar no relatório recarregado para não perder o preview
            if (pendenciaSelecionada) {
              const fotoAntes = pendenciaSelecionada.foto_url;
              const fotoDepois = pendenciaSelecionada.foto_depois_url;
              if (fotoAntes?.startsWith('data:') || fotoDepois?.startsWith('data:')) {
                relAtualizado.secoes?.forEach(sec => {
                  (sec.pendencias || []).forEach(p => {
                    if (p.id === pendenciaSelecionada.id) {
                      if (fotoAntes?.startsWith('data:') && !p.foto_url) p.foto_url = fotoAntes;
                      if (fotoDepois?.startsWith('data:') && !p.foto_depois_url) p.foto_depois_url = fotoDepois;
                    }
                  });
                  (sec.subsecoes || []).forEach(sub => {
                    (sub.pendencias || []).forEach((p: any) => {
                      if (p.id === pendenciaSelecionada.id) {
                        if (fotoAntes?.startsWith('data:') && !p.foto_url) p.foto_url = fotoAntes;
                        if (fotoDepois?.startsWith('data:') && !p.foto_depois_url) p.foto_depois_url = fotoDepois;
                      }
                    });
                  });
                });
              }
            }
            setRelatorioSelecionado(relAtualizado);
            saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
            // Atualizar seção/subseção selecionada
            const secAtualizada = relAtualizado.secoes?.find(s => s.id === secaoSelecionada?.id);
            if (secAtualizada) {
              setSecaoSelecionada(secAtualizada);
              if (subsecaoSelecionada) {
                const subAtualizada = secAtualizada.subsecoes?.find(sub => sub.id === subsecaoSelecionada.id);
                if (subAtualizada) setSubsecaoSelecionada(subAtualizada);
              }
            }
          }
        } catch {
          // Se falhar reload (offline), tudo bem - dados locais já estão certos
        }
      }

      setTela('relatorio-pendencias');
    } catch (error: any) {
      console.error('❌ Erro ao salvar pendência:', error);
      showMsg(`Erro: ${error?.message || 'Falha ao salvar'}`);
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

      // Debug: verificar dados das pendências
      relCompleto.secoes?.forEach(sec => {
        (sec.pendencias || []).forEach(p => {
          console.log(`[DOCX DEBUG] Pendência "${p.local}" - status: ${p.status}, foto_depois: ${p.foto_depois_url ? 'SIM' : 'NÃO'}, data_receb: ${p.data_recebimento}`);
        });
        (sec.subsecoes || []).forEach((sub: any) => {
          (sub.pendencias || []).forEach((p: any) => {
            console.log(`[DOCX DEBUG] Sub "${sub.titulo}" - Pendência "${p.local}" - status: ${p.status}, foto_depois: ${p.foto_depois_url ? 'SIM' : 'NÃO'}`);
          });
        });
      });

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

    const offlineRelId = `offline_rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const titulo = novoRelTitulo.trim();

    // Criar localmente primeiro (offline-first)
    const relLocal: any = {
      id: offlineRelId,
      contrato_id: contratoSelecionado.id,
      titulo,
      secoes: [],
      created_at: new Date().toISOString(),
    };

    // Adicionar à lista local
    setRelatorios(prev => [...prev, relLocal]);
    setRelatorioSelecionado(relLocal);
    saveToCache(`relatorio_${offlineRelId}`, relLocal);
    showMsg('Relatório criado!');
    setNovoRelTitulo('');
    setLoading(false);
    setTela('relatorio-secoes');

    // Se online, sincronizar em background
    if (navigator.onLine) {
      try {
        const novo = await relatorioPendenciasService.create({
          contrato_id: contratoSelecionado.id,
          titulo,
        } as any);
        const relCompleto = await relatorioPendenciasService.getById(novo.id);
        if (relCompleto) {
          setRelatorioSelecionado(relCompleto);
          saveToCache(`relatorio_${relCompleto.id}`, relCompleto);
          // Atualizar lista substituindo o local pelo real
          setRelatorios(prev => prev.map(r => r.id === offlineRelId ? relCompleto : r));
        }
      } catch (e) {
        console.error('Erro ao sync relatório (mantido local):', e);
      }
    }
  };

  // Criar nova seção (offline-first)
  const handleCriarSecao = async () => {
    if (!relatorioSelecionado || !novaSecaoTitulo.trim()) return;
    setLoading(true);

    const ordemAtual = relatorioSelecionado.secoes?.length || 0;
    const offlineSecaoId = `offline_sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Criar subseções locais
    const subsLocal = novaSecaoTemSubsecoes
      ? novaSubsecoes.filter(s => s.titulo.trim()).map((sub, i) => ({
          id: `offline_sub_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          ordem: i,
          titulo: sub.titulo.trim(),
          tipo: sub.tipo,
          pendencias: [],
          fotos_constatacao: sub.tipo === 'CONSTATACAO' ? [] : undefined,
        }))
      : [];

    // Criar seção local imediatamente (para navegar)
    const secaoLocal: any = {
      id: offlineSecaoId,
      ordem: ordemAtual,
      titulo_principal: novaSecaoTitulo.trim(),
      subtitulo: novaSecaoSubtitulo.trim() || '',
      tem_subsecoes: novaSecaoTemSubsecoes,
      subsecoes: subsLocal,
      pendencias: [],
    };

    // Adicionar ao relatório local
    const relAtualizado = {
      ...relatorioSelecionado,
      secoes: [...(relatorioSelecionado.secoes || []), secaoLocal],
    };
    setRelatorioSelecionado(relAtualizado as any);
    saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);

    // Salvar seção offline no localStorage (persiste independente do state React)
    const offlineSecoes = getOfflineSecoes();
    offlineSecoes.push({
      id: offlineSecaoId,
      relatorio_id: relatorioSelecionado.id,
      ordem: ordemAtual,
      titulo_principal: novaSecaoTitulo.trim(),
      subtitulo: novaSecaoSubtitulo.trim() || '',
      tem_subsecoes: novaSecaoTemSubsecoes,
      subsecoes: subsLocal.map(s => ({
        id: s.id,
        ordem: s.ordem,
        titulo: s.titulo,
        tipo: s.tipo,
        fotos_constatacao: s.fotos_constatacao,
      })),
    });
    saveOfflineSecoes(offlineSecoes);

    showMsg('Seção criada!');
    setNovaSecaoTitulo('');
    setNovaSecaoSubtitulo('');
    setNovaSecaoTemSubsecoes(false);
    setNovaSubsecoes([]);
    setLoading(false);

    // Navegar para a seção criada
    setSecaoSelecionada(secaoLocal);
    setTela('relatorio-pendencias');

    // Se online, sincronizar em background
    if (navigator.onLine) {
      try {
        const secao = await relatorioPendenciasService.createSecao({
          relatorio_id: relatorioSelecionado.id,
          ordem: ordemAtual,
          titulo_principal: novaSecaoTitulo.trim(),
          subtitulo: novaSecaoSubtitulo.trim() || '',
          tem_subsecoes: novaSecaoTemSubsecoes,
        } as any);

        // Criar subseções no banco
        const subIdsMap: Record<string, string> = {};
        if (novaSecaoTemSubsecoes) {
          for (let i = 0; i < subsLocal.length; i++) {
            const sub = subsLocal[i];
            try {
              const subCriada = await relatorioPendenciasService.createSubsecao({
                secao_id: secao.id,
                ordem: sub.ordem,
                titulo: sub.titulo,
                tipo: sub.tipo,
                fotos_constatacao: sub.fotos_constatacao,
              } as any);
              subIdsMap[sub.id] = subCriada.id;
            } catch (e) {
              console.error('Erro ao criar subseção:', e);
            }
          }
        }

        // Remover do localStorage de seções offline (sync deu certo)
        const secoesRestantes = getOfflineSecoes().filter(s => s.id !== offlineSecaoId);
        saveOfflineSecoes(secoesRestantes);

        // Atualizar IDs locais com IDs reais do banco
        const relReload = await relatorioPendenciasService.getById(relatorioSelecionado.id);
        if (relReload) {
          setRelatorioSelecionado(relReload);
          saveToCache(`relatorio_${relReload.id}`, relReload);
          const secReal = relReload.secoes?.find(s => s.id === secao.id);
          if (secReal) {
            setSecaoSelecionada(secReal);
          }
        }
      } catch (e) {
        console.error('Erro ao sync seção (mantida local):', e);
        // Seção fica no localStorage, será sincronizada no próximo sync
      }
    }
  };

  // Adicionar subseção a seção existente
  const handleAddSubsecao = async (titulo: string, tipo: 'MANUAL' | 'CONSTATACAO') => {
    if (!secaoSelecionada || !relatorioSelecionado || !titulo.trim()) return;
    setLoading(true);

    const ordem = (secaoSelecionada.subsecoes || []).length;
    const offlineSubId = `offline_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subLocal: any = {
      id: offlineSubId,
      ordem,
      titulo: titulo.trim(),
      tipo,
      pendencias: [],
      fotos_constatacao: tipo === 'CONSTATACAO' ? [] : undefined,
      descricao_constatacao: tipo === 'CONSTATACAO' ? '' : undefined,
    };

    // Atualizar seção local
    const secAtualizada = {
      ...secaoSelecionada,
      tem_subsecoes: true,
      subsecoes: [...(secaoSelecionada.subsecoes || []), subLocal],
    };
    setSecaoSelecionada(secAtualizada);

    // Atualizar no relatório
    const relAtualizado = {
      ...relatorioSelecionado,
      secoes: (relatorioSelecionado.secoes || []).map((s: any) =>
        s.id === secaoSelecionada.id ? secAtualizada : s
      ),
    };
    setRelatorioSelecionado(relAtualizado as any);
    saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);

    showMsg('Subseção criada!');
    setLoading(false);

    // Se online e seção tem ID real, criar no banco
    if (navigator.onLine && !secaoSelecionada.id.startsWith('offline_')) {
      try {
        const subCriada = await relatorioPendenciasService.createSubsecao({
          secao_id: secaoSelecionada.id,
          ordem,
          titulo: titulo.trim(),
          tipo,
          fotos_constatacao: tipo === 'CONSTATACAO' ? [] : undefined,
          descricao_constatacao: tipo === 'CONSTATACAO' ? '' : undefined,
        } as any);

        // Atualizar ID real
        const relReload = await relatorioPendenciasService.getById(relatorioSelecionado.id);
        if (relReload) {
          setRelatorioSelecionado(relReload);
          saveToCache(`relatorio_${relReload.id}`, relReload);
          const secFresca = relReload.secoes?.find((s: any) => s.id === secaoSelecionada.id);
          if (secFresca) {
            setSecaoSelecionada(secFresca);
          }
        }
      } catch (e) {
        console.error('Erro ao criar subseção no banco:', e);
      }
    }
  };

  // Criar nova pendência (offline-first para velocidade)
  const handleCriarPendencia = async () => {
    if (!relatorioSelecionado || !secaoSelecionada) return;
    if (!novaPendLocal.trim() && !novaPendDescricao.trim()) return;
    setLoading(true);

    const pendenciasAtuais = subsecaoSelecionada
      ? (subsecaoSelecionada.pendencias || [])
      : (secaoSelecionada.pendencias || []);

    try {
      const itemId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Se tem foto, salvar no IndexedDB (não no localStorage para evitar estouro)
      let fotoRef: string | null = null;
      if (novaPendFoto) {
        try {
          const base64 = await compressImage(novaPendFoto, 800, 0.6);
          fotoRef = `pendencia_foto_${itemId}`;
          await saveOfflineFoto(fotoRef, {
            pendenciaId: itemId,
            relatorioId: relatorioSelecionado.id,
            campo: 'foto_url',
            base64,
          });
        } catch (e) {
          console.error('Erro ao salvar foto offline:', e);
        }
      }

      const offlineItem: OfflinePendencia = {
        id: itemId,
        secao_id: secaoSelecionada.id,
        subsecao_id: subsecaoSelecionada?.id || null,
        ordem: pendenciasAtuais.length + offlineQueue.filter(q => q.secao_id === secaoSelecionada.id).length,
        local: novaPendLocal.trim(),
        descricao: novaPendDescricao.trim(),
        status: 'PENDENTE',
        foto_base64: fotoRef, // Agora é referência ao IndexedDB, não o base64 inteiro
        relatorio_id: relatorioSelecionado.id,
        created_at: new Date().toISOString(),
      };

      // Salvar na fila local imediatamente (ler do localStorage para evitar stale state)
      const currentQueue = getOfflineQueue();
      const newQueue = [...currentQueue, offlineItem];
      saveOfflineQueue(newQueue);
      setOfflineQueue(newQueue);

      // Limpar campos e ficar na mesma tela para criar outra
      showMsg('Pendência salva!');
      setNovaPendLocal('');
      setNovaPendDescricao('');
      setNovaPendFoto(null);
      setNovaPendFotoPreview(null);
      setLoading(false);
      loadOfflineFotos();

      // Se online, sincronizar em background (sem bloquear UI)
      if (navigator.onLine) {
        syncOfflineInBackground(newQueue);
      }
    } catch (error) {
      console.error('Erro ao salvar pendência:', error);
      showMsg('Erro ao salvar');
      setLoading(false);
    }
  };

  // Sincronizar fila offline em background - com retry se lock estiver ativo
  const syncOfflineInBackground = async (_queue: OfflinePendencia[]) => {
    // Se sync já está rodando, agendar retry para quando terminar
    if (syncLockRef.current) {
      const waitForUnlock = () => {
        const interval = setInterval(() => {
          if (!syncLockRef.current) {
            clearInterval(interval);
            syncOfflineQueue();
          }
        }, 1000);
        // Timeout máximo de 30s
        setTimeout(() => clearInterval(interval), 30000);
      };
      waitForUnlock();
      return;
    }
    await syncOfflineQueue();
  };

  // Navegar para editar pendência
  const abrirEditarPendencia = (pendencia: RelatorioPendencia) => {
    // Injetar fotos offline se a pendência não tem URL do Supabase
    const offlineFoto = offlineFotosMap[pendencia.id];
    const pendComFoto = { ...pendencia };
    if (!pendComFoto.foto_url && offlineFoto?.foto_url) {
      pendComFoto.foto_url = offlineFoto.foto_url;
    }
    if (!pendComFoto.foto_depois_url && offlineFoto?.foto_depois_url) {
      pendComFoto.foto_depois_url = offlineFoto.foto_depois_url;
    }
    setPendenciaSelecionada(pendComFoto);
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
        <button onClick={syncOfflineQueue} className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded flex items-center gap-1 active:scale-90 transition-transform">
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
  // Modal de configurações
  const renderSettingsModal = () => {
    if (!showSettings) return null;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowSettings(false)}>
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative w-full max-w-md bg-gray-800 rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5" />

          {/* User info */}
          {usuario && (
            <div className="flex items-center gap-3 mb-5 bg-gray-700/50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{usuario.nome}</p>
                <p className="text-gray-400 text-xs truncate">{usuario.email}</p>
                <p className="text-gray-500 text-xs">{usuario.cargo}</p>
              </div>
            </div>
          )}

          {/* Install app option */}
          {!isStandalone && (
            <div className="mb-3">
              <button
                onClick={async () => {
                  // Tentar prompt nativo primeiro
                  const prompt = deferredPrompt || (window as any).__pwaInstallPrompt;
                  if (prompt) {
                    handleInstallApp();
                    return;
                  }
                  // Fallback: tentar via getInstalledRelatedApps + re-trigger
                  try {
                    if ('serviceWorker' in navigator) {
                      const reg = await navigator.serviceWorker.getRegistration();
                      if (reg) await reg.update();
                    }
                    // Aguardar um pouco pelo evento
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const newPrompt = (window as any).__pwaInstallPrompt;
                    if (newPrompt) {
                      newPrompt.prompt();
                      await newPrompt.userChoice;
                      (window as any).__pwaInstallPrompt = null;
                      setDeferredPrompt(null);
                      setShowSettings(false);
                      return;
                    }
                  } catch {}
                  // Se nada funcionou, mostrar instrução
                  if (isIOS) {
                    alert('Para instalar:\n\n1. Toque no botao Compartilhar (icone de seta pra cima) no Safari\n\n2. Toque em "Adicionar a Tela Inicial"');
                  } else {
                    alert('Para instalar:\n\n1. Toque no menu do navegador (3 pontinhos no canto superior)\n\n2. Toque em "Instalar aplicativo" ou "Adicionar a tela inicial"\n\nSe nao aparecer, tente fechar e abrir o navegador.');
                  }
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-base">Baixar App</p>
                  <p className="text-blue-100 text-xs">Instalar na tela inicial</p>
                </div>
              </button>
            </div>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={() => {
                setShowSettings(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-red-600/30 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Sair do App</p>
                <p className="text-red-300 text-xs">Encerrar sessão</p>
              </div>
            </button>
          )}
        </div>
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
            <button onClick={syncOfflineQueue} className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded flex items-center gap-1 active:scale-90 transition-transform">
              <RefreshCw className="w-3 h-3" />
              {offlineQueue.length}
            </button>
          )}
          {mensagem && <span className="text-xs text-green-400 animate-pulse">{mensagem}</span>}
          <button onClick={() => setShowSettings(true)} className="text-gray-300 hover:text-white p-1 flex-shrink-0">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {renderSettingsModal()}

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

          {/* Indicador de sincronização em andamento */}
          {syncing && (
            <div className="w-full mb-3 bg-orange-600/80 text-white rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sincronizando...
            </div>
          )}

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

            {/* Adicionar nova subseção */}
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-3">
              <p className="text-gray-400 text-xs font-medium">Nova subseção</p>
              <input
                value={novaSubTitulo}
                onChange={(e) => setNovaSubTitulo(e.target.value)}
                placeholder="Nome da subseção..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNovaSubTipo('MANUAL')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    novaSubTipo === 'MANUAL' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Pendências
                </button>
                <button
                  onClick={() => setNovaSubTipo('CONSTATACAO')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    novaSubTipo === 'CONSTATACAO' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Constatação
                </button>
              </div>
              <button
                onClick={() => {
                  handleAddSubsecao(novaSubTitulo, novaSubTipo);
                  setNovaSubTitulo('');
                }}
                disabled={loading || !novaSubTitulo.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg p-2.5 flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar Subseção
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Se subseção CONSTATACAO, mostrar tela de fotos + observação
    if (subsecaoSelecionada?.tipo === 'CONSTATACAO') {
      const fotosConst = subsecaoSelecionada.fotos_constatacao || [];
      const handleFotoConstatacao = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || !relatorioSelecionado) return;
        setLoading(true);

        const novasUrls: string[] = [];
        for (const file of files) {
          try {
            if (navigator.onLine && !relatorioSelecionado.id.startsWith('offline_') && !subsecaoSelecionada.id.startsWith('offline_')) {
              const url = await relatorioPendenciasService.uploadFoto(file, relatorioSelecionado.id, `constatacao-${subsecaoSelecionada.id}-${Date.now()}`);
              novasUrls.push(url);
            } else {
              const base64 = await compressImage(file, 800, 0.6);
              novasUrls.push(base64);
            }
          } catch (err) {
            console.error('Erro upload foto constatação:', err);
          }
        }

        const fotosAtualizadas = [...fotosConst, ...novasUrls];
        // Atualizar no banco se online
        if (navigator.onLine && !subsecaoSelecionada.id.startsWith('offline_')) {
          try {
            await relatorioPendenciasService.updateSubsecao(subsecaoSelecionada.id, { fotos_constatacao: fotosAtualizadas });
          } catch (err) {
            console.error('Erro ao salvar fotos constatação:', err);
          }
        }

        // Atualizar state local
        const subAtualizada = { ...subsecaoSelecionada, fotos_constatacao: fotosAtualizadas };
        setSubsecaoSelecionada(subAtualizada);
        const secAtualizada = {
          ...secaoSelecionada,
          subsecoes: (secaoSelecionada.subsecoes || []).map((s: any) =>
            s.id === subsecaoSelecionada.id ? subAtualizada : s
          ),
        };
        setSecaoSelecionada(secAtualizada);
        const relAtualizado = {
          ...relatorioSelecionado,
          secoes: (relatorioSelecionado.secoes || []).map((s: any) =>
            s.id === secaoSelecionada.id ? secAtualizada : s
          ),
        };
        setRelatorioSelecionado(relAtualizado as any);
        saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
        setLoading(false);
        e.target.value = '';
      };

      const handleRemoverFotoConst = async (idx: number) => {
        const fotosAtualizadas = fotosConst.filter((_: any, i: number) => i !== idx);
        if (navigator.onLine && !subsecaoSelecionada.id.startsWith('offline_')) {
          try {
            await relatorioPendenciasService.updateSubsecao(subsecaoSelecionada.id, { fotos_constatacao: fotosAtualizadas });
          } catch (err) {
            console.error('Erro ao remover foto constatação:', err);
          }
        }
        const subAtualizada = { ...subsecaoSelecionada, fotos_constatacao: fotosAtualizadas };
        setSubsecaoSelecionada(subAtualizada);
        const secAtualizada = {
          ...secaoSelecionada,
          subsecoes: (secaoSelecionada.subsecoes || []).map((s: any) =>
            s.id === subsecaoSelecionada.id ? subAtualizada : s
          ),
        };
        setSecaoSelecionada(secAtualizada);
        const relAtualizado = {
          ...relatorioSelecionado,
          secoes: (relatorioSelecionado.secoes || []).map((s: any) =>
            s.id === secaoSelecionada.id ? secAtualizada : s
          ),
        };
        setRelatorioSelecionado(relAtualizado as any);
        saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
      };

      const handleSalvarObservacao = async (texto: string) => {
        if (navigator.onLine && !subsecaoSelecionada.id.startsWith('offline_')) {
          try {
            await relatorioPendenciasService.updateSubsecao(subsecaoSelecionada.id, { descricao_constatacao: texto });
          } catch (err) {
            console.error('Erro ao salvar observação:', err);
          }
        }
        const subAtualizada = { ...subsecaoSelecionada, descricao_constatacao: texto };
        setSubsecaoSelecionada(subAtualizada);
        const secAtualizada = {
          ...secaoSelecionada,
          subsecoes: (secaoSelecionada.subsecoes || []).map((s: any) =>
            s.id === subsecaoSelecionada.id ? subAtualizada : s
          ),
        };
        setSecaoSelecionada(secAtualizada);
        const relAtualizado = {
          ...relatorioSelecionado,
          secoes: (relatorioSelecionado.secoes || []).map((s: any) =>
            s.id === secaoSelecionada.id ? secAtualizada : s
          ),
        };
        setRelatorioSelecionado(relAtualizado as any);
        saveToCache(`relatorio_${relAtualizado.id}`, relAtualizado);
      };

      return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSubsecaoSelecionada(null)} className="text-gray-300 hover:text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-white truncate flex-1">{subsecaoSelecionada.titulo}</h1>
          </div>

          <div className="p-4 space-y-4">
            {/* Botão adicionar fotos */}
            <input
              ref={constatacaoFotoRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFotoConstatacao}
            />
            <button
              onClick={() => constatacaoFotoRef.current?.click()}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98] transition-all"
            >
              <Camera className="w-4 h-4" />
              Adicionar Fotos ({fotosConst.length})
            </button>

            {/* Grid de fotos */}
            {fotosConst.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {fotosConst.map((foto: string, idx: number) => (
                  <div key={idx} className="relative aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden">
                    <img src={foto} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoverFotoConst(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {fotosConst.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">Nenhuma foto adicionada</p>
            )}

            {/* Observação */}
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1 block">Observação</label>
              <textarea
                value={subsecaoSelecionada.descricao_constatacao || ''}
                onChange={(e) => handleSalvarObservacao(e.target.value)}
                placeholder="Ex: O gerador foi testado e está em funcionamento..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={4}
              />
            </div>
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

          {/* Indicador de sincronização */}
          {syncing && (
            <div className="w-full mb-3 bg-orange-600/80 text-white rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sincronizando...
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
                      {(offlineFotosMap[item.id]?.foto_url || (item.foto_base64 && item.foto_base64.startsWith('data:'))) ? (
                        <img src={offlineFotosMap[item.id]?.foto_url || item.foto_base64!} className="w-full h-full object-cover" />
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
                      {(pend.foto_url || offlineFotosMap[pend.id]?.foto_url) ? (
                        <img src={pend.foto_url || offlineFotosMap[pend.id]?.foto_url} className="w-full h-full object-cover" />
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
              <div className="relative aspect-square bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                {pendenciaSelecionada.foto_url ? (
                  <>
                    <img
                      src={pendenciaSelecionada.foto_url}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => fotoRef.current?.click()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFoto('antes'); }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); fotoGaleriaRef.current?.click(); }}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fotoRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">Tirar foto</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); fotoGaleriaRef.current?.click(); }}
                      className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800 border border-gray-600 rounded px-2 py-0.5"
                    >
                      <ImageIcon className="w-3 h-3" /> Galeria
                    </button>
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
              <input
                ref={fotoGaleriaRef}
                type="file"
                accept="image/*"
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
              <div className="relative aspect-square bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                {pendenciaSelecionada.foto_depois_url ? (
                  <>
                    <img
                      src={pendenciaSelecionada.foto_depois_url}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => fotoDepoisRef.current?.click()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFoto('depois'); }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); fotoDepoisGaleriaRef.current?.click(); }}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fotoDepoisRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">Foto depois</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); fotoDepoisGaleriaRef.current?.click(); }}
                      className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800 border border-gray-600 rounded px-2 py-0.5"
                    >
                      <ImageIcon className="w-3 h-3" /> Galeria
                    </button>
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
              <input
                ref={fotoDepoisGaleriaRef}
                type="file"
                accept="image/*"
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
          {/* Indicadores */}
          {syncing && (
            <div className="bg-orange-600/80 text-white rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sincronizando...
            </div>
          )}
          {!isOnline && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs">Sem conexão. Será sincronizado quando voltar.</p>
            </div>
          )}

          {/* Foto */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Foto (opcional)</p>
            <div
              onClick={() => novaPendFotoRef.current?.click()}
              className="relative w-full aspect-video bg-gray-800 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all"
            >
              {novaPendFotoPreview ? (
                <>
                  <img src={novaPendFotoPreview} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); novaPendFotoGaleriaRef.current?.click(); }}
                    className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-sm">Tirar foto</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); novaPendFotoGaleriaRef.current?.click(); }}
                    className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800 border border-gray-600 rounded px-2 py-0.5"
                  >
                    <ImageIcon className="w-3 h-3" /> Galeria
                  </button>
                </div>
              )}
            </div>
            <input
              ref={novaPendFotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNovaPendFoto(file);
                  setNovaPendFotoPreview(URL.createObjectURL(file));
                  try {
                    const b64 = await compressImage(file, 800, 0.6);
                    saveToGallery(b64, `ronda_nova_${Date.now()}.jpg`);
                  } catch {}
                }
                e.target.value = '';
              }}
            />
            <input
              ref={novaPendFotoGaleriaRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNovaPendFoto(file);
                  setNovaPendFotoPreview(URL.createObjectURL(file));
                  try {
                    const b64 = await compressImage(file, 800, 0.6);
                    saveToGallery(b64, `ronda_nova_${Date.now()}.jpg`);
                  } catch {}
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
