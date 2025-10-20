import { Document, Page, View, Text, StyleSheet, Image as PDFImage, pdf } from '@react-pdf/renderer';
import { AreaTecnica, Ronda, Contrato, FotoRonda } from '@/types';
import { CM_TO_PT } from './pdfConfig';

const styles = StyleSheet.create({
  page: {
    paddingTop: 2.0 * CM_TO_PT,
    paddingBottom: 1.6 * CM_TO_PT,
    paddingLeft: 1 * CM_TO_PT,
    paddingRight: 1 * CM_TO_PT,
    fontSize: 11,
    color: '#111827',
    fontFamily: 'Helvetica',
  },
  title: { fontSize: 18, fontWeight: 700, color: '#1e40af', marginBottom: 12 },
  header: {
    height: 3.2 * CM_TO_PT,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    paddingHorizontal: 0.5 * CM_TO_PT,
    marginBottom: 0.5 * CM_TO_PT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.4 * CM_TO_PT as any,
  },
  headerFixedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1.8 * CM_TO_PT,
    paddingHorizontal: 0.5 * CM_TO_PT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  headerText: {
    flexGrow: 1,
  },
  footerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.6 * CM_TO_PT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0.5 * CM_TO_PT,
  },
  footerPagination: {
    fontSize: 9,
    color: '#6B7280',
  },
  footerImage: {
    display: 'none',
  },
  logoCircle: { width: 2.2 * CM_TO_PT, height: 2.2 * CM_TO_PT, marginRight: 12 },
  logoTextBox: { color: 'white' },
  logoTextTop: { fontSize: 12, fontWeight: 700, color: 'white' },
  logoTextBottom: { fontSize: 14, fontWeight: 800, color: 'white' },
  faixa: {
    height: 1.2 * CM_TO_PT,
    borderWidth: 1,
    borderColor: '#16a34a',
    justifyContent: 'center',
    paddingHorizontal: 0.5 * CM_TO_PT,
    marginBottom: 0.3 * CM_TO_PT,
  },
  grid2: {
    flexDirection: 'row',
    gap: 1 * CM_TO_PT,
  },
  gridItem2: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#FFFFFF',
  },
  grid4Wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0.2 * CM_TO_PT,
    paddingBottom: 0,
  },
  gridItem4: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#FFFFFF',
  },
  gridItem4Ativo: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#22c55e',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#f0fdf4',
  },
  gridItem4Manutencao: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#fffbeb',
  },
  gridItem4Atencao: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#fef2f2',
  },
  gridItem4FotoAlta: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#fef2f2',
  },
  gridItem4FotoMedia: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#fffbeb',
  },
  gridItem4FotoBaixa: {
    width: 13.5 * CM_TO_PT,
    height: 7.8 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#22c55e',
    padding: 0.5 * CM_TO_PT,
    backgroundColor: '#f0fdf4',
  },
  titulo: { fontSize: 16, fontWeight: 700 },
  texto: { fontSize: 11 },
  img: { objectFit: 'contain' },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resumoContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  resumoSectionYellow: {
    backgroundColor: '#fef9c3',
    borderLeftWidth: 4,
    borderColor: '#f59e0b',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  resumoSectionOrange: {
    backgroundColor: '#ffedd5',
    borderLeftWidth: 4,
    borderColor: '#f97316',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  resumoSectionRed: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderColor: '#ef4444',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  resumoSectionGreen: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderColor: '#22c55e',
    padding: 10,
    borderRadius: 4,
  },
  resumoSectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  bullet: { fontSize: 10, marginBottom: 4 },
});

const CardArea: React.FC<{ area: AreaTecnica }> = ({ area }) => {
  // Escolher estilo baseado no status
  let cardStyle = styles.gridItem4;
  if (area.status === 'ATIVO') {
    cardStyle = styles.gridItem4Ativo;
  } else if (area.status === 'EM MANUTENÇÃO') {
    cardStyle = styles.gridItem4Manutencao;
  } else if (area.status === 'ATENÇÃO') {
    cardStyle = styles.gridItem4Atencao;
  }

  return (
    <View style={cardStyle}>
      <Text style={{ fontSize: 12, fontWeight: 700 }}>{area.nome}</Text>
      {/* Status pill com cor dinâmica */}
      {(() => {
        let bg = '#dcfce7';
        let border = '#22c55e';
        let color = '#166534';
        if (area.status === 'EM MANUTENÇÃO') { bg = '#fffbeb'; border = '#f59e0b'; color = '#92400e'; }
        if (area.status === 'ATENÇÃO') { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; }
        return (
          <View style={{ ...styles.statusPill, backgroundColor: bg, borderColor: border }}>
            <Text style={{ fontSize: 10, color }}>{area.status}</Text>
          </View>
        );
      })()}
      {area.foto ? (
        <PDFImage src={area.foto} style={{ width: '100%', height: 4.9 * CM_TO_PT, marginTop: 6 }} />
      ) : null}
      {area.observacoes ? (
        <Text style={{ fontSize: 10, marginTop: 6 }}>Obs.: {area.observacoes}</Text>
      ) : null}
    </View>
  );
};

const CardFoto: React.FC<{ foto: FotoRonda | { id: string; foto: any; local: string; especialidade: string; pendencia: string; observacoes?: string; responsavel?: string; criticidade?: string } }> = ({ foto }) => {
  // Escolher estilo baseado na criticidade
  let cardStyle = styles.gridItem4;
  const criticidade = (foto as any).criticidade?.toUpperCase();
  if (criticidade === 'ALTA') {
    cardStyle = styles.gridItem4FotoAlta;
  } else if (criticidade === 'MÉDIA' || criticidade === 'MEDIA') {
    cardStyle = styles.gridItem4FotoMedia;
  } else if (criticidade === 'BAIXA') {
    cardStyle = styles.gridItem4FotoBaixa;
  }

  return (
    <View style={cardStyle}>
      {foto.foto ? (
        <PDFImage src={foto.foto as any} style={{ width: '100%', height: 4.5 * CM_TO_PT }} />
      ) : (
        <View style={{ width: '100%', height: 4.5 * CM_TO_PT, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#64748b' }}>Sem imagem</Text>
        </View>
      )}
      <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{foto.local}</Text>
      <Text style={{ fontSize: 9 }}>Pendência: {foto.pendencia}</Text>
      <Text style={{ fontSize: 9 }}>Criticidade: {(foto as any).criticidade || '—'}</Text>
      {('responsavel' in foto) && (
        <Text style={{ fontSize: 9 }}>Responsável: {(foto as any).responsavel}</Text>
      )}
      <Text style={{ fontSize: 9 }}>Especialidade: {foto.especialidade}</Text>
      {foto.observacoes ? (<Text style={{ fontSize: 9 }}>Obs.: {foto.observacoes}</Text>) : null}
    </View>
  );
};

export type PdfImage = { data: Uint8Array; format: 'jpeg' | 'png' };
export type PdfFotoItem = { id: string; src: PdfImage | string | null; local: string; especialidade: string; pendencia: string; observacoes?: string; responsavel?: string; criticidade?: string };

export const RelatorioPDF: React.FC<{ ronda: Ronda; contrato: Contrato; areas: AreaTecnica[]; fotos?: PdfFotoItem[]; headerImage?: string | null }> = ({ ronda, contrato, areas, fotos = [], headerImage = null }) => {
  // Página 1: cabeçalho, faixa, 4 cards (2x2); demais páginas também 2x2
  const firstPageAreas = areas.slice(0, 4);
  const restantes = areas.slice(4);
  
  // Combinar fotos de ronda com itens de abertura de chamado
  const fotosRonda: PdfFotoItem[] = (ronda.fotosRonda || []).map((f) => ({ 
    id: f.id, 
    src: f.foto, 
    local: f.local, 
    especialidade: f.especialidade, 
    pendencia: f.pendencia, 
    observacoes: f.observacoes, 
    responsavel: (f as any).responsavel, 
    criticidade: (f as any).criticidade 
  }));
  
  // Adicionar itens de abertura de chamado (outrosItensCorrigidos com categoria CHAMADO)
  console.log('🔍 DEBUG PDF - Processando itens de chamado:', ronda.outrosItensCorrigidos);
  const itensChamado: PdfFotoItem[] = (ronda.outrosItensCorrigidos || [])
    .filter((item: any) => {
      console.log('🔍 DEBUG PDF - Verificando item:', item.categoria, item);
      return item.categoria === 'CHAMADO';
    })
    .flatMap((item: any) => {
      // Se o item tem múltiplas fotos, criar um item para cada foto
      if (item.fotos && item.fotos.length > 0) {
        return item.fotos.map((foto: string, index: number) => ({
          id: `${item.id}-foto-${index}`,
          src: foto,
          local: item.local || 'Local não informado',
          especialidade: item.nome || 'Item de chamado',
          pendencia: item.descricao || 'Sem descrição',
          observacoes: item.observacoes || '',
          responsavel: item.responsavel || '',
          criticidade: item.prioridade || 'MÉDIA'
        }));
      }
      // Se tem apenas uma foto ou nenhuma
      return [{
        id: item.id,
        src: item.foto || null,
        local: item.local || 'Local não informado',
        especialidade: item.nome || 'Item de chamado',
        pendencia: item.descricao || 'Sem descrição',
        observacoes: item.observacoes || '',
        responsavel: item.responsavel || '',
        criticidade: item.prioridade || 'MÉDIA'
      }];
    });
  
  const fotosToUse: PdfFotoItem[] = fotos.length
    ? fotos
    : [...fotosRonda, ...itensChamado];
  
  console.log('🔍 DEBUG PDF - Total de itens para PDF:', {
    fotosRonda: fotosRonda.length,
    itensChamado: itensChamado.length,
    total: fotosToUse.length,
    itensChamadoDetalhes: itensChamado
  });

  // Resumo Executivo (mesma lógica da interface)
  const resumo = (() => {
    const chamadosAbertos: string[] = [];
    const situacaoNormal: string[] = [];
    const emAtencao: string[] = [];
    const emManutencao: string[] = [];
    const itensCorrigidos: string[] = [];

    (ronda.fotosRonda || []).forEach(item => {
      const criticidade = (item as any).criticidade || 'Média';
      const textoPendencia = item.pendencia ? `Pendência: ${item.pendencia}` : `${item.especialidade} – ${item.local}`;
      
      if (criticidade === 'Alta') {
        emAtencao.push(`${item.especialidade} (${item.local}): ${textoPendencia}`);
      } else if (criticidade === 'Média') {
        emManutencao.push(`${item.especialidade} (${item.local}): ${textoPendencia}`);
      } else {
        chamadosAbertos.push(`${item.especialidade} (${item.local}): ${textoPendencia}`);
      }
    });

    areas.forEach(area => {
      if (area.status === 'ATENÇÃO') {
        emAtencao.push(`${area.nome}${area.observacoes ? `: ${area.observacoes}` : ''}`);
      } else if (area.status === 'EM MANUTENÇÃO') {
        emManutencao.push(`${area.nome}${area.observacoes ? `: ${area.observacoes}` : ''}`);
      } else {
        situacaoNormal.push(`${area.nome}: Operacional`);
      }
    });
    
    // Processar itens de abertura de chamado
    console.log('🔍 DEBUG PDF RESUMO - Processando itens de chamado:', ronda.outrosItensCorrigidos);
    (ronda.outrosItensCorrigidos || []).forEach(item => {
      console.log('🔍 DEBUG PDF RESUMO - Item:', {
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        status: item.status,
        prioridade: item.prioridade
      });
      
      const statusNorm = (item.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      
      // Se for item de chamado (não concluído) - considerar também itens sem categoria definida
      const isItemChamado = item.categoria === 'CHAMADO' || 
                           (item.categoria === undefined && statusNorm !== 'CONCLUIDO') ||
                           (item.categoria === null && statusNorm !== 'CONCLUIDO');
      
      if (isItemChamado && statusNorm !== 'CONCLUIDO') {
        const base = `${item.nome} (${item.local})`;
        const detalhe = item.descricao || item.observacoes || 'Item registrado';
        const prioridade = item.prioridade || 'MÉDIA';
        
        console.log('🔍 DEBUG PDF RESUMO - Item de chamado encontrado:', {
          base,
          detalhe,
          prioridade,
          statusNorm
        });
        
        // Classificar por prioridade e status
        if (prioridade === 'URGENTE' || prioridade === 'ALTA') {
          emAtencao.push(`${base}: ${detalhe}`);
          console.log('🔍 DEBUG PDF RESUMO - Adicionado a emAtencao');
        } else if (prioridade === 'MÉDIA' || statusNorm === 'EM ANDAMENTO') {
          emManutencao.push(`${base}: ${detalhe}`);
          console.log('🔍 DEBUG PDF RESUMO - Adicionado a emManutencao');
        } else {
          // BAIXA, PENDENTE ou outros status vão para chamados abertos
          chamadosAbertos.push(`${base}: ${detalhe}`);
          console.log('🔍 DEBUG PDF RESUMO - Adicionado a chamadosAbertos');
        }
      } else {
        console.log('🔍 DEBUG PDF RESUMO - Item não é chamado ou está concluído:', {
          categoria: item.categoria,
          statusNorm,
          isChamado: item.categoria === 'CHAMADO',
          isConcluido: statusNorm === 'CONCLUIDO'
        });
      }
      
      // Se for item corrigido
      if (statusNorm === 'CONCLUIDO') {
        const base = `${item.nome} (${item.local})`;
        const detalhe = item.observacoes || item.descricao || 'Item corrigido';
        itensCorrigidos.push(`${base}: ${detalhe}`);
      }
    });
    
    const resultado = { chamadosAbertos, situacaoNormal, emAtencao, emManutencao, itensCorrigidos };
    
    console.log('🔍 DEBUG PDF RESUMO - Resultado final:', {
      chamadosAbertos: resultado.chamadosAbertos.length,
      situacaoNormal: resultado.situacaoNormal.length,
      emAtencao: resultado.emAtencao.length,
      emManutencao: resultado.emManutencao.length,
      itensCorrigidos: resultado.itensCorrigidos.length,
      detalhes: resultado
    });
    
    return resultado;
  })();

  return (
    <Document title={`Relatório de Visita Técnica · ${contrato.nome}`} author="Portal de Visitas Manutenção Predial" subject="Relatório técnico de visita">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerFixedContainer} fixed>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>Relatório de Visita Técnica</Text>
            <Text style={{ fontSize: 10, color: '#374151' }}>Contrato: {contrato.nome}</Text>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>Data: {ronda.data}  Hora: {ronda.hora}</Text>
          </View>
        </View>
        <View style={styles.faixa}>
          <Text style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>Áreas Técnicas Verificadas</Text>
        </View>
        <View style={styles.grid4Wrap}>
          {firstPageAreas.map((a) => (
            <CardArea key={a.id} area={a} />
          ))}
        </View>
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerPagination} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
          {headerImage ? (
            <PDFImage src={headerImage} style={{ width: 3.8 * CM_TO_PT, height: 1.1 * CM_TO_PT }} />
          ) : null}
        </View>
      </Page>

      {/* Páginas seguintes: áreas técnicas 2x2 por página */}
      {Array.from({ length: Math.ceil(restantes.length / 4) }).map((_, pageIndex) => (
        <Page key={`areas-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.headerFixedContainer} fixed>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {headerImage ? (
                <PDFImage src={headerImage} style={{ width: 3.8 * CM_TO_PT, height: 1.1 * CM_TO_PT }} />
              ) : null}
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 700 }}>Relatório de Visita Técnica</Text>
              <Text style={{ fontSize: 10, color: '#374151' }}>Contrato: {contrato.nome}</Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Data: {ronda.data}  Hora: {ronda.hora}</Text>
            </View>
          </View>
          <View style={styles.grid4Wrap}>
            {restantes.slice(pageIndex * 4, pageIndex * 4 + 4).map((a) => (
              <CardArea key={a.id} area={a} />
            ))}
          </View>
          <View style={styles.footerContainer} fixed>
            <Text style={styles.footerPagination} render={({ pageNumber, totalPages }) => (
              `Página ${pageNumber} de ${totalPages}`
            )} />
          </View>
        </Page>
      ))}

      {/* Páginas de fotos 2x2 por página */}
      {Array.from({ length: Math.ceil(fotosToUse.length / 4) }).map((_, pageIndex) => (
        <Page key={`fotos-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.headerFixedContainer} fixed>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {headerImage ? (
                <PDFImage src={headerImage} style={{ width: 3.8 * CM_TO_PT, height: 1.1 * CM_TO_PT }} />
              ) : null}
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 700 }}>Relatório de Visita Técnica</Text>
              <Text style={{ fontSize: 10, color: '#374151' }}>Contrato: {contrato.nome}</Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Data: {ronda.data}  Hora: {ronda.hora}</Text>
            </View>
          </View>
          {pageIndex === 0 && (
            <View style={styles.faixa}>
              <Text style={{ color: '#ea580c', fontWeight: 700, fontSize: 14 }}>Itens Abertura de Chamado</Text>
            </View>
          )}
          <View style={styles.grid4Wrap}>
            {fotosToUse.slice(pageIndex * 4, pageIndex * 4 + 4).map((f) => (
              <CardFoto key={f.id} foto={{ id: f.id, foto: f.src as any, local: f.local, especialidade: f.especialidade, pendencia: f.pendencia, observacoes: f.observacoes, responsavel: f.responsavel, criticidade: f.criticidade }} />
            ))}
          </View>
          <View style={styles.footerContainer} fixed>
            <Text style={styles.footerPagination} render={({ pageNumber, totalPages }) => (
              `Página ${pageNumber} de ${totalPages}`
            )} />
          </View>
        </Page>
      ))}

      {/* Resumo Executivo – última página, uma página só */}
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <View style={styles.headerFixedContainer} fixed>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>Relatório de Visita Técnica</Text>
            <Text style={{ fontSize: 10, color: '#374151' }}>Contrato: {contrato.nome}</Text>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>Data: {ronda.data}  Hora: {ronda.hora}</Text>
          </View>
        </View>
        <View style={styles.resumoContainer}>
          <Text style={styles.title}>Resumo Executivo – Pontos Críticos</Text>

          {/* Chamados Abertos */}
          {resumo.chamadosAbertos.length > 0 && (
            <View style={styles.resumoSectionYellow}>
              <Text style={styles.resumoSectionTitle}>Chamados Abertos</Text>
              {resumo.chamadosAbertos.map((t, i) => (
                <Text key={i} style={styles.bullet}>• {t}</Text>
              ))}
            </View>
          )}

          {/* Áreas em ATENÇÃO */}
          {resumo.emAtencao.length > 0 && (
            <View style={styles.resumoSectionOrange}>
              <Text style={styles.resumoSectionTitle}>Áreas em ATENÇÃO</Text>
              {resumo.emAtencao.map((t, i) => (
                <Text key={i} style={styles.bullet}>• {t}</Text>
              ))}
            </View>
          )}

          {/* Áreas EM MANUTENÇÃO */}
          {resumo.emManutencao.length > 0 && (
            <View style={styles.resumoSectionRed}>
              <Text style={styles.resumoSectionTitle}>Áreas em MANUTENÇÃO</Text>
              {resumo.emManutencao.map((t, i) => (
                <Text key={i} style={styles.bullet}>• {t}</Text>
              ))}
            </View>
          )}

          {/* Situação Normal */}
          {resumo.situacaoNormal.length > 0 && (
            <View style={styles.resumoSectionGreen}>
              <Text style={styles.resumoSectionTitle}>Situação Normal</Text>
              {resumo.situacaoNormal.map((t, i) => (
                <Text key={i} style={styles.bullet}>• {t}</Text>
              ))}
            </View>
          )}

          {/* Itens Corrigidos */}
          {resumo.itensCorrigidos.length > 0 && (
            <View style={styles.resumoSectionGreen}>
              <Text style={styles.resumoSectionTitle}>Itens Corrigidos</Text>
              {resumo.itensCorrigidos.map((t, i) => (
                <Text key={i} style={styles.bullet}>• {t}</Text>
              ))}
            </View>
          )}
        </View>
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerPagination} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
          {headerImage ? (
            <PDFImage src={headerImage} style={{ width: 3.8 * CM_TO_PT, height: 1.1 * CM_TO_PT }} />
          ) : null}
        </View>
      </Page>
    </Document>
  );
};

async function srcToDataURL(src?: string | null): Promise<string | null> {
  if (!src) return null;
  // Carregar imagem e converter sempre para JPEG (compatível com React-PDF)
  const loadAsJpeg = (imgSrc: string): Promise<string | null> => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        const jpeg = canvas.toDataURL('image/jpeg', 0.92);
        resolve(jpeg);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });

  try {
    if (src.startsWith('data:image')) {
      // Se for WEBP, converter para JPEG; senão manter
      if (src.startsWith('data:image/webp')) {
        const jpeg = await (async () => {
          const img = new Image();
          return await new Promise<string | null>((resolve) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.92));
              } catch {
                resolve(null);
              }
            };
            img.onerror = () => resolve(null);
            img.src = src;
          });
        })();
        return jpeg || src; // fallback no base64 original
      }
      return src;
    }
    // blob: local - carregar direto no canvas
    if (src.startsWith('blob:')) {
      const jpeg = await loadAsJpeg(src);
      return jpeg;
    }
    // http/https: buscar como blob e converter via canvas para JPEG
    const response = await fetch(src, { mode: 'cors' });
    const blobObj = await response.blob();
    const objectUrl = URL.createObjectURL(blobObj);
    const jpeg = await loadAsJpeg(objectUrl);
    URL.revokeObjectURL(objectUrl);
    return jpeg;
  } catch (e) {
    return null;
  }
}

export async function preparePdfData(ronda: Ronda, areas: AreaTecnica[]) {
  const areasNormalized: AreaTecnica[] = await Promise.all(
    areas.map(async (a) => ({
      ...a,
      foto: a.foto ? ((await srcToDataURL(a.foto)) || a.foto) : a.foto,
    }))
  );
  const rondaNormalized: Ronda = {
    ...ronda,
    fotosRonda: await Promise.all(
      (ronda.fotosRonda || []).map(async (f) => ({
        ...f,
        foto: (await srcToDataURL(f.foto)) || f.foto,
      }))
    ),
  };
  return { rondaNormalized, areasNormalized };
}

async function fetchAsDataURLRaw(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadRelatorioPDF(ronda: Ronda, contrato: Contrato, areas: AreaTecnica[], headerImage?: string | null) {
  // Normalizar imagens para DataURL para garantir que todas renderizem no PDF
  const { rondaNormalized, areasNormalized } = await preparePdfData(ronda, areas);
  const headerDataUrl = await fetchAsDataURLRaw(headerImage || undefined);

  const blob = await pdf(<RelatorioPDF ronda={rondaNormalized} contrato={contrato} areas={areasNormalized} headerImage={headerDataUrl || headerImage || null} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio.pdf';
  a.click();
  URL.revokeObjectURL(url);
}




