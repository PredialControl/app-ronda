import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    TableOfContents,
    PageNumber,
    NumberFormat,
    Footer,
    Header,
    PageBreak,
    LevelFormat,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ImageRun,
    VerticalAlign,
} from 'docx';
// @ts-ignore
import { saveAs } from 'file-saver';
import { ParecerTecnico as ParecerTecnicoType, Contrato } from '@/types';

// Converter cm para twips (1 cm = 567 twips)
const cmToTwip = (cm: number) => Math.round(cm * 567);

// Configuração ABNT
const ABNT_CONFIG = {
    margins: {
        top: cmToTwip(2.5),
        right: cmToTwip(2.5),
        bottom: cmToTwip(2.5),
        left: cmToTwip(2.5),
    },
    font: 'Arial',
    fontSize: 24, // 12pt = 24 half-points
    lineSpacing: 360, // 1.5 line spacing
};

// Função para converter número para romano
function toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];

    let result = '';
    for (const [value, numeral] of romanNumerals) {
        while (num >= value) {
            result += numeral;
            num -= value;
        }
    }
    return result;
}

// Helper para carregar imagem como ArrayBuffer
async function loadImage(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    return await response.arrayBuffer();
}

// Função para criar cabeçalho (Tabela igual ao PDF/Imagem de referência)
async function createHeader(contrato: Contrato, parecer: ParecerTecnicoType): Promise<Header> {
    // Tentar carregar logo
    let logoImage: ArrayBuffer | null = null;
    try {
        logoImage = await loadImage('/logo-header.png');
    } catch (e) {
        console.warn('Logo não encontrada');
    }

    // Dimensões A4 exatas (21cm = 11906 twips)
    const pageWidthTwips = 11906;
    const docMarginTwips = cmToTwip(2.5); // 1417 twips
    const desiredMarginTwips = cmToTwip(0.5); // 0.5cm de margem visual

    // Largura da tabela = Página - 2 * Margem Desejada
    const tableWidthTwips = pageWidthTwips - (desiredMarginTwips * 2);

    // Recuo negativo = -(Margem do Doc - Margem Desejada)
    const indentTwips = -(docMarginTwips - desiredMarginTwips);

    // Larguras das colunas (Total = 100%)
    const col1Width = 15; // Logo
    const col3Width = 30; // Info
    const col2Width = 55; // Título

    const table = new Table({
        width: {
            size: tableWidthTwips,
            type: WidthType.DXA,
        },
        indent: {
            size: indentTwips,
            type: WidthType.DXA,
        },
        layout: 'fixed',
        rows: [
            new TableRow({
                height: { value: cmToTwip(2.5), rule: 'exact' }, // Altura EXATA de 2.5cm (25mm)
                children: [
                    // Coluna 1: Logo
                    new TableCell({
                        width: { size: col1Width, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: logoImage ? [
                                    new ImageRun({
                                        data: logoImage,
                                        transformation: { width: 58, height: 58 }, // Aumentado levemente
                                        type: 'png',
                                    }),
                                ] : [new TextRun("Logo")],
                            }),
                        ],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.NONE }, // Sem borda lateral esquerda
                            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        }
                    }),
                    // Coluna 2: Título Dinâmico
                    new TableCell({
                        width: { size: col2Width, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: parecer.titulo || "Relatório de Constatação", // Título dinâmico
                                        bold: true,
                                        size: 24, // 12pt
                                        font: ABNT_CONFIG.font,
                                    }),
                                ],
                            }),
                        ],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        }
                    }),
                    // Coluna 3: Informações (Tabela Aninhada)
                    new TableCell({
                        width: { size: col3Width, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                layout: 'fixed',
                                rows: [
                                    // Linha 1: Condomínio
                                    new TableRow({
                                        height: { value: cmToTwip(0.8), rule: 'atLeast' }, // ~0.8cm
                                        children: [
                                            new TableCell({
                                                columnSpan: 2,
                                                verticalAlign: VerticalAlign.CENTER,
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.CENTER,
                                                        children: [new TextRun({ text: "Condomínio", size: 16, bold: true })]
                                                    })
                                                ],
                                                borders: {
                                                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                                    left: { style: BorderStyle.NONE },
                                                    right: { style: BorderStyle.NONE },
                                                    top: { style: BorderStyle.NONE }
                                                }
                                            })
                                        ]
                                    }),
                                    // Linha 2: Nome | Pág
                                    new TableRow({
                                        height: { value: cmToTwip(0.8), rule: 'atLeast' }, // ~0.8cm
                                        children: [
                                            new TableCell({
                                                width: { size: 60, type: WidthType.PERCENTAGE },
                                                verticalAlign: VerticalAlign.CENTER,
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.LEFT,
                                                        children: [new TextRun({ text: contrato.nome, size: 14 })]
                                                    })
                                                ],
                                                borders: {
                                                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                                    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                                    left: { style: BorderStyle.NONE },
                                                    top: { style: BorderStyle.NONE }
                                                }
                                            }),
                                            new TableCell({
                                                width: { size: 40, type: WidthType.PERCENTAGE },
                                                verticalAlign: VerticalAlign.CENTER,
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.LEFT,
                                                        children: [
                                                            new TextRun({ text: "Pág: ", size: 14 }),
                                                            new TextRun({ children: [PageNumber.CURRENT, "/", PageNumber.TOTAL_PAGES], size: 14 })
                                                        ]
                                                    })
                                                ],
                                                borders: {
                                                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                                    left: { style: BorderStyle.NONE },
                                                    right: { style: BorderStyle.NONE },
                                                    top: { style: BorderStyle.NONE }
                                                }
                                            })
                                        ]
                                    }),
                                    // Linha 3: Data | Rev
                                    new TableRow({
                                        height: { value: cmToTwip(0.8), rule: 'atLeast' }, // ~0.8cm
                                        children: [
                                            new TableCell({
                                                width: { size: 60, type: WidthType.PERCENTAGE },
                                                verticalAlign: VerticalAlign.CENTER,
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.LEFT,
                                                        children: [new TextRun({ text: `Data: ${new Date(parecer.created_at).toLocaleDateString('pt-BR')}`, size: 14 })]
                                                    })
                                                ],
                                                borders: {
                                                    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                                    bottom: { style: BorderStyle.NONE },
                                                    left: { style: BorderStyle.NONE },
                                                    top: { style: BorderStyle.NONE }
                                                }
                                            }),
                                            new TableCell({
                                                width: { size: 40, type: WidthType.PERCENTAGE },
                                                verticalAlign: VerticalAlign.CENTER,
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.LEFT,
                                                        children: [new TextRun({ text: "Rev: 00", size: 14 })]
                                                    })
                                                ],
                                                borders: {
                                                    bottom: { style: BorderStyle.NONE },
                                                    left: { style: BorderStyle.NONE },
                                                    right: { style: BorderStyle.NONE },
                                                    top: { style: BorderStyle.NONE }
                                                }
                                            })
                                        ]
                                    }),
                                ]
                            })
                        ],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE }, // Sem borda lateral direita
                        }
                    }),
                ],
            }),
        ],
    });

    return new Header({
        children: [table, new Paragraph({ spacing: { after: 200 } })],
    });
}

// Função para criar rodapé
async function createFooter(): Promise<Footer> {
    let footerImage: ArrayBuffer | null = null;
    try {
        footerImage = await loadImage('/rodape-padrao.png');
    } catch (e) {
        console.warn('Rodapé não encontrado');
    }

    // Dimensões A4 exatas
    const marginTwips = cmToTwip(2.5);

    return new Footer({
        children: [
            new Paragraph({
                children: footerImage ? [
                    new ImageRun({
                        data: footerImage,
                        transformation: { width: 794, height: 75 }, // Aumentado para ~2cm
                        type: 'png',
                    }),
                ] : [],
                alignment: AlignmentType.CENTER,
                indent: {
                    left: -marginTwips,
                    right: -marginTwips
                }
            }),
        ],
    });
}

// Função principal para gerar DOCX
export async function generateParecerTecnicoDOCX(
    parecer: ParecerTecnicoType,
    contrato: Contrato
): Promise<void> {
    try {
        const header = await createHeader(contrato, parecer);
        const footer = await createFooter();

        const sections: any[] = [];

        // Seção 1: Capa
        if (parecer.capa_url) {
            // Capa personalizada com imagem
            try {
                const capaImage = await loadImage(parecer.capa_url);
                sections.push({
                    properties: {
                        page: {
                            margin: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                            }
                        },
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: capaImage,
                                    transformation: {
                                        width: 794, // Largura A4 em pixels (21cm)
                                        height: 1123, // Altura A4 em pixels (29.7cm)
                                    },
                                    type: 'png',
                                }),
                            ],
                            spacing: { before: 0, after: 0 },
                            pageBreakBefore: true, // Garante que a próxima seção comece em nova página
                        }),
                    ],
                });
            } catch (error) {
                console.error('Erro ao carregar capa:', error);
                // Fallback para capa text se falhar
                sections.push({
                    properties: {
                        page: {
                            margin: {
                                ...ABNT_CONFIG.margins,
                                header: 0,
                                footer: 0
                            }
                        },
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'PARECER TÉCNICO DE ENGENHARIA',
                                    font: ABNT_CONFIG.font,
                                    size: 48,
                                    bold: true,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: cmToTwip(10), after: cmToTwip(2) },
                        }),
                        new Paragraph({ children: [new PageBreak()] }),
                    ],
                });
            }
        } else {
            // Capa texto padrão
            sections.push({
                properties: {
                    page: {
                        margin: {
                            ...ABNT_CONFIG.margins,
                            header: 0,
                            footer: 0
                        }
                    },
                },
                children: [
                    // Espaçamento superior
                    new Paragraph({
                        text: '',
                        spacing: { before: cmToTwip(7) },
                    }),
                    // Título principal fixo
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'PARECER',
                                font: ABNT_CONFIG.font,
                                size: 48, // 24pt
                                bold: true,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: cmToTwip(0.1) },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'TÉCNICO DE',
                                font: ABNT_CONFIG.font,
                                size: 48,
                                bold: true,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: cmToTwip(0.1) },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'ENGENHARIA',
                                font: ABNT_CONFIG.font,
                                size: 48,
                                bold: true,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: cmToTwip(4) },
                    }),
                    // Título do parecer (dinâmico) - Substitui "ILUMINAÇÃO EXTERNA"
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: parecer.titulo.toUpperCase(),
                                font: ABNT_CONFIG.font,
                                size: 32, // 16pt
                                bold: true,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: cmToTwip(0.5) },
                    }),
                    // Nome do contrato - Substitui "GRIFFE POR DUBAI"
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: contrato.nome.toUpperCase(),
                                font: ABNT_CONFIG.font,
                                size: 32,
                                bold: true,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: cmToTwip(2) },
                    }),
                    // Quebra de página
                    new Paragraph({ children: [new PageBreak()] }),
                ],
            });
        }

        // Seção 2: Conteúdo com Cabeçalho e Rodapé
        const contentChildren: (Paragraph | TableOfContents)[] = [];

        // Sumário
        contentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Sumário",
                        bold: true,
                        size: 24, // 12pt
                        font: ABNT_CONFIG.font,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: cmToTwip(0.5),
                    after: cmToTwip(0.5),
                },
            }),
            new TableOfContents("Sumário", {
                headingStyleRange: "1-5",
            }),
            new Paragraph({
                children: [new PageBreak()],
            })
        );

        // I – Finalidade
        contentChildren.push(
            new Paragraph({
                text: `${toRoman(1)} – FINALIDADE DO RELATÓRIO`,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
                spacing: {
                    before: cmToTwip(0.5),
                    after: cmToTwip(0.3),
                    line: ABNT_CONFIG.lineSpacing,
                },
            })
        );

        parecer.finalidade.split('\n').filter(p => p.trim()).forEach(parag => {
            contentChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: parag,
                            font: ABNT_CONFIG.font,
                            size: ABNT_CONFIG.fontSize,
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: {
                        after: cmToTwip(0.3),
                        line: ABNT_CONFIG.lineSpacing,
                    },
                    indent: { firstLine: cmToTwip(1.25) },
                })
            );
        });

        // II – Narrativa
        contentChildren.push(
            new Paragraph({
                text: `${toRoman(2)} – NARRATIVA DO CENÁRIO`,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
                spacing: {
                    before: cmToTwip(0.5),
                    after: cmToTwip(0.3),
                    line: ABNT_CONFIG.lineSpacing,
                },
            })
        );

        parecer.narrativa_cenario.split('\n').filter(p => p.trim()).forEach(parag => {
            contentChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: parag,
                            font: ABNT_CONFIG.font,
                            size: ABNT_CONFIG.fontSize,
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: {
                        after: cmToTwip(0.3),
                        line: ABNT_CONFIG.lineSpacing,
                    },
                    indent: { firstLine: cmToTwip(1.25) },
                })
            );
        });

        // Tópicos Dinâmicos (III, IV, V...)
        console.log('Processando tópicos:', parecer.topicos?.length);
        if (parecer.topicos && parecer.topicos.length > 0) {
            const sortedTopicos = [...parecer.topicos].sort((a, b) => a.ordem - b.ordem);
            let imageCounter = 1;

            for (let i = 0; i < sortedTopicos.length; i++) {
                const topico = sortedTopicos[i];
                const topicoNumber = i + 3; // Começa do III
                const isLastTopico = i === sortedTopicos.length - 1;

                // Título do tópico em romano
                contentChildren.push(
                    new Paragraph({
                        text: `${toRoman(topicoNumber)} – ${topico.titulo.toUpperCase()}`,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.LEFT,
                        spacing: {
                            before: cmToTwip(0.5),
                            after: cmToTwip(0.3),
                            line: ABNT_CONFIG.lineSpacing,
                        },
                        // Manter com próxima linha se for o último tópico
                        keepNext: isLastTopico,
                    })
                );

                // Descrição
                topico.descricao.split('\n').filter(p => p.trim()).forEach((parag, pIdx, arr) => {
                    const isLastParagraph = pIdx === arr.length - 1;
                    contentChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: parag,
                                    font: ABNT_CONFIG.font,
                                    size: ABNT_CONFIG.fontSize,
                                }),
                            ],
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: {
                                after: cmToTwip(0.3),
                                line: ABNT_CONFIG.lineSpacing,
                            },
                            indent: { firstLine: cmToTwip(1.25) },
                            // Se for último tópico e último parágrafo, manter com assinatura
                            keepNext: isLastTopico && isLastParagraph,
                        })
                    );
                });

                // Imagens
                if (topico.imagens && topico.imagens.length > 0) {
                    const sortedImages = [...topico.imagens].sort((a, b) => a.ordem - b.ordem);

                    for (const imagem of sortedImages) {
                        const imageNumberFormatted = String(imageCounter).padStart(2, '0');

                        try {
                            console.log(`Carregando imagem ${imageNumberFormatted}:`, imagem.url);
                            const imageBuffer = await loadImage(imagem.url);

                            // Adicionar imagem
                            contentChildren.push(
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: imageBuffer,
                                            transformation: {
                                                width: 400, // ~14cm
                                                height: 300, // Proporcional (será ajustado pelo word se necessário, mas definimos um padrão)
                                            },
                                            type: 'png', // Tentar png, docx detecta
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    spacing: {
                                        before: cmToTwip(0.3),
                                        after: cmToTwip(0.1),
                                    },
                                })
                            );

                            // Adicionar legenda
                            contentChildren.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `Imagem ${imageNumberFormatted} – ${imagem.descricao}`,
                                            font: ABNT_CONFIG.font,
                                            size: 20, // 10pt
                                            italics: true,
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    spacing: {
                                        after: cmToTwip(0.5),
                                    },
                                })
                            );
                        } catch (error) {
                            console.error(`Erro ao carregar imagem ${imagem.url}:`, error);
                            // Fallback para texto em caso de erro
                            contentChildren.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `[Erro ao carregar Imagem ${imageNumberFormatted} – ${imagem.descricao}]`,
                                            font: ABNT_CONFIG.font,
                                            size: 22,
                                            color: "FF0000",
                                            italics: true,
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    spacing: {
                                        before: cmToTwip(0.3),
                                        after: cmToTwip(0.5),
                                    },
                                })
                            );
                        }

                        imageCounter++;
                    }
                }
            }
        }

        // Assinatura (canto inferior esquerdo, mesma página do último tópico)
        contentChildren.push(
            new Paragraph({
                text: '',
                spacing: {
                    before: cmToTwip(1), // Reduzido de 3cm para 1cm
                    after: cmToTwip(0.3),
                },
            })
        );

        contentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: '_'.repeat(29), // Aproximadamente o tamanho de "Supervisor Ricardo Oliveira"
                        font: ABNT_CONFIG.font,
                        size: ABNT_CONFIG.fontSize,
                    }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: {
                    after: cmToTwip(0.1),
                },
            })
        );

        contentChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Supervisor Ricardo Oliveira',
                        font: ABNT_CONFIG.font,
                        size: ABNT_CONFIG.fontSize,
                        bold: true,
                    }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: {
                    after: cmToTwip(0.5),
                },
            })
        );

        sections.push({
            properties: {
                page: {
                    margin: {
                        ...ABNT_CONFIG.margins,
                        header: cmToTwip(0.4), // 0.4cm do topo
                        footer: 0  // Rodapé colado no fundo
                    },
                    pageNumbers: {
                        start: 1,
                        formatType: NumberFormat.DECIMAL,
                    },
                },
            },
            headers: { default: header },
            footers: { default: footer },
            children: contentChildren,
        });

        // Criar documento
        const doc = new Document({
            sections,
            numbering: {
                config: [
                    {
                        reference: 'parecer-numbering',
                        levels: [
                            {
                                level: 0,
                                format: LevelFormat.UPPER_ROMAN,
                                text: '%1',
                                alignment: AlignmentType.LEFT,
                            },
                        ],
                    },
                ],
            },
            styles: {
                default: {
                    document: {
                        run: {
                            font: ABNT_CONFIG.font,
                            size: ABNT_CONFIG.fontSize,
                        },
                        paragraph: {
                            spacing: { line: ABNT_CONFIG.lineSpacing },
                        },
                    },
                    heading1: {
                        run: {
                            font: ABNT_CONFIG.font,
                            size: ABNT_CONFIG.fontSize,
                            bold: true,
                        },
                        paragraph: {
                            spacing: {
                                before: cmToTwip(0.5),
                                after: cmToTwip(0.3),
                                line: ABNT_CONFIG.lineSpacing,
                            },
                        },
                    },
                },
            },
        });

        // Gerar e baixar
        const blob = await Packer.toBlob(doc);
        const fileName = `Parecer_Tecnico_${contrato.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        saveAs(blob, fileName);

        console.log('✅ DOCX gerado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao gerar DOCX:', error);
        throw error;
    }
}
