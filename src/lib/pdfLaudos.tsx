import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { Laudo } from '@/lib/laudoService';

// Cores para o PDF
const colors = {
    primary: '#0f172a',
    secondary: '#334155',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    bgLight: '#f8fafc',
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        color: colors.text,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 3,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 15,
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    table: {
        width: '100%',
        marginBottom: 15,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    tableHeader: {
        backgroundColor: colors.bgLight,
        fontWeight: 'bold',
        fontSize: 10,
    },
    tableCell: {
        fontSize: 9,
        paddingHorizontal: 5,
    },
    cellTitulo: {
        width: '40%',
    },
    cellStatus: {
        width: '15%',
    },
    cellData: {
        width: '20%',
    },
    cellPeriodicidade: {
        width: '25%',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        fontSize: 8,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
    },
    emDia: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    proximoVencimento: {
        backgroundColor: '#fef9c3',
        color: '#854d0e',
    },
    vencido: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: colors.textLight,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 10,
    },
    emptyState: {
        fontSize: 9,
        color: colors.textLight,
        fontStyle: 'italic',
        paddingVertical: 10,
        textAlign: 'center',
    },
});

const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case 'em-dia':
            return styles.emDia;
        case 'proximo-vencimento':
            return styles.proximoVencimento;
        case 'vencidos':
            return styles.vencido;
        default:
            return styles.emDia;
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'em-dia':
            return 'Em Dia';
        case 'proximo-vencimento':
            return 'Próximo ao Vencimento';
        case 'vencidos':
            return 'Vencido';
        default:
            return status;
    }
};

const formatarData = (data: string): string => {
    try {
        const date = new Date(data + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    } catch {
        return data;
    }
};

interface LaudosPDFProps {
    laudos: Laudo[];
    contratoNome: string;
}

const LaudosPDF = ({ laudos, contratoNome }: LaudosPDFProps) => {
    // Agrupar por status
    const emDia = laudos.filter(l => l.status === 'em-dia');
    const proximoVencimento = laudos.filter(l => l.status === 'proximo-vencimento');
    const vencidos = laudos.filter(l => l.status === 'vencidos');

    const renderLaudoRow = (laudo: Laudo) => {
        // Para vencidos, mostrar "VENCIDO" ao invés da data
        const dataDisplay = laudo.status === 'vencidos'
            ? 'VENCIDO'
            : (laudo.data_vencimento ? formatarData(laudo.data_vencimento) : '-');

        return (
            <View style={styles.tableRow} key={laudo.id}>
                <View style={[styles.tableCell, styles.cellTitulo]}>
                    <Text>{laudo.titulo}</Text>
                </View>
                <View style={[styles.tableCell, styles.cellStatus]}>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(laudo.status)]}>
                        <Text>{getStatusLabel(laudo.status)}</Text>
                    </View>
                </View>
                <View style={[styles.tableCell, styles.cellData]}>
                    <Text>{dataDisplay}</Text>
                </View>
                <View style={[styles.tableCell, styles.cellPeriodicidade]}>
                    <Text>{laudo.periodicidade || '-'}</Text>
                </View>
            </View>
        );
    };

    const renderSection = (titulo: string, items: Laudo[]) => {
        if (items.length === 0) return null;

        return (
            <View>
                <Text style={styles.sectionTitle}>{titulo}</Text>
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.cellTitulo]}>
                            <Text>Título</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellStatus]}>
                            <Text>Status</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellData]}>
                            <Text>Vencimento</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellPeriodicidade]}>
                            <Text>Periodicidade</Text>
                        </View>
                    </View>
                    {/* Rows */}
                    {items.map(renderLaudoRow)}
                </View>
            </View>
        );
    };

    return (
        <Document title={`Relatório de Laudos - ${contratoNome}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Relatório de Laudos</Text>
                    <Text style={styles.subtitle}>Contrato: {contratoNome}</Text>
                    <Text style={styles.subtitle}>
                        Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                    </Text>
                </View>

                {/* Summary */}
                <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 11, marginBottom: 5 }}>
                        Total de Laudos: {laudos.length}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.textLight }}>
                        Em Dia: {emDia.length} | Próximo ao Vencimento: {proximoVencimento.length} | Vencidos: {vencidos.length}
                    </Text>
                </View>

                {/* Sections */}
                {renderSection('Em Dia', emDia)}
                {renderSection('Próximo ao Vencimento', proximoVencimento)}
                {renderSection('Vencidos', vencidos)}

                {/* Empty state */}
                {laudos.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text>Nenhum laudo encontrado para este contrato.</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>App Ronda - Controle de Laudos</Text>
                </View>
            </Page>
        </Document>
    );
};

export const downloadLaudosPDF = async (laudos: Laudo[], contratoNome: string) => {
    try {
        const blob = await pdf(<LaudosPDF laudos={laudos} contratoNome={contratoNome} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Relatorio_Laudos_${contratoNome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erro ao gerar PDF de laudos:', error);
        throw error;
    }
};
