import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Edit, Trash2, Download, Search, FileDown } from 'lucide-react';
import { Contrato, ParecerTecnico as ParecerTecnicoType } from '@/types';
import { parecerService } from '@/lib/parecerService';
import { ParecerTecnicoEditor } from './ParecerTecnicoEditor';
import { generateParecerTecnicoDOCX } from '@/lib/docxGenerator';
import { generateParecerPDF } from '@/lib/pdfParecer';

interface ParecerTecnicoProps {
    contratoSelecionado: Contrato;
}

export function ParecerTecnico({ contratoSelecionado }: ParecerTecnicoProps) {
    const [pareceres, setPareceres] = useState<ParecerTecnicoType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editingParecer, setEditingParecer] = useState<ParecerTecnicoType | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);

    useEffect(() => {
        loadPareceres();
    }, [contratoSelecionado.id]);

    const loadPareceres = async () => {
        try {
            setIsLoading(true);
            const data = await parecerService.getAll(contratoSelecionado.id);
            setPareceres(data);
        } catch (error) {
            console.error('Erro ao carregar pareceres:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNovoParecer = () => {
        setEditingParecer(null);
        setShowEditor(true);
    };

    const handleEditParecer = (parecer: ParecerTecnicoType) => {
        setEditingParecer(parecer);
        setShowEditor(true);
    };

    const handleDeleteParecer = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este parecer técnico?')) return;

        try {
            await parecerService.delete(id);
            await loadPareceres();
        } catch (error) {
            console.error('Erro ao deletar parecer:', error);
            alert('Erro ao deletar parecer técnico.');
        }
    };

    const handleExportDOCX = async (parecer: ParecerTecnicoType) => {
        try {
            setExportingId(parecer.id);

            // Buscar parecer completo com tópicos e imagens
            const parecerCompleto = await parecerService.getById(parecer.id);

            if (!parecerCompleto) {
                throw new Error('Parecer não encontrado');
            }

            await generateParecerTecnicoDOCX(parecerCompleto, contratoSelecionado);

            alert('✅ Documento DOCX gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar DOCX:', error);
            alert('❌ Erro ao gerar documento DOCX. Verifique o console.');
        } finally {
            setExportingId(null);
        }
    };

    const handleExportPDF = async (parecer: ParecerTecnicoType) => {
        try {
            setExportingId(parecer.id);

            // Buscar parecer completo com tópicos e imagens
            const parecerCompleto = await parecerService.getById(parecer.id);

            if (!parecerCompleto) {
                throw new Error('Parecer não encontrado');
            }

            await generateParecerPDF(parecerCompleto, contratoSelecionado);

            alert('✅ PDF gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('❌ Erro ao gerar PDF. Verifique o console.');
        } finally {
            setExportingId(null);
        }
    };

    const handleSaveComplete = () => {
        setShowEditor(false);
        setEditingParecer(null);
        loadPareceres();
    };

    const handleCancelEdit = () => {
        setShowEditor(false);
        setEditingParecer(null);
    };

    const filteredPareceres = pareceres.filter(p =>
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.finalidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showEditor) {
        return (
            <ParecerTecnicoEditor
                contrato={contratoSelecionado}
                parecer={editingParecer}
                onSave={handleSaveComplete}
                onCancel={handleCancelEdit}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Parecer Técnico</h2>
                    <p className="text-gray-400">Gerencie os pareceres técnicos do contrato {contratoSelecionado.nome}</p>
                </div>
                <Button onClick={handleNovoParecer} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Parecer
                </Button>
            </div>

            {/* Search */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Buscar por título ou finalidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-900 border-gray-700 text-white"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pareceres List */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                    Carregando pareceres...
                </div>
            ) : filteredPareceres.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12">
                        <div className="text-center text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">
                                {searchTerm ? 'Nenhum parecer encontrado.' : 'Nenhum parecer técnico cadastrado ainda.'}
                            </p>
                            {!searchTerm && (
                                <p className="text-sm">Clique em "Novo Parecer" para começar.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredPareceres.map((parecer) => (
                        <div key={parecer.id} className="group flex flex-col gap-2">
                            {/* Card / Mini Capa */}
                            <Card
                                className="relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1"
                                style={{ aspectRatio: '1/1.5' }} // Proporção vertical (tipo papel/documento)
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${parecer.capa_url || '/placeholder-cover.jpg'})`,
                                        backgroundColor: '#1f2937'
                                    }}
                                />

                                {/* Hover Overlay with Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                                    <Button
                                        onClick={() => handleEditParecer(parecer)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-white/90 hover:bg-white text-gray-900"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        onClick={() => handleExportPDF(parecer)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-blue-500/90 hover:bg-blue-500 text-white border-0"
                                        disabled={exportingId === parecer.id}
                                    >
                                        <FileDown className="w-4 h-4 mr-2" />
                                        PDF
                                    </Button>
                                    <Button
                                        onClick={() => handleExportDOCX(parecer)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-green-500/90 hover:bg-green-500 text-white border-0"
                                        disabled={exportingId === parecer.id}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        DOCX
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteParecer(parecer.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-red-500/90 hover:bg-red-500 text-white border-0"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            </Card>

                            {/* Info Below Card */}
                            <div className="space-y-1 px-1">
                                <h3 className="text-sm font-medium text-white leading-tight line-clamp-2" title={parecer.titulo}>
                                    {parecer.titulo}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>{new Date(parecer.created_at).toLocaleDateString('pt-BR')}</span>
                                    <span>{parecer.topicos?.length || 0} tópicos</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
