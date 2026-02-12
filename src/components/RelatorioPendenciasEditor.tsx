import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, X, GripVertical, Trash2, Image as ImageIcon, Loader2, ArrowLeft, Mic, MicOff, Edit3 } from 'lucide-react';
import { Contrato, RelatorioPendencias as RelatorioPendenciasType } from '@/types';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { useVoiceCapture } from '@/hooks/useVoiceCapture';
import { ImageEditor } from '@/components/ImageEditor';

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
                setSecoes(secoes.map(s => {
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
                setSecoes(secoes.map(s => {
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

    // Função para converter número para romano
    const toRoman = (num: number): string => {
        const romanNumerals: [number, string][] = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
            [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
        ];
        let result = '';
        for (const [value, numeral] of romanNumerals) {
            while (num >= value) {
                result += numeral;
                num -= value;
            }
        }
        return result;
    };

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
        setSecoes(secoes.map(s => s.tempId === tempId ? ({ ...s, [field]: value } as SecaoLocal) : s));
    };

    const handleDeleteSecao = (tempId: string) => {
        setSecoes(secoes.filter(s => s.tempId !== tempId).map((s, idx) => ({ ...s, ordem: idx })));
    };

    // ==================== FUNÇÕES PARA SUBSEÇÕES ====================
    const handleAddSubsecao = (secaoTempId: string, tipo: 'MANUAL' | 'CONSTATACAO' = 'MANUAL') => {
        setSecoes(secoes.map(s => {
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
        setSecoes(secoes.map(s => {
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
        setSecoes(secoes.map(s => {
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

        setSecoes(secoes.map(s => {
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
        setSecoes(secoes.map(s => {
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
        setSecoes(secoes.map(s => {
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
        setSecoes(secoes.map(s => {
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
        setSecoes(secoes.map(s => {
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
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'file', file);
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'preview', URL.createObjectURL(file));
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

            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'fileDepois', file);
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'previewDepois', URL.createObjectURL(file));
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'data_recebimento', dataRecebimento);
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'status', 'RECEBIDO');
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

        // Atualizar state local imediatamente
        if (subsecaoTempId) {
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, previewCampo as keyof PendenciaLocal, null);
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, fileCampo as keyof PendenciaLocal, undefined);
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, campo as keyof PendenciaLocal, null);
        } else {
            handleUpdatePendencia(secaoTempId, pendenciaTempId, previewCampo as keyof PendenciaLocal, null);
            handleUpdatePendencia(secaoTempId, pendenciaTempId, fileCampo as keyof PendenciaLocal, undefined);
            handleUpdatePendencia(secaoTempId, pendenciaTempId, campo as keyof PendenciaLocal, null);
        }

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
        setSecoes(secoes.map(s => {
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

        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    pendencias: s.pendencias.map(p => {
                        if (p.tempId === pendenciaTempId) {
                            const updated = { ...p, [field]: value };
                            console.log(`   ✅ Pendência atualizada:`, {
                                tempId: updated.tempId,
                                fileDepois: updated.fileDepois?.name || 'n/a',
                                previewDepois: updated.previewDepois || 'n/a',
                                foto_depois_url: updated.foto_depois_url || 'n/a',
                            });
                            return updated;
                        }
                        return p;
                    }),
                };
            }
            return s;
        }));
    };

    const handleDeletePendencia = (secaoTempId: string, pendenciaTempId: string) => {
        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    pendencias: s.pendencias.filter(p => p.tempId !== pendenciaTempId).map((p, idx) => ({ ...p, ordem: idx })),
                };
            }
            return s;
        }));
    };

    const handleFotoChange = (secaoTempId: string, pendenciaTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpdatePendencia(secaoTempId, pendenciaTempId, 'file', file);
            handleUpdatePendencia(secaoTempId, pendenciaTempId, 'preview', URL.createObjectURL(file));
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
            setSecoes(secoes.map(s => {
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
            setSecoes(secoes.map(s => {
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
            setSecoes(secoes.map(s => {
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
            setSecoes(secoes.map(s => {
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

        setSecoes(secoes.map(s => {
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

        setSecoes(secoes.map(s => {
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
                        await relatorioPendenciasService.createPendencia({
                            secao_id: secaoId,
                            ...pendenciaData,
                        });
                    }
                }

                // Salvar subseções (se existirem)
                if (secao.subsecoes && secao.subsecoes.length > 0) {
                    for (const subsecao of secao.subsecoes) {
                        let subsecaoId = subsecao.id;

                        // Upload fotos de constatação (se for tipo CONSTATACAO)
                        // NOTE: Campos tipo, fotos_constatacao e descricao_constatacao não existem no banco ainda
                        // As fotos são enviadas mas não são salvas nos metadados da subseção
                        let fotosConstatacaoUrls: string[] = [];
                        if (subsecao.tipo === 'CONSTATACAO' && subsecao.fotos_constatacao_files) {
                            for (const file of subsecao.fotos_constatacao_files) {
                                const url = await relatorioPendenciasService.uploadFoto(file, relatorioId, `constatacao-${subsecao.tempId}-${Date.now()}`);
                                fotosConstatacaoUrls.push(url);
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
                                await relatorioPendenciasService.createPendencia({
                                    secao_id: secaoId,
                                    ...pendenciaData,
                                });
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
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Seções</h3>
                    <Button onClick={handleAddSecao} variant="outline" className="text-blue-400">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Seção
                    </Button>
                </div>

                {secoes.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="py-12 text-center text-gray-400">
                            <p>Nenhuma seção adicionada. Clique em "Adicionar Seção" para começar.</p>
                        </CardContent>
                    </Card>
                ) : (() => {
                    let globalPendenciaCounter = 0;

                    return secoes.map((secao) => (
                        <Card key={secao.tempId} className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <GripVertical className="w-5 h-5 text-gray-500" />
                                        Seção VIII.{secao.ordem + 1}
                                    </CardTitle>
                                    <Button
                                        onClick={() => handleDeleteSecao(secao.tempId)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
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

                                    {secao.pendencias.length > 0 && (
                                        <div className="space-y-3 mb-6">
                                            {secao.pendencias.map((pendencia, pIdx) => {
                                                globalPendenciaCounter++;
                                                return (
                                                    <div key={pendencia.tempId} className="bg-gray-900 border border-gray-600 rounded-sm overflow-hidden mb-4 shadow-sm">
                                                        {/* Row 1: Número e Campos de Texto */}
                                                        <div className="flex border-b border-gray-600 min-h-[5rem]">
                                                            {/* Coluna do Número */}
                                                            <div className="w-[8%] min-w-[3.5rem] bg-indigo-900/30 flex items-center justify-center border-r border-gray-600">
                                                                <span className="text-3xl font-bold text-white">
                                                                    {globalPendenciaCounter}
                                                                </span>
                                                            </div>

                                                            {/* Coluna dos Campos */}
                                                            <div className="flex-1 p-3 space-y-2 relative">
                                                                <Button
                                                                    onClick={() => handleDeletePendencia(secao.tempId, pendencia.tempId)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute top-1 right-1 text-red-500 hover:text-red-400 h-6 w-6 p-0 z-10"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>

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
                                                );
                                            })}
                                        </div>
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

                                                            {subsecao.pendencias.length === 0 ? (
                                                                <p className="text-xs text-gray-500 text-center py-4 border border-dashed border-gray-700 rounded bg-gray-900/50">Nenhuma pendência na subseção</p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {subsecao.pendencias.map((pend, pIdx) => {
                                                                        globalPendenciaCounter++;
                                                                        return (
                                                                            <div key={pend.tempId} className="bg-gray-900 border border-gray-700 rounded-sm overflow-hidden shadow-sm">
                                                                                <div className="flex min-h-[4rem] border-b border-gray-700">
                                                                                    <div className="w-[8%] min-w-[3rem] bg-indigo-900/20 flex items-center justify-center border-r border-gray-700 font-bold text-lg text-indigo-300">
                                                                                        {globalPendenciaCounter}
                                                                                    </div>
                                                                                    <div className="flex-1 p-2 space-y-2 relative">
                                                                                        <Button
                                                                                            onClick={() => handleDeletePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId)}
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="absolute top-1 right-1 text-red-500 h-5 w-5 p-0"
                                                                                        >
                                                                                            <X className="w-3.5 h-3.5" />
                                                                                        </Button>
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
                                                                        );
                                                                    })}
                                                                </div>
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
                    ));
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

            {/* Modal do Image Editor */}
            {editingImage && (
                <ImageEditor
                    imageUrl={editingImage.imageUrl}
                    onSave={handleSaveEditedImage}
                    onCancel={() => setEditingImage(null)}
                />
            )}
        </div >
    );
}
