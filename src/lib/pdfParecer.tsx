import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image as PDFImage, pdf, Font } from '@react-pdf/renderer';
import { Contrato, ParecerTecnico, ParecerTopico, ParecerImagem } from '@/types';
import { saveAs } from 'file-saver';

// Configurações de medidas
const CM_TO_PT = 28.3465;

// Cores
const colors = {
    primary: '#000000', // Preto para texto padrão ABNT
    secondary: '#333333',
    border: '#000000',
};

// Função para converter número para romano (igual ao DOCX)
function toRoman(num: number): string {
    const roman = {
        M: 1000, CM: 900, D: 500, CD: 400,
        C: 100, XC: 90, L: 50, XL: 40,
        X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    let str = '';
    for (const i of Object.keys(roman)) {
        const q = Math.floor(num / roman[i as keyof typeof roman]);
        num -= q * roman[i as keyof typeof roman];
        str += i.repeat(q);
    }
    return str;
}

const styles = StyleSheet.create({
    page: {
        paddingTop: 4.0 * CM_TO_PT, // Mantém 4.0cm para o cabeçalho
        paddingBottom: 2.0 * CM_TO_PT, // 2.0cm inferior
        paddingLeft: 3.0 * CM_TO_PT, // 3.0cm esquerda (ABNT)
        paddingRight: 2.0 * CM_TO_PT, // 2.0cm direita (ABNT)
        fontSize: 12, // 12pt padrão
        color: colors.primary,
        fontFamily: 'Helvetica', // Helvetica é o mais próximo de Arial no padrão PDF
        backgroundColor: '#ffffff',
    },
    // Cabeçalho Fixo
    headerFixedContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3.5 * CM_TO_PT, // Aumentado um pouco a área reservada
        paddingHorizontal: 1.5 * CM_TO_PT,
        paddingTop: 0.5 * CM_TO_PT,
        flexDirection: 'row',
        alignItems: 'flex-start', // Alinhado ao topo
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
    },
    headerContent: {
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 5,
        alignItems: 'center',
    },
    headerLogo: {
        width: 60,
        height: 40,
        marginRight: 10,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    headerInfo: {
        width: 150,
        borderWidth: 1,
        borderColor: '#000000',
        fontSize: 8,
    },
    headerInfoRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        height: 14,
        alignItems: 'center',
    },

    // Rodapé
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1.5 * CM_TO_PT,
        paddingHorizontal: 2.0 * CM_TO_PT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#000000',
        backgroundColor: '#ffffff',
    },
    footerText: {
        fontSize: 9,
        color: '#333333',
    },

    // Estilos de Texto
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    paragraph: {
        fontSize: 12,
        textAlign: 'justify',
        lineHeight: 1.5,
        marginBottom: 10,
        textIndent: 35, // ~1.25cm de indentação na primeira linha
    },

    // Imagens
    imageContainer: {
        marginTop: 10,
        marginBottom: 15,
        alignItems: 'center',
        width: '100%',
    },
    image: {
        width: '90%', // Imagem grande centralizada
        height: 300,
        objectFit: 'contain',
        marginBottom: 5,
    },
    imageCaption: {
        fontSize: 10,
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#555555',
    },

    // Capa Texto
    coverTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 100,
        marginBottom: 50,
    },
    coverSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        textTransform: 'uppercase',
    }
});

// Componente de Cabeçalho
const CustomHeader = ({ contrato }: { contrato: Contrato }) => (
    <View style={styles.headerFixedContainer} fixed>
        <View style={styles.headerContent}>
            {/* Logo */}
            <View style={styles.headerLogo}>
                <PDFImage src="/logo-header.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </View>

            {/* Título Central */}
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitleText}>PARECER TÉCNICO</Text>
            </View>

            {/* Tabela Info */}
            <View style={styles.headerInfo}>
                <View style={[styles.headerInfoRow, { justifyContent: 'center', backgroundColor: '#f0f0f0' }]}>
                    <Text style={{ fontWeight: 'bold' }}>CONDOMÍNIO</Text>
                </View>
                <View style={styles.headerInfoRow}>
                    <View style={{ flex: 1, paddingLeft: 4, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{contrato.nome.substring(0, 25)}</Text>
                    </View>
                </View>
                <View style={[styles.headerInfoRow, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1, paddingLeft: 4, borderRightWidth: 1, borderRightColor: '#000000', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 7 }}>{new Date().toLocaleDateString('pt-BR')}</Text>
                    </View>
                    <View style={{ flex: 0.5, paddingLeft: 4, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 7 }} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
                    </View>
                </View>
            </View>
        </View>
    </View>
);

// Componente de Rodapé
const CustomFooter = () => (
    <View style={styles.footerContainer} fixed>
        <Text style={styles.footerText}>App Ronda - Sistema de Gestão Predial</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
);

interface ParecerPDFProps {
    parecer: ParecerTecnico;
    contrato: Contrato;
}

const ParecerPDF = ({ parecer, contrato }: ParecerPDFProps) => {
    return (
        <Document title={`Parecer Técnico - ${parecer.titulo}`} author="App Ronda">

            {/* CAPA */}
            {parecer.capa_url ? (
                <Page size="A4" style={{ padding: 0 }}>
                    <PDFImage
                        src={parecer.capa_url}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </Page>
            ) : (
                <Page size="A4" style={styles.page}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={styles.coverTitle}>PARECER TÉCNICO DE ENGENHARIA</Text>

                        <Text style={styles.coverSubtitle}>{parecer.titulo}</Text>

                        <Text style={{ fontSize: 14, marginTop: 50 }}>CONTRATO:</Text>
                        <Text style={styles.coverSubtitle}>{contrato.nome}</Text>

                        <Text style={{ fontSize: 12, marginTop: 100 }}>{new Date().toLocaleDateString('pt-BR')}</Text>
                    </View>
                </Page>
            )}

            {/* CONTEÚDO */}
            <Page size="A4" style={styles.page}>
                <CustomHeader contrato={contrato} />

                {/* I - FINALIDADE */}
                <View>
                    <Text style={styles.sectionTitle}>{toRoman(1)} – FINALIDADE DO RELATÓRIO</Text>
                    {parecer.finalidade.split('\n').map((p, i) => (
                        p.trim() && <Text key={i} style={styles.paragraph}>{p}</Text>
                    ))}
                </View>

                {/* II - NARRATIVA */}
                <View>
                    <Text style={styles.sectionTitle}>{toRoman(2)} – NARRATIVA DO CENÁRIO</Text>
                    {parecer.narrativa_cenario.split('\n').map((p, i) => (
                        p.trim() && <Text key={i} style={styles.paragraph}>{p}</Text>
                    ))}
                </View>

                {/* TÓPICOS (III, IV...) */}
                {parecer.topicos?.sort((a, b) => a.ordem - b.ordem).map((topico, index) => (
                    <View key={topico.id} break={index > 0}>
                        <Text style={styles.sectionTitle}>
                            {toRoman(index + 3)} – {topico.titulo.toUpperCase()}
                        </Text>

                        <Text style={styles.paragraph}>{topico.descricao}</Text>

                        {/* Imagens - Uma por linha, grande */}
                        {topico.imagens?.map((img) => (
                            <View key={img.id} style={styles.imageContainer} wrap={false}>
                                <PDFImage src={img.url} style={styles.image} />
                                <Text style={styles.imageCaption}>{img.descricao}</Text>
                            </View>
                        ))}
                    </View>
                ))}

                <CustomFooter />
            </Page>
        </Document>
    );
};

export const generateParecerPDF = async (parecer: ParecerTecnico, contrato: Contrato) => {
    try {
        const blob = await pdf(<ParecerPDF parecer={parecer} contrato={contrato} />).toBlob();
        saveAs(blob, `Parecer - ${parecer.titulo} - ${contrato.nome}.pdf`);
        return true;
    } catch (error) {
        console.error('Erro ao gerar PDF do Parecer:', error);
        return false;
    }
};
