import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, X, GripVertical, Trash2, Image as ImageIcon, FileText, Download, Upload } from 'lucide-react';
import { Contrato, ParecerTecnico as ParecerTecnicoType, ParecerTopico, ParecerImagem } from '@/types';
import { parecerService } from '@/lib/parecerService';
import { generateParecerTecnicoDOCX } from '@/lib/docxGenerator';
import { ImageEditor } from '@/components/ImageEditor';

interface ParecerTecnicoEditorProps {
    contrato: Contrato;
    parecer?: ParecerTecnicoType | null;
    onSave: () => void;
    onCancel: () => void;
}

interface TopicoLocal {
    id?: string;
    tempId: string;
    ordem: number;
    titulo: string;
    descricao: string;
    imagens: ImagemLocal[];
}

interface ImagemLocal {
    id?: string;
    tempId: string;
    ordem: number;
    url: string;
    descricao: string;
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
    const [editingImage, setEditingImage] = useState<{ topicoTempId: string; imagemTempId: string; url: string } | null>(null);
    const [arquivoWordUrl, setArquivoWordUrl] = useState(parecer?.arquivo_word_url || '');
    const [arquivoWordNome, setArquivoWordNome] = useState(parecer?.arquivo_word_nome || '');
    const [arquivoWordFile, setArquivoWordFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'EXECUTADO' | 'NAO_EXECUTADO'>(parecer?.status || 'NAO_EXECUTADO');

    useEffect(() => {
        if (parecer?.topicos) {
            const topicosLocal: TopicoLocal[] = parecer.topicos.map((t, idx) => ({
                ...t,
                tempId: `topico-${idx}`,
                imagens: (t.imagens || []).map((img, imgIdx) => ({
                    ...img,
                    tempId: `img-${idx}-${imgIdx}`,
                    preview: img.url, // Usar a URL como preview para imagens já salvas
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

    const handleSaveEditedImage = async (editedImageBlob: Blob) => {
        if (!editingImage) return;

        // Converter Blob para File
        const file = new File([editedImageBlob], 'edited-image.png', { type: 'image/png' });
        const preview = URL.createObjectURL(editedImageBlob);

        // Atualizar a imagem no tópico
        setTopicos(topicos.map(t => {
            if (t.tempId === editingImage.topicoTempId) {
                return {
                    ...t,
                    imagens: t.imagens.map(img => {
                        if (img.tempId === editingImage.imagemTempId) {
                            return { ...img, file, preview };
                        }
                        return img;
                    }),
                };
            }
            return t;
        }));

        setEditingImage(null);
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

    const handleArquivoWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar se é arquivo Word
            const isWord = file.name.endsWith('.doc') || file.name.endsWith('.docx');
            if (!isWord) {
                alert('Por favor, selecione um arquivo Word (.doc ou .docx)');
                return;
            }
            setArquivoWordFile(file);
            setArquivoWordNome(file.name);
        }
    };

    const handleRemoveArquivoWord = async () => {
        if (arquivoWordUrl && parecer?.id) {
            try {
                await parecerService.deleteArquivoWord(arquivoWordUrl);
            } catch (error) {
                console.error('Erro ao deletar arquivo Word:', error);
            }
        }
        setArquivoWordFile(null);
        setArquivoWordNome('');
        setArquivoWordUrl('');
    };

    const handleDownloadArquivoWord = () => {
        if (arquivoWordUrl) {
            window.open(arquivoWordUrl, '_blank');
        }
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
            let finalArquivoWordUrl = arquivoWordUrl;

            // Create or update parecer first
            if (parecerId) {
                await parecerService.update(parecerId, {
                    titulo,
                    finalidade,
                    narrativa_cenario: narrativaCenario,
                    capa_url: finalCapaUrl,
                    status,
                });
            } else {
                const newParecer = await parecerService.create({
                    contrato_id: contrato.id,
                    titulo,
                    finalidade,
                    narrativa_cenario: narrativaCenario,
                    capa_url: finalCapaUrl,
                    status,
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
                    status,
                });
            }

            // Upload Word file if new file selected
            if (arquivoWordFile) {
                finalArquivoWordUrl = await parecerService.uploadArquivoWord(arquivoWordFile, parecerId);
                // Update parecer with arquivo Word URL
                await parecerService.update(parecerId, {
                    arquivo_word_url: finalArquivoWordUrl,
                    arquivo_word_nome: arquivoWordNome,
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
        <div className="flex flex-col h-screen bg-gray-950">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-700 flex-shrink-0">
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
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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

                    <div>
                        <Label htmlFor="status" className="text-gray-300">Status do Parecer *</Label>
                        <div className="flex gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setStatus('EXECUTADO')}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-semibold ${
                                    status === 'EXECUTADO'
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-green-600'
                                }`}
                            >
                                ✓ Executado
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('NAO_EXECUTADO')}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-semibold ${
                                    status === 'NAO_EXECUTADO'
                                        ? 'bg-red-600 border-red-600 text-white'
                                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-red-600'
                                }`}
                            >
                                ✗ Não Executado
                            </button>
                        </div>
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

            {/* Upload de Arquivo Word */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Arquivo Word do Parecer (Opcional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="arquivoWord" className="text-gray-300">
                            Upload de Arquivo Word (.doc, .docx)
                        </Label>
                        <p className="text-sm text-gray-400 mb-3">
                            Faça upload de um parecer técnico já pronto em Word para armazenar junto com este registro.
                        </p>

                        {!arquivoWordNome ? (
                            <div className="mt-2">
                                <label htmlFor="arquivoWord" className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-fit">
                                        <Upload className="w-4 h-4" />
                                        <span>Selecionar Arquivo Word</span>
                                    </div>
                                </label>
                                <Input
                                    id="arquivoWord"
                                    type="file"
                                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleArquivoWordChange}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                    <FileText className="w-8 h-8 text-blue-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{arquivoWordNome}</p>
                                        <p className="text-sm text-gray-400">
                                            {arquivoWordFile ? 'Pronto para enviar' : 'Arquivo anexado'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {arquivoWordUrl && !arquivoWordFile && (
                                            <Button
                                                onClick={handleDownloadArquivoWord}
                                                variant="outline"
                                                size="sm"
                                                className="text-green-400 hover:text-green-300"
                                                title="Baixar arquivo"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleRemoveArquivoWord}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300"
                                            title="Remover arquivo"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

                {/* Dynamic Topics */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Tópicos Adicionais</h3>

                    {topicos.length === 0 ? (
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="py-12 text-center text-gray-400">
                                <p>Nenhum tópico adicional. Clique em "Adicionar Tópico" abaixo para começar.</p>
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
                                                            className="w-32 h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => setEditingImage({ topicoTempId: topico.tempId, imagemTempId: imagem.tempId, url: imagem.preview })}
                                                            title="Clique para editar com marcações"
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

            {/* Fixed Footer with Buttons */}
            <div className="flex gap-3 px-6 py-4 bg-gray-900 border-t border-gray-700 flex-shrink-0">
                <Button
                    onClick={handleAddTopico}
                    variant="outline"
                    className="text-blue-400 hover:text-blue-300 flex-1"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Novo Tópico
                </Button>
                <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={isSaving}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Parecer'}
                </Button>
            </div>

            {/* Image Editor Modal */}
            {editingImage && (
                <ImageEditor
                    imageUrl={editingImage.url}
                    onSave={handleSaveEditedImage}
                    onCancel={() => setEditingImage(null)}
                />
            )}
        </div>
    );
}
