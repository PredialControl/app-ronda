import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, Edit, Trash2, Download, FileDown } from 'lucide-react';
import { Contrato, RelatorioPendencias as RelatorioPendenciasType } from '@/types';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { RelatorioPendenciasEditor } from './RelatorioPendenciasEditor';
import { generateRelatorioPendenciasDOCX } from '@/lib/docxRelatorioPendencias';

interface RelatorioPendenciasProps {
    contratoSelecionado: Contrato;
}

export function RelatorioPendencias({ contratoSelecionado }: RelatorioPendenciasProps) {
    const [relatorios, setRelatorios] = useState<RelatorioPendenciasType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editingRelatorio, setEditingRelatorio] = useState<RelatorioPendenciasType | null>(null);

    useEffect(() => {
        if (contratoSelecionado) {
            loadRelatorios();
        }
    }, [contratoSelecionado]);

    const loadRelatorios = async () => {
        try {
            setLoading(true);
            const data = await relatorioPendenciasService.getAll(contratoSelecionado.id);
            setRelatorios(data);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            alert('Erro ao carregar relatórios de pendências');
        } finally {
            setLoading(false);
        }
    };

    const handleNewRelatorio = () => {
        setEditingRelatorio(null);
        setShowEditor(true);
    };

    const handleEditRelatorio = (relatorio: RelatorioPendenciasType) => {
        setEditingRelatorio(relatorio);
        setShowEditor(true);
    };

    const handleDeleteRelatorio = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este relatório de pendências?')) return;

        try {
            await relatorioPendenciasService.delete(id);
            await loadRelatorios();
        } catch (error) {
            console.error('Erro ao deletar relatório:', error);
            alert('Erro ao deletar relatório de pendências.');
        }
    };

    const handleExportDOCX = async (relatorio: RelatorioPendenciasType) => {
        try {
            const relatorioCompleto = await relatorioPendenciasService.getById(relatorio.id);
            if (!relatorioCompleto) {
                throw new Error('Relatório não encontrado');
            }
            await generateRelatorioPendenciasDOCX(relatorioCompleto, contratoSelecionado);
        } catch (error) {
            console.error('Erro ao exportar DOCX:', error);
            alert('Erro ao gerar documento DOCX.');
        }
    };

    const handleSaveComplete = () => {
        setShowEditor(false);
        setEditingRelatorio(null);
        loadRelatorios();
    };

    const filteredRelatorios = relatorios.filter(rel =>
        rel.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showEditor) {
        return (
            <RelatorioPendenciasEditor
                contrato={contratoSelecionado}
                relatorio={editingRelatorio}
                onSave={handleSaveComplete}
                onCancel={() => setShowEditor(false)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Relatórios de Pendências</h2>
                    <Button
                        onClick={handleNewRelatorio}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Relatório
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Buscar relatórios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-900 border-gray-700 text-white"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Relatórios List */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-400">Carregando relatórios...</p>
                </div>
            ) : filteredRelatorios.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 text-center">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">
                            {searchTerm ? 'Nenhum relatório encontrado.' : 'Nenhum relatório de pendências cadastrado ainda.'}
                        </p>
                        {!searchTerm && (
                            <Button
                                onClick={handleNewRelatorio}
                                variant="outline"
                                className="mt-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Primeiro Relatório
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredRelatorios.map((relatorio) => (
                        <div key={relatorio.id} className="group flex flex-col gap-2">
                            {/* Card / Mini Capa */}
                            <Card
                                className="relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1"
                                style={{ aspectRatio: '1/1.5' }}
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${relatorio.capa_url || '/placeholder-cover.jpg'})`,
                                        backgroundColor: '#1f2937'
                                    }}
                                />

                                {/* Hover Overlay with Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                                    <Button
                                        onClick={() => handleEditRelatorio(relatorio)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-white/90 hover:bg-white text-gray-900"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        onClick={() => handleExportDOCX(relatorio)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-green-500/90 hover:bg-green-500 text-white border-0"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        DOCX
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteRelatorio(relatorio.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full bg-red-500/90 hover:bg-red-500 text-white border-0"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            </Card>

                            {/* Título e Info */}
                            <div className="px-1">
                                <h3 className="text-sm font-semibold text-white truncate" title={relatorio.titulo}>
                                    {relatorio.titulo}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {relatorio.secoes?.length || 0} seções • {relatorio.secoes?.reduce((acc, sec) => {
                                        const pendenciasDiretas = sec.pendencias?.length || 0;
                                        const pendenciasSubsecoes = (sec.subsecoes || []).reduce((subAcc, sub) => subAcc + (sub.pendencias?.length || 0), 0);
                                        return acc + pendenciasDiretas + pendenciasSubsecoes;
                                    }, 0) || 0} pendências
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(relatorio.created_at).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
