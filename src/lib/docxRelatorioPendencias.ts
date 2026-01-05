import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, ImageRun, HeadingLevel, PageBreak, Header, Footer, PageNumber, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { RelatorioPendencias, Contrato } from '@/types';

// Converter cm para twips (1 cm = 567 twips)
const cmToTwip = (cm: number) => Math.round(cm * 567);

// Função para carregar imagem como ArrayBuffer
async function loadImage(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    return await response.arrayBuffer();
}

// Função para criar cabeçalho
async function createHeader(relatorio: RelatorioPendencias, contrato: Contrato): Promise<Header> {
    // Tentar carregar logo
    let logoImage: ArrayBuffer | null = null;
    try {
        logoImage = await loadImage('/logo-header.png');
    } catch (e) {
        console.warn('Logo não encontrada');
    }

    // Dimensões A4 exatas (21cm = 11906 twips)
    const pageWidthTwips = 11906;
    const docMarginLeftTwips = cmToTwip(3.0); // Margem esquerda ABNT
    const docMarginRightTwips = cmToTwip(2.0); // Margem direita ABNT
    const desiredMarginTwips = cmToTwip(0.5);

    const tableWidthTwips = pageWidthTwips - (desiredMarginTwips * 2);
    const indentTwips = -(docMarginLeftTwips - desiredMarginTwips);

    // Larguras das colunas em twips (valores fixos para alinhamento perfeito)
    const col1WidthTwips = cmToTwip(2.5); // Logo - 2.5cm
    const col2WidthTwips = cmToTwip(11.0); // Título - 11cm
    const col3WidthTwips = cmToTwip(5.0); // Nome do condomínio - 5cm
    const col4WidthTwips = cmToTwip(2.0); // Pág - 2cm

    const table = new Table({
        width: { size: tableWidthTwips, type: WidthType.DXA },
        indent: { size: indentTwips, type: WidthType.DXA },
        layout: 'fixed',
        rows: [
            // Linha 1: Logo | Título | Condomínio (título)
            new TableRow({
                height: { value: cmToTwip(0.7), rule: 'atLeast' },
                children: [
                    // Logo (rowSpan 3)
                    new TableCell({
                        width: { size: col1WidthTwips, type: WidthType.DXA },
                        rowSpan: 3,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: logoImage ? [
                                    new ImageRun({
                                        data: logoImage,
                                        transformation: { width: 70, height: 70 },
                                        type: 'png',
                                    }),
                                ] : [new TextRun("Logo")],
                            }),
                        ],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        }
                    }),
                    // Título (rowSpan 3)
                    new TableCell({
                        width: { size: col2WidthTwips, type: WidthType.DXA },
                        rowSpan: 3,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: relatorio.titulo || "Relatório de Pendências",
                                        bold: true,
                                        size: 24,
                                        font: 'Arial',
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
                    // Condomínio (colSpan 2)
                    new TableCell({
                        width: { size: col3WidthTwips + col4WidthTwips, type: WidthType.DXA },
                        columnSpan: 2,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: "Condomínio", size: 16, bold: true })]
                            })
                        ],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                        }
                    }),
                ],
            }),
            // Linha 2: Nome | Pág
            new TableRow({
                height: { value: cmToTwip(0.7), rule: 'atLeast' },
                children: [
                    // Nome do condomínio
                    new TableCell({
                        width: { size: col3WidthTwips, type: WidthType.DXA },
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
                    // Pág
                    new TableCell({
                        width: { size: col4WidthTwips, type: WidthType.DXA },
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
                ],
            }),
            // Linha 3: Data | Rev
            new TableRow({
                height: { value: cmToTwip(0.7), rule: 'atLeast' },
                children: [
                    // Data
                    new TableCell({
                        width: { size: col3WidthTwips, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [new TextRun({ text: `Data: ${new Date().toLocaleDateString('pt-BR')}`, size: 14 })]
                            })
                        ],
                        borders: {
                            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            top: { style: BorderStyle.NONE }
                        }
                    }),
                    // Rev
                    new TableCell({
                        width: { size: col4WidthTwips, type: WidthType.DXA },
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
                ],
            }),
        ],
    });

    return new Header({
        children: [table, new Paragraph({ spacing: { after: 20 } })],
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
    const pageWidthTwips = 11906;
    const docMarginLeftTwips = cmToTwip(3.0); // Margem esquerda do documento
    const docMarginRightTwips = cmToTwip(2.0); // Margem direita do documento

    // Largura da imagem ocupando toda a página (de borda a borda)
    const footerImageWidth = pageWidthTwips;

    return new Footer({
        children: [
            new Paragraph({
                children: footerImage ? [
                    new ImageRun({
                        data: footerImage,
                        transformation: {
                            width: footerImageWidth / 15, // Largura total da página
                            height: 75
                        },
                        type: 'png',
                    }),
                ] : [],
                alignment: AlignmentType.CENTER,
                indent: {
                    left: -docMarginLeftTwips, // Compensar margem esquerda completamente
                    right: -docMarginRightTwips // Compensar margem direita completamente
                },
                spacing: {
                    before: 0,
                    after: 0
                }
            }),
        ],
    });
}

export async function generateRelatorioPendenciasDOCX(relatorio: RelatorioPendencias, contrato: Contrato) {
    // Seções do documento
    const sections: any[] = [];

    // SEÇÃO 1: Capa (se existir) - SEM cabeçalho e rodapé
    if (relatorio.capa_url) {
        try {
            const capaImage = await loadImage(relatorio.capa_url);

            // Dimensões A4 ajustadas para não cortar
            // 21cm x 29.7cm em pixels (72 DPI padrão Word)
            const a4WidthFull = 794; // 21cm = 794 pixels
            const a4HeightFull = 1122; // 29.7cm = 1122 pixels

            sections.push({
                properties: {
                    page: {
                        margin: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            header: 0,
                            footer: 0,
                        },
                    },
                },
                children: [
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: new Uint8Array(capaImage),
                                transformation: {
                                    width: a4WidthFull,
                                    height: a4HeightFull,
                                },
                                type: 'png',
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 0 },
                    }),
                ],
            });
        } catch (error) {
            console.error('Erro ao carregar capa:', error);
            // Continuar sem a capa se houver erro
        }
    }

    // SEÇÃO 2: Conteúdo principal - COM cabeçalho e rodapé
    const children: (Paragraph | Table)[] = [];

    // ==================== SUMÁRIO AUTOMÁTICO ====================
    // Adicionar página de sumário
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'SUMÁRIO',
                    bold: true,
                    size: 24, // 12pt (ABNT padrão para títulos)
                    font: 'Arial',
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400, line: 360 },
        })
    );

    // I - APRESENTAÇÃO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'I – APRESENTAÇÃO',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // II - OBJETIVO DO RELATÓRIO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'II – OBJETIVO DO RELATÓRIO',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // III - REFERÊNCIA NORMATIVA
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'III – REFERÊNCIA NORMATIVA',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // IV - PRINCÍPIOS E RESSALVAS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IV – PRINCÍPIOS E RESSALVAS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // V - EMPREENDIMENTO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'V – EMPREENDIMENTO',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // VI - HISTÓRICO DAS VISITAS E ATIVIDADES
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VI – HISTÓRICO DAS VISITAS E ATIVIDADES',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // VII - SITUAÇÃO ATUAL DAS VISTORIAS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VII – SITUAÇÃO ATUAL DAS VISTORIAS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // VIII - ITENS QUE PRECISAM SER CORRIGIDOS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VIII – ITENS QUE PRECISAM SER CORRIGIDOS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // Listar todas as seções (VIII.1, VIII.2, etc)
    if (relatorio.secoes && relatorio.secoes.length > 0) {
        for (let i = 0; i < relatorio.secoes.length; i++) {
            const secao = relatorio.secoes[i];

            // Título principal da seção com numeração romana
            if (secao.titulo_principal && secao.titulo_principal.trim()) {
                const numeroSecao = `VIII.${i + 1}`;
                const tituloComNumero = `${numeroSecao} – ${secao.titulo_principal}`;

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: tituloComNumero,
                                bold: true,
                                size: 24, // 12pt (ABNT)
                                font: 'Arial',
                            }),
                        ],
                        spacing: { before: 200, after: 100, line: 360 },
                        indent: { left: 800 }, // Mais recuado (subitem de VIII)
                    })
                );
            }

            // Se tem subseções (VIII.1A, VIII.1B, etc.)
            if (secao.tem_subsecoes && secao.subsecoes && secao.subsecoes.length > 0) {
                for (let j = 0; j < secao.subsecoes.length; j++) {
                    const subsecao = secao.subsecoes[j];
                    const letraSubsecao = String.fromCharCode(65 + j); // 65 = 'A', 66 = 'B', etc.
                    const numeroSubsecao = `VIII.${i + 1}${letraSubsecao}`;
                    const tituloSubsecao = `${numeroSubsecao} – ${subsecao.titulo}`;

                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: tituloSubsecao,
                                    size: 24, // 12pt (ABNT)
                                    font: 'Arial',
                                }),
                            ],
                            spacing: { after: 100, line: 360 },
                            indent: { left: 1200 }, // Recuado (subitem de VIII.X)
                        })
                    );
                }
            } else if (secao.subtitulo && secao.subtitulo.trim()) {
                // Subtítulo da seção (modo antigo, sem letras)
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: secao.subtitulo,
                                size: 24, // 12pt (ABNT)
                                font: 'Arial',
                            }),
                        ],
                        spacing: { after: 100, line: 360 },
                        indent: { left: 1200 }, // Ainda mais recuado (subitem de VIII.X)
                    })
                );
            }
        }
    }

    // IX - DOCUMENTAÇÃO TÉCNICA
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX – DOCUMENTAÇÃO TÉCNICA',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // IX.1 - MANUAL DE USO, OPERAÇÃO E MANUTENÇÃO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.1 – MANUAL DE USO, OPERAÇÃO E MANUTENÇÃO',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 800 },
        })
    );

    // IX.2 - PROJETOS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.2 – PROJETOS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 800 },
        })
    );

    // IX.3 - LAUDOS E CERTIFICADOS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.3 – LAUDOS E CERTIFICADOS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 800 },
        })
    );

    // IX.4 - NOTAS FISCAIS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.4 – NOTAS FISCAIS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 800 },
        })
    );

    // X - CONSIDERAÇÕES FINAIS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'X – CONSIDERAÇÕES FINAIS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 200, after: 100, line: 360 },
            indent: { left: 400 },
        })
    );

    // Quebra de página após o sumário
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // ==================== PÁGINA 3: APRESENTAÇÃO E OBJETIVO ====================

    // I – APRESENTAÇÃO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'I – APRESENTAÇÃO',
                    bold: true,
                    size: 24, // 12pt (ABNT)
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 300, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'A etapa de Entrega/Recebimento da edificação é um momento crucial para a vida do condomínio.',
                    size: 24, // 12pt (ABNT)
                    font: 'Arial',
                }),
            ],
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.JUSTIFIED, // Justificado (ABNT)
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Esse é o momento para testar todos os equipamentos e sistemas, inspecionar a edificação e verificar se existem vícios construtivos e/ou normativos, e corrigir todos antes da ocupação do imóvel.',
                    size: 24, // 12pt
                }),
            ],
            spacing: { after: 400 },
        })
    );

    // II – OBJETIVO DO RELATÓRIO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'II – OBJETIVO DO RELATÓRIO',
                    bold: true,
                    size: 28, // 14pt
                }),
            ],
            spacing: { before: 400, after: 300 },
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Este relatório tem como finalidade registrar todos os itens encontrados em vistoria, que precisam ser corrigidos no ',
                    size: 24, // 12pt
                }),
                new TextRun({
                    text: contrato.nome,
                    size: 24,
                    bold: true,
                }),
                new TextRun({
                    text: '.',
                    size: 24,
                }),
            ],
            spacing: { after: 200 },
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Todos os apontamentos foram feitos embasados em Normas Técnicas, Legislações e expertise proveniente da vivência em Manutenção Predial.',
                    size: 24, // 12pt
                }),
            ],
            spacing: { after: 400 },
        })
    );

    // Quebra de página após apresentação
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // ==================== PÁGINA 4: REFERÊNCIA NORMATIVA ====================

    // III – REFERÊNCIA NORMATIVA
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'III – REFERÊNCIA NORMATIVA',
                    bold: true,
                    size: 28, // 14pt
                }),
            ],
            spacing: { before: 400, after: 300 },
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Todas as inspeções de recebimento foram realizadas conforme os padrões estabelecidos nas seguintes normas:',
                    size: 24, // 12pt
                }),
            ],
            spacing: { after: 300 },
        })
    );

    // Lista de normas
    const normas = [
        'NBR-5410 Instalações elétricas de baixa tensão',
        'NBR-5462 Confiabilidade e maneabilidade',
        'NBR-5674 Manutenção de edificações',
        'NBR-9050 Acessibilidade a edificações, mobiliário, espaços e equipamentos urbanos',
        'NBR-10898 Sistema de iluminação de emergência',
        'NBR-13300 Redes telefônicas internas em prédios',
        'NBR-13994 Elevadores de passageiros – Elevadores para transporte de pessoas portadoras de deficiência',
        'NBR-16401-1 – Instalação de ar-condicionado – Sistemas centrais e unitários Parte 1: Projetos das instalações',
        'NBR-16401-3 – Instalação de ar-condicionado – Sistemas centrais e unitários Parte 3: Qualidade do ar interior',
        'NBR-14664 Grupos Geradores – Requisitos para telecomunicações',
        'NBR-16747 Inspeção Predial – Diretrizes, conceitos, terminologia e procedimento.',
        'NBR 17240 Sistema de detecção e alarme de incêndio',
        'IT-18 Iluminação de Emergência',
    ];

    normas.forEach(norma => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: norma,
                        size: 22, // 11pt
                    }),
                ],
                spacing: { after: 150 },
                indent: { left: 400 },
            })
        );
    });

    // Quebra de página após referência normativa
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // ==================== PÁGINA 5: PRINCÍPIOS E RESSALVAS ====================

    // IV – PRINCÍPIOS E RESSALVAS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IV – PRINCÍPIOS E RESSALVAS',
                    bold: true,
                    size: 28, // 14pt
                }),
            ],
            spacing: { before: 400, after: 300 },
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'O presente relatório observou criteriosamente os seguintes princípios fundamentais:',
                    size: 24, // 12pt
                }),
            ],
            spacing: { after: 300 },
        })
    );

    // Lista de princípios
    const principios = [
        {
            letra: 'a)',
            texto: 'O relatório foi elaborado com estrita observância dos postulados constantes do Código de Ética Profissional do Conselho Federal de Engenharia e Agronomia;'
        },
        {
            letra: 'b)',
            texto: 'O relatório apresenta todas as condições limitativas impostas pela metodologia empregada;'
        },
        {
            letra: 'c)',
            texto: 'O relatório foi elaborado por si e ninguém mais, a não ser o próprio responsável técnico, que preparou as análises e as respectivas conclusões;'
        },
        {
            letra: 'd)',
            texto: 'Os honorários do signatário não estão, de qualquer forma, subordinados às conclusões das pendências apontadas neste relatório;'
        },
        {
            letra: 'e)',
            texto: 'O signatário não tem nenhuma inclinação pessoal em relação à matéria envolvida neste parecer, nem contempla para o futuro, qualquer interesse;'
        },
        {
            letra: 'f)',
            texto: 'No melhor conhecimento e crédito do responsável técnico, as análises, opiniões e conclusões expressadas no presente relatório, são baseadas em dados, diligências e levantamentos verdadeiros.'
        },
    ];

    principios.forEach(item => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: item.letra + ' ',
                        bold: true,
                        size: 22, // 11pt
                    }),
                    new TextRun({
                        text: item.texto,
                        size: 22, // 11pt
                    }),
                ],
                spacing: { after: 200 },
                indent: { left: 400 },
            })
        );
    });

    // Quebra de página após princípios
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // ==================== PÁGINA 6: INFORMAÇÕES DO EMPREENDIMENTO ====================

    // V – EMPREENDIMENTO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'V – EMPREENDIMENTO',
                    bold: true,
                    size: 28, // 14pt
                }),
            ],
            spacing: { before: 400, after: 300 },
        })
    );

    // Nome do empreendimento
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Nome: ',
                    bold: true,
                    size: 24, // 12pt
                }),
                new TextRun({
                    text: contrato.nome,
                    size: 24,
                }),
            ],
            spacing: { after: 200 },
        })
    );

    // Endereço
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Endereço: ',
                    bold: true,
                    size: 24, // 12pt
                }),
                new TextRun({
                    text: contrato.endereco,
                    size: 24,
                }),
            ],
            spacing: { after: 200 },
        })
    );

    // Tipo de uso (se disponível)
    if (contrato.tipo_uso) {
        let tipoUsoTexto = '';
        if (contrato.tipo_uso === 'RESIDENCIAL') tipoUsoTexto = 'Residencial';
        else if (contrato.tipo_uso === 'NAO_RESIDENCIAL') tipoUsoTexto = 'Não Residencial';
        else if (contrato.tipo_uso === 'RESIDENCIAL_E_NAO_RESIDENCIAL') tipoUsoTexto = 'Residencial e Não Residencial';

        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Tipo de Uso: ',
                        bold: true,
                        size: 24, // 12pt
                    }),
                    new TextRun({
                        text: tipoUsoTexto,
                        size: 24,
                    }),
                ],
                spacing: { after: 200 },
            })
        );
    }

    // Quantidade de torres (se disponível)
    if (contrato.quantidade_torres) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Quantidade de Torres: ',
                        bold: true,
                        size: 24, // 12pt
                    }),
                    new TextRun({
                        text: contrato.quantidade_torres.toString(),
                        size: 24,
                    }),
                ],
                spacing: { after: 300 },
            })
        );
    }

    // Foto da localidade (se disponível)
    if (relatorio.foto_localidade_url) {
        try {
            const fotoLocalidade = await loadImage(relatorio.foto_localidade_url);
            // Imagem sem texto acima
            children.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fotoLocalidade,
                            transformation: {
                                width: 500, // Largura em pontos
                                height: 375, // Altura proporcional (4:3)
                            },
                            type: 'png',
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 100 },
                })
            );
            // Legenda abaixo da imagem
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Figura 1',
                            bold: true,
                            size: 22, // 11pt
                        }),
                        new TextRun({
                            text: ' - Identificação do local Objeto deste relatório (Fonte: Google Maps).',
                            size: 22, // 11pt
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                })
            );
        } catch (error) {
            console.error('Erro ao carregar foto da localidade:', error);
            // Continuar sem a foto se houver erro
        }
    }

    // Quebra de página após informações do empreendimento
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // ==================== PÁGINA 7: HISTÓRICO DAS VISITAS ====================

    // VI – HISTÓRICO DAS VISITAS E ATIVIDADES
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VI – HISTÓRICO DAS VISITAS E ATIVIDADES',
                    bold: true,
                    size: 24, // 12pt (ABNT)
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 300, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Neste capítulo do Relatório Técnico de Recebimento, serão registradas todas as visitas e atividades realizadas no ${contrato.nome}.`,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // Data de início (se disponível)
    if (relatorio.data_inicio_vistoria) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `No dia ${relatorio.data_inicio_vistoria} foram iniciadas as atividades de entrega/recebimento das áreas comuns do Condomínio.`,
                        size: 24,
                        font: 'Arial',
                    }),
                ],
                spacing: { after: 200, line: 360 },
                alignment: AlignmentType.JUSTIFIED,
            })
        );
    }

    // Histórico de visitas (se disponível)
    if (relatorio.historico_visitas && relatorio.historico_visitas.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Segue abaixo o histórico de todas as vistorias realizadas no ${contrato.nome} até o presente momento${relatorio.data_situacao_atual ? ` (${relatorio.data_situacao_atual})` : ''}:`,
                        size: 24,
                        font: 'Arial',
                    }),
                ],
                spacing: { before: 200, after: 200, line: 360 },
                alignment: AlignmentType.JUSTIFIED,
            })
        );

        // Lista de visitas
        relatorio.historico_visitas.forEach(visita => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `• ${visita}`,
                            size: 24,
                            font: 'Arial',
                        }),
                    ],
                    spacing: { after: 150, line: 360 },
                    indent: { left: 400 },
                })
            );
        });
    }

    // ==================== PÁGINA 7 (CONTINUAÇÃO): SITUAÇÃO ATUAL ====================

    // Espaço entre histórico e situação atual
    children.push(
        new Paragraph({
            text: '',
            spacing: { after: 400 },
        })
    );

    // VII – SITUAÇÃO ATUAL DAS VISTORIAS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VII – SITUAÇÃO ATUAL DAS VISTORIAS',
                    bold: true,
                    size: 24, // 12pt (ABNT)
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 300, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VII.1 – ÁREAS VISTORIADAS e SISTEMAS TESTADOS:',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Até o presente momento${relatorio.data_situacao_atual ? ` (${relatorio.data_situacao_atual})` : ''} nem todas as áreas do condomínio foram vistoriadas, e os sistemas e equipamentos não foram testados e comissionados;`,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // VIII – ITENS QUE PRECISAM SER CORRIGIDOS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'VIII – ITENS QUE PRECISAM SER CORRIGIDOS',
                    bold: true,
                    size: 24, // 12pt (ABNT)
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 300, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Com base nas vistorias realizadas${relatorio.data_situacao_atual ? ` no dia ${relatorio.data_situacao_atual}` : ''} foram levantados os seguintes itens:`,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // ==================== QUEBRA DE PÁGINA ANTES DAS PENDÊNCIAS ====================
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // Contador global de pendências
    let numeroPendenciaGlobal = 0;

    // Para cada seção
    console.log('Relatório completo:', JSON.stringify(relatorio, null, 2));

    for (let secaoIndex = 0; secaoIndex < (relatorio.secoes || []).length; secaoIndex++) {
        const secao = relatorio.secoes![secaoIndex];
        console.log(`Seção ${secaoIndex}:`, {
            titulo_principal: secao.titulo_principal,
            subtitulo: secao.subtitulo,
            tem_subsecoes: secao.tem_subsecoes,
            subsecoes: secao.subsecoes?.length,
            pendencias: secao.pendencias?.length
        });

        // Adicionar quebra de página antes de cada seção (exceto a primeira)
        // IMPORTANTE: Só adiciona se a seção tiver pendências (diretas ou em subseções)
        const temPendencias = secao.tem_subsecoes
            ? (secao.subsecoes || []).some(sub => (sub.pendencias || []).length > 0)
            : (secao.pendencias || []).length > 0;

        if (secaoIndex > 0 && temPendencias) {
            children.push(
                new Paragraph({
                    children: [new PageBreak()],
                })
            );
        }

        // Título Principal da Seção
        if (secao.titulo_principal && secao.titulo_principal.trim()) {
            // Adicionar numeração VIII.1, VIII.2, etc.
            const numeroSecao = `VIII.${secaoIndex + 1}`;
            const tituloComNumero = `${numeroSecao} – ${secao.titulo_principal}`;

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: tituloComNumero,
                            bold: true,
                            size: 28, // 14pt
                        }),
                    ],
                    spacing: { before: 400, after: 100 },
                })
            );
        }

        // Se TEM subseções (VIII.1A, VIII.1B, etc.)
        if (secao.tem_subsecoes && secao.subsecoes && secao.subsecoes.length > 0) {
            for (let subsecaoIndex = 0; subsecaoIndex < secao.subsecoes.length; subsecaoIndex++) {
                const subsecao = secao.subsecoes[subsecaoIndex];
                const letraSubsecao = String.fromCharCode(65 + subsecaoIndex); // A, B, C, etc.
                const numeroSubsecao = `VIII.${secaoIndex + 1}${letraSubsecao}`;
                const tituloSubsecao = `${numeroSubsecao} – ${subsecao.titulo}`;

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: tituloSubsecao,
                                bold: true,
                                size: 24, // 12pt
                            }),
                        ],
                        spacing: { after: 200 },
                    })
                );

                // Para cada pendência na subseção
                let pendenciaCount = 0;
                for (const pendencia of subsecao.pendencias || []) {
                    pendenciaCount++;
                    numeroPendenciaGlobal++;
            // Criar tabela para a pendência com layout específico
            // Layout com 3 colunas:
            // Row 1: [Número (rowspan 2, 5%) | Local (colSpan 2, 95%)]
            // Row 2: [mesma célula do número | Pendência (colSpan 2, 95%)]
            // Row 3: [Foto (colSpan 2, 50%) | Espaço vazio (50%)]

            const tableRows: TableRow[] = [];

            // ================= ROW 1: Número (rowspan 2) + Local =================
            const row1Cells: TableCell[] = [];

            // Célula 1: Número em célula quadrada (rowSpan 2 para ocupar altura de Local + Pendência)
            row1Cells.push(
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    rowSpan: 2,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: numeroPendenciaGlobal.toString(),
                                    bold: true,
                                    size: 40, // 20pt
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                    margins: {
                        top: 250,
                        bottom: 250,
                        left: 150,
                        right: 150,
                    },
                })
            );

            // Célula 2: Local (colSpan 2 para ocupar as outras 2 colunas)
            row1Cells.push(
                new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Local: ',
                                    bold: true,
                                    size: 24,
                                }),
                                new TextRun({
                                    text: pendencia.local.replace(/^([IVX]+\.\d+|[IVX]+|\d+)\s*[-–]\s*/, ''), // Remove números romanos e árabicos do início
                                    size: 24,
                                }),
                            ],
                        }),
                    ],
                    margins: {
                        top: 150,
                        bottom: 100,
                        left: 200,
                        right: 200,
                    },
                })
            );

            tableRows.push(new TableRow({ children: row1Cells }));

            // ================= ROW 2: Pendência (continua célula do número) =================
            const row2Cells: TableCell[] = [];

            // Não adicionar célula do número (rowSpan 2 já cobre isso)
            // Célula: Pendência (colSpan 2)
            row2Cells.push(
                new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Pendência: ',
                                    bold: true,
                                    size: 24,
                                }),
                                new TextRun({
                                    text: pendencia.descricao.replace(/^([IVX]+\.\d+|[IVX]+|\d+)\s*[-–]\s*/, ''), // Remove números romanos e árabicos do início
                                    size: 24,
                                }),
                            ],
                        }),
                    ],
                    margins: {
                        top: 100,
                        bottom: 150,
                        left: 200,
                        right: 200,
                    },
                })
            );

            tableRows.push(new TableRow({ children: row2Cells }));

            // ================= ROW 3: Foto ANTES (ocupa número + foto) + Foto DEPOIS =================
            const row3Cells: TableCell[] = [];

            // Célula 1: Foto ANTES (colSpan 2, 54% = 8% número + 46% foto)
            let photoParagraph: Paragraph;

            if (pendencia.foto_url) {
                try {
                    console.log('🔍 Carregando foto ANTES:', pendencia.foto_url);
                    const imageResponse = await fetch(pendencia.foto_url);
                    const imageBuffer = await imageResponse.arrayBuffer();
                    console.log('✅ Foto ANTES carregada. Tamanho:', imageBuffer.byteLength, 'bytes');

                    photoParagraph = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: 280,
                                    height: 210,
                                },
                                type: "png",
                            }),
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 100, after: 100 },
                    });
                } catch (error) {
                    console.error('❌ Erro ao carregar imagem ANTES:', error);
                    photoParagraph = new Paragraph({
                        children: [
                            new TextRun({
                                text: '[Erro ao carregar imagem]',
                                italics: true,
                                color: 'FF0000',
                            }),
                        ],
                    });
                }
            } else {
                photoParagraph = new Paragraph({ text: '' });
            }

            row3Cells.push(
                new TableCell({
                    width: { size: 54, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [photoParagraph],
                    verticalAlign: VerticalAlign.TOP,
                    margins: {
                        top: 150,
                        bottom: 150,
                        left: 100,
                        right: 100,
                    },
                })
            );

            // Célula 2: Foto DEPOIS (46% - o quadrado em branco)
            let photoDepoisParagraph: Paragraph;

            if (pendencia.foto_depois_url) {
                try {
                    console.log('🔍 Carregando foto DEPOIS:', pendencia.foto_depois_url);
                    const imageDepoisResponse = await fetch(pendencia.foto_depois_url);
                    const imageDepoisBuffer = await imageDepoisResponse.arrayBuffer();
                    console.log('✅ Foto DEPOIS carregada. Tamanho:', imageDepoisBuffer.byteLength, 'bytes');

                    photoDepoisParagraph = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageDepoisBuffer,
                                transformation: {
                                    width: 280,
                                    height: 210,
                                },
                                type: "png",
                            }),
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 100, after: 100 },
                    });
                } catch (error) {
                    console.error('❌ Erro ao carregar imagem DEPOIS:', error);
                    photoDepoisParagraph = new Paragraph({
                        children: [
                            new TextRun({
                                text: '[Erro ao carregar imagem depois]',
                                italics: true,
                                color: 'FF0000',
                            }),
                        ],
                    });
                }
            } else {
                console.log('⚠️ Nenhuma foto_depois_url encontrada');
                photoDepoisParagraph = new Paragraph({ text: '' });
            }

            row3Cells.push(
                new TableCell({
                    width: { size: 46, type: WidthType.PERCENTAGE },
                    children: [photoDepoisParagraph],
                    verticalAlign: VerticalAlign.TOP,
                    margins: {
                        top: 150,
                        bottom: 150,
                        left: 100,
                        right: 100,
                    },
                })
            );

            tableRows.push(new TableRow({ children: row3Cells }));

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
                            spacing: { after: 200 }, // Reduzir espaçamento entre pendências
                        })
                    );

                    // Adicionar quebra de página a cada 2 pendências (mas NÃO na última pendência da subseção)
                    const isUltimaPendenciaDaSubsecao = pendenciaCount === (subsecao.pendencias || []).length;
                    if (pendenciaCount % 2 === 0 && !isUltimaPendenciaDaSubsecao) {
                        children.push(
                            new Paragraph({
                                children: [new PageBreak()],
                            })
                        );
                    }
                } // Fim do loop de pendências da subseção
            } // Fim do loop de subseções
        } else {
            // Se NÃO TEM subseções (modo antigo com subtítulo opcional)
            if (secao.subtitulo && secao.subtitulo.trim()) {
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
            }

            // Para cada pendência na seção (sem subseções)
            let pendenciaCount = 0;
            for (const pendencia of secao.pendencias || []) {
                pendenciaCount++;
                numeroPendenciaGlobal++;
            // Criar tabela para a pendência com layout específico
            // Layout com 3 colunas:
            // Row 1: [Número (rowspan 2, 5%) | Local (colSpan 2, 95%)]
            // Row 2: [mesma célula do número | Pendência (colSpan 2, 95%)]
            // Row 3: [Foto (colSpan 2, 50%) | Espaço vazio (50%)]

            const tableRows: TableRow[] = [];

            // ================= ROW 1: Número (rowspan 2) + Local =================
            const row1Cells: TableCell[] = [];

            // Célula 1: Número em célula quadrada (rowSpan 2 para ocupar altura de Local + Pendência)
            row1Cells.push(
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    rowSpan: 2,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: numeroPendenciaGlobal.toString(),
                                    bold: true,
                                    size: 40, // 20pt
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                    margins: {
                        top: 250,
                        bottom: 250,
                        left: 150,
                        right: 150,
                    },
                })
            );

            // Célula 2: Local (colSpan 2 para ocupar as outras 2 colunas)
            row1Cells.push(
                new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Local: ',
                                    bold: true,
                                    size: 24,
                                }),
                                new TextRun({
                                    text: pendencia.local.replace(/^([IVX]+\.\d+[A-Z]?|[IVX]+|\d+)\s*[-–]\s*/, ''), // Remove números romanos e árabicos do início
                                    size: 24,
                                }),
                            ],
                        }),
                    ],
                    margins: {
                        top: 150,
                        bottom: 100,
                        left: 200,
                        right: 200,
                    },
                })
            );

            tableRows.push(new TableRow({ children: row1Cells }));

            // ================= ROW 2: Pendência (continua célula do número) =================
            const row2Cells: TableCell[] = [];

            // Não adicionar célula do número (rowSpan 2 já cobre isso)
            // Célula: Pendência (colSpan 2)
            row2Cells.push(
                new TableCell({
                    width: { size: 92, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Pendência: ',
                                    bold: true,
                                    size: 24,
                                }),
                                new TextRun({
                                    text: pendencia.descricao.replace(/^([IVX]+\.\d+[A-Z]?|[IVX]+|\d+)\s*[-–]\s*/, ''), // Remove números romanos e árabicos do início
                                    size: 24,
                                }),
                            ],
                        }),
                    ],
                    margins: {
                        top: 100,
                        bottom: 150,
                        left: 200,
                        right: 200,
                    },
                })
            );

            tableRows.push(new TableRow({ children: row2Cells }));

            // ================= ROW 3: Foto ANTES (ocupa número + foto) + Foto DEPOIS =================
            const row3Cells: TableCell[] = [];

            // Célula 1: Foto ANTES (colSpan 2, 54% = 8% número + 46% foto)
            let photoParagraph: Paragraph;

            if (pendencia.foto_url) {
                try {
                    console.log('🔍 Carregando foto ANTES:', pendencia.foto_url);
                    const imageResponse = await fetch(pendencia.foto_url);
                    const imageBuffer = await imageResponse.arrayBuffer();
                    console.log('✅ Foto ANTES carregada. Tamanho:', imageBuffer.byteLength, 'bytes');

                    photoParagraph = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: 280,
                                    height: 210,
                                },
                                type: "png",
                            }),
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 100, after: 100 },
                    });
                } catch (error) {
                    console.error('❌ Erro ao carregar imagem ANTES:', error);
                    photoParagraph = new Paragraph({
                        children: [
                            new TextRun({
                                text: '[Erro ao carregar imagem]',
                                italics: true,
                                color: 'FF0000',
                            }),
                        ],
                    });
                }
            } else {
                photoParagraph = new Paragraph({ text: '' });
            }

            row3Cells.push(
                new TableCell({
                    width: { size: 54, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [photoParagraph],
                    verticalAlign: VerticalAlign.TOP,
                    margins: {
                        top: 150,
                        bottom: 150,
                        left: 100,
                        right: 100,
                    },
                })
            );

            // Célula 2: Foto DEPOIS (46% - o quadrado em branco)
            let photoDepoisParagraph: Paragraph;

            if (pendencia.foto_depois_url) {
                try {
                    console.log('🔍 Carregando foto DEPOIS:', pendencia.foto_depois_url);
                    const imageDepoisResponse = await fetch(pendencia.foto_depois_url);
                    const imageDepoisBuffer = await imageDepoisResponse.arrayBuffer();
                    console.log('✅ Foto DEPOIS carregada. Tamanho:', imageDepoisBuffer.byteLength, 'bytes');

                    photoDepoisParagraph = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageDepoisBuffer,
                                transformation: {
                                    width: 280,
                                    height: 210,
                                },
                                type: "png",
                            }),
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 100, after: 100 },
                    });
                } catch (error) {
                    console.error('❌ Erro ao carregar imagem DEPOIS:', error);
                    photoDepoisParagraph = new Paragraph({
                        children: [
                            new TextRun({
                                text: '[Erro ao carregar imagem depois]',
                                italics: true,
                                color: 'FF0000',
                            }),
                        ],
                    });
                }
            } else {
                console.log('⚠️ Nenhuma foto_depois_url encontrada');
                photoDepoisParagraph = new Paragraph({ text: '' });
            }

            row3Cells.push(
                new TableCell({
                    width: { size: 46, type: WidthType.PERCENTAGE },
                    children: [photoDepoisParagraph],
                    verticalAlign: VerticalAlign.TOP,
                    margins: {
                        top: 150,
                        bottom: 150,
                        left: 100,
                        right: 100,
                    },
                })
            );

            tableRows.push(new TableRow({ children: row3Cells }));

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
                        spacing: { after: 200 }, // Reduzir espaçamento entre pendências
                    })
                );

                // Adicionar quebra de página a cada 2 pendências (mas NÃO na última pendência da seção)
                const isUltimaPendenciaDaSecao = pendenciaCount === (secao.pendencias || []).length;
                if (pendenciaCount % 2 === 0 && !isUltimaPendenciaDaSecao) {
                    children.push(
                        new Paragraph({
                            children: [new PageBreak()],
                        })
                    );
                }
            } // Fim do loop de pendências da seção sem subseções
        } // Fim do else (sem subseções)
    } // Fim do loop de seções

    // ==================== CAPÍTULO IX: DOCUMENTAÇÃO TÉCNICA ====================

    // Quebra de página antes do capítulo IX
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // IX – DOCUMENTAÇÃO TÉCNICA
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX – DOCUMENTAÇÃO TÉCNICA',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 300, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Faz parte da entrega/recebimento de um condomínio, a passagem das documentações da edificação.',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Até a presente data${relatorio.data_situacao_atual ? ` (${relatorio.data_situacao_atual})` : ''}, nenhum documento do ${contrato.nome} foi entregue. Segue a lista dos documentos que precisam ser entregues ao condomínio:`,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // IX.1 - MANUAL DE USO, OPERAÇÃO E MANUTENÇÃO
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.1 – MANUAL DE USO, OPERAÇÃO E MANUTENÇÃO',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 200, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Para que as manutenções preventivas e rotinas de uso sejam mantidas da forma correta, o condomínio precisa receber o Manual de Uso, Operação e Manutenção específico do empreendimento, e de acordo com a NBR-14037.',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // IX.2 - PROJETOS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.2 – PROJETOS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 200, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Todos os projetos legais e projetos As Built do empreendimento devem ser entregues ao condomínio.',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // IX.3 - LAUDOS E CERTIFICADOS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.3 – LAUDOS E CERTIFICADOS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 200, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Os laudos e certificados do empreendimento devem ser entregues ao condomínio, são:',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // Lista de laudos
    const laudos = [
        'Auto de conclusão (habite-se);',
        'Alvará de aprovação da edificação;',
        'Alvará de execução da edificação;',
        'AVCB (Auto de Vistoria do Corpo de Bombeiros);',
        'ART de execução do Sistema de prevenção e Combate a Incêndio;',
        'Certificado de limpeza dos ralos, poços e redes (esgoto, drenagem e pluvial) das áreas comuns;',
        'Certificado de limpeza dos ralos das unidades privativas;',
        'Ensaio de arrancamento dos dispositivos de ancoragem;',
        'Ordem de Serviço de Start-up e Relatório Técnico das VRPs (Válvulas Redutoras de Pressão);',
        'Manuais de operação e garantia do Sistema de Irrigação de Jardins;',
        'Certificado de conformidade das instalações elétricas;',
        'ART de projeto e instalação elétrica;',
        'Certificado de limpeza dos reservatórios de água potável;',
        'Análise de potabilidade da água fria;',
        'Laudo de SPDA com medição ôhmica e ART; e',
        'Memorial descritivo.',
    ];

    laudos.forEach(laudo => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `• ${laudo}`,
                        size: 24,
                        font: 'Arial',
                    }),
                ],
                spacing: { after: 150, line: 360 },
                indent: { left: 400 },
            })
        );
    });

    // IX.4 - NOTAS FISCAIS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'IX.4 – NOTAS FISCAIS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 200, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Todas as notas fiscais dos equipamentos instalados no empreendimento, devem ser entregues ao condomínio, para que tenham acesso as garantias.',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // ==================== CAPÍTULO X: CONSIDERAÇÕES FINAIS ====================

    // Quebra de página antes do capítulo X
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    );

    // X – CONSIDERAÇÕES FINAIS
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'X – CONSIDERAÇÕES FINAIS',
                    bold: true,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 300, line: 360 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `No momento da presente vistoria, realizada no dia ${relatorio.data_situacao_atual || '[data]'}, o ${contrato.nome} ainda estava em obra, então as áreas não foram completamente vistoriadas, não foi testado nenhum equipamento e/ou sistema. Devido ao estado do empreendimento, diversas outras vistorias precisarão ser realizadas, a fim de fazer a constatação de fato das pendências de obra.`,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 300, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Este Relatório foi desenvolvido para registrar as pendências do ${contrato.nome}, e contempla o parecer técnico do Engenheiro Felipe Lima e da Engenheira Gessica Camargo.`,
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 600, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
        })
    );

    // Assinaturas - Alinhadas à esquerda
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '_____________________________',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 0 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Eng. Gessica Camargo',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 0 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'CREA/SP 5071696233',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '_____________________________',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { before: 400, after: 0 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Eng. Felipe Lima',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 0 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'CREA/SP 5068907902',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 0 },
            alignment: AlignmentType.LEFT,
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'CONPEJ 02.00.3374',
                    size: 24,
                    font: 'Arial',
                }),
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.LEFT,
        })
    );

    // Criar cabeçalho e rodapé
    const header = await createHeader(relatorio, contrato);
    const footer = await createFooter();

    // Adicionar seção principal com cabeçalho e rodapé
    sections.push({
        properties: {
            page: {
                margin: {
                    top: cmToTwip(2.5), // Reduzir margem superior (ABNT ajustado)
                    right: cmToTwip(2.0), // ABNT: 2cm direita
                    bottom: cmToTwip(1.2), // Margem inferior menor para rodapé no limite
                    left: cmToTwip(3.0), // ABNT: 3cm esquerda
                    header: cmToTwip(0.3), // Subir cabeçalho bem para cima
                    footer: cmToTwip(0.05), // Rodapé no limite absoluto
                },
            },
        },
        headers: {
            default: header,
        },
        footers: {
            default: footer,
        },
        children,
    });

    // Criar documento
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Arial', // ABNT: Arial ou Times New Roman
                        size: 24, // 12pt (ABNT padrão)
                    },
                    paragraph: {
                        spacing: {
                            line: 360, // 1.5 de espaçamento (ABNT)
                            before: 0,
                            after: 0,
                        },
                    },
                },
            },
        },
        sections,
    });

    // Gerar e salvar
    const blob = await Packer.toBlob(doc);
    const fileName = `${relatorio.titulo.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
}
