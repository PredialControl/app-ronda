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

// Função auxiliar para truncar nome da aba (máximo 31 caracteres no Excel)
function truncarNomeAba(nome: string, index: number): string {
    const nomeBase = nome.replace(/[*?:/\\[\]]/g, '').trim(); // Remove caracteres inválidos
    if (nomeBase.length <= 28) {
        return nomeBase;
    }
    return `${nomeBase.substring(0, 25)}...(${index + 1})`;
}

// Função auxiliar para criar aba de um relatório
function criarAbaRelatorio(
    workbook: ExcelJS.Workbook,
    nomeAba: string,
    tituloRelatorio: string,
    itensRelatorio: ItemCompilado[],
    tableIndex: number
) {
    const sheet = workbook.addWorksheet(nomeAba);

    // Título
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = tituloRelatorio;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 25;

    // Resumo do relatório
    const itensApontados = itensRelatorio.length;
    const itensRecebidos = itensRelatorio.filter(i => i.situacao === 'RECEBIDO').length;
    const naoFarao = itensRelatorio.filter(i => i.situacao === 'NAO_FARA').length;
    const itensPendentes = itensRelatorio.filter(i => i.situacao === 'PENDENTE').length;

    const percentualRecebidos = itensApontados > 0 ? Math.round((itensRecebidos / itensApontados) * 100) : 0;
    const percentualPendentes = itensApontados > 0 ? Math.round((itensPendentes / itensApontados) * 100) : 0;
    const percentualNaoFarao = itensApontados > 0 ? Math.round((naoFarao / itensApontados) * 100) : 0;

    // Linha de resumo
    sheet.getCell('A2').value = `Total: ${itensApontados} | `;
    sheet.getCell('A2').font = { bold: true };

    sheet.getCell('B2').value = `Recebidos: ${itensRecebidos} (${percentualRecebidos}%)`;
    sheet.getCell('B2').font = { bold: true, color: { argb: 'FF22C55E' } };

    sheet.getCell('D2').value = `Pendentes: ${itensPendentes} (${percentualPendentes}%)`;
    sheet.getCell('D2').font = { bold: true, color: { argb: 'FFF97316' } };

    sheet.getCell('F2').value = `Não Farão: ${naoFarao} (${percentualNaoFarao}%)`;
    sheet.getCell('F2').font = { bold: true, color: { argb: 'FFEF4444' } };

    // Tabela de itens
    if (itensRelatorio.length > 0) {
        sheet.addTable({
            name: `TabelaRelatorio${tableIndex}`,
            ref: 'A4',
            headerRow: true,
            style: {
                theme: 'TableStyleMedium9',
                showRowStripes: true,
            },
            columns: [
                { name: 'Item', filterButton: true },
                { name: 'Seção', filterButton: true },
                { name: 'Local', filterButton: true },
                { name: 'Descrição', filterButton: true },
                { name: 'Situação', filterButton: true },
                { name: 'Data Recebido', filterButton: true },
                { name: 'Construtora', filterButton: true }
            ],
            rows: itensRelatorio.map((item, idx) => [
                idx + 1, // Número sequencial dentro do relatório
                item.secao_titulo,
                item.local,
                item.descricao,
                item.situacao === 'RECEBIDO' ? 'RECEBIDO' : item.situacao === 'NAO_FARA' ? 'NÃO FARÁ' : 'PENDENTE',
                item.data_recebido ? new Date(item.data_recebido + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
                item.construtora || '-'
            ])
        });

        // Ajustar larguras
        sheet.getColumn('A').width = 8;
        sheet.getColumn('B').width = 25;
        sheet.getColumn('C').width = 25;
        sheet.getColumn('D').width = 40;
        sheet.getColumn('E').width = 15;
        sheet.getColumn('F').width = 15;
        sheet.getColumn('G').width = 20;

        // Aplicar cores nas situações
        for (let i = 5; i < 5 + itensRelatorio.length; i++) {
            const row = sheet.getRow(i);
            const situacaoCell = row.getCell(5);
            situacaoCell.alignment = { horizontal: 'center' };
            situacaoCell.font = { bold: true };

            const situacao = itensRelatorio[i - 5].situacao;
            if (situacao === 'RECEBIDO') {
                situacaoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF22C55E' }
                };
                situacaoCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            } else if (situacao === 'NAO_FARA') {
                situacaoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFEF4444' }
                };
                situacaoCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            } else {
                situacaoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF97316' }
                };
                situacaoCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            }

            // Centralizar item número e data
            row.getCell(1).alignment = { horizontal: 'center' };
            row.getCell(6).alignment = { horizontal: 'center' };
        }
    }
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

    // ==================== ABA 1: RESUMO GERAL ====================
    const resumoSheet = workbook.addWorksheet('Resumo Geral', {
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

    // Estatísticas GERAIS
    const itensApontados = itens.length;
    const itensRecebidos = itens.filter(i => i.situacao === 'RECEBIDO').length;
    const naoFarao = itens.filter(i => i.situacao === 'NAO_FARA').length;
    const itensPendentes = itens.filter(i => i.situacao === 'PENDENTE').length;

    const percentualRecebidos = itensApontados > 0 ? Math.round((itensRecebidos / itensApontados) * 100) : 0;
    const percentualPendentes = itensApontados > 0 ? Math.round((itensPendentes / itensApontados) * 100) : 0;
    const percentualNaoFarao = itensApontados > 0 ? Math.round((naoFarao / itensApontados) * 100) : 0;

    // Tabela de resumo geral
    resumoSheet.addTable({
        name: 'TabelaResumoGeral',
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
        rows: [
            ['Itens Apontados', itensApontados, '100%'],
            ['Itens Recebidos', itensRecebidos, `${percentualRecebidos}%`],
            ['Não Farão', naoFarao, `${percentualNaoFarao}%`],
            ['Itens Pendentes', itensPendentes, `${percentualPendentes}%`]
        ]
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

    // Visualização visual
    if (itensApontados > 0) {
        resumoSheet.getCell('E4').value = 'Distribuição Visual';
        resumoSheet.getCell('E4').font = { size: 12, bold: true };

        const criarBarraVisual = (percentual: number) => {
            const blocos = Math.round(percentual / 5);
            return '█'.repeat(blocos);
        };

        resumoSheet.getCell('E6').value = `Recebidos (${percentualRecebidos}%)`;
        resumoSheet.getCell('F6').value = criarBarraVisual(percentualRecebidos);
        resumoSheet.getCell('F6').font = { color: { argb: 'FF22C55E' }, size: 14 };

        resumoSheet.getCell('E7').value = `Pendentes (${percentualPendentes}%)`;
        resumoSheet.getCell('F7').value = criarBarraVisual(percentualPendentes);
        resumoSheet.getCell('F7').font = { color: { argb: 'FFF97316' }, size: 14 };

        resumoSheet.getCell('E8').value = `Não Farão (${percentualNaoFarao}%)`;
        resumoSheet.getCell('F8').value = criarBarraVisual(percentualNaoFarao);
        resumoSheet.getCell('F8').font = { color: { argb: 'FFEF4444' }, size: 14 };

        resumoSheet.getColumn('E').width = 25;
        resumoSheet.getColumn('F').width = 30;
    }

    // ==================== RESUMO POR RELATÓRIO ====================
    // Agrupar itens por relatório
    const relatoriosMap = new Map<string, { titulo: string; itens: ItemCompilado[] }>();
    itens.forEach(item => {
        if (!relatoriosMap.has(item.relatorio_id)) {
            relatoriosMap.set(item.relatorio_id, {
                titulo: item.relatorio_titulo,
                itens: []
            });
        }
        relatoriosMap.get(item.relatorio_id)!.itens.push(item);
    });

    // Tabela de resumo por relatório
    if (relatoriosMap.size > 0) {
        resumoSheet.getCell('A11').value = 'Resumo por Relatório';
        resumoSheet.getCell('A11').font = { size: 14, bold: true };
        resumoSheet.mergeCells('A11:F11');

        const relatoriosArray = Array.from(relatoriosMap.entries());

        resumoSheet.addTable({
            name: 'TabelaResumoPorRelatorio',
            ref: 'A13',
            headerRow: true,
            style: {
                theme: 'TableStyleLight9',
                showRowStripes: true,
            },
            columns: [
                { name: 'Relatório', filterButton: true },
                { name: 'Total', filterButton: true },
                { name: 'Recebidos', filterButton: true },
                { name: 'Pendentes', filterButton: true },
                { name: 'Não Farão', filterButton: true },
                { name: '% Concluído', filterButton: true }
            ],
            rows: relatoriosArray.map(([_, rel]) => {
                const total = rel.itens.length;
                const recebidos = rel.itens.filter(i => i.situacao === 'RECEBIDO').length;
                const pendentes = rel.itens.filter(i => i.situacao === 'PENDENTE').length;
                const naoFara = rel.itens.filter(i => i.situacao === 'NAO_FARA').length;
                const pctConcluido = total > 0 ? Math.round((recebidos / total) * 100) : 0;
                return [rel.titulo, total, recebidos, pendentes, naoFara, `${pctConcluido}%`];
            })
        });

        // Estilizar colunas
        for (let i = 14; i < 14 + relatoriosArray.length; i++) {
            const row = resumoSheet.getRow(i);
            row.getCell(3).font = { bold: true, color: { argb: 'FF22C55E' } }; // Recebidos
            row.getCell(4).font = { bold: true, color: { argb: 'FFF97316' } }; // Pendentes
            row.getCell(5).font = { bold: true, color: { argb: 'FFEF4444' } }; // Não Farão
            row.getCell(6).font = { bold: true, color: { argb: 'FF2563EB' } }; // % Concluído
        }
    }

    // ==================== ABA 2: EVOLUÇÃO POR DATA ====================
    if (evolucaoData.length > 0) {
        const evolucaoSheet = workbook.addWorksheet('Evolução por Data');

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
                { name: 'Total Acumulado', filterButton: true },
                { name: 'Progresso', filterButton: false }
            ],
            rows: evolucaoData.map(item => [
                new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR'),
                item.quantidade,
                item.acumulado,
                ''
            ])
        });

        evolucaoSheet.getColumn('A').width = 15;
        evolucaoSheet.getColumn('B').width = 20;
        evolucaoSheet.getColumn('C').width = 20;
        evolucaoSheet.getColumn('D').width = 35;

        const maxAcumulado = evolucaoData[evolucaoData.length - 1].acumulado;

        for (let i = 4; i < 4 + evolucaoData.length; i++) {
            const dataIndex = i - 4;
            const row = evolucaoSheet.getRow(i);

            row.getCell(2).alignment = { horizontal: 'center' };
            row.getCell(3).alignment = { horizontal: 'center' };
            row.getCell(2).font = { bold: true, color: { argb: 'FF22C55E' } };
            row.getCell(3).font = { bold: true, color: { argb: 'FF2563EB' } };

            const percentual = Math.round((evolucaoData[dataIndex].acumulado / maxAcumulado) * 100);
            const blocos = Math.round(percentual / 5);

            row.getCell(4).value = '█'.repeat(blocos) + ` ${percentual}%`;
            row.getCell(4).font = { color: { argb: 'FF22C55E' }, size: 10 };
        }
    }

    // ==================== ABAS POR RELATÓRIO (uma aba para cada) ====================
    let tableIndex = 1;
    relatoriosMap.forEach((relatorio, relatorioId) => {
        const nomeAba = truncarNomeAba(relatorio.titulo, tableIndex);
        criarAbaRelatorio(workbook, nomeAba, relatorio.titulo, relatorio.itens, tableIndex);
        tableIndex++;
    });

    // ==================== GERAR E BAIXAR ARQUIVO ====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Evolucao_Recebimentos_${contratoNome.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
}
