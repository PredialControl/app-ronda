import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contrato } from '@/types';
import { relatorioPendenciasService } from '@/lib/relatorioPendenciasService';
import { supabase } from '@/lib/supabase';
import { Save, X, Filter } from 'lucide-react';

interface ItensCompiladosProps {
    contratoSelecionado: Contrato;
}

interface ItemCompilado {
    id: string;
    relatorio_id: string;
    relatorio_titulo: string;
    secao_titulo: string;
    item_numero: number;
    local: string;
    descricao: string;
    situacao: 'PENDENTE' | 'RECEBIDO' | 'NAO_FARA';
    data_recebido: string | null;
    construtora: string;
    sindico: string;
}

export function ItensCompilados({ contratoSelecionado }: ItensCompiladosProps) {
    const [itens, setItens] = useState<ItemCompilado[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [relatorios, setRelatorios] = useState<any[]>([]);
    const [abaAtiva, setAbaAtiva] = useState<string>('geral');
    const [filtroSituacao, setFiltroSituacao] = useState<'TODOS' | 'PENDENTE' | 'RECEBIDO' | 'NAO_FARA'>('TODOS');

    useEffect(() => {
        if (contratoSelecionado) {
            loadItens();
        }
    }, [contratoSelecionado]);

    const loadItens = async () => {
        try {
            setLoading(true);
            const relatoriosData = await relatorioPendenciasService.getAll(contratoSelecionado.id);
            setRelatorios(relatoriosData);

            // Buscar dados salvos da evolução
            const { data: evolucaoData } = await supabase
                .from('evolucao_recebimentos')
                .select('*')
                .eq('contrato_id', contratoSelecionado.id);

            const evolucaoMap = new Map(
                (evolucaoData || []).map(item => [item.pendencia_id, item])
            );

            // Compilar todas as pendências de todos os relatórios
            const todosItens: ItemCompilado[] = [];
            let itemNumero = 1;

            relatoriosData.forEach(relatorio => {
                relatorio.secoes?.forEach(secao => {
                    secao.pendencias?.forEach(pendencia => {
                        const evolucao = evolucaoMap.get(pendencia.id);
                        todosItens.push({
                            id: pendencia.id,
                            relatorio_id: relatorio.id,
                            relatorio_titulo: relatorio.titulo,
                            secao_titulo: secao.titulo_principal,
                            item_numero: itemNumero++,
                            local: pendencia.local,
                            descricao: pendencia.descricao || '',
                            situacao: evolucao?.situacao || 'PENDENTE',
                            data_recebido: evolucao?.data_recebido || null,
                            construtora: evolucao?.construtora || '',
                            sindico: evolucao?.sindico || '',
                        });
                    });
                });
            });

            setItens(todosItens);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        } finally {
            setLoading(false);
        }
    };

    const salvarItem = async (item: ItemCompilado) => {
        try {
            await supabase
                .from('evolucao_recebimentos')
                .upsert({
                    pendencia_id: item.id,
                    relatorio_id: item.relatorio_id,
                    contrato_id: contratoSelecionado.id,
                    situacao: item.situacao,
                    data_recebido: item.data_recebido,
                    construtora: item.construtora,
                    sindico: item.sindico,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'pendencia_id'
                });
            console.log('💾 Item salvo automaticamente');
        } catch (error) {
            console.error('Erro ao salvar item:', error);
        }
    };

    const handleUpdateSituacao = (id: string, situacao: 'PENDENTE' | 'RECEBIDO' | 'NAO_FARA') => {
        console.log('🔄 Atualizando situação:', { id, situacao });
        setItens(itens.map(item => {
            if (item.id === id) {
                const updated = {
                    ...item,
                    situacao,
                    data_recebido: situacao === 'RECEBIDO' ? new Date().toISOString().split('T')[0] : null,
                };
                console.log('✅ Item atualizado:', updated);
                salvarItem(updated); // Salvar automaticamente
                return updated;
            }
            return item;
        }));
    };

    const handleUpdateField = (id: string, field: keyof ItemCompilado, value: string) => {
        setItens(itens.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                salvarItem(updated); // Salvar automaticamente
                return updated;
            }
            return item;
        }));
    };

    // Filtrar itens baseado na aba ativa e situação
    let itensFiltrados = abaAtiva === 'geral'
        ? itens
        : itens.filter(item => item.relatorio_id === abaAtiva);

    // Aplicar filtro de situação
    if (filtroSituacao !== 'TODOS') {
        itensFiltrados = itensFiltrados.filter(item => item.situacao === filtroSituacao);
    }

    const itensApontados = itensFiltrados.length;
    const itensRecebidos = itensFiltrados.filter(i => i.situacao === 'RECEBIDO').length;
    const naoFarao = itensFiltrados.filter(i => i.situacao === 'NAO_FARA').length;
    const itensPendentes = itensFiltrados.filter(i => i.situacao === 'PENDENTE').length;

    const percentualRecebidos = itensApontados > 0 ? Math.round((itensRecebidos / itensApontados) * 100) : 0;
    const percentualPendentes = itensApontados > 0 ? Math.round((itensPendentes / itensApontados) * 100) : 0;
    const percentualNaoFarao = itensApontados > 0 ? Math.round((naoFarao / itensApontados) * 100) : 0;

    // Calcular dados para o gráfico de evolução (timeline)
    const calcularEvolucao = () => {
        const recebidosComData = itens.filter(item =>
            item.situacao === 'RECEBIDO' && item.data_recebido
        );

        // Agrupar por data
        const porData = recebidosComData.reduce((acc, item) => {
            const data = item.data_recebido!;
            acc[data] = (acc[data] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Ordenar datas e calcular acumulado
        const datas = Object.keys(porData).sort();
        let acumulado = 0;

        return datas.map(data => {
            acumulado += porData[data];
            return {
                data,
                quantidade: porData[data],
                acumulado
            };
        });
    };

    const evolucaoData = calcularEvolucao();

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Carregando itens compilados...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white">Evolução dos Recebimentos - {contratoSelecionado.nome}</h2>
                <p className="text-gray-300 text-sm mt-1">Acompanhamento de pendências e recebimentos dos relatórios</p>
            </div>

            {/* Sub-abas dos Relatórios */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                    <div className="flex overflow-x-auto border-b border-gray-700">
                        {/* Aba Resumo Geral */}
                        <button
                            onClick={() => setAbaAtiva('geral')}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                abaAtiva === 'geral'
                                    ? 'border-orange-500 text-orange-400 bg-gray-700/50'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                            }`}
                        >
                            📊 Resumo Geral
                        </button>

                        {/* Abas dos Relatórios Individuais */}
                        {relatorios.map((relatorio, index) => (
                            <button
                                key={relatorio.id}
                                onClick={() => setAbaAtiva(relatorio.id)}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                    abaAtiva === relatorio.id
                                        ? 'border-blue-500 text-blue-400 bg-gray-700/50'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                                }`}
                            >
                                📄 {relatorio.titulo || `Relatório ${index + 1}`}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Filtros */}
            {abaAtiva !== 'geral' && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <Label className="text-gray-300">Filtrar por situação:</Label>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setFiltroSituacao('TODOS')}
                                    variant={filtroSituacao === 'TODOS' ? 'default' : 'outline'}
                                    size="sm"
                                    className={filtroSituacao === 'TODOS' ? 'bg-blue-600' : ''}
                                >
                                    Todos
                                </Button>
                                <Button
                                    onClick={() => setFiltroSituacao('PENDENTE')}
                                    variant={filtroSituacao === 'PENDENTE' ? 'default' : 'outline'}
                                    size="sm"
                                    style={{ backgroundColor: filtroSituacao === 'PENDENTE' ? '#f97316' : undefined }}
                                    className={filtroSituacao === 'PENDENTE' ? 'text-white' : ''}
                                >
                                    Pendentes
                                </Button>
                                <Button
                                    onClick={() => setFiltroSituacao('RECEBIDO')}
                                    variant={filtroSituacao === 'RECEBIDO' ? 'default' : 'outline'}
                                    size="sm"
                                    style={{ backgroundColor: filtroSituacao === 'RECEBIDO' ? '#22c55e' : undefined }}
                                    className={filtroSituacao === 'RECEBIDO' ? 'text-white' : ''}
                                >
                                    Recebidos
                                </Button>
                                <Button
                                    onClick={() => setFiltroSituacao('NAO_FARA')}
                                    variant={filtroSituacao === 'NAO_FARA' ? 'default' : 'outline'}
                                    size="sm"
                                    style={{ backgroundColor: filtroSituacao === 'NAO_FARA' ? '#ef4444' : undefined }}
                                    className={filtroSituacao === 'NAO_FARA' ? 'text-white' : ''}
                                >
                                    Não Farão
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Resumo e Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resumo */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Resumo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-gray-300">Itens Apontados</span>
                                <span className="text-white font-bold">{itensApontados}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-green-500">Itens Recebidos</span>
                                <span className="text-green-500 font-bold">{itensRecebidos}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-red-500">Não Farão</span>
                                <span className="text-red-500 font-bold">{naoFarao}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-orange-500">Itens Pendentes</span>
                                <span className="text-orange-500 font-bold">{itensPendentes}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Gráfico de Pizza (SVG simples) */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Distribuição</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        {itensApontados > 0 ? (
                            <div className="relative w-64 h-64">
                                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                                    {/* Fatia Recebidos (verde) */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="80"
                                        fill="transparent"
                                        stroke="#22c55e"
                                        strokeWidth="60"
                                        strokeDasharray={`${percentualRecebidos * 5.027} 502.7`}
                                    />
                                    {/* Fatia Pendentes (laranja) */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="80"
                                        fill="transparent"
                                        stroke="#f97316"
                                        strokeWidth="60"
                                        strokeDasharray={`${percentualPendentes * 5.027} 502.7`}
                                        strokeDashoffset={-percentualRecebidos * 5.027}
                                    />
                                    {/* Fatia Não Farão (vermelho) */}
                                    <circle
                                        cx="100"
                                        cy="100"
                                        r="80"
                                        fill="transparent"
                                        stroke="#ef4444"
                                        strokeWidth="60"
                                        strokeDasharray={`${percentualNaoFarao * 5.027} 502.7`}
                                        strokeDashoffset={-(percentualRecebidos + percentualPendentes) * 5.027}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-center space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                                            <span className="text-white text-xs">Recebidos {percentualRecebidos}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                            <span className="text-white text-xs">Pendentes {percentualPendentes}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                                            <span className="text-white text-xs">Não Farão {percentualNaoFarao}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">Sem dados para exibir</p>
                        )}
                    </CardContent>
                </Card>

                {/* Gráfico de Evolução (Linha do Tempo) */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Evolução dos Recebimentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {evolucaoData.length > 0 ? (
                            <div className="relative h-64">
                                <svg viewBox="0 0 400 200" className="w-full h-full">
                                    {/* Grade de fundo */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line
                                            key={i}
                                            x1="40"
                                            y1={20 + i * 40}
                                            x2="380"
                                            y2={20 + i * 40}
                                            stroke="#374151"
                                            strokeWidth="0.5"
                                            strokeDasharray="2,2"
                                        />
                                    ))}

                                    {/* Eixos */}
                                    <line x1="40" y1="20" x2="40" y2="180" stroke="#9ca3af" strokeWidth="2" />
                                    <line x1="40" y1="180" x2="380" y2="180" stroke="#9ca3af" strokeWidth="2" />

                                    {/* Linha do gráfico */}
                                    {(() => {
                                        const maxQuantidade = Math.max(...evolucaoData.map(d => d.quantidade), 1);
                                        const width = 340;
                                        const height = 160;
                                        const stepX = width / Math.max(evolucaoData.length - 1, 1);

                                        // Criar pontos
                                        const points = evolucaoData.map((d, i) => {
                                            const x = 40 + i * stepX;
                                            const y = 180 - (d.quantidade / maxQuantidade) * height;
                                            return `${x},${y}`;
                                        }).join(' ');

                                        return (
                                            <>
                                                {/* Linha */}
                                                <polyline
                                                    points={points}
                                                    fill="none"
                                                    stroke="#22c55e"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />

                                                {/* Pontos */}
                                                {evolucaoData.map((d, i) => {
                                                    const x = 40 + i * stepX;
                                                    const y = 180 - (d.quantidade / maxQuantidade) * height;
                                                    return (
                                                        <g key={i}>
                                                            <circle cx={x} cy={y} r="4" fill="#22c55e" />
                                                            <text
                                                                x={x}
                                                                y={y - 10}
                                                                textAnchor="middle"
                                                                fill="#fff"
                                                                fontSize="10"
                                                                fontWeight="bold"
                                                            >
                                                                {d.quantidade}
                                                            </text>
                                                        </g>
                                                    );
                                                })}

                                                {/* Labels das datas */}
                                                {evolucaoData.map((d, i) => {
                                                    const x = 40 + i * stepX;
                                                    const dataFormatada = new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    });
                                                    return (
                                                        <text
                                                            key={i}
                                                            x={x}
                                                            y={195}
                                                            textAnchor="middle"
                                                            fill="#9ca3af"
                                                            fontSize="9"
                                                        >
                                                            {dataFormatada}
                                                        </text>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-gray-400">Marque itens como recebidos com data para ver a evolução</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Recebimentos por Data - Apenas no Resumo Geral */}
            {abaAtiva === 'geral' && evolucaoData.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Recebimentos por Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Quantidade Recebida</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Total Acumulado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {evolucaoData.map((registro, index) => (
                                        <tr key={index} className="hover:bg-gray-700/50">
                                            <td className="px-4 py-3 text-sm text-white">
                                                {new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-green-400 font-bold">
                                                {registro.quantidade}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-blue-400 font-bold">
                                                {registro.acumulado}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabela de Itens - Oculta no Resumo Geral */}
            {abaAtiva !== 'geral' && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pendência</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Situação</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recebido</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Construtora</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Síndico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {itensFiltrados.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-700/50">
                                        <td className="px-4 py-3 text-sm text-white">{item.item_numero}</td>
                                        <td className="px-4 py-3 text-sm text-gray-300 max-w-md">
                                            <div className="font-medium">{item.local}</div>
                                            {item.descricao && (
                                                <div className="text-xs text-gray-500 mt-1">{item.descricao}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <select
                                                value={item.situacao}
                                                onChange={(e) => {
                                                    console.log('📝 Select onChange:', e.target.value);
                                                    handleUpdateSituacao(item.id, e.target.value as any);
                                                }}
                                                className="px-3 py-1.5 rounded text-xs font-bold text-white border-0 cursor-pointer"
                                                style={{
                                                    backgroundColor:
                                                        item.situacao === 'RECEBIDO' ? '#22c55e' :
                                                        item.situacao === 'NAO_FARA' ? '#ef4444' :
                                                        '#f97316',
                                                    color: 'white'
                                                }}
                                            >
                                                <option value="PENDENTE" style={{ backgroundColor: '#374151', color: 'white' }}>PENDENTE</option>
                                                <option value="RECEBIDO" style={{ backgroundColor: '#374151', color: 'white' }}>RECEBIDO</option>
                                                <option value="NAO_FARA" style={{ backgroundColor: '#374151', color: 'white' }}>NÃO FARÁ</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {item.situacao === 'RECEBIDO' ? (
                                                <Input
                                                    type="date"
                                                    value={item.data_recebido || ''}
                                                    onChange={(e) => handleUpdateField(item.id, 'data_recebido', e.target.value)}
                                                    className="bg-gray-900 border-gray-700 text-white text-xs w-32"
                                                />
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Input
                                                type="text"
                                                value={item.construtora}
                                                onChange={(e) => handleUpdateField(item.id, 'construtora', e.target.value)}
                                                className="bg-gray-900 border-gray-700 text-white text-xs"
                                                placeholder="-"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Input
                                                type="text"
                                                value={item.sindico}
                                                onChange={(e) => handleUpdateField(item.id, 'sindico', e.target.value)}
                                                className="bg-gray-900 border-gray-700 text-white text-xs"
                                                placeholder="-"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            )}

            {abaAtiva !== 'geral' && itensFiltrados.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-400">Nenhum item neste relatório.</p>
                    </CardContent>
                </Card>
            )}

            {itens.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-400">Nenhum item compilado. Crie relatórios de pendências primeiro.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
