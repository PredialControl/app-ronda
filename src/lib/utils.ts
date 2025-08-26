import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Otimiza uma foto para reduzir o tamanho mantendo qualidade
 * @param file - Arquivo da foto
 * @param maxWidth - Largura máxima (padrão: 1200px)
 * @param maxHeight - Altura máxima (padrão: 1200px)
 * @param quality - Qualidade da compressão (0.1 a 1.0, padrão: 0.8)
 * @returns Promise<string> - Base64 da foto otimizada
 */
export async function otimizarFoto(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Exportar sempre em JPEG para compatibilidade com PDF
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        console.log(`✅ Foto otimizada: ${file.size} → ${Math.round(jpegDataUrl.length * 0.75)} bytes (JPEG)`);
        resolve(jpegDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calcula o tamanho aproximado de uma string base64 em bytes
 */
export function calcularTamanhoBase64(base64: string): number {
  // Remove o prefixo "data:image/...;base64,"
  const base64Data = base64.split(',')[1];
  // Cada caractere base64 representa 6 bits, então 4 caracteres = 3 bytes
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Formata o tamanho em bytes para leitura humana
 */
export function formatarTamanho(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
