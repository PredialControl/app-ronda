import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, X, GripVertical, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Contrato, RelatorioPendencias as RelatorioPendenciasType } from '@/types';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';

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
    pendencias: PendenciaLocal[];
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

    useEffect(() => {
        if (relatorio?.secoes) {
            const secoesLocal: SecaoLocal[] = relatorio.secoes.map((s, idx) => ({
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
                pendencias: (s.pendencias || []).map((p, pIdx) => ({
                    ...p,
                    tempId: `pend-${idx}-${pIdx}`,
                    // Garantir que preview seja setado com a URL do banco se existir
                    preview: p.foto_url || undefined,
                    previewDepois: p.foto_depois_url || undefined,
                })),
            }));
            setSecoes(secoesLocal);
        }
    }, [relatorio]);

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
    const handleAddSubsecao = (secaoTempId: string) => {
        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                const ordem = (s.subsecoes || []).length;
                const letra = String.fromCharCode(65 + ordem); // A, B, C...
                const newSubsecao: SubsecaoLocal = {
                    tempId: `subsecao-${Date.now()}`,
                    ordem: ordem,
                    titulo: `${letra} - `,
                    pendencias: [],
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

    const handleAddPendenciaSubsecao = (secaoTempId: string, subsecaoTempId: string) => {
        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    subsecoes: (s.subsecoes || []).map(sub => {
                        if (sub.tempId === subsecaoTempId) {
                            const extrairTexto = (texto: string) => {
                                const partes = texto.split('–');
                                return partes.length > 1 ? partes[1].trim() : texto.trim();
                            };

                            const tituloPrincipalLimpo = extrairTexto(s.titulo_principal);
                            const subtituloLimpo = extrairTexto(sub.titulo);
                            const localAutomatico = `${tituloPrincipalLimpo} - ${subtituloLimpo}`;

                            const newPendencia: PendenciaLocal = {
                                tempId: `pend-${Date.now()}`,
                                ordem: sub.pendencias.length,
                                local: localAutomatico,
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
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'fileDepois', file);
            handleUpdatePendenciaSubsecao(secaoTempId, subsecaoTempId, pendenciaTempId, 'previewDepois', URL.createObjectURL(file));
        }
    };

    // ==================== FIM FUNÇÕES PARA SUBSEÇÕES ====================

    const handleAddPendencia = (secaoTempId: string) => {
        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                // Remover numeração romana do local (extrair apenas o texto após "–")
                const extrairTexto = (texto: string) => {
                    const partes = texto.split('–');
                    return partes.length > 1 ? partes[1].trim() : texto.trim();
                };

                const tituloPrincipalLimpo = extrairTexto(s.titulo_principal);
                const subtituloLimpo = extrairTexto(s.subtitulo || '');
                const localAutomatico = `${tituloPrincipalLimpo} - ${subtituloLimpo}`;

                const newPendencia: PendenciaLocal = {
                    tempId: `pend-${Date.now()}`,
                    ordem: s.pendencias.length,
                    local: localAutomatico,
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
        console.log('🖼️ handleFotoDepoisChange chamado!');
        console.log('   - Seção:', secaoTempId);
        console.log('   - Pendência:', pendenciaTempId);
        console.log('   - Arquivo:', file);

        if (file) {
            console.log('   - Nome do arquivo:', file.name);
            console.log('   - Tamanho:', file.size, 'bytes');
            const blobUrl = URL.createObjectURL(file);
            console.log('   - Blob URL criada:', blobUrl);

            // IMPORTANTE: Atualizar fileDepois e previewDepois de uma vez só!
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
                                };
                            }
                            return p;
                        }),
                    };
                }
                return s;
            }));

            console.log('✅ fileDepois e previewDepois setados DE UMA VEZ!');
        } else {
            console.log('⚠️ Nenhum arquivo foi selecionado');
        }
    };

    const handleBulkPhotos = (secaoTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const secao = secoes.find(s => s.tempId === secaoTempId);
        if (!secao) return;

        // Remover numeração romana do local (extrair apenas o texto após "–")
        const extrairTexto = (texto: string) => {
            const partes = texto.split('–');
            return partes.length > 1 ? partes[1].trim() : texto.trim();
        };

        const tituloPrincipalLimpo = extrairTexto(secao.titulo_principal);
        const subtituloLimpo = extrairTexto(secao.subtitulo || '');
        const localAutomatico = `${tituloPrincipalLimpo} - ${subtituloLimpo}`;

        const newPendencias: PendenciaLocal[] = files.map((file, idx) => ({
            tempId: `pend-${Date.now()}-${idx}`,
            ordem: secao.pendencias.length + idx,
            local: localAutomatico,
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

        // Remover numeração romana do local (extrair apenas o texto após "–")
        const extrairTexto = (texto: string) => {
            const partes = texto.split('–');
            return partes.length > 1 ? partes[1].trim() : texto.trim();
        };

        const tituloPrincipalLimpo = extrairTexto(secao.titulo_principal);
        const subsecaoLimpo = extrairTexto(subsecao.titulo);
        const localAutomatico = `${tituloPrincipalLimpo} - ${subsecaoLimpo}`;

        const newPendencias: PendenciaLocal[] = files.map((file, idx) => ({
            tempId: `pend-${Date.now()}-${idx}`,
            ordem: subsecao.pendencias.length + idx,
            local: localAutomatico,
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

            // Save secoes and pendencias
            for (const secao of secoes) {
                let secaoId = secao.id;

                if (secaoId) {
                    await relatorioPendenciasService.updateSecao(secaoId, {
                        titulo_principal: secao.titulo_principal,
                        subtitulo: secao.subtitulo || '',
                        tem_subsecoes: secao.tem_subsecoes,
                        ordem: secao.ordem,
                    });
                } else {
                    const newSecao = await relatorioPendenciasService.createSecao({
                        relatorio_id: relatorioId,
                        titulo_principal: secao.titulo_principal,
                        subtitulo: secao.subtitulo || '',
                        tem_subsecoes: secao.tem_subsecoes,
                        ordem: secao.ordem,
                    });
                    secaoId = newSecao.id;
                }

                // Se TEM subseções, salvar subseções
                if (secao.tem_subsecoes && secao.subsecoes) {
                    for (const subsecao of secao.subsecoes) {
                        let subsecaoId = subsecao.id;

                        if (subsecaoId) {
                            await relatorioPendenciasService.updateSubsecao(subsecaoId, {
                                titulo: subsecao.titulo,
                                ordem: subsecao.ordem,
                            });
                        } else {
                            const newSubsecao = await relatorioPendenciasService.createSubsecao({
                                secao_id: secaoId,
                                titulo: subsecao.titulo,
                                ordem: subsecao.ordem,
                            });
                            subsecaoId = newSubsecao.id;
                        }

                        // Salvar pendências da subseção
                        for (const pendencia of subsecao.pendencias) {
                            let fotoUrl = pendencia.foto_url;
                            let fotoDepoisUrl = pendencia.foto_depois_url;

                            // Upload foto ANTES
                            if (pendencia.file) {
                                fotoUrl = await relatorioPendenciasService.uploadFoto(pendencia.file, relatorioId, pendencia.tempId);
                            } else if (!pendencia.preview && !pendencia.foto_url) {
                                fotoUrl = null;
                            }

                            // Upload foto DEPOIS
                            if (pendencia.fileDepois) {
                                fotoDepoisUrl = await relatorioPendenciasService.uploadFoto(pendencia.fileDepois, relatorioId, `${pendencia.tempId}-depois`);
                            } else if (!pendencia.previewDepois && !pendencia.foto_depois_url) {
                                fotoDepoisUrl = null;
                            }

                            const pendenciaData = {
                                local: pendencia.local,
                                descricao: pendencia.descricao,
                                foto_url: fotoUrl,
                                foto_depois_url: fotoDepoisUrl,
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
                } else {
                    // Se NÃO TEM subseções, salvar pendências diretas na seção
                    for (const pendencia of secao.pendencias) {
                    // Preservar URLs existentes se não houver novos arquivos
                    let fotoUrl = pendencia.foto_url;
                    let fotoDepoisUrl = pendencia.foto_depois_url;

                    console.log('💾 Salvando pendência:', {
                        id: pendencia.id,
                        tempId: pendencia.tempId,
                        foto_url_atual: pendencia.foto_url,
                        foto_depois_url_atual: pendencia.foto_depois_url,
                        tem_file: !!pendencia.file,
                        tem_fileDepois: !!pendencia.fileDepois,
                        preview: pendencia.preview,
                        previewDepois: pendencia.previewDepois,
                    });

                    // Upload new foto ANTES if file exists
                    if (pendencia.file) {
                        console.log('📤 Fazendo upload da foto ANTES...');
                        fotoUrl = await relatorioPendenciasService.uploadFoto(pendencia.file, relatorioId, pendencia.tempId);
                        console.log('✅ Foto ANTES salva:', fotoUrl);
                    } else if (pendencia.preview && pendencia.preview.startsWith('blob:')) {
                        // Se há preview mas não é URL do banco, significa que foi removida
                        console.log('⚠️ Preview blob detectado mas sem file - mantendo URL atual');
                    } else if (!pendencia.preview && !pendencia.foto_url) {
                        // Foi explicitamente removida
                        fotoUrl = null;
                        console.log('🗑️ Foto ANTES foi removida');
                    }

                    // Upload new foto DEPOIS if file exists
                    if (pendencia.fileDepois) {
                        console.log('📤 Fazendo upload da foto DEPOIS...');
                        fotoDepoisUrl = await relatorioPendenciasService.uploadFoto(pendencia.fileDepois, relatorioId, `${pendencia.tempId}-depois`);
                        console.log('✅ Foto DEPOIS salva:', fotoDepoisUrl);
                    } else if (pendencia.previewDepois && pendencia.previewDepois.startsWith('blob:')) {
                        // Se há preview mas não é URL do banco, significa que foi removida
                        console.log('⚠️ Preview blob DEPOIS detectado mas sem fileDepois - mantendo URL atual');
                    } else if (!pendencia.previewDepois && !pendencia.foto_depois_url) {
                        // Foi explicitamente removida
                        fotoDepoisUrl = null;
                        console.log('🗑️ Foto DEPOIS foi removida');
                    }

                    const pendenciaData = {
                        local: pendencia.local,
                        descricao: pendencia.descricao,
                        foto_url: fotoUrl,
                        foto_depois_url: fotoDepoisUrl,
                        ordem: pendencia.ordem,
                    };

                    console.log('💿 Salvando no banco:', pendenciaData);

                    if (pendencia.id) {
                        await relatorioPendenciasService.updatePendencia(pendencia.id, pendenciaData);
                        console.log('✅ Pendência atualizada no banco');
                    } else {
                        await relatorioPendenciasService.createPendencia({
                            secao_id: secaoId,
                            ...pendenciaData,
                        });
                        console.log('✅ Pendência criada no banco');
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
                ) : (
                    secoes.map((secao) => (
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

                                {/* CHECKBOX: Tem Subseções */}
                                <div className="bg-blue-900/20 border-2 border-blue-600/50 p-4 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id={`tem-subsecoes-${secao.tempId}`}
                                            checked={secao.tem_subsecoes}
                                            onChange={(e) => handleUpdateSecao(secao.tempId, 'tem_subsecoes', e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <Label htmlFor={`tem-subsecoes-${secao.tempId}`} className="text-blue-200 cursor-pointer font-semibold">
                                            ✨ Esta seção tem subseções (VIII.1A, VIII.1B, VIII.1C...)
                                        </Label>
                                    </div>
                                    <p className="text-xs text-blue-300/70 mt-2 ml-8">
                                        Marque esta opção se esta seção precisar de subdivisões (ex: diferentes pavimentos, áreas, etc.)
                                    </p>
                                </div>

                                {/* SUBSEÇÕES (se habilitado) */}
                                {secao.tem_subsecoes ? (
                                    <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-blue-300 font-semibold">Subseções ({(secao.subsecoes || []).length})</Label>
                                            <Button
                                                onClick={() => handleAddSubsecao(secao.tempId)}
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-400 border-blue-600 hover:bg-blue-900/30"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Adicionar Subseção
                                            </Button>
                                        </div>

                                        {(secao.subsecoes || []).length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                Nenhuma subseção. Clique em "Adicionar Subseção" para começar.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {(secao.subsecoes || []).map((subsecao, subIdx) => (
                                                    <div key={subsecao.tempId} className="bg-gray-800 border border-blue-600/30 rounded p-3">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <Label className="text-blue-300">
                                                                Subseção {String.fromCharCode(65 + subIdx)} (VIII.{secao.ordem + 1}{String.fromCharCode(65 + subIdx)})
                                                            </Label>
                                                            <Button
                                                                onClick={() => handleDeleteSubsecao(secao.tempId, subsecao.tempId)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <Input
                                                            value={subsecao.titulo}
                                                            onChange={(e) => handleUpdateSubsecao(secao.tempId, subsecao.tempId, 'titulo', e.target.value)}
                                                            placeholder="Ex: 22 PAVIMENTO"
                                                            className="bg-gray-900 border-gray-600 text-white mb-3"
                                                        />

                                                        {/* Pendências da Subseção */}
                                                        <div className="border-t border-blue-600/20 pt-3 mt-2">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <Label className="text-gray-400 text-sm">Pendências ({subsecao.pendencias.length})</Label>
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
                                                                        className="text-blue-400 h-7 text-xs"
                                                                    >
                                                                        <ImageIcon className="w-3 h-3 mr-1" />
                                                                        Várias Fotos
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleAddPendenciaSubsecao(secao.tempId, subsecao.tempId)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-green-400 h-7 text-xs"
                                                                    >
                                                                        <Plus className="w-3 h-3 mr-1" />
                                                                        Adicionar
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {subsecao.pendencias.length === 0 ? (
                                                                <p className="text-xs text-gray-500 text-center py-2">Nenhuma pendência</p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {subsecao.pendencias.map((pend, pIdx) => (
                                                                        <div key={pend.tempId} className="bg-gray-900 border border-gray-600 rounded p-2">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-white font-bold text-sm">{pIdx + 1}.</span>
                                                                                <Input
                                                                                    value={pend.local}
                                                                                    onChange={(e) => handleUpdatePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId, 'local', e.target.value)}
                                                                                    placeholder="Local"
                                                                                    className="bg-gray-800 border-gray-600 text-white h-7 text-sm flex-1"
                                                                                />
                                                                                <Button
                                                                                    onClick={() => handleDeletePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId)}
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-red-400 h-6 w-6 p-0"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                            <Textarea
                                                                                value={pend.descricao}
                                                                                onChange={(e) => handleUpdatePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId, 'descricao', e.target.value)}
                                                                                placeholder="Descrição da pendência"
                                                                                rows={2}
                                                                                className="bg-gray-800 border-gray-600 text-white text-sm resize-y mb-2"
                                                                            />

                                                                            {/* Fotos da Pendência da Subseção */}
                                                                            <div className="flex gap-2">
                                                                                <div className="flex-1">
                                                                                    <Label className="text-xs text-gray-400">Foto Antes</Label>
                                                                                    {!pend.preview && !pend.foto_url ? (
                                                                                        <div>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                onChange={(e) => handleFotoChangeSubsecao(secao.tempId, subsecao.tempId, pend.tempId, e)}
                                                                                                className="hidden"
                                                                                                id={`foto-sub-${pend.tempId}`}
                                                                                            />
                                                                                            <Button
                                                                                                onClick={() => document.getElementById(`foto-sub-${pend.tempId}`)?.click()}
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className="w-full h-20 text-xs"
                                                                                            >
                                                                                                <ImageIcon className="w-4 h-4 mr-1" />
                                                                                                Adicionar Foto
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="relative">
                                                                                            <img src={pend.preview || pend.foto_url || ''} alt="Preview" className="w-full h-20 object-cover rounded" />
                                                                                            <Button
                                                                                                onClick={() => handleUpdatePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId, 'preview', undefined)}
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="absolute top-0 right-0 text-red-400 h-6 w-6 p-0"
                                                                                            >
                                                                                                <X className="w-3 h-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex-1">
                                                                                    <Label className="text-xs text-gray-400">Foto Depois</Label>
                                                                                    {!pend.previewDepois && !pend.foto_depois_url ? (
                                                                                        <div>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                onChange={(e) => handleFotoDepoisChangeSubsecao(secao.tempId, subsecao.tempId, pend.tempId, e)}
                                                                                                className="hidden"
                                                                                                id={`foto-depois-sub-${pend.tempId}`}
                                                                                            />
                                                                                            <Button
                                                                                                onClick={() => document.getElementById(`foto-depois-sub-${pend.tempId}`)?.click()}
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className="w-full h-20 text-xs"
                                                                                            >
                                                                                                <ImageIcon className="w-4 h-4 mr-1" />
                                                                                                Adicionar Foto
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="relative">
                                                                                            <img src={pend.previewDepois || pend.foto_depois_url || ''} alt="Preview Depois" className="w-full h-20 object-cover rounded" />
                                                                                            <Button
                                                                                                onClick={() => handleUpdatePendenciaSubsecao(secao.tempId, subsecao.tempId, pend.tempId, 'previewDepois', undefined)}
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="absolute top-0 right-0 text-red-400 h-6 w-6 p-0"
                                                                                            >
                                                                                                <X className="w-3 h-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {/* Pendências (só aparecem se NÃO tiver subseções) */}
                                {!secao.tem_subsecoes && (
                                <div className="border-t border-gray-700 pt-4 mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <Label className="text-gray-300">Pendências ({secao.pendencias.length})</Label>
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
                                        </div>
                                    </div>

                                    {secao.pendencias.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            Nenhuma pendência adicionada
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {secao.pendencias.map((pendencia, pIdx) => (
                                                <div key={pendencia.tempId} className="bg-gray-900 border border-gray-600 rounded-sm overflow-hidden mb-4">
                                                    {/* Row 1: Número e Campos de Texto */}
                                                    <div className="flex border-b border-gray-600 min-h-[5rem]">
                                                        {/* Coluna do Número */}
                                                        <div className="w-[8%] min-w-[3.5rem] bg-gray-800 flex items-center justify-center border-r border-gray-600">
                                                            <span className="text-3xl font-bold text-white">
                                                                {pIdx + 1}
                                                            </span>
                                                        </div>

                                                        {/* Coluna dos Campos */}
                                                        <div className="flex-1 p-3 space-y-2 relative">
                                                            <Button
                                                                onClick={() => handleDeletePendencia(secao.tempId, pendencia.tempId)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute top-1 right-1 text-red-400 hover:text-red-300 h-6 w-6 p-0 z-10"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-gray-300 font-bold whitespace-nowrap w-20 text-right">Local:</Label>
                                                                <Input
                                                                    value={pendencia.local}
                                                                    onChange={(e) => handleUpdatePendencia(secao.tempId, pendencia.tempId, 'local', e.target.value)}
                                                                    className="bg-gray-800/50 border-gray-600 text-white h-8 flex-1"
                                                                />
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <Label className="text-gray-300 font-bold whitespace-nowrap w-20 text-right mt-1.5">Pendência:</Label>
                                                                <Textarea
                                                                    value={pendencia.descricao}
                                                                    onChange={(e) => handleUpdatePendencia(secao.tempId, pendencia.tempId, 'descricao', e.target.value)}
                                                                    rows={2}
                                                                    className="bg-gray-800/50 border-gray-600 text-white flex-1 resize-y"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Foto e Espaço Vazio */}
                                                    <div className="flex min-h-[10rem]">
                                                        {/* Coluna da Foto (50%) */}
                                                        <div className="w-1/2 border-r border-gray-600 p-2 flex items-center justify-center bg-black/20 relative">
                                                            {!pendencia.preview && !pendencia.foto_url ? (
                                                                <div className="text-center w-full">
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
                                                                        className="w-full h-full min-h-[8rem] border-2 border-dashed border-gray-600 hover:border-blue-500 hover:bg-gray-800/50 text-gray-400"
                                                                    >
                                                                        <div className="flex flex-col items-center">
                                                                            <ImageIcon className="w-8 h-8 mb-2" />
                                                                            <span>Adicionar Foto</span>
                                                                        </div>
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="relative w-full h-full flex items-center justify-center">
                                                                    <img
                                                                        src={pendencia.preview || pendencia.foto_url || ''}
                                                                        alt="Preview"
                                                                        className="max-w-full max-h-[15rem] object-contain rounded"
                                                                    />
                                                                    <div className="absolute top-1 right-1 flex gap-1">
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
                                                                            className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                                                                            title="Trocar Foto"
                                                                        >
                                                                            <ImageIcon className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => {
                                                                                handleUpdatePendencia(secao.tempId, pendencia.tempId, 'preview', null);
                                                                                handleUpdatePendencia(secao.tempId, pendencia.tempId, 'file', undefined);
                                                                                handleUpdatePendencia(secao.tempId, pendencia.tempId, 'foto_url', null);
                                                                            }}
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                                                            title="Remover Foto"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Coluna da Foto DEPOIS (50%) */}
                                                        <div className="w-1/2 p-2 flex items-center justify-center bg-black/20 relative">
                                                            {!pendencia.previewDepois && !pendencia.foto_depois_url ? (
                                                                <div className="text-center w-full">
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
                                                                        className="w-full h-full min-h-[8rem] border-2 border-dashed border-gray-600 hover:border-green-500 hover:bg-gray-800/50 text-gray-400"
                                                                    >
                                                                        <div className="flex flex-col items-center">
                                                                            <ImageIcon className="w-8 h-8 mb-2" />
                                                                            <span>Foto Depois</span>
                                                                        </div>
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="relative w-full h-full flex items-center justify-center">
                                                                    <img
                                                                        src={pendencia.previewDepois || pendencia.foto_depois_url || ''}
                                                                        alt="Preview Depois"
                                                                        className="max-w-full max-h-[15rem] object-contain rounded"
                                                                    />
                                                                    <div className="absolute top-1 right-1 flex gap-1">
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
                                                                            className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                                                                            title="Trocar Foto Depois"
                                                                        >
                                                                            <ImageIcon className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => {
                                                                                handleUpdatePendencia(secao.tempId, pendencia.tempId, 'previewDepois', null);
                                                                                handleUpdatePendencia(secao.tempId, pendencia.tempId, 'fileDepois', undefined);
                                                                                handleUpdatePendencia(secao.tempId, pendencia.tempId, 'foto_depois_url', null);
                                                                            }}
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                                                            title="Remover Foto Depois"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
