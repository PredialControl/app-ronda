import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, X, GripVertical, Trash2, Image as ImageIcon } from 'lucide-react';
import { Contrato, RelatorioPendencias as RelatorioPendenciasType } from '@/types';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';

interface RelatorioPendenciasEditorProps {
    contrato: Contrato;
    relatorio?: RelatorioPendenciasType | null;
    onSave: () => void;
    onCancel: () => void;
}

interface SecaoLocal {
    id?: string;
    tempId: string;
    ordem: number;
    titulo_principal: string;
    subtitulo: string;
    pendencias: PendenciaLocal[];
}

interface PendenciaLocal {
    id?: string;
    tempId: string;
    ordem: number;
    local: string;
    descricao: string;
    foto_url: string | null;
    file?: File;
    preview?: string;
}

export function RelatorioPendenciasEditor({ contrato, relatorio, onSave, onCancel }: RelatorioPendenciasEditorProps) {
    const [titulo, setTitulo] = useState(relatorio?.titulo || '');
    const [secoes, setSecoes] = useState<SecaoLocal[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (relatorio?.secoes) {
            const secoesLocal: SecaoLocal[] = relatorio.secoes.map((s, idx) => ({
                ...s,
                tempId: `secao-${idx}`,
                pendencias: (s.pendencias || []).map((p, pIdx) => ({
                    ...p,
                    tempId: `pend-${idx}-${pIdx}`,
                })),
            }));
            setSecoes(secoesLocal);
        }
    }, [relatorio]);

    const handleAddSecao = () => {
        const newSecao: SecaoLocal = {
            tempId: `secao-${Date.now()}`,
            ordem: secoes.length,
            titulo_principal: '',
            subtitulo: '',
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

    const handleAddPendencia = (secaoTempId: string) => {
        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                const localAutomatico = `${s.titulo_principal} - ${s.subtitulo}`;
                const newPendencia: PendenciaLocal = {
                    tempId: `pend-${Date.now()}`,
                    ordem: s.pendencias.length,
                    local: localAutomatico,
                    descricao: '',
                    foto_url: null,
                };
                return { ...s, pendencias: [...s.pendencias, newPendencia] };
            }
            return s;
        }));
    };

    const handleUpdatePendencia = (secaoTempId: string, pendenciaTempId: string, field: keyof PendenciaLocal, value: any) => {
        setSecoes(secoes.map(s => {
            if (s.tempId === secaoTempId) {
                return {
                    ...s,
                    pendencias: s.pendencias.map(p => p.tempId === pendenciaTempId ? { ...p, [field]: value } : p),
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

    const handleBulkPhotos = (secaoTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const secao = secoes.find(s => s.tempId === secaoTempId);
        if (!secao) return;

        // Limpar partes comuns do título para deixar o local mais limpo (opcional, mas solicitado pelo usuário 'automatico pegando titulo e sub titulo')
        // Vamos usar exatamente o que ele pediu: Concatenar.
        // Ex: Título: VIII.1 – 4º SUBSOLO, Subtítulo: VIII.1.A – HALL
        // Local Gerado: 4º SUBSOLO - HALL (Tentativa de limpar numeração romana se possível, ou usar direto)
        // O usuário disse: "Local: 4º Subsolo - Hall" na imagem.
        // Vamos tentar extrair apenas o texto relevante ou concatenar direto.
        // Simplificação: Usar Título Principal + " - " + Subtítulo. O usuário pode editar depois.

        const localAutomatico = `${secao.titulo_principal} - ${secao.subtitulo}`;

        const newPendencias: PendenciaLocal[] = files.map((file, idx) => ({
            tempId: `pend-${Date.now()}-${idx}`,
            ordem: secao.pendencias.length + idx,
            local: localAutomatico,
            descricao: '',
            foto_url: null,
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

    const handleSave = async () => {
        if (!titulo.trim()) {
            alert('Por favor, preencha o título do relatório.');
            return;
        }

        setIsSaving(true);

        try {
            let relatorioId = relatorio?.id;

            // Create or update relatório
            if (relatorioId) {
                await relatorioPendenciasService.update(relatorioId, { titulo });
            } else {
                const newRelatorio = await relatorioPendenciasService.create({
                    contrato_id: contrato.id,
                    titulo,
                });
                relatorioId = newRelatorio.id;
            }

            // Save secoes and pendencias
            for (const secao of secoes) {
                let secaoId = secao.id;

                if (secaoId) {
                    await relatorioPendenciasService.updateSecao(secaoId, {
                        titulo_principal: secao.titulo_principal,
                        subtitulo: secao.subtitulo,
                        ordem: secao.ordem,
                    });
                } else {
                    const newSecao = await relatorioPendenciasService.createSecao({
                        relatorio_id: relatorioId,
                        titulo_principal: secao.titulo_principal,
                        subtitulo: secao.subtitulo,
                        ordem: secao.ordem,
                    });
                    secaoId = newSecao.id;
                }

                // Save pendencias
                for (const pendencia of secao.pendencias) {
                    let fotoUrl = pendencia.foto_url;

                    // Upload new foto if file exists
                    if (pendencia.file) {
                        fotoUrl = await relatorioPendenciasService.uploadFoto(pendencia.file, relatorioId, pendencia.tempId);
                    }

                    if (pendencia.id) {
                        await relatorioPendenciasService.updatePendencia(pendencia.id, {
                            local: pendencia.local,
                            descricao: pendencia.descricao,
                            foto_url: fotoUrl,
                            ordem: pendencia.ordem,
                        });
                    } else {
                        await relatorioPendenciasService.createPendencia({
                            secao_id: secaoId,
                            local: pendencia.local,
                            descricao: pendencia.descricao,
                            foto_url: fotoUrl,
                            ordem: pendencia.ordem,
                        });
                    }
                }
            }

            alert('Relatório de pendências salvo com sucesso!');
            onSave();
        } catch (error) {
            console.error('Erro ao salvar relatório:', error);
            alert('Erro ao salvar relatório de pendências. Verifique o console.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
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
                                        Seção {secao.ordem + 1}
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
                                        placeholder="Ex: 4º Subsolo"
                                        className="bg-gray-900 border-gray-700 text-white mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Este texto será usado automaticamente no início do campo "Local" das pendências.</p>
                                </div>

                                <div>
                                    <Label htmlFor={`subtitulo-${secao.tempId}`} className="text-gray-300">
                                        Subtítulo / Área
                                    </Label>
                                    <Input
                                        id={`subtitulo-${secao.tempId}`}
                                        value={secao.subtitulo}
                                        onChange={(e) => handleUpdateSecao(secao.tempId, 'subtitulo', e.target.value)}
                                        placeholder="Ex: Hall"
                                        className="bg-gray-900 border-gray-700 text-white mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Este texto será usado automaticamente no fim do campo "Local".</p>
                                </div>

                                {/* Pendências */}
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

                                                        {/* Coluna Vazia (50%) */}
                                                        <div className="w-1/2 bg-gray-900/50">
                                                            {/* Espaço Vazio intencional para match com layout do Word */}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
