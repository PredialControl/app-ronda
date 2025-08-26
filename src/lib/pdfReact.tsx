import { Document, Page, View, Text, StyleSheet, Image as PDFImage, pdf } from '@react-pdf/renderer';
import { AreaTecnica, Ronda, Contrato, FotoRonda } from '@/types';
import { CM_TO_PT } from './pdfConfig';

const styles = StyleSheet.create({
  page: {
    paddingTop: 2 * CM_TO_PT,
    paddingBottom: 2 * CM_TO_PT,
    paddingLeft: 1 * CM_TO_PT,
    paddingRight: 1 * CM_TO_PT,
    fontSize: 10,
  },
  title: { fontSize: 16, fontWeight: 700, color: '#1e40af', marginBottom: 10 },
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
  headerText: {
    flexGrow: 1,
  },
  footerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.6 * CM_TO_PT,
  },
  footerImage: {
    position: 'absolute',
    bottom: 0.5 * CM_TO_PT,
    right: 0.5 * CM_TO_PT,
    width: 3.5 * CM_TO_PT,
    height: 1.0 * CM_TO_PT,
    opacity: 0.95,
  },
  logoCircle: { width: 2.2 * CM_TO_PT, height: 2.2 * CM_TO_PT, marginRight: 12 },
  logoTextBox: { color: 'white' },
  logoTextTop: { fontSize: 12, fontWeight: 700, color: 'white' },
  logoTextBottom: { fontSize: 14, fontWeight: 800, color: 'white' },
  faixa: {
    height: 1.6 * CM_TO_PT,
    borderWidth: 1,
    borderColor: '#16a34a',
    justifyContent: 'center',
    paddingHorizontal: 0.5 * CM_TO_PT,
    marginBottom: 0.5 * CM_TO_PT,
  },
  grid2: {
    flexDirection: 'row',
    gap: 1 * CM_TO_PT,
  },
  gridItem2: {
    width: (29.7 * CM_TO_PT - 2 * CM_TO_PT - 2 * CM_TO_PT - 0.5 * CM_TO_PT) / 2,
    height: 7.2 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#7e22ce',
    padding: 0.5 * CM_TO_PT,
  },
  grid4Wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0.5 * CM_TO_PT,
    paddingBottom: 1.8 * CM_TO_PT, // espaço reservado para rodapé
  },
  gridItem4: {
    width: (29.7 * CM_TO_PT - 2 * CM_TO_PT - 2 * CM_TO_PT - 0.5 * CM_TO_PT) / 2,
    height: 7.2 * CM_TO_PT,
    borderWidth: 2,
    borderColor: '#7e22ce',
    padding: 0.5 * CM_TO_PT,
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
    borderColor: '#bfdbfe',
    padding: 12,
    borderRadius: 4,
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

const CardArea: React.FC<{ area: AreaTecnica }> = ({ area }) => (
  <View style={styles.gridItem4}>
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

const CardFoto: React.FC<{ foto: FotoRonda | { id: string; foto: any; local: string; especialidade: string; pendencia: string; observacoes?: string; responsavel?: string; criticidade?: string } }> = ({ foto }) => (
  <View style={styles.gridItem4}>
    {foto.foto ? (
      <PDFImage src={foto.foto as any} style={{ width: '100%', height: 5.5 * CM_TO_PT }} />
    ) : (
      <View style={{ width: '100%', height: 5.5 * CM_TO_PT, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#64748b' }}>Sem imagem</Text>
      </View>
    )}
    <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{foto.local}</Text>
    <Text style={{ fontSize: 10 }}>Pendência: {foto.pendencia}</Text>
    <Text style={{ fontSize: 10 }}>Criticidade: {(foto as any).criticidade || '—'}</Text>
    {('responsavel' in foto) && (
      <Text style={{ fontSize: 10 }}>Responsável: {(foto as any).responsavel}</Text>
    )}
    <Text style={{ fontSize: 10 }}>Especialidade: {foto.especialidade}</Text>
    {foto.observacoes ? (<Text style={{ fontSize: 10 }}>Obs.: {foto.observacoes}</Text>) : null}
  </View>
);

export type PdfImage = { data: Uint8Array; format: 'jpeg' | 'png' };
export type PdfFotoItem = { id: string; src: PdfImage | string | null; local: string; especialidade: string; pendencia: string; observacoes?: string; responsavel?: string; criticidade?: string };

export const RelatorioPDF: React.FC<{ ronda: Ronda; contrato: Contrato; areas: AreaTecnica[]; fotos?: PdfFotoItem[]; headerImage?: string | null }> = ({ ronda, contrato, areas, fotos = [], headerImage = null }) => {
  // Página 1: cabeçalho, faixa, 2 cards largos (metade da altura útil cada um)
  const firstTwo = areas.slice(0, 2);
  const restantes = areas.slice(2);
  const fotosToUse: PdfFotoItem[] = fotos.length
    ? fotos
    : (ronda.fotosRonda || []).map((f) => ({ id: f.id, src: f.foto, local: f.local, especialidade: f.especialidade, pendencia: f.pendencia, observacoes: f.observacoes, responsavel: (f as any).responsavel, criticidade: (f as any).criticidade }));

  // Resumo Executivo (mesma lógica da interface)
  const resumo = (() => {
    const chamadosAbertos: string[] = [];
    const situacaoNormal: string[] = [];
    const emAtencao: string[] = [];
    const emManutencao: string[] = [];

    (ronda.fotosRonda || []).forEach(item => {
      const base = `${item.especialidade} – ${item.local}`;
      const obs = item.observacoes ? `: ${item.observacoes}` : '';
      chamadosAbertos.push(`${base}${obs ? obs : ''}`);
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
    return { chamadosAbertos, situacaoNormal, emAtencao, emManutencao };
  })();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {headerImage ? (
            <PDFImage src={headerImage} style={{ width: 7.0 * CM_TO_PT, height: 2.0 * CM_TO_PT }} />
          ) : null}
          <View style={styles.headerText}>
            <Text style={styles.titulo}>Relatório de Ronda Técnica</Text>
            <Text style={styles.texto}>Contrato: {contrato.nome}</Text>
            <Text style={styles.texto}>Endereço: {contrato.endereco}</Text>
            <Text style={styles.texto}>Data: {ronda.data}   Hora: {ronda.hora}   Responsável: {ronda.responsavel || '—'}</Text>
          </View>
        </View>
        <View style={styles.faixa}>
          <Text style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>Áreas Técnicas Verificadas</Text>
        </View>
        <View style={styles.grid4Wrap}>
          {firstTwo.map((a, i) => (
            <View key={i} style={styles.gridItem2}>
              <Text style={{ fontSize: 12, fontWeight: 700 }}>{a.nome}</Text>
              {(() => {
                let bg = '#dcfce7';
                let border = '#22c55e';
                let color = '#166534';
                if (a.status === 'EM MANUTENÇÃO') { bg = '#fffbeb'; border = '#f59e0b'; color = '#92400e'; }
                if (a.status === 'ATENÇÃO') { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; }
                return (
                  <View style={{ ...styles.statusPill, backgroundColor: bg, borderColor: border }}>
                    <Text style={{ fontSize: 10, color }}>{a.status}</Text>
                  </View>
                );
              })()}
              {a.foto ? (<PDFImage src={a.foto} style={{ width: '100%', height: 4.9 * CM_TO_PT, marginTop: 6 }} />) : null}
              {a.observacoes ? (<Text style={{ fontSize: 10, marginTop: 6 }}>Obs.: {a.observacoes}</Text>) : null}
            </View>
          ))}
        </View>
        <View style={styles.footerContainer} fixed>
          {headerImage ? (<PDFImage src={headerImage} style={styles.footerImage} />) : null}
        </View>
      </Page>

      {/* Páginas seguintes: áreas técnicas 2x2 por página */}
      {Array.from({ length: Math.ceil(restantes.length / 4) }).map((_, pageIndex) => (
        <Page key={`areas-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.grid4Wrap}>
            {restantes.slice(pageIndex * 4, pageIndex * 4 + 4).map((a) => (
              <CardArea key={a.id} area={a} />
            ))}
          </View>
          <View style={styles.footerContainer} fixed>
            {headerImage ? (<PDFImage src={headerImage} style={styles.footerImage} />) : null}
          </View>
        </Page>
      ))}

      {/* Páginas de fotos 2x2 por página */}
      {Array.from({ length: Math.ceil(fotosToUse.length / 4) }).map((_, pageIndex) => (
        <Page key={`fotos-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
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
            {headerImage ? (<PDFImage src={headerImage} style={styles.footerImage} />) : null}
          </View>
        </Page>
      ))}

      {/* Resumo Executivo – última página, uma página só */}
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
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
        </View>
        <View style={styles.footerContainer} fixed>
          {headerImage ? (<PDFImage src={headerImage} style={styles.footerImage} />) : null}
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
