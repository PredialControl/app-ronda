import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ronda } from '@/types';
import { X, Calendar, Clock, User, FileText, Save } from 'lucide-react';

interface EditarRondaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ronda: Ronda) => void;
    ronda: Ronda | null;
}

export function EditarRondaModal({
    isOpen,
    onClose,
    onSave,
    ronda
}: EditarRondaModalProps) {
    const [formData, setFormData] = useState({
        nome: '',
        data: '',
        hora: '',
        responsavel: '',
        observacoesGerais: '',
        tipoVisita: 'RONDA' as 'RONDA' | 'REUNIAO' | 'OUTROS'
    });

    useEffect(() => {
        if (ronda) {
            setFormData({
                nome: ronda.nome,
                data: ronda.data,
                hora: ronda.hora,
                responsavel: ronda.responsavel || '',
                observacoesGerais: ronda.observacoesGerais || '',
                tipoVisita: ronda.tipoVisita || 'RONDA'
            });
        }
    }, [ronda]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!ronda) return;
        if (!formData.nome) {
            alert('Por favor, preencha o nome da ronda');
            return;
        }

        const rondaAtualizada: Ronda = {
            ...ronda,
            nome: formData.nome,
            data: formData.data,
            hora: formData.hora,
            responsavel: formData.responsavel,
            observacoesGerais: formData.observacoesGerais,
            tipoVisita: formData.tipoVisita
        };

        onSave(rondaAtualizada);
        onClose();
    };

    if (!isOpen || !ronda) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] overflow-y-auto">
                {/* Header fixo */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Editar Ronda
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Conteúdo do formulário */}
                <div className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Tipo de Visita */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Visita *</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('tipoVisita', 'RONDA')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'RONDA'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    🔍 Ronda
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('tipoVisita', 'REUNIAO')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'REUNIAO'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    👥 Reunião
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('tipoVisita', 'OUTROS')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'OUTROS'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    📋 Outros
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Nome *</label>
                            <Input
                                value={formData.nome}
                                onChange={(e) => handleInputChange('nome', e.target.value)}
                                placeholder="Nome da ronda"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Data *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.data}
                                    onChange={(e) => handleInputChange('data', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Hora *
                                </label>
                                <Input
                                    type="time"
                                    value={formData.hora}
                                    onChange={(e) => handleInputChange('hora', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <User className="w-4 h-4" />
                                Responsável
                            </label>
                            <Input
                                value={formData.responsavel}
                                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                                placeholder="Nome do responsável"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Observações Gerais
                            </label>
                            <textarea
                                value={formData.observacoesGerais}
                                onChange={(e) => handleInputChange('observacoesGerais', e.target.value)}
                                placeholder="Observações sobre a ronda..."
                                className="w-full min-h-[120px] p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
