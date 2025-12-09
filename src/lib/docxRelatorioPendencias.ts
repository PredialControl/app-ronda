import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, ImageRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { RelatorioPendencias, Contrato } from '@/types';

export async function generateRelatorioPendenciasDOCX(relatorio: RelatorioPendencias, contrato: Contrato) {
    const children: (Paragraph | Table)[] = [];

    // Header com título do relatório
    children.push(
        new Paragraph({
            text: relatorio.titulo,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );

    // Para cada seção
    for (const secao of relatorio.secoes || []) {
        // Título Principal
        children.push(
            new Paragraph({
                text: secao.titulo_principal,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
                bold: true,
            })
        );

        // Subtítulo
        children.push(
            new Paragraph({
                text: secao.subtitulo,
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200 },
                bold: true,
            })
        );

        // Para cada pendência na seção
        for (const pendencia of secao.pendencias || []) {
            // Criar tabela para a pendência
            const tableRows: TableRow[] = [];

            // Primeira linha: número, local e descrição
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 800, type: WidthType.DXA },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: pendencia.ordem + 1 + '',
                                            bold: true,
                                            size: 24,
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 8200, type: WidthType.DXA },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Local: ',
                                            bold: true,
                                        }),
                                        new TextRun({
                                            text: pendencia.local,
                                        }),
                                    ],
                                    spacing: { after: 100 },
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Pendência: ',
                                            bold: true,
                                        }),
                                        new TextRun({
                                            text: pendencia.descricao,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                })
            );

            // Segunda linha: imagem (se houver)
            if (pendencia.foto_url) {
                try {
                    const imageResponse = await fetch(pendencia.foto_url);
                    const imageBuffer = await imageResponse.arrayBuffer();

                    tableRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: imageBuffer,
                                                    transformation: {
                                                        width: 400,
                                                        height: 300,
                                                    },
                                                }),
                                            ],
                                            alignment: AlignmentType.LEFT,
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                } catch (error) {
                    console.error('Erro ao carregar imagem:', error);
                    tableRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    children: [
                                        new Paragraph({
                                            text: '[Erro ao carregar imagem]',
                                            italics: true,
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                }
            } else {
                // Linha vazia para pendências sem foto
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                columnSpan: 2,
                                children: [new Paragraph({ text: '' })],
                            }),
                        ],
                    })
                );
            }

            // Adicionar tabela ao documento
            children.push(
                new Table({
                    width: { size: 9000, type: WidthType.DXA },
                    rows: tableRows,
                    margins: {
                        top: 100,
                        bottom: 100,
                        left: 100,
                        right: 100,
                    },
                })
            );

            // Espaçamento entre tabelas
            children.push(
                new Paragraph({
                    text: '',
                    spacing: { after: 200 },
                })
            );
        }

        // Espaço entre seções
        children.push(
            new Paragraph({
                text: '',
                spacing: { after: 400 },
            })
        );
    }

    // Criar documento
    const doc = new Document({
        sections: [
            {
                properties: {},
                children,
            },
        ],
    });

    // Gerar e salvar
    const blob = await Packer.toBlob(doc);
    const fileName = `${relatorio.titulo.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
}
