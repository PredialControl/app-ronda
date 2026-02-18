import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, X, Trash2, Image as ImageIcon, Loader2, ArrowLeft, Mic, MicOff, Edit3, RefreshCw, ArrowUp, ArrowDown, MoveRight, FolderInput, Check } from 'lucide-react';
import { Contrato, RelatorioPendencias as RelatorioPendenciasType } from '@/types';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { useVoiceCapture } from '@/hooks/useVoiceCapture';
import { ImageEditor } from '@/components/ImageEditor';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================
// IndexedDB para sync de fotos offline do celular
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

function base64ToFileSync(base64: string, filename: string): File {
    const [header, data] = base64.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new File([ab], filename, { type: mime });
}

function getOfflineQueue(): any[] {
    try {
        const raw = localStorage.getItem('coleta_offline_queue');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveOfflineQueue(queue: any[]) {
    localStorage.setItem('coleta_offline_queue', JSON.stringify(queue));
}

interface RelatorioPendenciasEditorProps {
    contrato: Contrato;
    relatorio?: RelatorioPendenciasType | null;
    onSave: () => void;
    onCancel: () => void;
}

interface SubsecaoLocal {
    id?: string;
    tempId: string;
    ordem: number;
    titulo: string;
    tipo?: 'MANUAL' | 'CONSTATACAO';
    pendencias: PendenciaLocal[];
    fotos_constatacao?: string[];
    fotos_constatacao_files?: File[];
    fotos_constatacao_previews?: string[];
    descricao_constatacao?: string;
}

interface SecaoLocal {
    id?: string;
    tempId: string;
    ordem: number;
    titulo_principal: string;
    subtitulo?: string; // Agora opcional
    tem_subsecoes: boolean; // NOVO
    subsecoes?: SubsecaoLocal[]; // NOVO
    pendencias: PendenciaLocal[];
}

interface PendenciaLocal {
    id?: string;
    tempId: string;
    ordem: number;
    local: string;
    descricao: string;
    foto_url: string | null;
    foto_depois_url: string | null;
    data_recebimento?: string;
    status?: 'PENDENTE' | 'RECEBIDO' | 'NAO_FARAO';
    file?: File;
    preview?: string;
    fileDepois?: File;
    previewDepois?: string;
}

// Wrapper arrastável para pendência
function DraggablePendencia({ id, children, isSelected }: { id: string; children: React.ReactNode; isSelected?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        outline: isSelected ? '2px solid #6366f1' : undefined,
        outlineOffset: isSelected ? '2px' : undefined,
        cursor: 'grab',
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

// Wrapper arrastável para seção
function DraggableSecao({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

// Drop zone para seção/subseção (permite soltar pendências)
function DropZone({ id, label }: { id: string; label: string }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`border-2 border-dashed rounded-md px-3 py-2 text-center text-xs transition-all ${
                isOver ? 'border-indigo-400 bg-indigo-900/30 text-indigo-300' : 'border-gray-700 text-gray-600'
            }`}
        >
            {isOver ? 'Soltar aqui' : label}
        </div>
    );
}

export function RelatorioPendenciasEditor({ contrato, relatorio, onSave, onCancel }: RelatorioPendenciasEditorProps) {
    const [titulo, setTitulo] = useState(relatorio?.titulo || '');
    const [capaUrl, setCapaUrl] = useState(relatorio?.capa_url || '');
    const [capaFile, setCapaFile] = useState<File | null>(null);
    const [capaPreview, setCapaPreview] = useState(relatorio?.capa_url || '');
    const [fotoLocalidadeUrl, setFotoLocalidadeUrl] = useState(relatorio?.foto_localidade_url || '');
    const [fotoLocalidadeFile, setFotoLocalidadeFile] = useState<File | null>(null);
    const [fotoLocalidadePreview, setFotoLocalidadePreview] = useState(relatorio?.foto_localidade_url || '');
    const [dataInicioVistoria, setDataInicioVistoria] = useState(relatorio?.data_inicio_vistoria || '');
    const [historicoVisitas, setHistoricoVisitas] = useState<string[]>(relatorio?.historico_visitas || []);
    const [novaVisita, setNovaVisita] = useState('');
    const [dataSituacaoAtual, setDataSituacaoAtual] = useState(relatorio?.data_situacao_atual || '');
    const [secoes, setSecoes] = useState<SecaoLocal[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Rastrear IDs originais do banco para detectar deleções
    const originalIdsRef = useRef<{
        secaoIds: string[];
        subsecaoIds: string[];
        pendenciaIds: string[];
    }>({ secaoIds: [], subsecaoIds: [], pendenciaIds: [] });

    // Captura de voz
    const voice = useVoiceCapture();
    const [secaoAtivaParaVoz, setSecaoAtivaParaVoz] = useState<string | null>(null);
    const [subsecaoAtivaParaVoz, setSubsecaoAtivaParaVoz] = useState<string | null>(null);

    // Sync offline
    const [syncingOffline, setSyncingOffline] = useState(false);
    const [offlinePendingCount, setOfflinePendingCount] = useState(0);

    // Verificar se tem itens offline ao montar e periodicamente
    useEffect(() => {
        const checkOffline = async () => {
            try {
                const queue = getOfflineQueue();
                const fotos = await getOfflineFotos();
                const fotosOrfas = fotos.filter(f =>
                    f.base64 && f.pendenciaId && f.relatorioId &&
                    !f.pendenciaId.startsWith('offline_')
                );
                setOfflinePendingCount(queue.length + fotosOrfas.length);
            } catch {
                setOfflinePendingCount(0);
            }
        };
        checkOffline();
        const interval = setInterval(checkOffline, 10000); // Checar a cada 10s
        return () => clearInterval(interval);
    }, []);

    const handleSyncOffline = async () => {
        if (syncingOffline) return;
        setSyncingOffline(true);
        try {
            // 1. Sync pendências da fila offline
            const queue = getOfflineQueue();
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

                    if (item.foto_base64 && criada.id) {
                        try {
                            let base64Data = item.foto_base64;
                            let fotoKeyToDelete: string | null = null;
                            if (item.foto_base64.startsWith('pendencia_foto_')) {
                                const fotos = await getOfflineFotos();
                                const fotoEntry = fotos.find((f: any) => f.key === item.foto_base64);
                                if (fotoEntry?.base64) {
                                    base64Data = fotoEntry.base64;
                                    fotoKeyToDelete = item.foto_base64;
                                } else {
                                    base64Data = '';
                                }
                            }
                            if (base64Data && base64Data.startsWith('data:')) {
                                const file = base64ToFileSync(base64Data, `foto_${criada.id}.jpg`);
                                const url = await relatorioPendenciasService.uploadFoto(file, item.relatorio_id, criada.id);
                                await relatorioPendenciasService.updatePendencia(criada.id, { foto_url: url });
                                if (fotoKeyToDelete) await deleteOfflineFoto(fotoKeyToDelete);
                            }
                        } catch (e) {
                            console.error('Erro upload foto sync PC:', e);
                        }
                    }

                    // Remover da fila IMEDIATAMENTE após sucesso
                    const currentQueue = getOfflineQueue().filter((q: any) => q.id !== item.id);
                    saveOfflineQueue(currentQueue);
                } catch (e) {
                    console.error('Erro sync pendência PC:', e);
                }
            }

            // 2. Sync fotos órfãs do IndexedDB
            const fotos = await getOfflineFotos();
            const fotosOrfas = fotos.filter((f: any) =>
                f.base64 && f.pendenciaId && f.relatorioId &&
                !f.key?.startsWith('pendencia_foto_') &&
                !f.pendenciaId.startsWith('offline_')
            );
            for (const foto of fotosOrfas) {
                try {
                    const file = base64ToFileSync(foto.base64, `foto_${foto.pendenciaId}.jpg`);
                    const url = await relatorioPendenciasService.uploadFoto(file, foto.relatorioId, `${foto.pendenciaId}-sync-${Date.now()}`);
                    await relatorioPendenciasService.updatePendencia(foto.pendenciaId, { [foto.campo]: url });
                    await deleteOfflineFoto(foto.key);
                } catch (e) {
                    console.error('Erro sync foto PC:', e);
                }
            }

            // Atualizar contagem
            const remainingQueue = getOfflineQueue();
            const remainingFotos = await getOfflineFotos();
            setOfflinePendingCount(remainingQueue.length + remainingFotos.filter((f: any) =>
                f.base64 && f.pendenciaId && !f.pendenciaId.startsWith('offline_')
            ).length);

            // Recarregar relatório
            if (relatorio?.id) {
                const relAtualizado = await relatorioPendenciasService.getById(relatorio.id);
                if (relAtualizado) {
                    // Recarregar seções
                    const secoesCarregadas = (relAtualizado.secoes || []).map((secao: any, i: number) => ({
                        id: secao.id,
                        tempId: secao.id || `temp_sec_${i}`,
                        ordem: secao.ordem ?? i,
                        titulo_principal: secao.titulo_principal || '',
                        subtitulo: secao.subtitulo || '',
                        tem_subsecoes: secao.tem_subsecoes || false,
                        subsecoes: (secao.subsecoes || []).map((sub: any, j: number) => ({
                            id: sub.id,
                            tempId: sub.id || `temp_sub_${j}`,
                            ordem: sub.ordem ?? j,
                            titulo: sub.titulo || '',
                            tipo: sub.tipo || 'MANUAL',
                            fotos_constatacao: sub.fotos_constatacao || [],
                            descricao_constatacao: sub.descricao_constatacao || '',
                            pendencias: (sub.pendencias || []).map((p: any, k: number) => ({
                                id: p.id,
                                tempId: p.id || `temp_pend_${k}`,
                                ordem: p.ordem ?? k,
                                local: p.local || '',
                                descricao: p.descricao || '',
                                foto_url: p.foto_url,
                                foto_depois_url: p.foto_depois_url,
                                status: p.status || 'PENDENTE',
                                data_recebimento: p.data_recebimento || '',
                            })),
                        })),
                        pendencias: (secao.pendencias || []).map((p: any, k: number) => ({
                            id: p.id,
                            tempId: p.id || `temp_pend_${k}`,
                            ordem: p.ordem ?? k,
                            local: p.local || '',
                            descricao: p.descricao || '',
                            foto_url: p.foto_url,
                            foto_depois_url: p.foto_depois_url,
                            status: p.status || 'PENDENTE',
                            data_recebimento: p.data_recebimento || '',
                        })),
                    }));
                    setSecoes(secoesCarregadas);
                }
            }
        } catch (e) {
            console.error('Erro geral sync PC:', e);
        } finally {
            setSyncingOffline(false);
        }
    };

    // Editor de imagem
    const [editingImage, setEditingImage] = useState<{
        secaoTempId: string;
        pendenciaTempId?: string;
        imageUrl: string;
        type: 'antes' | 'depois';
        subsecaoTempId?: string;
        isConstatacao?: boolean;
        constatacaoIndex?: number;
    } | null>(null);

    useEffect(() => {
        if (relatorio?.secoes) {
            const secoesLocal: SecaoLocal[] = relatorio.secoes.map((s, idx) => ({
                ...s,
                tempId: `secao-${idx}`,
                tem_subsecoes: s.tem_subsecoes || false,
                subsecoes: (s.subsecoes || []).map((sub, subIdx) => ({
                    ...sub,
                    tempId: `subsecao-${idx}-${subIdx}`,
                    fotos_constatacao_previews: sub.fotos_constatacao || [],
                    pendencias: (sub.pendencias || []).map((p, pIdx) => ({
                        ...p,
                        tempId: `pend-${idx}-${subIdx}-${pIdx}`,
                        preview: p.foto_url || undefined,
                        previewDepois: p.foto_depois_url || undefined,
                    })),
                })),
                pendencias: (s.pendencias || []).map((p, pIdx) => ({
                    ...p,
                    tempId: `pend-${idx}-${pIdx}`,
                    // Garantir que preview seja setado com a URL do banco se existir
                    preview: p.foto_url || undefined,
                    previewDepois: p.foto_depois_url || undefined,
                })),
            }));
            setSecoes(secoesLocal);

            // Salvar IDs originais para detectar deleções ao salvar
            const secaoIds: string[] = [];
            const subsecaoIds: string[] = [];
            const pendenciaIds: string[] = [];
            relatorio.secoes.forEach(s => {
                if (s.id) secaoIds.push(s.id);
                (s.pendencias || []).forEach(p => { if (p.id) pendenciaIds.push(p.id); });
                (s.subsecoes || []).forEach(sub => {
                    if (sub.id) subsecaoIds.push(sub.id);
                    (sub.pendencias || []).forEach(p => { if (p.id) pendenciaIds.push(p.id); });
                });
            });
            originalIdsRef.current = { secaoIds, subsecaoIds, pendenciaIds };
        }
    }, [relatorio]);

    // Detectar pendência por voz
    useEffect(() => {
        voice.onPendenciaDetected((textoLiteral: string) => {
            if (!secaoAtivaParaVoz) {
                alert('Selecione uma seção antes de capturar por voz!');
                voice.stopListening();
                return;
            }

            // Adicionar pendência com texto literal
            if (subsecaoAtivaParaVoz) {
                // Adicionar em subseção
                setSecoes(prev => prev.map(s => {
                    if (s.tempId === secaoAtivaParaVoz) {
                        return {
                            ...s,
                            subsecoes: (s.subsecoes || []).map(sub => {
                                if (sub.tempId === subsecaoAtivaParaVoz) {
                                    const newPendencia: PendenciaLocal = {
                                        tempId: `pend-${Date.now()}`,
                                        ordem: sub.pendencias.length,
                                        local: '', // Usuário preenche depois
                                        descricao: textoLiteral, // LITERAL
                                        foto_url: null,
                                        foto_depois_url: null,
                                    };
                                    return { ...sub, pendencias: [...sub.pendencias, newPendencia] };
                                }
                                return sub;
                            }),
                        };
                    }
                    return s;
                }));
            } else {
                // Adicionar em seção
                setSecoes(prev => prev.map(s => {
                    if (s.tempId === secaoAtivaParaVoz) {
                        const newPendencia: PendenciaLocal = {
                            tempId: `pend-${Date.now()}`,
                            ordem: s.pendencias.length,
                            local: '', // Usuário preenche depois
                            descricao: textoLiteral, // LITERAL
                            foto_url: null,
                            foto_depois_url: null,
                        };
                        return { ...s, pendencias: [...s.pendencias, newPendencia] };
                    }
                    return s;
                }));
            }

            console.log('✅ Pendência adicionada por voz:', textoLiteral);
        });
    }, [voice, secaoAtivaParaVoz, subsecaoAtivaParaVoz, secoes]);

    // Função para gerar numeração automática da seção
    // VIII.1, VIII.2, VIII.3... (sem subseção)
    // VIII.1A, VIII.1B, VIII.1C... (com subseção)
    const gerarNumeracaoSecao = (ordem: number): string => {
        const numeroSecao = ordem + 1; // 1, 2, 3...
        return `VIII.${numeroSecao}`; // SEMPRE VIII
    };

    const handleAddSecao = () => {
        const ordem = secoes.length;
        const numeracao = gerarNumeracaoSecao(ordem);

        const newSecao: SecaoLocal = {
            tempId: `secao-${Date.now()}`,
            ordem: ordem,
            titulo_principal: `${numeracao} – `,
            subtitulo: '',
            tem_subsecoes: false, // Por padrão, sem subseções
            subsecoes: [],
            pendencias: [],
        };
        setSecoes([...secoes, newSecao]);
    };

    const handleUpdateSecao = (tempId: string, field: keyof SecaoLocal, value: any) => {
        setSecoes(prev => prev.map(s => s.tempId === tempId ? ({ ...s, [field]: value } as SecaoLocal) : s));
    };

    const handleDeleteSecao = (tempId: string) => {
        setSecoes(prev => prev.filter(s => s.tempId !== tempId).map((s, idx) => ({ ...s, ordem: idx })));
    };

    // ==================== FUNÇÕES PARA SUBSEÇÕES ====================
    const handleAddSubsecao = (secaoTempId: string, tipo: 'MANUAL' | 'CONSTATACAO' = 'MANUAL') => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                const ordem = (s.subsecoes || []).length;
                const letra = String.fromCharCode(65 + ordem); // A, B, C...
                const newSubsecao: SubsecaoLocal = {
                    tempId: `subsecao-${Date.now()}`,
                    ordem: ordem,
                    titulo: tipo === 'CONSTATACAO' ? `${letra} - CONSTATAÇÃO` : `${letra} - `,
                    tipo: tipo,
                    pendencias: [],
                    fotos_constatacao: tipo === 'CONSTATACAO' ? [] : undefined,
                    fotos_constatacao_files: tipo === 'CONSTATACAO' ? [] : undefined,
                    fotos_constatacao_previews: tipo === 'CONSTATACAO' ? [] : undefined,
                    descricao_constatacao: tipo === 'CONSTATACAO' ? '' : undefined,
                };
                return { ...s, subsecoes: [...(s.subsecoes || []), newSubsecao] };
            }
            return s;
        }));
    };

    const handleUpdateSubsecao = (secaoTempId: string, subsecaoTempId: string, field: keyof SubsecaoLocal, value: any) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub =>
                        sub.tempId === subsecaoTempId ? ({ ...sub, [field]: value } as SubsecaoLocal) : sub
                    ),
                };
            }
            return s;
        }));
    };

    const handleDeleteSubsecao = (secaoTempId: string, subsecaoTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || [])
                        .filter(sub => sub.tempId !== subsecaoTempId)
                        .map((sub, idx) => ({ ...sub, ordem: idx })),
                };
            }
            return s;
        }));
    };

    const handleFotosConstatacao = (secaoTempId: string, subsecaoTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            const newPreviews = files.map(file => URL.createObjectURL(file));
                            return {
                                ...sub,
                                fotos_constatacao_files: [...(sub.fotos_constatacao_files || []), ...files],
                                fotos_constatacao_previews: [...(sub.fotos_constatacao_previews || []), ...newPreviews],
                            };
                        }
                        return sub;
                    }),
                };
            }
            return s;
        }));

        e.target.value = '';
    };

    const handleRemoveFotoConstatacao = (secaoTempId: string, subsecaoTempId: string, index: number) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            const newFiles = [...(sub.fotos_constatacao_files || [])];
                            const newPreviews = [...(sub.fotos_constatacao_previews || [])];
                            const newUrls = [...(sub.fotos_constatacao || [])];

                            newFiles.splice(index, 1);
                            newPreviews.splice(index, 1);
                            if (newUrls.length > index) {
                                newUrls.splice(index, 1);
                            }

                            return {
                                ...sub,
                                fotos_constatacao_files: newFiles,
                                fotos_constatacao_previews: newPreviews,
                                fotos_constatacao: newUrls,
                            };
                        }
                        return sub;
                    }),
                };
            }
            return s;
        }));
    };

    const handleAddPendenciaSubsecao = (secaoTempId: string, subsecaoTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            const newPendencia: PendenciaLocal = {
                                tempId: `pend-${Date.now()}`,
                                ordem: sub.pendencias.length,
                                local: '', // Campo manual
                                descricao: '',
                                foto_url: null,
                                foto_depois_url: null,
                            };
                            return { ...sub, pendencias: [...sub.pendencias, newPendencia] };
                        }
                        return sub;
                    }),
                };
            }
            return s;
        }));
    };

    const handleUpdatePendenciaSubsecao = (secaoTempId: string, subsecaoTempId: string, pendenciaTempId: string, field: keyof PendenciaLocal, value: any) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            return {
                                ...sub,
                                pendencias: sub.pendencias.map(p =>
                                    p.tempId === pendenciaTempId ? { ...p, [field]: value } : p
                                ),
                            };
                        }
                        return sub;
                    }),
                };
            }
            return s;
        }));
    };

    const handleDeletePendenciaSubsecao = (secaoTempId: string, subsecaoTempId: string, pendenciaTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            return {
                                ...sub,
                                pendencias: sub.pendencias
                                    .filter(p => p.tempId !== pendenciaTempId)
                                    .map((p, idx) => ({ ...p, ordem: idx })),
                            };
                        }
                        return sub;
                    }),
                };
            }
            return s;
        }));
    };

    const handleFotoChangeSubsecao = (secaoTempId: string, subsecaoTempId: string, pendenciaTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const blobUrl = URL.createObjectURL(file);
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId === subsecaoTempId) {
                                return {
                                    ...sub,
                                    pendencias: sub.pendencias.map(p => {
                                        if (p.tempId === pendenciaTempId) {
                                            return { ...p, file, preview: blobUrl };
                                        }
                                        return p;
                                    }),
                                };
                            }
                            return sub;
                        }),
                    };
                }
                return s;
            }));
        }
    };

    const handleFotoDepoisChangeSubsecao = (secaoTempId: string, subsecaoTempId: string, pendenciaTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Pedir data de recebimento
            const dataRecebimento = prompt('Data de recebimento (DD/MM/AAAA):');
            if (!dataRecebimento) {
                alert('Data de recebimento é obrigatória ao adicionar foto "depois"');
                return;
            }

            const blobUrl = URL.createObjectURL(file);
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId === subsecaoTempId) {
                                return {
                                    ...sub,
                                    pendencias: sub.pendencias.map(p => {
                                        if (p.tempId === pendenciaTempId) {
                                            return {
                                                ...p,
                                                fileDepois: file,
                                                previewDepois: blobUrl,
                                                data_recebimento: dataRecebimento,
                                                status: 'RECEBIDO' as const,
                                            };
                                        }
                                        return p;
                                    }),
                                };
                            }
                            return sub;
                        }),
                    };
                }
                return s;
            }));
        }
    };

    // Excluir foto e salvar direto no banco (sem precisar salvar relatório)
    const handleDeleteFotoImediato = async (
        secaoTempId: string,
        pendenciaTempId: string,
        tipo: 'antes' | 'depois',
        subsecaoTempId?: string
    ) => {
        const campo = tipo === 'antes' ? 'foto_url' : 'foto_depois_url';
        const previewCampo = tipo === 'antes' ? 'preview' : 'previewDepois';
        const fileCampo = tipo === 'antes' ? 'file' : 'fileDepois';

        // Encontrar a pendência para pegar o ID do banco
        let pendenciaId: string | undefined;
        for (const s of secoes) {
            if (s.tempId === secaoTempId) {
                if (subsecaoTempId) {
                    for (const sub of (s.subsecoes || [])) {
                        if (sub.tempId === subsecaoTempId) {
                            const p = sub.pendencias.find(p => p.tempId === pendenciaTempId);
                            if (p) pendenciaId = p.id;
                        }
                    }
                } else {
                    const p = s.pendencias.find(p => p.tempId === pendenciaTempId);
                    if (p) pendenciaId = p.id;
                }
            }
        }

        // Atualizar state local imediatamente (todos os campos de uma vez)
        setSecoes(prev => prev.map(s => {
            if (s.tempId !== secaoTempId) return s;
            if (subsecaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId !== subsecaoTempId) return sub;
                        return {
                            ...sub,
                            pendencias: sub.pendencias.map(p => {
                                if (p.tempId !== pendenciaTempId) return p;
                                return { ...p, [previewCampo]: null, [fileCampo]: undefined, [campo]: null };
                            }),
                        };
                    }),
                };
            }
            return {
                ...s,
                pendencias: s.pendencias.map(p => {
                    if (p.tempId !== pendenciaTempId) return p;
                    return { ...p, [previewCampo]: null, [fileCampo]: undefined, [campo]: null };
                }),
            };
        }));

        // Salvar no banco imediatamente (se a pendência já existe no banco)
        if (pendenciaId) {
            try {
                await relatorioPendenciasService.updatePendencia(pendenciaId, { [campo]: null });
                console.log(`✅ Foto ${tipo} removida do banco para pendência ${pendenciaId}`);
            } catch (err) {
                console.error('Erro ao remover foto do banco:', err);
            }
        }
    };

    // ==================== FIM FUNÇÕES PARA SUBSEÇÕES ====================

    const handleAddPendencia = (secaoTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                const newPendencia: PendenciaLocal = {
                    tempId: `pend-${Date.now()}`,
                    ordem: s.pendencias.length,
                    local: '', // Campo manual
                    descricao: '',
                    foto_url: null,
                    foto_depois_url: null,
                };
                return { ...s, pendencias: [...s.pendencias, newPendencia] };
            }
            return s;
        }));
    };

    const handleUpdatePendencia = (secaoTempId: string, pendenciaTempId: string, field: keyof PendenciaLocal, value: any) => {
        console.log(`🔧 handleUpdatePendencia - campo: ${field}, valor:`, value);

        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    pendencias: s.pendencias.map(p => {
                        if (p.tempId === pendenciaTempId) {
                            return { ...p, [field]: value };
                        }
                        return p;
                    }),
                };
            }
            return s;
        }));
    };

    const handleDeletePendencia = (secaoTempId: string, pendenciaTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    pendencias: s.pendencias.filter(p => p.tempId !== pendenciaTempId).map((p, idx) => ({ ...p, ordem: idx })),
                };
            }
            return s;
        }));
    };

    // ============================================
    // Reordenar pendências (cima/baixo)
    // ============================================
    const handleMovePendenciaUp = (secaoTempId: string, pendenciaTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId !== secaoTempId) return s;
            const idx = s.pendencias.findIndex(p => p.tempId === pendenciaTempId);
            if (idx <= 0) return s;
            const arr = [...s.pendencias];
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
            return { ...s, pendencias: arr.map((p, i) => ({ ...p, ordem: i })) };
        }));
    };

    const handleMovePendenciaDown = (secaoTempId: string, pendenciaTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId !== secaoTempId) return s;
            const idx = s.pendencias.findIndex(p => p.tempId === pendenciaTempId);
            if (idx < 0 || idx >= s.pendencias.length - 1) return s;
            const arr = [...s.pendencias];
            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
            return { ...s, pendencias: arr.map((p, i) => ({ ...p, ordem: i })) };
        }));
    };

    const handleMovePendenciaSubUp = (secaoTempId: string, subsecaoTempId: string, pendenciaTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId !== secaoTempId) return s;
            return {
                ...s,
                subsecoes: (s.subsecoes || []).map(sub => {
                    if (sub.tempId !== subsecaoTempId) return sub;
                    const idx = sub.pendencias.findIndex(p => p.tempId === pendenciaTempId);
                    if (idx <= 0) return sub;
                    const arr = [...sub.pendencias];
                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                    return { ...sub, pendencias: arr.map((p, i) => ({ ...p, ordem: i })) };
                }),
            };
        }));
    };

    const handleMovePendenciaSubDown = (secaoTempId: string, subsecaoTempId: string, pendenciaTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId !== secaoTempId) return s;
            return {
                ...s,
                subsecoes: (s.subsecoes || []).map(sub => {
                    if (sub.tempId !== subsecaoTempId) return sub;
                    const idx = sub.pendencias.findIndex(p => p.tempId === pendenciaTempId);
                    if (idx < 0 || idx >= sub.pendencias.length - 1) return sub;
                    const arr = [...sub.pendencias];
                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                    return { ...sub, pendencias: arr.map((p, i) => ({ ...p, ordem: i })) };
                }),
            };
        }));
    };

    // ============================================
    // Reordenar seções (cima/baixo)
    // ============================================
    const handleMoveSecaoUp = (secaoTempId: string) => {
        setSecoes(prev => {
            const idx = prev.findIndex(s => s.tempId === secaoTempId);
            if (idx <= 0) return prev;
            const arr = [...prev];
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
            return arr.map((s, i) => ({ ...s, ordem: i }));
        });
    };

    const handleMoveSecaoDown = (secaoTempId: string) => {
        setSecoes(prev => {
            const idx = prev.findIndex(s => s.tempId === secaoTempId);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const arr = [...prev];
            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
            return arr.map((s, i) => ({ ...s, ordem: i }));
        });
    };

    // ============================================
    // Mover pendência entre seções/subseções
    // ============================================
    const [pendenciaParaMover, setPendenciaParaMover] = useState<{
        secaoTempId: string;
        subsecaoTempId?: string;
        pendenciaTempId: string;
        pendenciaLabel: string;
    } | null>(null);

    const handleMoverPendencia = (destinoSecaoTempId: string, destinoSubTempId?: string) => {
        if (!pendenciaParaMover) return;
        const { secaoTempId: origemSecao, subsecaoTempId: origemSub, pendenciaTempId } = pendenciaParaMover;

        setSecoes(prev => {
            let pendencia: PendenciaLocal | null = null;

            // 1. Extrair pendência da origem
            const semPendencia = prev.map(s => {
                if (s.tempId !== origemSecao) return s;
                if (origemSub) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId !== origemSub) return sub;
                            const found = sub.pendencias.find(p => p.tempId === pendenciaTempId);
                            if (found) pendencia = { ...found };
                            return {
                                ...sub,
                                pendencias: sub.pendencias.filter(p => p.tempId !== pendenciaTempId).map((p, i) => ({ ...p, ordem: i })),
                            };
                        }),
                    };
                } else {
                    const found = s.pendencias.find(p => p.tempId === pendenciaTempId);
                    if (found) pendencia = { ...found };
                    return {
                        ...s,
                        pendencias: s.pendencias.filter(p => p.tempId !== pendenciaTempId).map((p, i) => ({ ...p, ordem: i })),
                    };
                }
            });

            if (!pendencia) return prev;

            // 2. Inserir pendência no destino
            return semPendencia.map(s => {
                if (s.tempId !== destinoSecaoTempId) return s;
                if (destinoSubTempId) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId !== destinoSubTempId) return sub;
                            const novaPend = { ...pendencia!, ordem: sub.pendencias.length };
                            return { ...sub, pendencias: [...sub.pendencias, novaPend] };
                        }),
                    };
                } else {
                    const novaPend = { ...pendencia!, ordem: s.pendencias.length };
                    return { ...s, pendencias: [...s.pendencias, novaPend] };
                }
            });
        });

        setPendenciaParaMover(null);
    };

    // ============================================
    // Converter seção sem subseções para ter subseções
    // ============================================
    const handleConverterParaSubsecoes = (secaoTempId: string) => {
        setSecoes(prev => prev.map(s => {
            if (s.tempId !== secaoTempId) return s;
            // Criar subseção com as pendências existentes
            const novaSubsecao: SubsecaoLocal = {
                tempId: `sub-${Date.now()}`,
                ordem: 0,
                titulo: s.subtitulo || s.titulo_principal || 'Subseção A',
                tipo: 'MANUAL',
                pendencias: s.pendencias.map((p, i) => ({ ...p, ordem: i })),
            };
            return {
                ...s,
                tem_subsecoes: true,
                subsecoes: [novaSubsecao],
                pendencias: [], // Limpar da seção (agora estão na subseção)
            };
        }));
    };

    // ============================================
    // Seleção múltipla de pendências
    // ============================================
    const [selectedPendencias, setSelectedPendencias] = useState<Set<string>>(new Set());

    const toggleSelectPendencia = (tempId: string) => {
        setSelectedPendencias(prev => {
            const next = new Set(prev);
            if (next.has(tempId)) next.delete(tempId);
            else next.add(tempId);
            return next;
        });
    };

    const handleMoverSelecionadas = (destinoSecaoTempId: string, destinoSubTempId?: string) => {
        if (selectedPendencias.size === 0) return;
        setSecoes(prev => {
            const pendenciasExtraidas: PendenciaLocal[] = [];

            // 1. Extrair todas as pendências selecionadas de suas origens
            const semSelecionadas = prev.map(s => ({
                ...s,
                pendencias: s.pendencias.filter(p => {
                    if (selectedPendencias.has(p.tempId)) {
                        pendenciasExtraidas.push({ ...p });
                        return false;
                    }
                    return true;
                }).map((p, i) => ({ ...p, ordem: i })),
                subsecoes: (s.subsecoes || []).map(sub => ({
                    ...sub,
                    pendencias: sub.pendencias.filter(p => {
                        if (selectedPendencias.has(p.tempId)) {
                            pendenciasExtraidas.push({ ...p });
                            return false;
                        }
                        return true;
                    }).map((p, i) => ({ ...p, ordem: i })),
                })),
            }));

            if (pendenciasExtraidas.length === 0) return prev;

            // 2. Inserir no destino
            return semSelecionadas.map(s => {
                if (s.tempId !== destinoSecaoTempId) return s;
                if (destinoSubTempId) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId !== destinoSubTempId) return sub;
                            const base = sub.pendencias.length;
                            return {
                                ...sub,
                                pendencias: [...sub.pendencias, ...pendenciasExtraidas.map((p, i) => ({ ...p, ordem: base + i }))],
                            };
                        }),
                    };
                } else {
                    const base = s.pendencias.length;
                    return {
                        ...s,
                        pendencias: [...s.pendencias, ...pendenciasExtraidas.map((p, i) => ({ ...p, ordem: base + i }))],
                    };
                }
            });
        });
        setSelectedPendencias(new Set());
        setPendenciaParaMover(null);
    };

    // ============================================
    // Drag and Drop (dnd-kit)
    // ============================================
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    // Encontrar a pendência sendo arrastada para o DragOverlay
    const activeDragPendencia = useMemo(() => {
        if (!activeDragId) return null;
        for (const s of secoes) {
            const found = s.pendencias.find(p => p.tempId === activeDragId);
            if (found) return found;
            for (const sub of (s.subsecoes || [])) {
                const foundSub = sub.pendencias.find(p => p.tempId === activeDragId);
                if (foundSub) return foundSub;
            }
        }
        return null;
    }, [activeDragId, secoes]);

    // Encontrar container (secao/subsecao) de uma pendência
    const findPendenciaContainer = (pendTempId: string): { secaoTempId: string; subsecaoTempId?: string } | null => {
        for (const s of secoes) {
            if (s.pendencias.some(p => p.tempId === pendTempId)) {
                return { secaoTempId: s.tempId };
            }
            for (const sub of (s.subsecoes || [])) {
                if (sub.pendencias.some(p => p.tempId === pendTempId)) {
                    return { secaoTempId: s.tempId, subsecaoTempId: sub.tempId };
                }
            }
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Caso 1: Arrastar seção sobre seção (reordenar seções)
        // IDs de seção para drag usam prefixo "drag-secao-" para não conflitar com pendências cujo tempId já começa com "secao-"
        if (activeId.startsWith('drag-secao-') && overId.startsWith('drag-secao-')) {
            const fromTempId = activeId.replace('drag-secao-', '');
            const toTempId = overId.replace('drag-secao-', '');
            setSecoes(prev => {
                const fromIdx = prev.findIndex(s => s.tempId === fromTempId);
                const toIdx = prev.findIndex(s => s.tempId === toTempId);
                if (fromIdx < 0 || toIdx < 0) return prev;
                const arr = [...prev];
                const [moved] = arr.splice(fromIdx, 1);
                arr.splice(toIdx, 0, moved);
                return arr.map((s, i) => ({ ...s, ordem: i }));
            });
            return;
        }

        // Caso 2: Arrastar pendência
        const activeContainer = findPendenciaContainer(activeId);
        if (!activeContainer) return;

        // Over pode ser outra pendência ou um drop-zone de seção/subseção
        let targetContainer: { secaoTempId: string; subsecaoTempId?: string } | null = null;
        let targetIdx: number | null = null;

        // Drop em outra pendência
        const overContainer = findPendenciaContainer(overId);
        if (overContainer) {
            targetContainer = overContainer;
            // Encontrar o índice da pendência alvo
            for (const s of secoes) {
                if (s.tempId === overContainer.secaoTempId) {
                    if (overContainer.subsecaoTempId) {
                        const sub = (s.subsecoes || []).find(sub => sub.tempId === overContainer.subsecaoTempId);
                        if (sub) targetIdx = sub.pendencias.findIndex(p => p.tempId === overId);
                    } else {
                        targetIdx = s.pendencias.findIndex(p => p.tempId === overId);
                    }
                }
            }
        }

        // Drop em zone de seção/subseção (drop-zone-secao-xxx ou drop-zone-sub-xxx)
        if (overId.startsWith('drop-zone-sub-')) {
            const subTempId = overId.replace('drop-zone-sub-', '');
            for (const s of secoes) {
                const sub = (s.subsecoes || []).find(sub => sub.tempId === subTempId);
                if (sub) {
                    targetContainer = { secaoTempId: s.tempId, subsecaoTempId: subTempId };
                    break;
                }
            }
        } else if (overId.startsWith('drop-zone-secao-')) {
            const secTempId = overId.replace('drop-zone-secao-', '');
            targetContainer = { secaoTempId: secTempId };
        }

        if (!targetContainer) return;

        // Mover pendência(s): se a ativa está selecionada, mover todas selecionadas
        const idsParaMover = selectedPendencias.has(activeId)
            ? [...selectedPendencias]
            : [activeId];

        setSecoes(prev => {
            const pendenciasExtraidas: PendenciaLocal[] = [];

            // Extrair
            const semMovidas = prev.map(s => ({
                ...s,
                pendencias: s.pendencias.filter(p => {
                    if (idsParaMover.includes(p.tempId)) {
                        pendenciasExtraidas.push({ ...p });
                        return false;
                    }
                    return true;
                }),
                subsecoes: (s.subsecoes || []).map(sub => ({
                    ...sub,
                    pendencias: sub.pendencias.filter(p => {
                        if (idsParaMover.includes(p.tempId)) {
                            pendenciasExtraidas.push({ ...p });
                            return false;
                        }
                        return true;
                    }),
                })),
            }));

            if (pendenciasExtraidas.length === 0) return prev;

            // Inserir no destino
            return semMovidas.map(s => {
                if (s.tempId !== targetContainer!.secaoTempId) {
                    return {
                        ...s,
                        pendencias: s.pendencias.map((p, i) => ({ ...p, ordem: i })),
                        subsecoes: (s.subsecoes || []).map(sub => ({
                            ...sub,
                            pendencias: sub.pendencias.map((p, i) => ({ ...p, ordem: i })),
                        })),
                    };
                }
                if (targetContainer!.subsecaoTempId) {
                    return {
                        ...s,
                        pendencias: s.pendencias.map((p, i) => ({ ...p, ordem: i })),
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId !== targetContainer!.subsecaoTempId) {
                                return { ...sub, pendencias: sub.pendencias.map((p, i) => ({ ...p, ordem: i })) };
                            }
                            const arr = [...sub.pendencias];
                            const insertAt = targetIdx !== null && targetIdx >= 0 ? targetIdx : arr.length;
                            arr.splice(insertAt, 0, ...pendenciasExtraidas);
                            return { ...sub, pendencias: arr.map((p, i) => ({ ...p, ordem: i })) };
                        }),
                    };
                } else {
                    const arr = [...s.pendencias];
                    const insertAt = targetIdx !== null && targetIdx >= 0 ? targetIdx : arr.length;
                    arr.splice(insertAt, 0, ...pendenciasExtraidas);
                    return {
                        ...s,
                        pendencias: arr.map((p, i) => ({ ...p, ordem: i })),
                        subsecoes: (s.subsecoes || []).map(sub => ({
                            ...sub,
                            pendencias: sub.pendencias.map((p, i) => ({ ...p, ordem: i })),
                        })),
                    };
                }
            });
        });

        setSelectedPendencias(new Set());
    };

    const handleFotoChange = (secaoTempId: string, pendenciaTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const blobUrl = URL.createObjectURL(file);
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        pendencias: s.pendencias.map(p => {
                            if (p.tempId === pendenciaTempId) {
                                return { ...p, file, preview: blobUrl };
                            }
                            return p;
                        }),
                    };
                }
                return s;
            }));
        }
    };

    const handleFotoDepoisChange = (secaoTempId: string, pendenciaTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Pedir data de recebimento
            const dataRecebimento = prompt('Data de recebimento (DD/MM/AAAA):');
            if (!dataRecebimento) {
                alert('Data de recebimento é obrigatória ao adicionar foto "depois"');
                return;
            }

            const blobUrl = URL.createObjectURL(file);
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        pendencias: s.pendencias.map(p => {
                            if (p.tempId === pendenciaTempId) {
                                return {
                                    ...p,
                                    fileDepois: file,
                                    previewDepois: blobUrl,
                                    data_recebimento: dataRecebimento,
                                    status: 'RECEBIDO' as const,
                                };
                            }
                            return p;
                        }),
                    };
                }
                return s;
            }));
        }
    };

    // ==================== EDITOR DE IMAGEM ====================
    const handleOpenImageEditor = (
        secaoTempId: string,
        pendenciaTempId: string,
        imageUrl: string,
        type: 'antes' | 'depois',
        subsecaoTempId?: string
    ) => {
        setEditingImage({
            secaoTempId,
            pendenciaTempId,
            imageUrl,
            type,
            subsecaoTempId
        });
    };

    const handleOpenImageEditorConstatacao = (
        secaoTempId: string,
        subsecaoTempId: string,
        constatacaoIndex: number,
        imageUrl: string
    ) => {
        setEditingImage({
            secaoTempId,
            imageUrl,
            type: 'antes', // Não usado para constatação
            subsecaoTempId,
            isConstatacao: true,
            constatacaoIndex
        });
    };

    const handleSaveEditedImage = (blob: Blob) => {
        if (!editingImage) return;

        const file = new File([blob], 'edited-image.png', { type: 'image/png' });
        const blobUrl = URL.createObjectURL(blob);

        const { secaoTempId, pendenciaTempId, type, subsecaoTempId, isConstatacao, constatacaoIndex } = editingImage;

        // Se for constatação
        if (isConstatacao && subsecaoTempId !== undefined && constatacaoIndex !== undefined) {
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId === subsecaoTempId) {
                                const newFiles = [...(sub.fotos_constatacao_files || [])];
                                const newPreviews = [...(sub.fotos_constatacao_previews || [])];

                                newFiles[constatacaoIndex] = file;
                                newPreviews[constatacaoIndex] = blobUrl;

                                return {
                                    ...sub,
                                    fotos_constatacao_files: newFiles,
                                    fotos_constatacao_previews: newPreviews,
                                };
                            }
                            return sub;
                        })
                    };
                }
                return s;
            }));
        } else if (subsecaoTempId) {
            // Atualizar imagem em subseção (pendências)
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        subsecoes: (s.subsecoes || []).map(sub => {
                            if (sub.tempId === subsecaoTempId) {
                                return {
                                    ...sub,
                                    pendencias: sub.pendencias.map(p => {
                                        if (p.tempId === pendenciaTempId) {
                                            if (type === 'antes') {
                                                return { ...p, file, preview: blobUrl };
                                            } else {
                                                return { ...p, fileDepois: file, previewDepois: blobUrl };
                                            }
                                        }
                                        return p;
                                    })
                                };
                            }
                            return sub;
                        })
                    };
                }
                return s;
            }));
        } else {
            // Atualizar imagem em seção
            setSecoes(prev => prev.map(s => {
                if (s.tempId === secaoTempId) {
                    return {
                        ...s,
                        pendencias: s.pendencias.map(p => {
                            if (p.tempId === pendenciaTempId) {
                                if (type === 'antes') {
                                    return { ...p, file, preview: blobUrl };
                                } else {
                                    return { ...p, fileDepois: file, previewDepois: blobUrl };
                                }
                            }
                            return p;
                        })
                    };
                }
                return s;
            }));
        }

        setEditingImage(null);
    };

    const handleBulkPhotos = (secaoTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const secao = secoes.find(s => s.tempId === secaoTempId);
        if (!secao) return;

        const newPendencias: PendenciaLocal[] = files.map((file, idx) => ({
            tempId: `pend-${Date.now()}-${idx}`,
            ordem: secao.pendencias.length + idx,
            local: '', // Campo manual
            descricao: '',
            foto_url: null,
            foto_depois_url: null,
            file: file,
            preview: URL.createObjectURL(file),
        }));

        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return { ...s, pendencias: [...s.pendencias, ...newPendencias] };
            }
            return s;
        }));
    };

    const handleBulkPhotosSubsecao = (secaoTempId: string, subsecaoTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const secao = secoes.find(s => s.tempId === secaoTempId);
        if (!secao) return;

        const subsecao = (secao.subsecoes || []).find(sub => sub.tempId === subsecaoTempId);
        if (!subsecao) return;

        const newPendencias: PendenciaLocal[] = files.map((file, idx) => ({
            tempId: `pend-${Date.now()}-${idx}`,
            ordem: subsecao.pendencias.length + idx,
            local: '', // Campo manual
            descricao: '',
            foto_url: null,
            foto_depois_url: null,
            file: file,
            preview: URL.createObjectURL(file),
        }));

        setSecoes(prev => prev.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            return { ...sub, pendencias: [...sub.pendencias, ...newPendencias] };
                        }
                        return sub;
                    }),
                };
            }
            return s;
        }));
    };

    const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCapaFile(file);
            setCapaPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveCapa = () => {
        setCapaFile(null);
        setCapaPreview('');
        setCapaUrl('');
    };

    const handleFotoLocalidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFotoLocalidadeFile(file);
            setFotoLocalidadePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveFotoLocalidade = () => {
        setFotoLocalidadeFile(null);
        setFotoLocalidadePreview('');
        setFotoLocalidadeUrl('');
    };

    const handleAddVisita = () => {
        if (novaVisita.trim()) {
            setHistoricoVisitas([...historicoVisitas, novaVisita]);
            setNovaVisita('');
        }
    };

    const handleRemoveVisita = (index: number) => {
        setHistoricoVisitas(historicoVisitas.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        console.log('🚀 INICIANDO SALVAMENTO DO RELATÓRIO');
        console.log('📋 Dados iniciais:', {
            titulo,
            totalSecoes: secoes.length,
            relatorioId: relatorio?.id,
        });

        if (!titulo.trim()) {
            alert('Por favor, preencha o título do relatório.');
            return;
        }

        setIsSaving(true);

        try {
            let relatorioId = relatorio?.id;
            let finalCapaUrl = capaUrl;

            console.log('✅ Validação OK, iniciando processo de salvamento...');

            // Create or update relatório
            if (relatorioId) {
                await relatorioPendenciasService.update(relatorioId, {
                    titulo,
                    capa_url: finalCapaUrl,
                    data_inicio_vistoria: dataInicioVistoria,
                    historico_visitas: historicoVisitas,
                    data_situacao_atual: dataSituacaoAtual,
                });
            } else {
                const newRelatorio = await relatorioPendenciasService.create({
                    contrato_id: contrato.id,
                    titulo,
                    capa_url: finalCapaUrl,
                    data_inicio_vistoria: dataInicioVistoria,
                    historico_visitas: historicoVisitas,
                    data_situacao_atual: dataSituacaoAtual,
                });
                relatorioId = newRelatorio.id;
            }

            // Upload cover image if new file selected
            if (capaFile) {
                finalCapaUrl = await relatorioPendenciasService.uploadFoto(capaFile, relatorioId, 'capa');
                // Update relatorio with capa URL
                await relatorioPendenciasService.update(relatorioId, {
                    titulo,
                    capa_url: finalCapaUrl,
                });
            }

            // Upload foto localidade if new file selected
            let finalFotoLocalidadeUrl = fotoLocalidadeUrl;
            if (fotoLocalidadeFile) {
                finalFotoLocalidadeUrl = await relatorioPendenciasService.uploadFoto(fotoLocalidadeFile, relatorioId, 'localidade');
                // Update relatorio with foto localidade URL
                await relatorioPendenciasService.update(relatorioId, {
                    titulo,
                    capa_url: finalCapaUrl,
                    foto_localidade_url: finalFotoLocalidadeUrl,
                });
            }

            // Deletar do banco pendências, subseções e seções que foram removidas
            const currentPendenciaIds: string[] = [];
            const currentSubsecaoIds: string[] = [];
            const currentSecaoIds: string[] = [];
            for (const s of secoes) {
                if (s.id) currentSecaoIds.push(s.id);
                for (const p of s.pendencias) { if (p.id) currentPendenciaIds.push(p.id); }
                for (const sub of (s.subsecoes || [])) {
                    if (sub.id) currentSubsecaoIds.push(sub.id);
                    for (const p of sub.pendencias) { if (p.id) currentPendenciaIds.push(p.id); }
                }
            }

            // Deletar pendências removidas
            for (const id of originalIdsRef.current.pendenciaIds) {
                if (!currentPendenciaIds.includes(id)) {
                    console.log(`🗑️ Deletando pendência ${id} do banco`);
                    await relatorioPendenciasService.deletePendencia(id);
                }
            }
            // Deletar subseções removidas
            for (const id of originalIdsRef.current.subsecaoIds) {
                if (!currentSubsecaoIds.includes(id)) {
                    console.log(`🗑️ Deletando subseção ${id} do banco`);
                    await relatorioPendenciasService.deleteSubsecao(id);
                }
            }
            // Deletar seções removidas
            for (const id of originalIdsRef.current.secaoIds) {
                if (!currentSecaoIds.includes(id)) {
                    console.log(`🗑️ Deletando seção ${id} do banco`);
                    await relatorioPendenciasService.deleteSecao(id);
                }
            }

            // Save secoes and pendencias
            for (const secao of secoes) {
                let secaoId = secao.id;

                // Detectar automaticamente se tem subseções
                const temSubsecoes = (secao.subsecoes || []).length > 0;

                if (secaoId) {
                    try {
                        await relatorioPendenciasService.updateSecao(secaoId, {
                            titulo_principal: secao.titulo_principal,
                            subtitulo: secao.subtitulo || '',
                            tem_subsecoes: temSubsecoes,
                            ordem: secao.ordem,
                        });
                    } catch (err: any) {
                        // Se der erro de coluna não encontrada, tentar sem tem_subsecoes
                        if (err?.code === 'PGRST204') {
                            console.warn('⚠️ Salvando sem tem_subsecoes (modo retrocompatível)');
                            await relatorioPendenciasService.updateSecao(secaoId, {
                                titulo_principal: secao.titulo_principal,
                                subtitulo: secao.subtitulo || '',
                                ordem: secao.ordem,
                            });
                        } else {
                            throw err;
                        }
                    }
                } else {
                    try {
                        const newSecao = await relatorioPendenciasService.createSecao({
                            relatorio_id: relatorioId,
                            titulo_principal: secao.titulo_principal,
                            subtitulo: secao.subtitulo || '',
                            tem_subsecoes: temSubsecoes,
                            ordem: secao.ordem,
                        });
                        secaoId = newSecao.id;
                        secao.id = newSecao.id;
                    } catch (err: any) {
                        // Se der erro de coluna não encontrada, tentar sem tem_subsecoes
                        if (err?.code === 'PGRST204') {
                            console.warn('⚠️ Salvando sem tem_subsecoes (modo retrocompatível)');
                            const newSecao = await relatorioPendenciasService.createSecao({
                                relatorio_id: relatorioId,
                                titulo_principal: secao.titulo_principal,
                                subtitulo: secao.subtitulo || '',
                                ordem: secao.ordem,
                            });
                            secaoId = newSecao.id;
                        } else {
                            throw err;
                        }
                    }
                }

                // Salvar pendências diretas na seção (SEMPRE salvar se existirem)
                for (const pendencia of secao.pendencias) {
                    let fotoUrl = pendencia.foto_url;
                    let fotoDepoisUrl = pendencia.foto_depois_url;

                    if (pendencia.file) {
                        fotoUrl = await relatorioPendenciasService.uploadFoto(pendencia.file, relatorioId, pendencia.tempId);
                    } else if (pendencia.preview || pendencia.foto_url) {
                        // Manter URL existente do banco
                        fotoUrl = pendencia.foto_url || null;
                    } else {
                        fotoUrl = null;
                    }

                    if (pendencia.fileDepois) {
                        fotoDepoisUrl = await relatorioPendenciasService.uploadFoto(pendencia.fileDepois, relatorioId, `${pendencia.tempId}-depois`);
                    } else if (pendencia.previewDepois || pendencia.foto_depois_url) {
                        // Manter URL existente do banco
                        fotoDepoisUrl = pendencia.foto_depois_url || null;
                    } else {
                        fotoDepoisUrl = null;
                    }

                    const pendenciaData = {
                        local: pendencia.local,
                        descricao: pendencia.descricao,
                        foto_url: fotoUrl,
                        foto_depois_url: fotoDepoisUrl,
                        data_recebimento: pendencia.data_recebimento,
                        status: pendencia.status || 'PENDENTE',
                        ordem: pendencia.ordem,
                    };

                    if (pendencia.id) {
                        await relatorioPendenciasService.updatePendencia(pendencia.id, pendenciaData);
                    } else {
                        const novaPend = await relatorioPendenciasService.createPendencia({
                            secao_id: secaoId,
                            ...pendenciaData,
                        });
                        // Atualizar ID no state para evitar duplicação se o save falhar e for retentado
                        pendencia.id = novaPend.id;
                    }
                }

                // Salvar subseções (se existirem)
                if (secao.subsecoes && secao.subsecoes.length > 0) {
                    for (const subsecao of secao.subsecoes) {
                        let subsecaoId = subsecao.id;

                        // Upload fotos de constatação (se for tipo CONSTATACAO)
                        // Manter URLs existentes + adicionar novas fotos uploadadas
                        let fotosConstatacaoUrls: string[] = [];
                        if (subsecao.tipo === 'CONSTATACAO') {
                            // 1. Preservar fotos já existentes (URLs do banco)
                            if (subsecao.fotos_constatacao && subsecao.fotos_constatacao.length > 0) {
                                fotosConstatacaoUrls = [...subsecao.fotos_constatacao.filter(u => u && u.startsWith('http'))];
                            }
                            // 2. Upload de fotos novas (arquivos locais)
                            if (subsecao.fotos_constatacao_files) {
                                for (const file of subsecao.fotos_constatacao_files) {
                                    const url = await relatorioPendenciasService.uploadFoto(file, relatorioId, `constatacao-${subsecao.tempId}-${Date.now()}`);
                                    fotosConstatacaoUrls.push(url);
                                }
                            }
                        }

                        if (subsecaoId) {
                            await relatorioPendenciasService.updateSubsecao(subsecaoId, {
                                titulo: subsecao.titulo,
                                ordem: subsecao.ordem,
                                tipo: subsecao.tipo || 'MANUAL',
                                fotos_constatacao: subsecao.tipo === 'CONSTATACAO' ? fotosConstatacaoUrls : undefined,
                                descricao_constatacao: subsecao.tipo === 'CONSTATACAO' ? subsecao.descricao_constatacao : undefined,
                            });
                        } else {
                            const newSubsecao = await relatorioPendenciasService.createSubsecao({
                                secao_id: secaoId,
                                titulo: subsecao.titulo,
                                ordem: subsecao.ordem,
                                tipo: subsecao.tipo || 'MANUAL',
                                fotos_constatacao: subsecao.tipo === 'CONSTATACAO' ? fotosConstatacaoUrls : undefined,
                                descricao_constatacao: subsecao.tipo === 'CONSTATACAO' ? subsecao.descricao_constatacao : undefined,
                            });
                            subsecaoId = newSubsecao.id;
                            subsecao.id = newSubsecao.id;
                        }

                        // Salvar pendências da subseção (só para tipo MANUAL)
                        if (subsecao.tipo !== 'CONSTATACAO') {
                        for (const pendencia of subsecao.pendencias) {
                            let fotoUrl = pendencia.foto_url;
                            let fotoDepoisUrl = pendencia.foto_depois_url;

                            if (pendencia.file) {
                                fotoUrl = await relatorioPendenciasService.uploadFoto(pendencia.file, relatorioId, pendencia.tempId);
                            } else if (pendencia.preview || pendencia.foto_url) {
                                // Manter URL existente do banco
                                fotoUrl = pendencia.foto_url || null;
                            } else {
                                fotoUrl = null;
                            }

                            if (pendencia.fileDepois) {
                                fotoDepoisUrl = await relatorioPendenciasService.uploadFoto(pendencia.fileDepois, relatorioId, `${pendencia.tempId}-depois`);
                            } else if (pendencia.previewDepois || pendencia.foto_depois_url) {
                                // Manter URL existente do banco
                                fotoDepoisUrl = pendencia.foto_depois_url || null;
                            } else {
                                fotoDepoisUrl = null;
                            }

                            const pendenciaData = {
                                local: pendencia.local,
                                descricao: pendencia.descricao,
                                foto_url: fotoUrl,
                                foto_depois_url: fotoDepoisUrl,
                                data_recebimento: pendencia.data_recebimento,
                                status: pendencia.status || 'PENDENTE',
                                ordem: pendencia.ordem,
                                subsecao_id: subsecaoId,
                            };

                            if (pendencia.id) {
                                await relatorioPendenciasService.updatePendencia(pendencia.id, pendenciaData);
                            } else {
                                const novaPend = await relatorioPendenciasService.createPendencia({
                                    secao_id: secaoId,
                                    ...pendenciaData,
                                });
                                // Atualizar ID no state para evitar duplicação se o save falhar e for retentado
                                pendencia.id = novaPend.id;
                            }
                        }
                        }
                    }
                }
            }

            console.log('🎉 SALVAMENTO CONCLUÍDO COM SUCESSO!');

            // Recarregar os dados do banco para atualizar a interface
            if (relatorioId) {
                console.log('🔄 Recarregando dados do banco...');
                const relatorioAtualizado = await relatorioPendenciasService.getById(relatorioId);
                console.log('📦 DADOS COMPLETOS DO BANCO:', JSON.stringify(relatorioAtualizado, null, 2));

                if (relatorioAtualizado?.secoes) {
                    // Log detalhado de cada pendência
                    relatorioAtualizado.secoes.forEach((secao, sIdx) => {
                        console.log(`📂 Seção ${sIdx + 1}:`, secao.titulo_principal);
                        secao.pendencias?.forEach((pend, pIdx) => {
                            console.log(`   📌 Pendência ${pIdx + 1}:`, {
                                id: pend.id,
                                local: pend.local,
                                foto_url: pend.foto_url,
                                foto_depois_url: pend.foto_depois_url,
                                ordem: pend.ordem,
                            });
                        });
                    });

                    const secoesAtualizadas: SecaoLocal[] = relatorioAtualizado.secoes.map((s, idx) => ({
                        ...s,
                        tempId: `secao-${idx}`,
                        tem_subsecoes: s.tem_subsecoes || false,
                        subsecoes: (s.subsecoes || []).map((sub, subIdx) => ({
                            ...sub,
                            tempId: `subsecao-${idx}-${subIdx}`,
                            pendencias: (sub.pendencias || []).map((p, pIdx) => ({
                                ...p,
                                tempId: `pend-${idx}-${subIdx}-${pIdx}`,
                                preview: p.foto_url || undefined,
                                previewDepois: p.foto_depois_url || undefined,
                            })),
                        })),
                        pendencias: (s.pendencias || []).map((p, pIdx) => {
                            console.log(`🔄 Mapeando pendência ${pIdx + 1}:`, {
                                foto_url: p.foto_url,
                                foto_depois_url: p.foto_depois_url,
                                preview_sera: p.foto_url || undefined,
                                previewDepois_sera: p.foto_depois_url || undefined,
                            });

                            return {
                                ...p,
                                tempId: `pend-${idx}-${pIdx}`,
                                preview: p.foto_url || undefined,
                                previewDepois: p.foto_depois_url || undefined,
                            };
                        }),
                    }));
                    setSecoes(secoesAtualizadas);

                    // Atualizar IDs originais com os novos dados do banco
                    const newSecaoIds: string[] = [];
                    const newSubsecaoIds: string[] = [];
                    const newPendenciaIds: string[] = [];
                    relatorioAtualizado.secoes.forEach(s => {
                        if (s.id) newSecaoIds.push(s.id);
                        (s.pendencias || []).forEach(p => { if (p.id) newPendenciaIds.push(p.id); });
                        (s.subsecoes || []).forEach(sub => {
                            if (sub.id) newSubsecaoIds.push(sub.id);
                            (sub.pendencias || []).forEach(p => { if (p.id) newPendenciaIds.push(p.id); });
                        });
                    });
                    originalIdsRef.current = { secaoIds: newSecaoIds, subsecaoIds: newSubsecaoIds, pendenciaIds: newPendenciaIds };

                    console.log('✅ Interface atualizada com dados do banco!');
                    console.log('📊 SEÇÕES FINAIS:', secoesAtualizadas);
                }
            }

            alert('Relatório de pendências salvo com sucesso!');
            onSave();
        } catch (error) {
            console.error('❌❌❌ ERRO AO SALVAR RELATÓRIO:', error);
            console.error('Stack trace:', error);
            alert('Erro ao salvar relatório de pendências. Verifique o console.');
        } finally {
            console.log('🏁 Finalizando processo de salvamento');
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Loading Overlay */}
            {isSaving && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                        <div className="text-center">
                            <p className="text-xl font-bold text-white mb-2">Salvando Relatório</p>
                            <p className="text-sm text-gray-400">Aguarde enquanto processamos os dados...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                    {relatorio ? 'Editar Relatório de Pendências' : 'Novo Relatório de Pendências'}
                </h2>
                <div className="flex gap-2">
                    <Button onClick={onCancel} variant="outline" disabled={isSaving}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </div>

            {/* Título */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <Label htmlFor="titulo" className="text-gray-300">Título do Relatório *</Label>
                        <Input
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Relatório de Pendências - Torre 1"
                            className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Cover Image Upload */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Capa Personalizada (Opcional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="capa" className="text-gray-300">
                            Upload da Capa
                        </Label>
                        <p className="text-sm text-gray-400 mb-2">
                            Envie uma imagem personalizada para a capa do relatório (PNG, JPG, JPEG)
                        </p>
                        {!capaPreview ? (
                            <div className="mt-2">
                                <Input
                                    id="capa"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleCapaChange}
                                    className="bg-gray-900 border-gray-700 text-white"
                                />
                            </div>
                        ) : (
                            <div className="mt-2 space-y-2">
                                <div className="relative inline-block">
                                    <img
                                        src={capaPreview}
                                        alt="Preview da capa"
                                        className="h-40 w-auto border-2 border-gray-600 rounded"
                                    />
                                </div>
                                <div>
                                    <Button
                                        onClick={handleRemoveCapa}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Remover Capa
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Foto da Localidade Upload */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Foto da Localidade (Opcional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="foto-localidade" className="text-gray-300">
                            Upload da Foto da Localidade
                        </Label>
                        <p className="text-sm text-gray-400 mb-2">
                            Envie uma foto da localidade do empreendimento (PNG, JPG, JPEG)
                        </p>
                        {!fotoLocalidadePreview ? (
                            <div className="mt-2">
                                <Input
                                    id="foto-localidade"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFotoLocalidadeChange}
                                    className="bg-gray-900 border-gray-700 text-white"
                                />
                            </div>
                        ) : (
                            <div className="mt-2 space-y-2">
                                <div className="relative inline-block">
                                    <img
                                        src={fotoLocalidadePreview}
                                        alt="Preview da foto da localidade"
                                        className="h-40 w-auto border-2 border-gray-600 rounded"
                                    />
                                </div>
                                <div>
                                    <Button
                                        onClick={handleRemoveFotoLocalidade}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Remover Foto
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Histórico de Vistorias */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Histórico de Vistorias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="data-inicio" className="text-gray-300">
                            Data de Início das Vistorias
                        </Label>
                        <Input
                            id="data-inicio"
                            value={dataInicioVistoria}
                            onChange={(e) => setDataInicioVistoria(e.target.value)}
                            placeholder="Ex: 24/10/2025"
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                        />
                    </div>

                    <div>
                        <Label className="text-gray-300">
                            Histórico de Todas as Visitas
                        </Label>
                        <p className="text-sm text-gray-400 mb-2">
                            Adicione cada visita no formato: "DD/MM/AA – Descrição"
                        </p>
                        <div className="flex gap-2 mt-2">
                            <Input
                                value={novaVisita}
                                onChange={(e) => setNovaVisita(e.target.value)}
                                placeholder="Ex: 24/10/25 – Início das vistorias"
                                className="bg-gray-900 border-gray-700 text-white flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddVisita();
                                    }
                                }}
                            />
                            <Button onClick={handleAddVisita} variant="outline" size="sm">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        {historicoVisitas.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {historicoVisitas.map((visita, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-900 p-2 rounded border border-gray-700">
                                        <span className="text-white text-sm">• {visita}</span>
                                        <Button
                                            onClick={() => handleRemoveVisita(index)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="data-situacao" className="text-gray-300">
                            Data da Situação Atual
                        </Label>
                        <Input
                            id="data-situacao"
                            value={dataSituacaoAtual}
                            onChange={(e) => setDataSituacaoAtual(e.target.value)}
                            placeholder="Ex: 08/12/2025"
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Seções */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Seções</h3>
                    <div className="flex gap-2 items-center">
                        {selectedPendencias.size > 0 && (
                            <span className="text-sm text-blue-400 font-medium">
                                {selectedPendencias.size} selecionada(s)
                            </span>
                        )}
                        <Button onClick={handleAddSecao} variant="outline" className="text-blue-400">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Seção
                        </Button>
                    </div>
                </div>

                {secoes.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="py-12 text-center text-gray-400">
                            <p>Nenhuma seção adicionada. Clique em "Adicionar Seção" para começar.</p>
                        </CardContent>
                    </Card>
                ) : (() => {
                    let globalPendenciaCounter = 0;

                    return (
                    <SortableContext items={secoes.map(s => `drag-secao-${s.tempId}`)} strategy={verticalListSortingStrategy}>
                    {secoes.map((secao, secaoIdx) => (
                        <DraggableSecao key={secao.tempId} id={`drag-secao-${secao.tempId}`}>
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => handleMoveSecaoUp(secao.tempId)}
                                                disabled={secaoIdx === 0}
                                                className="text-gray-400 hover:text-white disabled:text-gray-700 p-0.5"
                                                title="Mover seção para cima"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveSecaoDown(secao.tempId)}
                                                disabled={secaoIdx === secoes.length - 1}
                                                className="text-gray-400 hover:text-white disabled:text-gray-700 p-0.5"
                                                title="Mover seção para baixo"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                        Seção VIII.{secao.ordem + 1}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        {!secao.tem_subsecoes && secao.pendencias.length > 0 && (
                                            <Button
                                                onClick={() => handleConverterParaSubsecoes(secao.tempId)}
                                                variant="outline"
                                                size="sm"
                                                className="text-indigo-400 border-indigo-600 hover:bg-indigo-900/30"
                                                title="Converter pendências em subseção"
                                            >
                                                <FolderInput className="w-4 h-4 mr-1" />
                                                Criar Subseção
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleDeleteSecao(secao.tempId)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor={`titulo-principal-${secao.tempId}`} className="text-gray-300">
                                        Título Principal da Seção
                                    </Label>
                                    <Input
                                        id={`titulo-principal-${secao.tempId}`}
                                        value={secao.titulo_principal}
                                        onChange={(e) => handleUpdateSecao(secao.tempId, 'titulo_principal', e.target.value)}
                                        placeholder="Ex: HALLS RESIDENCIAL"
                                        className="bg-gray-900 border-gray-700 text-white mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Título principal (Ex: VIII.1 - HALLS RESIDENCIAL)</p>
                                </div>

                                {/* Pendências da Seção (renderizadas ANTES das subseções) */}
                                <div className="border-t border-gray-700 pt-4 mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <Label className="text-gray-300">Pendências da Seção ({secao.pendencias.length})</Label>
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => handleBulkPhotos(secao.tempId, e)}
                                                className="hidden"
                                                id={`bulk-photos-${secao.tempId}`}
                                            />
                                            <Button
                                                onClick={() => document.getElementById(`bulk-photos-${secao.tempId}`)?.click()}
                                                variant="secondary"
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <ImageIcon className="w-3 h-3 mr-1" />
                                                Adicionar Várias Fotos
                                            </Button>

                                            <Button
                                                onClick={() => handleAddPendencia(secao.tempId)}
                                                variant="outline"
                                                size="sm"
                                                className="text-green-400"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Adicionar Manual
                                            </Button>

                                            <Button
                                                onClick={() => {
                                                    setSecaoAtivaParaVoz(secao.tempId);
                                                    setSubsecaoAtivaParaVoz(null);
                                                    if (voice.isListening) {
                                                        voice.stopListening();
                                                    } else {
                                                        voice.startListening();
                                                    }
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className={voice.isListening && secaoAtivaParaVoz === secao.tempId ? "text-red-400 border-red-400" : "text-purple-400"}
                                                disabled={!voice.isSupported}
                                            >
                                                {voice.isListening && secaoAtivaParaVoz === secao.tempId ? (
                                                    <><MicOff className="w-3 h-3 mr-1" />Parar Voz</>
                                                ) : (
                                                    <><Mic className="w-3 h-3 mr-1" />Capturar por Voz</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Drop zone para soltar pendências nesta seção */}
                                    <DropZone id={`drop-zone-secao-${secao.tempId}`} label="Arraste pendências aqui" />

                                    {secao.pendencias.length > 0 && (
                                        <SortableContext items={secao.pendencias.map(p => p.tempId)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-3 mb-6">
                                            {secao.pendencias.map((pendencia, pIdx) => {
                                                globalPendenciaCounter++;
                                                return (
                                                    <DraggablePendencia key={pendencia.tempId} id={pendencia.tempId} isSelected={selectedPendencias.has(pendencia.tempId)}>
                                                    <div className="bg-gray-900 border border-gray-600 rounded-sm overflow-hidden mb-4 shadow-sm">
                                                        {/* Row 1: Número e Campos de Texto */}
                                                        <div className="flex border-b border-gray-600 min-h-[5rem]">
                                                            {/* Coluna do Número + Setas + Checkbox */}
                                                            <div className="w-[8%] min-w-[3.5rem] bg-indigo-900/30 flex flex-col items-center justify-center border-r border-gray-600 gap-0.5 py-1">
                                                                <button
                                                                    onClick={() => toggleSelectPendencia(pendencia.tempId)}
                                                                    className={`w-5 h-5 rounded border flex items-center justify-center mb-0.5 ${
                                                                        selectedPendencias.has(pendencia.tempId)
                                                                            ? 'bg-indigo-500 border-indigo-400'
                                                                            : 'border-gray-500 hover:border-gray-300'
                                                                    }`}
                                                                    title="Selecionar"
                                                                >
                                                                    {selectedPendencias.has(pendencia.tempId) && <Check className="w-3 h-3 text-white" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMovePendenciaUp(secao.tempId, pendencia.tempId)}
                                                                    disabled={pIdx === 0}
                                                                    className="text-gray-400 hover:text-white disabled:text-gray-700 p-0.5"
                                                                    title="Mover para cima"
                                                                >
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <span className="text-2xl font-bold text-white leading-none">
                                                                    {globalPendenciaCounter}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleMovePendenciaDown(secao.tempId, pendencia.tempId)}
                                                                    disabled={pIdx === secao.pendencias.length - 1}
                                                                    className="text-gray-400 hover:text-white disabled:text-gray-700 p-0.5"
                                                                    title="Mover para baixo"
                                                                >
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>

                                                            {/* Coluna dos Campos */}
                                                            <div className="flex-1 p-3 space-y-2 relative">
                                                                <div className="absolute top-1 right-1 flex gap-1 z-10">
                                                                    <Button
                                                                        onClick={() => setPendenciaParaMover({
                                                                            secaoTempId: secao.tempId,
                                                                            pendenciaTempId: pendencia.tempId,
                                                                            pendenciaLabel: `#${globalPendenciaCounter} ${pendencia.local || pendencia.descricao || ''}`.trim().slice(0, 40),
                                                                        })}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
                                                                        title="Mover para outra seção"
                                                                    >
                                                                        <MoveRight className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleDeletePendencia(secao.tempId, pendencia.tempId)}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-500 hover:text-red-400 h-6 w-6 p-0"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <Label className="text-gray-300 font-bold whitespace-nowrap w-20 text-right">Local:</Label>
                                                                    <Input
                                                                        value={pendencia.local}
                                                                        onChange={(e) => handleUpdatePendencia(secao.tempId, pendencia.tempId, 'local', e.target.value)}
                                                                        className="bg-gray-800 border-gray-600 text-white h-8 flex-1 focus:border-blue-500 transition-colors"
                                                                    />
                                                                </div>
                                                                <div className="flex items-start gap-2">
                                                                    <Label className="text-gray-300 font-bold whitespace-nowrap w-20 text-right mt-1.5">Pendência:</Label>
                                                                    <Textarea
                                                                        value={pendencia.descricao}
                                                                        onChange={(e) => handleUpdatePendencia(secao.tempId, pendencia.tempId, 'descricao', e.target.value)}
                                                                        rows={2}
                                                                        className="bg-gray-800 border-gray-600 text-white flex-1 resize-y min-h-[50px] focus:border-blue-500 transition-colors"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Fotos */}
                                                        <div className="flex h-64">
                                                            {/* Coluna da Foto ANTES (50%) */}
                                                            <div className="w-1/2 border-r border-gray-600 p-2 flex items-center justify-center bg-gray-900 relative">
                                                                {!pendencia.preview && !pendencia.foto_url ? (
                                                                    <div className="text-center w-full h-full flex items-center">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleFotoChange(secao.tempId, pendencia.tempId, e)}
                                                                            className="hidden"
                                                                            id={`foto-${pendencia.tempId}`}
                                                                        />
                                                                        <Button
                                                                            onClick={() => document.getElementById(`foto-${pendencia.tempId}`)?.click()}
                                                                            variant="ghost"
                                                                            className="w-full h-full border-2 border-dashed border-gray-700 hover:border-indigo-500 hover:bg-indigo-900/10 text-gray-500 hover:text-indigo-400 transition-all"
                                                                        >
                                                                            <div className="flex flex-col items-center">
                                                                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                                                <span>Foto Antes</span>
                                                                            </div>
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative w-full h-full flex items-center justify-center p-1">
                                                                        <img
                                                                            src={pendencia.preview || pendencia.foto_url || ''}
                                                                            alt="Preview"
                                                                            className="w-full h-full object-cover rounded shadow-lg"
                                                                        />
                                                                        <div className="absolute top-2 right-2 flex gap-1">
                                                                            <Button
                                                                                onClick={() => handleOpenImageEditor(
                                                                                    secao.tempId,
                                                                                    pendencia.tempId,
                                                                                    pendencia.preview || pendencia.foto_url || '',
                                                                                    'antes'
                                                                                )}
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0 bg-purple-600 text-white shadow-xl hover:bg-purple-500"
                                                                                title="Editar com marcações"
                                                                            >
                                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleFotoChange(secao.tempId, pendencia.tempId, e)}
                                                                                className="hidden"
                                                                                id={`edit-foto-${pendencia.tempId}`}
                                                                            />
                                                                            <Button
                                                                                onClick={() => document.getElementById(`edit-foto-${pendencia.tempId}`)?.click()}
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0 bg-blue-600 text-white shadow-xl hover:bg-blue-500"
                                                                                title="Trocar foto"
                                                                            >
                                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => handleDeleteFotoImediato(secao.tempId, pendencia.tempId, 'antes')}
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 bg-red-600 text-white shadow-xl hover:bg-red-500 border-2 border-red-400"
                                                                                title="Remover foto antes"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Coluna da Foto DEPOIS (50%) */}
                                                            <div className="w-1/2 p-2 flex items-center justify-center bg-gray-900 relative">
                                                                {!pendencia.previewDepois && !pendencia.foto_depois_url ? (
                                                                    <div className="text-center w-full h-full flex items-center">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleFotoDepoisChange(secao.tempId, pendencia.tempId, e)}
                                                                            className="hidden"
                                                                            id={`foto-depois-${pendencia.tempId}`}
                                                                        />
                                                                        <Button
                                                                            onClick={() => document.getElementById(`foto-depois-${pendencia.tempId}`)?.click()}
                                                                            variant="ghost"
                                                                            className="w-full h-full border-2 border-dashed border-gray-700 hover:border-emerald-500 hover:bg-emerald-900/10 text-gray-500 hover:text-emerald-400 transition-all"
                                                                        >
                                                                            <div className="flex flex-col items-center">
                                                                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                                                <span>Foto Depois</span>
                                                                            </div>
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative w-full h-full flex items-center justify-center p-1">
                                                                        <img
                                                                            src={pendencia.previewDepois || pendencia.foto_depois_url || ''}
                                                                            alt="Preview Depois"
                                                                            className="w-full h-full object-cover rounded shadow-lg"
                                                                        />
                                                                        <div className="absolute top-2 right-2 flex gap-1">
                                                                            <Button
                                                                                onClick={() => handleOpenImageEditor(
                                                                                    secao.tempId,
                                                                                    pendencia.tempId,
                                                                                    pendencia.previewDepois || pendencia.foto_depois_url || '',
                                                                                    'depois'
                                                                                )}
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0 bg-purple-600 text-white shadow-xl hover:bg-purple-500"
                                                                                title="Editar com marcações"
                                                                            >
                                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleFotoDepoisChange(secao.tempId, pendencia.tempId, e)}
                                                                                className="hidden"
                                                                                id={`edit-foto-depois-${pendencia.tempId}`}
                                                                            />
                                                                            <Button
                                                                                onClick={() => document.getElementById(`edit-foto-depois-${pendencia.tempId}`)?.click()}
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0 bg-emerald-600 text-white shadow-xl hover:bg-emerald-500"
                                                                                title="Trocar foto"
                                                                            >
                                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => handleDeleteFotoImediato(secao.tempId, pendencia.tempId, 'depois')}
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 bg-red-600 text-white shadow-xl hover:bg-red-500 border-2 border-red-400"
                                                                                title="Remover foto depois"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    </DraggablePendencia>
                                                );
                                            })}
                                        </div>
                                        </SortableContext>
                                    )}
                                </div>

                                {/* SUBSEÇÕES (agora renderizadas DEPOIS das pendências da seção) */}
                                <div className="bg-indigo-900/10 border border-indigo-700/30 rounded-lg p-4 space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-indigo-300 font-semibold text-base uppercase tracking-wider">Subseções ({(secao.subsecoes || []).length})</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleAddSubsecao(secao.tempId, 'MANUAL')}
                                                variant="outline"
                                                size="sm"
                                                className="text-indigo-400 border-indigo-600 hover:bg-indigo-900/30 font-bold"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Subseção Manual
                                            </Button>
                                            <Button
                                                onClick={() => handleAddSubsecao(secao.tempId, 'CONSTATACAO')}
                                                variant="outline"
                                                size="sm"
                                                className="text-amber-400 border-amber-600 hover:bg-amber-900/30 font-bold"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Constatação
                                            </Button>
                                        </div>
                                    </div>

                                    {(secao.subsecoes || []).length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-6 italic">
                                            Nenhuma subseção cadastrada.
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {(secao.subsecoes || []).map((subsecao, subIdx) => (
                                                <div key={subsecao.tempId} className="bg-gray-800 border border-indigo-600/30 rounded-md overflow-hidden shadow-md">
                                                    <div className="bg-indigo-900/20 px-3 py-2 border-b border-indigo-600/20 flex justify-between items-center font-bold">
                                                        <span className="text-indigo-300">
                                                            Subseção {String.fromCharCode(65 + subIdx)} (VIII.{secao.ordem + 1}{String.fromCharCode(65 + subIdx)})
                                                        </span>
                                                        <Button
                                                            onClick={() => handleDeleteSubsecao(secao.tempId, subsecao.tempId)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-7 w-7 p-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="p-3 space-y-4">
                                                        <Input
                                                            value={subsecao.titulo}
                                                            onChange={(e) => handleUpdateSubsecao(secao.tempId, subsecao.tempId, 'titulo', e.target.value)}
                                                            placeholder="Título da subseção (Ex: 22º PAVIMENTO)"
                                                            className="bg-gray-900 border-gray-700 text-white font-semibold"
                                                        />

                                                        {/* CONSTATAÇÃO: Grid de Fotos */}
                                                        {subsecao.tipo === 'CONSTATACAO' && (
                                                            <div className="bg-amber-900/10 border border-amber-700/30 rounded-md p-3 space-y-3">
                                                                <Label className="text-amber-300 font-semibold text-sm">Constatação (Múltiplas Fotos)</Label>

                                                                <Textarea
                                                                    value={subsecao.descricao_constatacao || ''}
                                                                    onChange={(e) => handleUpdateSubsecao(secao.tempId, subsecao.tempId, 'descricao_constatacao', e.target.value)}
                                                                    placeholder="Descrição da constatação (opcional)"
                                                                    className="bg-gray-900 border-gray-700 text-white min-h-[60px]"
                                                                />

                                                                {/* Upload de múltiplas fotos */}
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    onChange={(e) => handleFotosConstatacao(secao.tempId, subsecao.tempId, e)}
                                                                    className="hidden"
                                                                    id={`constatacao-fotos-${subsecao.tempId}`}
                                                                />
                                                                <Button
                                                                    onClick={() => document.getElementById(`constatacao-fotos-${subsecao.tempId}`)?.click()}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full text-amber-400 border-amber-700 hover:bg-amber-900/30"
                                                                >
                                                                    <ImageIcon className="w-4 h-4 mr-2" />
                                                                    Adicionar Fotos ({(subsecao.fotos_constatacao_previews || []).length})
                                                                </Button>

                                                                {/* Grid de fotos 2x2 */}
                                                                {(subsecao.fotos_constatacao_previews || []).length > 0 && (
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {(subsecao.fotos_constatacao_previews || []).map((preview, idx) => (
                                                                            <div key={idx} className="relative aspect-square bg-gray-900 rounded border border-amber-700/30 overflow-hidden group">
                                                                                <img
                                                                                    src={preview}
                                                                                    alt={`Foto ${idx + 1}`}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <Button
                                                                                        onClick={() => handleOpenImageEditorConstatacao(secao.tempId, subsecao.tempId, idx, preview)}
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-6 w-6 p-0 bg-purple-600/80 hover:bg-purple-600 text-white"
                                                                                        title="Editar com marcações"
                                                                                    >
                                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        onClick={() => handleRemoveFotoConstatacao(secao.tempId, subsecao.tempId, idx)}
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-6 w-6 p-0 bg-red-500/80 hover:bg-red-600 text-white"
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                                                                    {idx + 1}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Pendências da Subseção (só para tipo MANUAL) */}
                                                        {subsecao.tipo !== 'CONSTATACAO' && (
                                                        <div className="pt-2">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <Label className="text-gray-400 text-sm font-medium">Pendências da Subseção ({subsecao.pendencias.length})</Label>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*"
                                                                        onChange={(e) => handleBulkPhotosSubsecao(secao.tempId, subsecao.tempId, e)}
                                                                        className="hidden"
                                                                        id={`bulk-photos-${subsecao.tempId}`}
                                                                    />
                                                                    <Button
                                                                        onClick={() => document.getElementById(`bulk-photos-${subsecao.tempId}`)?.click()}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-blue-400 h-7 text-xs border-blue-800 hover:bg-blue-900/20"
                                                                    >
                                                                        <ImageIcon className="w-3.5 h-3.5 mr-1" />
                                                                        Fotos
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleAddPendenciaSubsecao(secao.tempId, subsecao.tempId)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-emerald-400 h-7 text-xs border-emerald-800 hover:bg-emerald-900/20"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                                                        Adicionar
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setSecaoAtivaParaVoz(secao.tempId);
                                                                            setSubsecaoAtivaParaVoz(subsecao.tempId);
                                                                            if (voice.isListening) {
                                                                                voice.stopListening();
                                                                            } else {
                                                                                voice.startListening();
                                                                            }
                                                                        }}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className={voice.isListening && subsecaoAtivaParaVoz === subsecao.tempId ? "text-red-400 border-red-400 h-7 text-xs" : "text-purple-400 h-7 text-xs border-purple-800 hover:bg-purple-900/20"}
                                                                        disabled={!voice.isSupported}
                                                                    >
                                                                        {voice.isListening && subsecaoAtivaParaVoz === subsecao.tempId ? (
                                                                            <><MicOff className="w-3 h-3 mr-1" />Parar</>
                                                                        ) : (
                                                                            <><Mic className="w-3 h-3 mr-1" />Voz</>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Drop zone para subseção */}
                                                            <DropZone id={`drop-zone-sub-${subsecao.tempId}`} label="Arraste pendências aqui" />

                                                            {subsecao.pendencias.length === 0 ? (
                                                                <p className="text-xs text-gray-500 text-center py-4 border border-dashed border-gray-700 rounded bg-gray-900/50">Nenhuma pendência na subseção</p>
                                                            ) : (
                                                                <SortableContext items={subsecao.pendencias.map(p => p.tempId)} strategy={verticalListSortingStrategy}>
                                                                <div className="space-y-3">
                                                                    {subsecao.pendencias.map((pend, pIdx) => {
                                                                        globalPendenciaCounter++;
                                                                        return (
                                                                            <DraggablePendencia key={pend.tempId} id={pend.tempId} isSelected={selectedPendencias.has(pend.tempId)}>
                                                                            <div className="bg-gray-900 border border-gray-700 rounded-sm overflow-hidden shadow-sm">
                                                                                <div className="flex min-h-[4rem] border-b border-gray-700">
                                                                                    <div className="w-[8%] min-w-[3rem] bg-indigo-900/20 flex flex-col items-center justify-center border-r border-gray-700 gap-0.5 py-1">
                                                                                        <button
                                                                                            onClick={() => toggleSelectPendencia(pend.tempId)}
                                                                                            className={`w-4 h-4 rounded border flex items-center justify-center mb-0.5 ${
                                                                                                selectedPendencias.has(pend.tempId)
                                                                                                    ? 'bg-indigo-500 border-indigo-400'
                                                                                                    : 'border-gray-500 hover:border-gray-300'
                                                                                            }`}
                                                                                            title="Selecionar"
                                                                                        >
                                                                                            {selectedPendencias.has(pend.tempId) && <Check className="w-2.5 h-2.5 text-white" />}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleMovePendenciaSubUp(secao.tempId, subsecao.tempId, pend.tempId)}
                                                                                            disabled={pIdx === 0}
                                                                                            className="text-gray-400 hover:text-white disabled:text-gray-700 p-0.5"
                                                                                            title="Mover para cima"
                                                                                        >
                                                                                            <ArrowUp className="w-3 h-3" />
                                                                                        </button>
                                                                                        <span className="font-bold text-lg text-indigo-300 leading-none">
                                                                                            {globalPendenciaCounter}
                                                                                        </span>
                                                                                        <button
                                                                                            onClick={() => handleMovePendenciaSubDown(secao.tempId, subsecao.tempId, pend.tempId)}
                                                                                            disabled={pIdx === subsecao.pendencias.length - 1}
                                                                                            className="text-gray-400 hover:text-white disabled:text-gray-700 p-0.5"
                                                                                            title="Mover para baixo"
                                                                                        >
                                                                                            <ArrowDown className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="flex-1 p-2 space-y-2 relative">
                                                                                        <div className="absolute top-1 right-1 flex gap-1 z-10">
                                                                                            <Button
                                                                                                onClick={() => setPendenciaParaMover({
                                                                                                    secaoTempId: secao.tempId,
                                                                                                    subsecaoTempId: subsecao.tempId,
                                                                                                    pendenciaTempId: pend.tempId,
                                                                                                    pendenciaLabel: `#${globalPendenciaCounter} ${pend.local || pend.descricao || ''}`.trim().slice(0, 40),
                                                                                                })}
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="text-blue-400 hover:text-blue-300 h-5 w-5 p-0"
                                                                                                title="Mover para outra seção"
                                                                                            >
                                                                                                <MoveRight className="w-3.5 h-3.5" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                onClick={() => handleDeletePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId)}
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="text-red-500 h-5 w-5 p-0"
                                                                                            >
                                                                                                <X className="w-3.5 h-3.5" />
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Label className="text-gray-400 text-[10px] font-bold uppercase w-12 text-right">Local:</Label>
                                                                                            <Input
                                                                                                value={pend.local}
                                                                                                onChange={(e) => handleUpdatePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId, 'local', e.target.value)}
                                                                                                className="bg-gray-800 border-gray-700 h-7 text-xs text-white flex-1"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex items-start gap-2">
                                                                                            <Label className="text-gray-400 text-[10px] font-bold uppercase w-12 text-right mt-1.5">Item:</Label>
                                                                                            <Textarea
                                                                                                value={pend.descricao}
                                                                                                onChange={(e) => handleUpdatePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId, 'descricao', e.target.value)}
                                                                                                rows={1}
                                                                                                className="bg-gray-800 border-gray-700 text-xs text-white flex-1 min-h-[32px] py-1"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex h-64 divide-x divide-gray-700">
                                                                                    <div className="w-1/2 relative bg-black/10">
                                                                                        {!pend.preview && !pend.foto_url ? (
                                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                                <input type="file" accept="image/*" onChange={(e) => handleFotoChangeSubsecao(secao.tempId, subsecao.tempId, pend.tempId, e)} className="hidden" id={`foto-sub-${pend.tempId}`} />
                                                                                                <Button onClick={() => document.getElementById(`foto-sub-${pend.tempId}`)?.click()} variant="ghost" className="w-full h-full text-xs text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/10 border-2 border-dashed border-gray-700">
                                                                                                    <ImageIcon className="w-6 h-6 mr-1 opacity-40" />
                                                                                                    Antes
                                                                                                </Button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="w-full h-full p-1 relative">
                                                                                                <img src={pend.preview || pend.foto_url || ''} className="w-full h-full object-cover rounded-sm" />
                                                                                                <div className="absolute top-1 right-1 flex gap-1">
                                                                                                    <Button
                                                                                                        onClick={() => handleOpenImageEditor(
                                                                                                            secao.tempId,
                                                                                                            pend.tempId,
                                                                                                            pend.preview || pend.foto_url || '',
                                                                                                            'antes',
                                                                                                            subsecao.tempId
                                                                                                        )}
                                                                                                        variant="secondary"
                                                                                                        size="sm"
                                                                                                        className="h-6 w-6 p-0 bg-purple-600/80 hover:bg-purple-600 text-white"
                                                                                                        title="Editar com marcações"
                                                                                                    >
                                                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        onClick={() => handleDeleteFotoImediato(secao.tempId, pend.tempId, 'antes', subsecao.tempId)}
                                                                                                        variant="secondary"
                                                                                                        size="sm"
                                                                                                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-500 text-white border-2 border-red-400"
                                                                                                        title="Remover foto antes"
                                                                                                    >
                                                                                                        <Trash2 className="w-4 h-4" />
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="w-1/2 relative bg-black/10">
                                                                                        {!pend.previewDepois && !pend.foto_depois_url ? (
                                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                                <input type="file" accept="image/*" onChange={(e) => handleFotoDepoisChangeSubsecao(secao.tempId, subsecao.tempId, pend.tempId, e)} className="hidden" id={`foto-depois-sub-${pend.tempId}`} />
                                                                                                <Button onClick={() => document.getElementById(`foto-depois-sub-${pend.tempId}`)?.click()} variant="ghost" className="w-full h-full text-xs text-gray-500 hover:text-emerald-400 hover:bg-emerald-900/10 border-2 border-dashed border-gray-700">
                                                                                                    <ImageIcon className="w-6 h-6 mr-1 opacity-40" />
                                                                                                    Depois
                                                                                                </Button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="w-full h-full p-1 relative">
                                                                                                <img src={pend.previewDepois || pend.foto_depois_url || ''} className="w-full h-full object-cover rounded-sm" />
                                                                                                <div className="absolute top-1 right-1 flex gap-1">
                                                                                                    <Button
                                                                                                        onClick={() => handleOpenImageEditor(
                                                                                                            secao.tempId,
                                                                                                            pend.tempId,
                                                                                                            pend.previewDepois || pend.foto_depois_url || '',
                                                                                                            'depois',
                                                                                                            subsecao.tempId
                                                                                                        )}
                                                                                                        variant="secondary"
                                                                                                        size="sm"
                                                                                                        className="h-6 w-6 p-0 bg-purple-600/80 hover:bg-purple-600 text-white"
                                                                                                        title="Editar com marcações"
                                                                                                    >
                                                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        onClick={() => handleDeleteFotoImediato(secao.tempId, pend.tempId, 'depois', subsecao.tempId)}
                                                                                                        variant="secondary"
                                                                                                        size="sm"
                                                                                                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-500 text-white border-2 border-red-400"
                                                                                                        title="Remover foto depois"
                                                                                                    >
                                                                                                        <Trash2 className="w-4 h-4" />
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            </DraggablePendencia>
                                                                        );
                                                                    })}
                                                                </div>
                                                                </SortableContext>
                                                            )}
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        </DraggableSecao>
                    ))}
                    </SortableContext>
                    );
                })()}

                {secoes.length > 0 && (
                    <div className="flex flex-col gap-6 pt-8 pb-12 border-t border-gray-700 mt-8">
                        <Button
                            onClick={handleAddSecao}
                            variant="outline"
                            className="w-full py-8 border-dashed border-2 border-blue-900/50 hover:border-blue-500 hover:bg-blue-900/10 text-blue-400 font-bold text-lg transition-all"
                        >
                            <Plus className="w-6 h-6 mr-2" />
                            Adicionar Nova Seção
                        </Button>

                        {offlinePendingCount > 0 && (
                            <Button
                                onClick={handleSyncOffline}
                                className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base shadow-lg"
                                disabled={syncingOffline}
                            >
                                <RefreshCw className={`w-5 h-5 mr-2 ${syncingOffline ? 'animate-spin' : ''}`} />
                                {syncingOffline
                                    ? 'Sincronizando...'
                                    : `Sincronizar Tudo (${offlinePendingCount} pendente${offlinePendingCount > 1 ? 's' : ''})`
                                }
                            </Button>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={onCancel}
                                variant="outline"
                                className="flex-1 py-6 text-gray-400 border-gray-700 hover:bg-gray-800"
                                disabled={isSaving}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-[2] py-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg hover:shadow-green-900/20"
                                disabled={isSaving}
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {isSaving ? 'Salvando...' : 'Salvar Relatório'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay do item sendo arrastado */}
            <DragOverlay>
                {activeDragPendencia && (
                    <div className="bg-indigo-900/80 border-2 border-indigo-400 rounded-md px-4 py-3 shadow-2xl text-white text-sm max-w-sm">
                        <span className="font-bold">
                            {activeDragPendencia.local || activeDragPendencia.descricao || 'Pendência'}
                        </span>
                        {selectedPendencias.size > 1 && selectedPendencias.has(activeDragPendencia.tempId) && (
                            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                +{selectedPendencias.size - 1}
                            </span>
                        )}
                    </div>
                )}
            </DragOverlay>
            </DndContext>

            {/* Modal do Image Editor */}
            {editingImage && (
                <ImageEditor
                    imageUrl={editingImage.imageUrl}
                    onSave={handleSaveEditedImage}
                    onCancel={() => setEditingImage(null)}
                />
            )}

            {/* Modal Mover Pendência(s) para outra seção/subseção */}
            {pendenciaParaMover && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setPendenciaParaMover(null); }}>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-semibold text-lg">
                                {selectedPendencias.size > 1 ? `Mover ${selectedPendencias.size} Pendências` : 'Mover Pendência'}
                            </h3>
                            <button onClick={() => setPendenciaParaMover(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {selectedPendencias.size > 1
                                ? <span className="text-white font-medium">{selectedPendencias.size} pendências selecionadas</span>
                                : <>Movendo: <span className="text-white font-medium">{pendenciaParaMover.pendenciaLabel}</span></>
                            }
                        </p>
                        <p className="text-gray-500 text-xs mb-3">Selecione o destino:</p>
                        <div className="space-y-2">
                            {secoes.map(secao => {
                                const isOrigem = secao.tempId === pendenciaParaMover.secaoTempId && !pendenciaParaMover.subsecaoTempId;
                                return (
                                    <div key={secao.tempId}>
                                        {/* Seção como destino (se não tem subseções ou se pendências diretas são permitidas) */}
                                        {!secao.tem_subsecoes && (
                                            <button
                                                onClick={() => selectedPendencias.size > 1 ? handleMoverSelecionadas(secao.tempId) : handleMoverPendencia(secao.tempId)}
                                                disabled={isOrigem}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                                                    isOrigem
                                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gray-700/50 text-white hover:bg-indigo-900/40 hover:border-indigo-500 border border-transparent'
                                                }`}
                                            >
                                                <span className="font-medium">VIII.{secao.ordem + 1}</span> - {secao.titulo_principal || 'Sem título'}
                                                {isOrigem && <span className="text-xs ml-2 text-gray-500">(atual)</span>}
                                            </button>
                                        )}
                                        {/* Seção com subseções */}
                                        {secao.tem_subsecoes && (
                                            <div>
                                                <p className="text-gray-400 text-xs font-semibold px-3 py-1.5 bg-gray-900/50 rounded-t-md">
                                                    VIII.{secao.ordem + 1} - {secao.titulo_principal || 'Sem título'}
                                                </p>
                                                <div className="pl-4 space-y-1 py-1">
                                                    {(secao.subsecoes || []).filter(sub => sub.tipo !== 'CONSTATACAO').map((sub, subIdx) => {
                                                        const isOrigemSub = secao.tempId === pendenciaParaMover.secaoTempId && sub.tempId === pendenciaParaMover.subsecaoTempId;
                                                        return (
                                                            <button
                                                                key={sub.tempId}
                                                                onClick={() => selectedPendencias.size > 1 ? handleMoverSelecionadas(secao.tempId, sub.tempId) : handleMoverPendencia(secao.tempId, sub.tempId)}
                                                                disabled={isOrigemSub}
                                                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                                                                    isOrigemSub
                                                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-gray-700/30 text-gray-300 hover:bg-indigo-900/30 hover:text-white border border-transparent'
                                                                }`}
                                                            >
                                                                {String.fromCharCode(65 + subIdx)}. {sub.titulo || 'Sem título'}
                                                                {isOrigemSub && <span className="text-xs ml-2 text-gray-500">(atual)</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
