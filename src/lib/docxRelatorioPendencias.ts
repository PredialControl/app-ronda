import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, ImageRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { RelatorioPendencias } from '@/types';

export async function generateRelatorioPendenciasDOCX(relatorio: RelatorioPendencias) {
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
        // Título Principal e Subtítulo da Seção
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: secao.titulo_principal,
                        bold: true,
                        size: 28, // 14pt
                    }),
                ],
                spacing: { before: 400, after: 100 },
            })
        );

        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: secao.subtitulo,
                        bold: true,
                        size: 24, // 12pt
                    }),
                ],
                spacing: { after: 200 },
            })
        );

        // Para cada pendência na seção
        for (const pendencia of secao.pendencias || []) {
            // Criar tabela para a pendência com layout específico
            // Grid: [10%, 40%, 50%]
            // Row 1: Cell 1 (Nº) span 1, Cell 2 (Texto) span 2
            // Row 2: Cell 1 (Foto) span 2 (10+40=50%), Cell 2 (Vazio) span 1 (50%)

            const tableRows: TableRow[] = [];

            // ================= ROW 1: Número e Texto =================
            const row1Cells: TableCell[] = [];

            // Célula 1: Número (10%)
            row1Cells.push(
                new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: (pendencia.ordem + 1).toString(),
                                    bold: true,
                                    size: 48, // 24pt
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                })
            );

            // Célula 2: Texto (90% - span 2 colunas virtuais)
            row1Cells.push(
                new TableCell({
                    width: { size: 90, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Local: ',
                                    bold: true,
                                    size: 22, // 11pt
                                }),
                                new TextRun({
                                    text: pendencia.local,
                                    size: 22,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Pendência: ',
                                    bold: true,
                                    size: 22, // 11pt
                                }),
                                new TextRun({
                                    text: pendencia.descricao,
                                    size: 22,
                                }),
                            ],
                        }),
                    ],
                })
            );

            tableRows.push(new TableRow({ children: row1Cells }));

            // ================= ROW 2: Foto e Espaço Vazio =================
            const row2Cells: TableCell[] = [];

            // Célula 1: Foto (50% - span 2 colunas virtuais se considerarmos grid complexo, ou span 1 com width manual)
            // Vamos usar width manual para garantir.

            let photoParagraph: Paragraph;

            if (pendencia.foto_url) {
                try {
                    // Tentar baixar a imagem e converter para Uint8Array
                    const imageResponse = await fetch(pendencia.foto_url);
                    const imageBuffer = await imageResponse.arrayBuffer();

                    photoParagraph = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: 300, // Largura ajustada para caber na meia página
                                    height: 225, // Proporção 4:3
                                },
                                type: "png", // Adicionado para satisfazer IImageOptions
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                    });
                } catch (error) {
                    console.error('Erro ao carregar imagem:', error);
                    photoParagraph = new Paragraph({
                        children: [
                            new TextRun({
                                text: '[Erro ao carregar imagem]',
                                italics: true,
                                color: 'FF0000',
                            }),
                            new TextRun({
                                text: ` URL: ${pendencia.foto_url}`,
                                size: 16,
                            }),
                        ],
                    });
                }
            } else {
                photoParagraph = new Paragraph({ text: '' });
            }

            row2Cells.push(
                new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [photoParagraph],
                    verticalAlign: VerticalAlign.CENTER,
                })
            );

            // Célula 2: Vazia (50%)
            row2Cells.push(
                new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({})],
                })
            );

            tableRows.push(new TableRow({ children: row2Cells }));

            // Adicionar tabela ao documento
            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
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
                    spacing: { after: 400 },
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
