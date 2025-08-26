import html2pdf from 'html2pdf.js';
export const CM_TO_PT = 28.3465;

export const pdfConfig = {
  margin: [5, 5, 5, 5],
  filename: 'relatorio.pdf',
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    removeContainer: true,
    windowWidth: 1920,
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'landscape',
    compress: true,
    precision: 16,
  },
  pagebreak: {
    mode: ['css', 'avoid-all', 'legacy'],
    avoid: ['.no-break'],
  },
};

// Detectar se é dispositivo móvel
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const generatePDF = async (element: HTMLElement, filename?: string) => {
  try {
    const isMobileDevice = isMobile();
    const config = {
      ...pdfConfig,
      filename: filename || pdfConfig.filename,
      html2canvas: {
        ...pdfConfig.html2canvas,
        scale: isMobileDevice ? 1.5 : 2,
        quality: isMobileDevice ? 0.8 : 0.95,
      },
      image: {
        ...pdfConfig.image,
        quality: isMobileDevice ? 0.85 : 0.95,
      },
      jsPDF: {
        ...pdfConfig.jsPDF,
        precision: isMobileDevice ? 8 : 16,
      },
    };

    const pdf = await html2pdf().from(element).set(config).save();
    // Remover página em branco ao final (algumas versões do html2pdf adicionam)
    // @ts-ignore
    if (pdf && pdf.internal && pdf.internal.getNumberOfPages) {
      // @ts-ignore
      const total = pdf.internal.getNumberOfPages();
      if (total > 1) {
        // @ts-ignore
        const last = pdf.internal.pages[total];
        if (!last || last.length === 0) {
          // @ts-ignore
          pdf.deletePage(total);
        }
      }
    }
    return pdf;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};
