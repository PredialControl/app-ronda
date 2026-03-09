/**
 * Helpers para corrigir problemas específicos do iOS em PWA
 */

/**
 * Detecta se está rodando em iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detecta se está rodando como PWA standalone no iOS
 */
export function isIOSStandalone(): boolean {
  if (!isIOS()) return false;

  // @ts-ignore - standalone existe no navigator do iOS
  return 'standalone' in window.navigator && window.navigator.standalone === true;
}

/**
 * Salva uma imagem na galeria do iOS usando download
 * iOS não salva automaticamente fotos capturadas pelo PWA
 */
export async function saveImageToGalleryIOS(imageUrl: string, filename?: string): Promise<boolean> {
  try {
    // Se não for iOS, não faz nada
    if (!isIOS()) {
      console.log('Não é iOS, não precisa salvar manualmente');
      return false;
    }

    // Criar um link temporário para download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || `foto-${Date.now()}.jpg`;

    // Adicionar ao DOM temporariamente (necessário no iOS)
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Remover do DOM
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    return true;
  } catch (error) {
    console.error('Erro ao salvar imagem na galeria iOS:', error);
    return false;
  }
}

/**
 * Converte data URL para Blob (útil para compartilhar fotos)
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Tenta salvar foto usando a API Share do iOS (se disponível)
 * Fallback para download se Share não estiver disponível
 */
export async function shareOrSaveImage(imageUrl: string, filename?: string): Promise<boolean> {
  try {
    if (!isIOS()) {
      return false;
    }

    // Tentar usar Web Share API (funciona melhor no iOS)
    if (navigator.share) {
      const blob = dataURLtoBlob(imageUrl);
      const file = new File([blob], filename || `foto-${Date.now()}.jpg`, { type: blob.type });

      await navigator.share({
        files: [file],
        title: 'Salvar foto na galeria',
      });

      return true;
    } else {
      // Fallback para download direto
      return await saveImageToGalleryIOS(imageUrl, filename);
    }
  } catch (error) {
    // Se o usuário cancelou o share, não é erro
    if ((error as Error).name === 'AbortError') {
      console.log('Usuário cancelou o compartilhamento');
      return false;
    }

    console.error('Erro ao compartilhar/salvar imagem:', error);
    // Tentar fallback
    return await saveImageToGalleryIOS(imageUrl, filename);
  }
}

/**
 * Classes CSS específicas para iOS standalone
 * Corrige problemas de z-index e posicionamento
 */
export function getIOSStandaloneClasses(): string {
  if (!isIOSStandalone()) return '';

  return 'ios-standalone';
}

/**
 * Adiciona classes CSS globais para iOS quando necessário
 */
export function setupIOSStyles(): void {
  if (typeof document === 'undefined') return;

  if (isIOSStandalone()) {
    document.documentElement.classList.add('ios-standalone');

    // Adicionar meta viewport específico para iOS
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }
  }
}

/**
 * Hook React para detectar iOS standalone
 */
export function useIsIOSStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return isIOSStandalone();
}
