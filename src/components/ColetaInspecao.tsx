import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Camera, Mic, MicOff, RefreshCw, AlertCircle, CheckCircle2,
  Wifi, WifiOff, Trash2, ChevronRight, Eye
} from 'lucide-react';
import { contratoService } from '@/lib/supabaseService';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { supabase } from '@/lib/supabase';
import { Contrato } from '@/types';
import type { UsuarioAutorizado } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface InspectionItem {
  id: string;
  contratoId: string;
  contratoNome: string;
  cardTitle: string;
  cardCategory: string;
  local: string;
  descricao: string;
  fotoBase64: string;
  status: 'PENDENTE' | 'SYNCED';
  synced: boolean;
  relatorioId?: string;
  secaoId?: string;
  createdAt: string;
}

interface CardDef {
  category: string;
  categoryLabel: string;
  title: string;
  color: string;
  borderColor: string;
}

type ScreenState = 'CONTRATOS' | 'CARDS' | 'INSPECAO' | 'GALERIA';

interface ColetaInspecaoProps {
  onVoltar: () => void;
  onLogout: () => void;
  usuario: UsuarioAutorizado | null;
}

// ============================================================================
// CONSTANTS - Cards do Kanban
// ============================================================================

const CARD_DEFINITIONS: CardDef[] = [
  // 1. VISTORIA
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'ÁREAS COMUNS', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'HALLS', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'ESCADARIAS', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'ÁREAS TÉCNICAS', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'ELEVADORES', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'FACHADA', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  { category: 'VISTORIA', categoryLabel: '1. VISTORIA', title: 'GARAGENS', color: 'bg-blue-600', borderColor: 'border-l-blue-500' },
  // 2. RECEBIMENTO INCÊNDIO
  { category: 'RECEBIMENTO_INCENDIO', categoryLabel: '2. RECEBIMENTO INCÊNDIO', title: 'RECEBIMENTO ITENS DE INCÊNDIO', color: 'bg-rose-600', borderColor: 'border-l-rose-500' },
  // 3. RECEBIMENTO ÁREAS
  { category: 'RECEBIMENTO_AREAS', categoryLabel: '3. RECEBIMENTO ÁREAS', title: 'RECEBIMENTO ÁREAS COMUNS', color: 'bg-amber-600', borderColor: 'border-l-amber-500' },
  // 4. RECEBIMENTO CHAVES
  { category: 'RECEBIMENTO_CHAVES', categoryLabel: '4. RECEBIMENTO CHAVES', title: 'RECEBIMENTO CHAVES CONDOMÍNIO', color: 'bg-amber-600', borderColor: 'border-l-amber-500' },
  // 5. CONFERÊNCIA
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ITENS DE BOMBEIRO', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE ELEVADORES', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE ESCADAS', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE WCS', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE ÁREAS COMUNS', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE PISCINA', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  { category: 'CONFERENCIA', categoryLabel: '5. CONFERÊNCIA', title: 'ACESSIBILIDADE ENTRADA DO PRÉDIO', color: 'bg-purple-600', borderColor: 'border-l-purple-500' },
  // 6. COMISSIONAMENTO
  { category: 'COMISSIONAMENTO', categoryLabel: '6. COMISSIONAMENTO', title: 'COMISSIONAMENTO', color: 'bg-orange-600', borderColor: 'border-l-orange-500' },
  // 7. DOCUMENTAÇÃO
  { category: 'DOCUMENTACAO', categoryLabel: '7. DOCUMENTAÇÃO', title: 'DOCUMENTAÇÃO', color: 'bg-green-600', borderColor: 'border-l-green-500' },
];

const DB_NAME = 'coleta-inspecao-db';
const DB_VERSION = 1;

// ============================================================================
// INDEXEDDB HELPERS
// ============================================================================

function dbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('contratos')) {
        db.createObjectStore('contratos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'id' });
        store.createIndex('contratoId', 'contratoId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('cardKey', ['contratoId', 'cardTitle'], { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

async function dbSaveItem(item: InspectionItem): Promise<void> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readwrite');
    const req = tx.objectStore('items').put(item);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

async function dbDeleteItem(id: string): Promise<void> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readwrite');
    const req = tx.objectStore('items').delete(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

async function dbGetItemsByCard(contratoId: string, cardTitle: string): Promise<InspectionItem[]> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const index = store.index('cardKey');
    const req = index.getAll([contratoId, cardTitle]);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as InspectionItem[]);
  });
}

async function dbGetAllItemsByContrato(contratoId: string): Promise<InspectionItem[]> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readonly');
    const req = tx.objectStore('items').index('contratoId').getAll(contratoId);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as InspectionItem[]);
  });
}

async function dbGetPendingSync(): Promise<InspectionItem[]> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readonly');
    const req = tx.objectStore('items').getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const all = req.result as InspectionItem[];
      resolve(all.filter(i => !i.synced && i.status === 'PENDENTE'));
    };
  });
}

async function dbMarkSynced(id: string): Promise<void> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const item = req.result as InspectionItem;
      if (item) {
        item.synced = true;
        item.status = 'SYNCED';
        const putReq = store.put(item);
        putReq.onerror = () => reject(putReq.error);
        putReq.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
  });
}

async function dbCacheContratos(contratos: Contrato[]): Promise<void> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('contratos', 'readwrite');
    const store = tx.objectStore('contratos');
    store.clear();
    contratos.forEach(c => store.put(c));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetCachedContratos(): Promise<Contrato[]> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('contratos', 'readonly');
    const req = tx.objectStore('contratos').getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as Contrato[]);
  });
}

async function dbSaveSetting(key: string, value: any): Promise<void> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const req = tx.objectStore('settings').put({ key, value });
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

async function dbGetSetting(key: string): Promise<any> {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result?.value);
  });
}

// ============================================================================
// IMAGE COMPRESSION
// ============================================================================

function compressImage(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h * MAX) / w; w = MAX; }
          else { w = (w * MAX) / h; h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const result = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(img.src);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// SYNC LOGIC
// ============================================================================

async function syncItemsToSupabase(
  onProgress?: (current: number, total: number, detail: string) => void
): Promise<{ synced: number; errors: number; errorDetails: string[] }> {
  const errorDetails: string[] = [];
  const pending = await dbGetPendingSync();
  if (pending.length === 0) return { synced: 0, errors: 0, errorDetails: [] };

  let syncedCount = 0;
  let errorCount = 0;

  // Agrupar por contrato para reusar relatório/seção
  const byContrato: Record<string, InspectionItem[]> = {};
  for (const item of pending) {
    if (!byContrato[item.contratoId]) byContrato[item.contratoId] = [];
    byContrato[item.contratoId].push(item);
  }

  let processed = 0;

  for (const [contratoId, contratoItems] of Object.entries(byContrato)) {
    try {
      // 1. Buscar ou criar relatório para este contrato
      onProgress?.(processed, pending.length, `Buscando relatórios do contrato...`);
      let relatorioId: string | null = null;

      const relatorios = await relatorioPendenciasService.getAll(contratoId);
      console.log(`[SYNC] Relatórios existentes para ${contratoId}:`, relatorios.length);

      // Buscar relatório existente com título "Inspeção - Coleta de Campo"
      const existing = relatorios.find(r => r.titulo?.includes('Inspeção - Coleta'));
      if (existing) {
        relatorioId = existing.id;
        console.log(`[SYNC] Relatório existente encontrado: ${relatorioId}`);
      } else {
        // Criar novo relatório
        console.log(`[SYNC] Criando novo relatório para contrato ${contratoId}...`);
        try {
          const { data: novoRel, error: relError } = await supabase
            .from('relatorios_pendencias')
            .insert([{
              contrato_id: contratoId,
              titulo: 'Inspeção - Coleta de Campo',
            }])
            .select()
            .single();

          if (relError) {
            const msg = `Erro ao criar relatório: ${relError.message} (code: ${relError.code})`;
            console.error('[SYNC]', msg);
            errorDetails.push(msg);
            throw new Error(msg);
          }

          relatorioId = novoRel.id;
          console.log(`[SYNC] Relatório criado: ${relatorioId}`);
        } catch (createRelErr: any) {
          if (!createRelErr.message?.includes('Erro ao criar relatório')) {
            const msg = `Exceção ao criar relatório: ${createRelErr.message || createRelErr}`;
            errorDetails.push(msg);
          }
          throw createRelErr;
        }
      }

      // 2. Buscar relatório completo para ver seções existentes
      onProgress?.(processed, pending.length, `Carregando seções existentes...`);
      const relCompleto = await relatorioPendenciasService.getById(relatorioId);
      const secoesExistentes = relCompleto?.secoes || [];
      console.log(`[SYNC] Seções existentes: ${secoesExistentes.length}`);

      // Agrupar items por cardTitle para criar seções
      const byCard: Record<string, InspectionItem[]> = {};
      for (const item of contratoItems) {
        if (!byCard[item.cardTitle]) byCard[item.cardTitle] = [];
        byCard[item.cardTitle].push(item);
      }

      for (const [cardTitle, cardItems] of Object.entries(byCard)) {
        // 3. Buscar ou criar seção para este card
        let secao = secoesExistentes.find(
          s => s.titulo_principal === cardTitle
        );

        if (!secao) {
          console.log(`[SYNC] Criando seção "${cardTitle}"...`);
          const ordemMax = secoesExistentes.length > 0
            ? Math.max(...secoesExistentes.map(s => s.ordem))
            : 0;

          try {
            const { data: novaSecao, error: secError } = await supabase
              .from('relatorio_secoes')
              .insert([{
                relatorio_id: relatorioId,
                ordem: ordemMax + 1,
                titulo_principal: cardTitle,
                subtitulo: cardItems[0]?.cardCategory || '',
              }])
              .select()
              .single();

            if (secError) {
              const msg = `Erro ao criar seção "${cardTitle}": ${secError.message} (code: ${secError.code})`;
              console.error('[SYNC]', msg);
              errorDetails.push(msg);
              throw new Error(msg);
            }

            secao = { ...novaSecao, pendencias: [] };
            secoesExistentes.push(secao);
            console.log(`[SYNC] Seção criada: ${secao.id}`);
          } catch (createSecErr: any) {
            if (!createSecErr.message?.includes('Erro ao criar seção')) {
              errorDetails.push(`Exceção ao criar seção: ${createSecErr.message || createSecErr}`);
            }
            throw createSecErr;
          }
        }

        // 4. Criar pendências para cada item
        let pendenciasExistentes = secao.pendencias?.length || 0;

        for (const item of cardItems) {
          try {
            onProgress?.(processed, pending.length, `Enviando: ${item.local}...`);

            // 4a. Upload foto para Supabase Storage
            let fotoUrl: string | null = null;
            if (item.fotoBase64) {
              try {
                const base64Data = item.fotoBase64.split(',')[1] || item.fotoBase64;
                const binaryStr = atob(base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                  bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/jpeg' });
                const fileName = `${item.id}-${Date.now()}.jpg`;
                const filePath = `relatorios-pendencias/${relatorioId}/${fileName}`;

                console.log(`[SYNC] Uploading foto: ${filePath} (${blob.size} bytes)`);

                const { error: upErr } = await supabase.storage
                  .from('fotos')
                  .upload(filePath, blob, { upsert: true });

                if (upErr) {
                  const msg = `Upload foto falhou: ${upErr.message}`;
                  console.error('[SYNC]', msg);
                  errorDetails.push(msg);
                  // Continua sem foto - não bloqueia a criação da pendência
                } else {
                  const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(filePath);
                  fotoUrl = urlData.publicUrl;
                  console.log(`[SYNC] Foto uploaded: ${fotoUrl}`);
                }
              } catch (uploadErr: any) {
                const msg = `Exceção no upload: ${uploadErr.message || uploadErr}`;
                console.error('[SYNC]', msg);
                errorDetails.push(msg);
              }
            }

            // 4b. Criar pendência no Supabase
            pendenciasExistentes++;
            console.log(`[SYNC] Criando pendência #${pendenciasExistentes} na seção ${secao.id}...`);

            const pendenciaData = {
              secao_id: secao.id,
              ordem: pendenciasExistentes,
              tipo: 'PENDENCIA',
              local: item.local,
              descricao: item.descricao,
              foto_url: fotoUrl,
              foto_depois_url: null,
              status: 'PENDENTE',
            };

            console.log(`[SYNC] Dados pendência:`, JSON.stringify(pendenciaData));

            const { data: pendCriada, error: pendError } = await supabase
              .from('relatorio_pendencias')
              .insert([pendenciaData])
              .select()
              .single();

            if (pendError) {
              const msg = `Erro ao criar pendência: ${pendError.message} (code: ${pendError.code}, details: ${pendError.details || 'none'})`;
              console.error('[SYNC]', msg);
              errorDetails.push(msg);
              throw new Error(msg);
            }

            console.log(`[SYNC] Pendência criada: ${pendCriada.id}`);

            await dbMarkSynced(item.id);
            syncedCount++;
          } catch (itemErr: any) {
            console.error('[SYNC] Erro ao sincronizar item:', item.id, itemErr);
            if (!itemErr.message?.includes('Erro ao criar pendência')) {
              errorDetails.push(`Item ${item.local}: ${itemErr.message || itemErr}`);
            }
            errorCount++;
          }

          processed++;
          onProgress?.(processed, pending.length, '');
        }
      }
    } catch (contratoErr: any) {
      console.error('[SYNC] Erro ao sincronizar contrato:', contratoId, contratoErr);
      if (!errorDetails.some(e => e.includes(contratoErr.message))) {
        errorDetails.push(`Contrato: ${contratoErr.message || contratoErr}`);
      }
      errorCount += contratoItems.length;
      processed += contratoItems.length;
      onProgress?.(processed, pending.length, '');
    }
  }

  return { synced: syncedCount, errors: errorCount, errorDetails };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ColetaInspecao({ onVoltar, onLogout, usuario }: ColetaInspecaoProps) {
  // Navigation
  const [screen, setScreen] = useState<ScreenState>('CONTRATOS');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);

  // Data
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [allContratoItems, setAllContratoItems] = useState<InspectionItem[]>([]);
  const [cardItems, setCardItems] = useState<InspectionItem[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Connectivity & Sync
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState('');

  // Inspeção form
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState('');
  const [descricao, setDescricao] = useState('');
  const [autoMic, setAutoMic] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Online/offline listener
  useEffect(() => {
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  // Load contratos on mount
  useEffect(() => {
    loadContratos();
    loadPendingSyncCount();
  }, []);

  // Load all items when selecting a contrato (for card counts)
  useEffect(() => {
    if (selectedContrato) {
      loadAllContratoItems();
    }
  }, [selectedContrato]);

  // Load card-specific items when selecting a card
  useEffect(() => {
    if (selectedContrato && selectedCard) {
      loadCardItems();
      loadCardLocal();
    }
  }, [selectedContrato, selectedCard]);

  // Load autoMic setting
  useEffect(() => {
    dbGetSetting('autoMic').then(val => {
      if (val !== undefined) setAutoMic(val);
    }).catch(() => {});
  }, []);

  // Auto-start voice after photo capture
  useEffect(() => {
    if (screen === 'INSPECAO' && autoMic && fotoBase64 && !descricao) {
      // Delay a bit para dar tempo do formulário aparecer
      const t = setTimeout(() => startVoice(), 500);
      return () => clearTimeout(t);
    }
  }, [fotoBase64, screen, autoMic]);

  // Cleanup voice on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadContratos = async () => {
    setLoading(true);
    try {
      // Primeiro mostrar cache
      const cached = await dbGetCachedContratos();
      if (cached.length > 0) setContratos(cached);

      // Tentar buscar frescos se online
      if (navigator.onLine) {
        try {
          const fresh = await contratoService.getAll();
          if (fresh && fresh.length > 0) {
            await dbCacheContratos(fresh);
            setContratos(fresh);
          }
        } catch (e) {
          console.warn('Offline ou erro ao buscar contratos:', e);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar contratos:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAllContratoItems = async () => {
    if (!selectedContrato) return;
    try {
      const items = await dbGetAllItemsByContrato(selectedContrato.id);
      setAllContratoItems(items);
    } catch (e) {
      console.error('Erro ao carregar items do contrato:', e);
    }
  };

  const loadCardItems = async () => {
    if (!selectedContrato || !selectedCard) return;
    try {
      const items = await dbGetItemsByCard(selectedContrato.id, selectedCard.title);
      setCardItems(items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (e) {
      console.error('Erro ao carregar items do card:', e);
    }
  };

  const loadCardLocal = async () => {
    if (!selectedCard) return;
    try {
      const saved = await dbGetSetting(`local-${selectedCard.title}`);
      if (saved) setLocalValue(saved);
    } catch {}
  };

  const loadPendingSyncCount = async () => {
    try {
      const pending = await dbGetPendingSync();
      setPendingSyncCount(pending.length);
    } catch {}
  };

  // ============================================================================
  // VOICE RECOGNITION
  // ============================================================================

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e: any) => {
      console.warn('Speech error:', e.error);
      setIsRecording(false);
    };
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      setDescricao(prev => {
        if (finalTranscript) return prev ? prev + ' ' + finalTranscript : finalTranscript;
        return prev || interimTranscript;
      });
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.warn('Erro ao iniciar voz:', e);
    }
  }, []);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
    }
  }, []);

  // ============================================================================
  // PHOTO CAPTURE
  // ============================================================================

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setFotoBase64(compressed);
    } catch (e) {
      console.error('Erro ao comprimir foto:', e);
      alert('Erro ao processar foto. Tente novamente.');
    }
    // Reset input para permitir selecionar a mesma foto novamente
    event.currentTarget.value = '';
  };

  // ============================================================================
  // SAVE INSPECTION ITEM
  // ============================================================================

  const handleSaveItem = async () => {
    if (!selectedContrato || !selectedCard || !fotoBase64) {
      alert('Tire uma foto primeiro');
      return;
    }
    if (!localValue.trim()) {
      alert('Preencha o local');
      return;
    }
    if (!descricao.trim()) {
      alert('Descreva a pendência');
      return;
    }

    setIsSaving(true);
    try {
      stopVoice();

      const newItem: InspectionItem = {
        id: `insp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        contratoId: selectedContrato.id,
        contratoNome: selectedContrato.nome,
        cardTitle: selectedCard.title,
        cardCategory: selectedCard.category,
        local: localValue.trim(),
        descricao: descricao.trim(),
        fotoBase64,
        status: 'PENDENTE',
        synced: false,
        createdAt: new Date().toISOString(),
      };

      // Salvar no IndexedDB
      await dbSaveItem(newItem);

      // Salvar local para este card
      await dbSaveSetting(`local-${selectedCard.title}`, localValue.trim());

      // Atualizar estado
      setCardItems(prev => [...prev, newItem]);
      setAllContratoItems(prev => [...prev, newItem]);
      setPendingSyncCount(prev => prev + 1);

      // Limpar formulário para próximo item (manter local!)
      setFotoBase64(null);
      setDescricao('');

      // Vibrar para feedback tátil
      if (navigator.vibrate) navigator.vibrate(100);

    } catch (e) {
      console.error('Erro ao salvar:', e);
      alert('Erro ao salvar item. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // DELETE ITEM
  // ============================================================================

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await dbDeleteItem(id);
      setCardItems(prev => prev.filter(i => i.id !== id));
      setAllContratoItems(prev => prev.filter(i => i.id !== id));
      setPendingSyncCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Erro ao excluir:', e);
    }
  };

  // ============================================================================
  // SYNC
  // ============================================================================

  const handleSync = async () => {
    if (!navigator.onLine) {
      alert('Sem conexão com a internet. Tente quando estiver online.');
      return;
    }

    setSyncStatus('syncing');
    setSyncProgress('Iniciando sincronização...');

    try {
      const result = await syncItemsToSupabase((current, total, detail) => {
        setSyncProgress(detail || `Sincronizando ${current}/${total}...`);
      });

      if (result.errors === 0 && result.synced > 0) {
        setSyncStatus('success');
        setSyncProgress(`${result.synced} itens sincronizados!`);
      } else if (result.errors > 0) {
        setSyncStatus('error');
        const errorMsg = result.errorDetails.length > 0
          ? result.errorDetails.join('\n')
          : 'Erro desconhecido';
        setSyncProgress(`${result.synced} ok, ${result.errors} erros`);
        // Mostrar detalhes do erro para o usuário
        setTimeout(() => {
          alert(`Erros na sincronização:\n\n${errorMsg}`);
        }, 300);
      } else {
        setSyncStatus('success');
        setSyncProgress('Nenhum item pendente');
      }

      // Recarregar dados
      await loadPendingSyncCount();
      if (selectedContrato) await loadAllContratoItems();
      if (selectedContrato && selectedCard) await loadCardItems();

      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress('');
      }, 5000);
    } catch (e: any) {
      console.error('Sync error:', e);
      setSyncStatus('error');
      setSyncProgress('Erro na sincronização');
      alert(`Erro na sincronização: ${e.message || e}`);
      setTimeout(() => { setSyncStatus('idle'); setSyncProgress(''); }, 5000);
    }
  };

  // ============================================================================
  // CATEGORY LABELS (formatados)
  // ============================================================================

  const CATEGORY_LABELS: Record<string, string> = {
    'VISTORIA': '1. VISTORIA',
    'RECEBIMENTO_INCENDIO': '2. RECEBIMENTO INCÊNDIO',
    'RECEBIMENTO_AREAS': '3. RECEBIMENTO ÁREAS',
    'RECEBIMENTO_CHAVES': '4. RECEBIMENTO CHAVES',
    'CONFERENCIA': '5. CONFERÊNCIA',
    'COMISSIONAMENTO': '6. COMISSIONAMENTO',
    'DOCUMENTACAO': '7. DOCUMENTAÇÃO',
  };

  // ============================================================================
  // RENDER: CONTRATOS
  // ============================================================================

  if (screen === 'CONTRATOS') {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700 safe-area-top">
          <button onClick={onVoltar} className="p-2 hover:bg-gray-700 rounded-lg active:scale-95 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-lg font-bold">Coleta de Inspeção</h1>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-orange-400" />}
          </div>
        </div>

        {/* Status bar */}
        <div className={`px-4 py-2 flex items-center justify-between text-xs ${
          isOnline ? 'bg-green-900/50 text-green-300' : 'bg-orange-900/50 text-orange-300'
        }`}>
          <span>{isOnline ? 'Conectado' : 'Modo offline'}</span>
          {pendingSyncCount > 0 && (
            <span className="bg-orange-600 px-2 py-0.5 rounded-full text-white font-bold">
              {pendingSyncCount} pendente{pendingSyncCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Lista de contratos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && contratos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw size={32} className="mx-auto mb-3 animate-spin" />
              <p>Carregando contratos...</p>
            </div>
          ) : contratos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={32} className="mx-auto mb-3" />
              <p>Nenhum contrato encontrado</p>
              <p className="text-xs mt-1">Verifique sua conexão</p>
            </div>
          ) : (
            contratos.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedContrato(c);
                  setScreen('CARDS');
                }}
                className="w-full text-left p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition border border-gray-700 active:scale-[0.98] flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{c.nome}</div>
                  <div className="text-sm text-gray-400 truncate">{c.sindico}</div>
                  <div className="text-xs text-gray-500 truncate">{c.endereco}</div>
                </div>
                <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Bottom: Sync */}
        {pendingSyncCount > 0 && (
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <Button
              onClick={handleSync}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
            >
              <RefreshCw size={18} className={`mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? syncProgress : `Sincronizar (${pendingSyncCount} itens)`}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: CARDS
  // ============================================================================

  if (screen === 'CARDS' && selectedContrato) {
    // Agrupar cards por categoria
    const grouped: Record<string, CardDef[]> = {};
    for (const card of CARD_DEFINITIONS) {
      if (!grouped[card.category]) grouped[card.category] = [];
      grouped[card.category].push(card);
    }

    // Contar items por card
    const countByCard: Record<string, { total: number; pending: number }> = {};
    for (const item of allContratoItems) {
      if (!countByCard[item.cardTitle]) countByCard[item.cardTitle] = { total: 0, pending: 0 };
      countByCard[item.cardTitle].total++;
      if (!item.synced) countByCard[item.cardTitle].pending++;
    }

    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
          <button onClick={() => { setScreen('CONTRATOS'); setSelectedContrato(null); setAllContratoItems([]); }}
            className="p-2 hover:bg-gray-700 rounded-lg active:scale-95 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">{selectedContrato.nome}</h1>
            <div className="text-xs text-gray-400 truncate">Selecione a área para inspecionar</div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {Object.entries(grouped).map(([category, cards]) => (
            <div key={category}>
              <div className={`text-xs font-bold text-gray-300 mb-2 px-1 uppercase tracking-wide`}>
                {CATEGORY_LABELS[category] || category}
              </div>
              <div className="space-y-2">
                {cards.map((card) => {
                  const counts = countByCard[card.title] || { total: 0, pending: 0 };
                  return (
                    <button
                      key={card.title}
                      onClick={() => {
                        setSelectedCard(card);
                        setFotoBase64(null);
                        setDescricao('');
                        setScreen('INSPECAO');
                      }}
                      className={`w-full p-3 rounded-lg transition text-white font-medium flex items-center gap-3 ${card.color} hover:opacity-90 active:scale-[0.98] border-l-4 ${card.borderColor}`}
                    >
                      <span className="flex-1 text-sm text-left">{card.title}</span>
                      {counts.total > 0 && (
                        <div className="flex items-center gap-1">
                          {counts.pending > 0 && (
                            <span className="text-xs bg-orange-500 px-2 py-0.5 rounded-full font-bold">
                              {counts.pending}
                            </span>
                          )}
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {counts.total}
                          </span>
                        </div>
                      )}
                      <ChevronRight size={16} className="opacity-50" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Sync */}
        {pendingSyncCount > 0 && (
          <div className="bg-gray-800 p-3 border-t border-gray-700">
            <Button onClick={handleSync} disabled={!isOnline || syncStatus === 'syncing'}
              className="w-full bg-blue-600 hover:bg-blue-700 h-10">
              <RefreshCw size={16} className={`mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? syncProgress : `Sincronizar (${pendingSyncCount})`}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: GALERIA (itens capturados)
  // ============================================================================

  if (screen === 'GALERIA' && selectedCard && selectedContrato) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
          <button onClick={() => setScreen('INSPECAO')} className="p-2 hover:bg-gray-700 rounded-lg active:scale-95 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-sm">{selectedCard.title}</h2>
            <div className="text-xs text-gray-400">{cardItems.length} itens capturados</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cardItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nenhum item capturado</div>
          ) : (
            cardItems.map((item, idx) => (
              <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="flex">
                  <img src={item.fotoBase64} alt="" className="w-24 h-24 object-cover flex-shrink-0" />
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-300">#{idx + 1} - {item.local}</div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{item.descricao}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.synced ? (
                          <CheckCircle2 size={14} className="text-green-400" />
                        ) : (
                          <AlertCircle size={14} className="text-orange-400" />
                        )}
                        {!item.synced && (
                          <button onClick={() => handleDeleteItem(item.id)}
                            className="p-1 hover:bg-red-600/30 rounded transition">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: INSPEÇÃO
  // ============================================================================

  if (screen === 'INSPECAO' && selectedCard && selectedContrato) {
    const unsyncedCount = cardItems.filter(i => !i.synced).length;

    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
          <button
            onClick={() => {
              stopVoice();
              setFotoBase64(null);
              setDescricao('');
              setScreen('CARDS');
            }}
            className="p-2 hover:bg-gray-700 rounded-lg active:scale-95 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate">{selectedCard.title}</h2>
            <div className="text-xs text-gray-400">
              Item #{cardItems.length + 1} • {selectedContrato.nome}
            </div>
          </div>
          {/* Ver galeria */}
          <button onClick={() => setScreen('GALERIA')}
            className="relative p-2 hover:bg-gray-700 rounded-lg transition">
            <Eye size={18} />
            {cardItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cardItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Área principal: foto ou formulário */}
        <div className="flex-1 overflow-y-auto">
          {!fotoBase64 ? (
            /* Tela de captura */
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
              <div className="text-center">
                <Camera size={64} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-300">Tire uma foto</h3>
                <p className="text-sm text-gray-500 mt-1">Toque no botão abaixo para fotografar a pendência</p>
              </div>

              <button
                onClick={openCamera}
                className="w-32 h-32 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition flex items-center justify-center shadow-lg shadow-blue-600/30"
              >
                <Camera size={48} />
              </button>

              {cardItems.length > 0 && (
                <div className="text-center">
                  <div className="text-sm text-gray-400">
                    {cardItems.length} item{cardItems.length > 1 ? 's' : ''} capturado{cardItems.length > 1 ? 's' : ''}
                    {unsyncedCount > 0 && (
                      <span className="text-orange-400 ml-1">({unsyncedCount} pendente{unsyncedCount > 1 ? 's' : ''})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Formulário após foto */
            <div className="p-4 space-y-4">
              {/* Foto preview */}
              <div className="relative rounded-lg overflow-hidden">
                <img src={fotoBase64} alt="Foto capturada" className="w-full max-h-48 object-cover rounded-lg" />
                <button
                  onClick={() => { setFotoBase64(null); setDescricao(''); }}
                  className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black/80 transition"
                >
                  <Camera size={16} />
                </button>

                {isRecording && (
                  <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-xs font-bold">Gravando...</span>
                  </div>
                )}
              </div>

              {/* Auto-mic toggle */}
              <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <span className="text-sm">Microfone automático</span>
                <button
                  onClick={() => {
                    const newVal = !autoMic;
                    setAutoMic(newVal);
                    dbSaveSetting('autoMic', newVal);
                  }}
                  className={`w-12 h-7 rounded-full transition relative ${
                    autoMic ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                    autoMic ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Local */}
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">LOCAL</label>
                <Input
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  placeholder="Ex: 22 Pavimento, Hall do 3º andar..."
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 h-11"
                  autoComplete="off"
                />
                <p className="text-[10px] text-gray-500 mt-1">O local fica salvo para os próximos itens deste card</p>
              </div>

              {/* Pendência / Descrição */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-400">PENDÊNCIA / DESCRIÇÃO</label>
                  <button
                    onClick={() => isRecording ? stopVoice() : startVoice()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
                    {isRecording ? 'Parar' : 'Falar'}
                  </button>
                </div>
                <textarea
                  ref={descricaoRef}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva a pendência ou fale usando o microfone..."
                  className="w-full h-24 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => { setFotoBase64(null); setDescricao(''); }}
                  variant="outline"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-600 h-12"
                >
                  <Camera size={16} className="mr-2" />
                  Nova Foto
                </Button>
                <Button
                  onClick={handleSaveItem}
                  disabled={!localValue.trim() || !descricao.trim() || isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 h-12 text-base font-bold"
                >
                  {isSaving ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} className="mr-2" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom sync bar */}
        {syncStatus !== 'idle' && (
          <div className={`px-4 py-2 text-center text-xs font-bold ${
            syncStatus === 'syncing' ? 'bg-blue-900/50 text-blue-300' :
            syncStatus === 'success' ? 'bg-green-900/50 text-green-300' :
            'bg-red-900/50 text-red-300'
          }`}>
            {syncProgress}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
    );
  }

  // Fallback
  return null;
}

export default ColetaInspecao;
