import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

interface EvolucaoData {
    data: string;
    quantidade: number;
    acumulado: number;
}

export async function exportarEvolucaoParaExcel(
    itens: ItemCompilado[],
    evolucaoData: EvolucaoData[],
    contratoNome: string
) {
    const workbook = new ExcelJS.Workbook();

    // Configurações do workbook
    workbook.creator = 'App Ronda';
    workbook.created = new Date();

    // ==================== ABA 1: RESUMO ====================
    const resumoSheet = workbook.addWorksheet('Resumo', {
        views: [{ showGridLines: true }]
    });

    // Título
    resumoSheet.mergeCells('A1:F1');
    const titleCell = resumoSheet.getCell('A1');
    titleCell.value = `Evolução dos Recebimentos - ${contratoNome}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    resumoSheet.getRow(1).height = 30;

    // Data de geração
    resumoSheet.mergeCells('A2:F2');
    const dateCell = resumoSheet.getCell('A2');
    dateCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
    dateCell.font = { size: 10, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    // Espaço
    resumoSheet.getRow(3).height = 10;

    // Estatísticas
    const itensApontados = itens.length;
    const itensRecebidos = itens.filter(i => i.situacao === 'RECEBIDO').length;
    const naoFarao = itens.filter(i => i.situacao === 'NAO_FARA').length;
    const itensPendentes = itens.filter(i => i.situacao === 'PENDENTE').length;

    const percentualRecebidos = itensApontados > 0 ? Math.round((itensRecebidos / itensApontados) * 100) : 0;
    const percentualPendentes = itensApontados > 0 ? Math.round((itensPendentes / itensApontados) * 100) : 0;
    const percentualNaoFarao = itensApontados > 0 ? Math.round((naoFarao / itensApontados) * 100) : 0;

    // Tabela de resumo
    const resumoData = [
        ['Métrica', 'Quantidade', 'Percentual'],
        ['Itens Apontados', itensApontados, '100%'],
        ['Itens Recebidos', itensRecebidos, `${percentualRecebidos}%`],
        ['Não Farão', naoFarao, `${percentualNaoFarao}%`],
        ['Itens Pendentes', itensPendentes, `${percentualPendentes}%`]
    ];

    resumoSheet.addTable({
        name: 'TabelaResumo',
        ref: 'A4',
        headerRow: true,
        style: {
            theme: 'TableStyleMedium2',
            showRowStripes: true,
        },
        columns: [
            { name: 'Métrica', filterButton: false },
            { name: 'Quantidade', filterButton: false },
            { name: 'Percentual', filterButton: false }
        ],
        rows: resumoData.slice(1).map(row => row)
    });

    // Ajustar larguras
    resumoSheet.getColumn('A').width = 30;
    resumoSheet.getColumn('B').width = 15;
    resumoSheet.getColumn('C').width = 15;

    // Estilizar células de dados
    for (let i = 5; i <= 8; i++) {
        const row = resumoSheet.getRow(i);
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'center' };

        if (i === 6) { // Recebidos
            row.getCell(2).font = { bold: true, color: { argb: 'FF22C55E' } };
            row.getCell(3).font = { bold: true, color: { argb: 'FF22C55E' } };
        } else if (i === 7) { // Não Farão
            row.getCell(2).font = { bold: true, color: { argb: 'FFEF4444' } };
            row.getCell(3).font = { bold: true, color: { argb: 'FFEF4444' } };
        } else if (i === 8) { // Pendentes
            row.getCell(2).font = { bold: true, color: { argb: 'FFF97316' } };
            row.getCell(3).font = { bold: true, color: { argb: 'FFF97316' } };
        }
    }

    // ==================== GRÁFICO DE PIZZA ====================
    if (itensApontados > 0) {
        resumoSheet.getCell('E4').value = 'Distribuição das Pendências';
        resumoSheet.getCell('E4').font = { size: 12, bold: true };

        // Adicionar gráfico de pizza
        const chart = resumoSheet.addChart({
            type: 'pie',
            title: {
                name: 'Distribuição',
                color: '000000',
                size: 14,
            },
            categories: {
                formula: `Resumo!$A$6:$A$8`,
            },
            values: {
                formula: `Resumo!$B$6:$B$8`,
            },
            position: {
                type: 'twoCellAnchor',
                from: { col: 4, row: 4 },
                to: { col: 9, row: 18 }
            }
        });
    }

    // ==================== ABA 2: EVOLUÇÃO POR DATA ====================
    if (evolucaoData.length > 0) {
        const evolucaoSheet = workbook.addWorksheet('Evolução por Data');

        // Título
        evolucaoSheet.mergeCells('A1:D1');
        const evTitleCell = evolucaoSheet.getCell('A1');
        evTitleCell.value = 'Recebimentos por Data';
        evTitleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        evTitleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1F2937' }
        };
        evTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        evolucaoSheet.getRow(1).height = 25;

        // Tabela de evolução
        evolucaoSheet.addTable({
            name: 'TabelaEvolucao',
            ref: 'A3',
            headerRow: true,
            style: {
                theme: 'TableStyleLight9',
                showRowStripes: true,
            },
            columns: [
                { name: 'Data', filterButton: true },
                { name: 'Quantidade Recebida', filterButton: true },
                { name: 'Total Acumulado', filterButton: true }
            ],
            rows: evolucaoData.map(item => [
                new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR'),
                item.quantidade,
                item.acumulado
            ])
        });

        // Ajustar larguras
        evolucaoSheet.getColumn('A').width = 15;
        evolucaoSheet.getColumn('B').width = 20;
        evolucaoSheet.getColumn('C').width = 20;

        // Centralizar valores
        for (let i = 4; i < 4 + evolucaoData.length; i++) {
            evolucaoSheet.getRow(i).getCell(2).alignment = { horizontal: 'center' };
            evolucaoSheet.getRow(i).getCell(3).alignment = { horizontal: 'center' };
            evolucaoSheet.getRow(i).getCell(2).font = { bold: true, color: { argb: 'FF22C55E' } };
            evolucaoSheet.getRow(i).getCell(3).font = { bold: true, color: { argb: 'FF2563EB' } };
        }

        // ==================== GRÁFICO DE LINHA ====================
        const lineChart = evolucaoSheet.addChart({
            type: 'line',
            title: {
                name: 'Evolução dos Recebimentos ao Longo do Tempo',
                color: '000000',
                size: 14,
            },
            categories: {
                formula: `'Evolução por Data'!$A$4:$A$${3 + evolucaoData.length}`,
            },
            values: {
                formula: `'Evolução por Data'!$B$4:$B$${3 + evolucaoData.length}`,
            },
            position: {
                type: 'twoCellAnchor',
                from: { col: 4, row: 2 },
                to: { col: 11, row: 20 }
            }
        });
    }

    // ==================== ABA 3: DETALHAMENTO ====================
    const detalhamentoSheet = workbook.addWorksheet('Detalhamento');

    // Título
    detalhamentoSheet.mergeCells('A1:G1');
    const detTitleCell = detalhamentoSheet.getCell('A1');
    detTitleCell.value = 'Detalhamento de Todas as Pendências';
    detTitleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    detTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
    };
    detTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    detalhamentoSheet.getRow(1).height = 25;

    // Tabela de detalhamento
    detalhamentoSheet.addTable({
        name: 'TabelaDetalhamento',
        ref: 'A3',
        headerRow: true,
        style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
        },
        columns: [
            { name: 'Item', filterButton: true },
            { name: 'Local', filterButton: true },
            { name: 'Descrição', filterButton: true },
            { name: 'Situação', filterButton: true },
            { name: 'Data Recebido', filterButton: true },
            { name: 'Construtora', filterButton: true },
            { name: 'Síndico', filterButton: true }
        ],
        rows: itens.map(item => [
            item.item_numero,
            item.local,
            item.descricao,
            item.situacao === 'RECEBIDO' ? 'RECEBIDO' : item.situacao === 'NAO_FARA' ? 'NÃO FARÁ' : 'PENDENTE',
            item.data_recebido ? new Date(item.data_recebido + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
            item.construtora || '-',
            item.sindico || '-'
        ])
    });

    // Ajustar larguras
    detalhamentoSheet.getColumn('A').width = 8;
    detalhamentoSheet.getColumn('B').width = 25;
    detalhamentoSheet.getColumn('C').width = 40;
    detalhamentoSheet.getColumn('D').width = 15;
    detalhamentoSheet.getColumn('E').width = 15;
    detalhamentoSheet.getColumn('F').width = 20;
    detalhamentoSheet.getColumn('G').width = 20;

    // Aplicar cores nas situações
    for (let i = 4; i < 4 + itens.length; i++) {
        const row = detalhamentoSheet.getRow(i);
        const situacaoCell = row.getCell(4);
        situacaoCell.alignment = { horizontal: 'center' };
        situacaoCell.font = { bold: true };

        const situacao = itens[i - 4].situacao;
        if (situacao === 'RECEBIDO') {
            situacaoCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF22C55E' }
            };
            situacaoCell.font = { ...situacaoCell.font, color: { argb: 'FFFFFFFF' } };
        } else if (situacao === 'NAO_FARA') {
            situacaoCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEF4444' }
            };
            situacaoCell.font = { ...situacaoCell.font, color: { argb: 'FFFFFFFF' } };
        } else {
            situacaoCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF97316' }
            };
            situacaoCell.font = { ...situacaoCell.font, color: { argb: 'FFFFFFFF' } };
        }

        // Centralizar item número e data
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(5).alignment = { horizontal: 'center' };
    }

    // ==================== GERAR E BAIXAR ARQUIVO ====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Evolucao_Recebimentos_${contratoNome.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
}
