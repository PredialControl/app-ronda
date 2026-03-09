import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { isIOS, shareOrSaveImage } from '@/lib/iosHelpers';

interface IOSSaveImageButtonProps {
  imageUrl: string;
  filename?: string;
  variant?: 'icon' | 'button';
  className?: string;
}

/**
 * Botão para salvar imagem na galeria do iOS
 * Só aparece em dispositivos iOS
 */
export function IOSSaveImageButton({
  imageUrl,
  filename,
  variant = 'icon',
  className = ''
}: IOSSaveImageButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Não renderizar se não for iOS
  if (!isIOS()) {
    return null;
  }

  const handleSave = async () => {
    if (saving || saved) return;

    setSaving(true);
    try {
      const success = await shareOrSaveImage(imageUrl, filename);
      if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
    } finally {
      setSaving(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-full transition-all ${className}`}
        title="Salvar na galeria"
      >
        {saved ? (
          <span className="text-xs">✓</span>
        ) : saving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className={`flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md text-sm font-medium transition-all ${className}`}
    >
      {saved ? (
        <>
          <span className="text-sm">✓</span>
          <span>Salvo!</span>
        </>
      ) : saving ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Salvando...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Salvar na Galeria</span>
        </>
      )}
    </button>
  );
}
