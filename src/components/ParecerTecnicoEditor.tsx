import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, X, GripVertical, Trash2, Image as ImageIcon, FileText } from 'lucide-react';
import { Contrato, ParecerTecnico as ParecerTecnicoType, ParecerTopico, ParecerImagem } from '@/types';
import { parecerService } from '@/lib/parecerService';
import { generateParecerTecnicoDOCX } from '@/lib/docxGenerator';

interface ParecerTecnicoEditorProps {
    contrato: Contrato;
    parecer?: ParecerTecnicoType | null;
    onSave: () => void;
    onCancel: () => void;
}

interface TopicoLocal extends Omit<ParecerTopico, 'id' | 'parecer_id' | 'created_at'> {
    id?: string;
    tempId: string;
    imagens: ImagemLocal[];
}

interface ImagemLocal extends Omit<ParecerImagem, 'id' | 'topico_id' | 'created_at'> {
    id?: string;
    tempId: string;
    file?: File;
    preview?: string;
}

export function ParecerTecnicoEditor({ contrato, parecer, onSave, onCancel }: ParecerTecnicoEditorProps) {
    const [titulo, setTitulo] = useState(parecer?.titulo || '');
    const [finalidade, setFinalidade] = useState(parecer?.finalidade || '');
    const [narrativaCenario, setNarrativaCenario] = useState(parecer?.narrativa_cenario || '');
    const [capaUrl, setCapaUrl] = useState(parecer?.capa_url || '');
    const [capaFile, setCapaFile] = useState<File | null>(null);
    const [capaPreview, setCapaPreview] = useState(parecer?.capa_url || '');
    const [topicos, setTopicos] = useState<TopicoLocal[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (parecer?.topicos) {
            const topicosLocal: TopicoLocal[] = parecer.topicos.map((t, idx) => ({
                ...t,
                tempId: `topico-${idx}`,
                imagens: (t.imagens || []).map((img, imgIdx) => ({
                    ...img,
                    tempId: `img-${idx}-${imgIdx}`,
                })),
            }));
            setTopicos(topicosLocal);
        }
    }, [parecer]);

    const handleAddTopico = () => {
        const newTopico: TopicoLocal = {
            tempId: `topico-${Date.now()}`,
            ordem: topicos.length,
            titulo: '',
            descricao: '',
            imagens: [],
        };
        setTopicos([...topicos, newTopico]);
    };

    const handleUpdateTopico = (tempId: string, field: keyof TopicoLocal, value: any) => {
        setTopicos(topicos.map(t => t.tempId === tempId ? { ...t, [field]: value } : t));
    };

    const handleDeleteTopico = (tempId: string) => {
        setTopicos(topicos.filter(t => t.tempId !== tempId).map((t, idx) => ({ ...t, ordem: idx })));
    };

    const handleAddImagem = (topicoTempId: string, files: FileList | null) => {
        if (!files) return;

        const newImagens: ImagemLocal[] = Array.from(files).map((file, idx) => ({
            tempId: `img-${Date.now()}-${idx}`,
            ordem: 0,
            url: '',
            descricao: '',
            file,
            preview: URL.createObjectURL(file),
        }));

        setTopicos(topicos.map(t => {
            if (t.tempId === topicoTempId) {
                const allImagens = [...t.imagens, ...newImagens].map((img, idx) => ({ ...img, ordem: idx }));
                return { ...t, imagens: allImagens };
            }
            return t;
        }));
    };

    const handleUpdateImagem = (topicoTempId: string, imagemTempId: string, descricao: string) => {
        setTopicos(topicos.map(t => {
            if (t.tempId === topicoTempId) {
                return {
                    ...t,
                    imagens: t.imagens.map(img => img.tempId === imagemTempId ? { ...img, descricao } : img),
                };
            }
            return t;
        }));
    };

    const handleDeleteImagem = (topicoTempId: string, imagemTempId: string) => {
        setTopicos(topicos.map(t => {
            if (t.tempId === topicoTempId) {
                return {
                    ...t,
                    imagens: t.imagens.filter(img => img.tempId !== imagemTempId).map((img, idx) => ({ ...img, ordem: idx })),
                };
            }
            return t;
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

    const handleExportDOCX = async () => {
        if (!parecer) {
            alert('Salve o parecer antes de exportar!');
            return;
        }

        try {
            setIsExporting(true);
            const parecerCompleto = await parecerService.getById(parecer.id);
            if (!parecerCompleto) {
                throw new Error('Parecer não encontrado');
            }
            await generateParecerTecnicoDOCX(parecerCompleto, contrato);
            alert('✅ Documento DOCX gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar DOCX:', error);
            alert('❌ Erro ao gerar documento DOCX. Verifique o console.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleSave = async () => {
        if (!titulo.trim() || !finalidade.trim() || !narrativaCenario.trim()) {
            alert('Por favor, preencha todos os campos obrigatórios (Título, Finalidade e Narrativa do Cenário).');
            return;
        }

        setIsSaving(true);

        try {
            let parecerId = parecer?.id;
            let finalCapaUrl = capaUrl;

            // Create or update parecer first
            if (parecerId) {
                await parecerService.update(parecerId, {
                    titulo,
                    finalidade,
                    narrativa_cenario: narrativaCenario,
                    capa_url: finalCapaUrl,
                });
            } else {
                const newParecer = await parecerService.create({
                    contrato_id: contrato.id,
                    titulo,
                    finalidade,
                    narrativa_cenario: narrativaCenario,
                    capa_url: finalCapaUrl,
                });
                parecerId = newParecer.id;
            }

            // Upload cover image if new file selected
            if (capaFile) {
                finalCapaUrl = await parecerService.uploadImagem(capaFile, parecerId, 'capa');
                // Update parecer with capa URL
                await parecerService.update(parecerId, {
                    titulo,
                    finalidade,
                    narrativa_cenario: narrativaCenario,
                    capa_url: finalCapaUrl,
                });
            }

            // Save topicos and images
            for (const topico of topicos) {
                let topicoId = topico.id;

                if (topicoId) {
                    await parecerService.updateTopico(topicoId, {
                        titulo: topico.titulo,
                        descricao: topico.descricao,
                        ordem: topico.ordem,
                    });
                } else {
                    const newTopico = await parecerService.createTopico({
                        parecer_id: parecerId,
                        titulo: topico.titulo,
                        descricao: topico.descricao,
                        ordem: topico.ordem,
                    });
                    topicoId = newTopico.id;
                }

                // Save images
                for (const imagem of topico.imagens) {
                    let imageUrl = imagem.url;

                    // Upload new image if file exists
                    if (imagem.file) {
                        imageUrl = await parecerService.uploadImagem(imagem.file, parecerId, topicoId);
                    }

                    if (imagem.id) {
                        await parecerService.updateImagem(imagem.id, {
                            descricao: imagem.descricao,
                            ordem: imagem.ordem,
                        });
                    } else {
                        await parecerService.createImagem({
                            topico_id: topicoId,
                            url: imageUrl,
                            descricao: imagem.descricao,
                            ordem: imagem.ordem,
                        });
                    }
                }
            }

            alert('Parecer técnico salvo com sucesso!');
            onSave();
        } catch (error) {
            console.error('Erro ao salvar parecer:', error);
            alert('Erro ao salvar parecer técnico. Verifique o console.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                    {parecer ? 'Editar Parecer Técnico' : 'Novo Parecer Técnico'}
                </h2>
                <div className="flex gap-2">
                    {parecer && (
                        <Button
                            onClick={handleExportDOCX}
                            variant="outline"
                            disabled={isExporting}
                            className="text-green-400 hover:text-green-300"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {isExporting ? 'Gerando...' : 'Exportar DOCX'}
                        </Button>
                    )}
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

            {/* Fixed Fields */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="titulo" className="text-gray-300">Título do Parecer *</Label>
                        <Input
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Parecer Técnico - Vistoria Estrutural"
                            className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="finalidade" className="text-gray-300">1 – Finalidade do Relatório *</Label>
                        <Textarea
                            id="finalidade"
                            value={finalidade}
                            onChange={(e) => setFinalidade(e.target.value)}
                            placeholder="Descreva a finalidade deste parecer técnico..."
                            rows={4}
                            className="bg-gray-900 border-gray-700 text-white mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="narrativa" className="text-gray-300">2 – Narrativa do Cenário *</Label>
                        <Textarea
                            id="narrativa"
                            value={narrativaCenario}
                            onChange={(e) => setNarrativaCenario(e.target.value)}
                            placeholder="Descreva o cenário encontrado..."
                            rows={6}
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

            {/* Dynamic Topics */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Tópicos Adicionais</h3>
                    <Button onClick={handleAddTopico} variant="outline" className="text-blue-400">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Tópico
                    </Button>
                </div>

                {topicos.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="py-12 text-center text-gray-400">
                            <p>Nenhum tópico adicional. Clique em "Adicionar Tópico" para começar.</p>
                        </CardContent>
                    </Card>
                ) : (
                    topicos.map((topico, idx) => (
                        <Card key={topico.tempId} className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <GripVertical className="w-5 h-5 text-gray-500" />
                                        Tópico {idx + 3}
                                    </CardTitle>
                                    <Button
                                        onClick={() => handleDeleteTopico(topico.tempId)}
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
                                    <Label htmlFor={`titulo-${topico.tempId}`} className="text-gray-300">Título *</Label>
                                    <Input
                                        id={`titulo-${topico.tempId}`}
                                        value={topico.titulo}
                                        onChange={(e) => handleUpdateTopico(topico.tempId, 'titulo', e.target.value)}
                                        placeholder="Ex: Instalações Elétricas"
                                        className="bg-gray-900 border-gray-700 text-white mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`descricao-${topico.tempId}`} className="text-gray-300">Descrição *</Label>
                                    <Textarea
                                        id={`descricao-${topico.tempId}`}
                                        value={topico.descricao}
                                        onChange={(e) => handleUpdateTopico(topico.tempId, 'descricao', e.target.value)}
                                        placeholder="Descreva os detalhes deste tópico..."
                                        rows={4}
                                        className="bg-gray-900 border-gray-700 text-white mt-1"
                                    />
                                </div>

                                {/* Images */}
                                <div>
                                    <Label className="text-gray-300">Imagens (Opcional)</Label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleAddImagem(topico.tempId, e.target.files)}
                                        className="hidden"
                                        id={`img-upload-${topico.tempId}`}
                                    />
                                    <Button
                                        onClick={() => document.getElementById(`img-upload-${topico.tempId}`)?.click()}
                                        variant="outline"
                                        className="mt-2"
                                    >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Adicionar Imagens
                                    </Button>

                                    {topico.imagens.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {topico.imagens.map((imagem) => (
                                                <div key={imagem.tempId} className="flex gap-3 items-start bg-gray-900 p-3 rounded">
                                                    {imagem.preview && (
                                                        <img
                                                            src={imagem.preview}
                                                            alt="Preview"
                                                            className="w-20 h-20 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <Input
                                                            value={imagem.descricao}
                                                            onChange={(e) => handleUpdateImagem(topico.tempId, imagem.tempId, e.target.value)}
                                                            placeholder="Descrição da imagem"
                                                            className="bg-gray-800 border-gray-700 text-white"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={() => handleDeleteImagem(topico.tempId, imagem.tempId)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
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
