import { useState, useRef } from 'react';
import { Camera, Upload, X, ZoomIn } from 'lucide-react';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  showCounter?: boolean;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 40,
  label = '📸 Fotos',
  showCounter = true
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Função para converter imagem para WebP
  const convertToWebP = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Criar canvas para conversão
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          // Redimensionar se necessário (máximo 1920x1920)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Desenhar imagem no canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Converter SEMPRE para WebP com qualidade 0.85
          const webpData = canvas.toDataURL('image/webp', 0.85);
          resolve(webpData);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newPhotos: string[] = [];
      const remainingSlots = maxPhotos - photos.length;

      // Processar apenas o número de fotos que cabem
      const filesToProcess = Math.min(files.length, remainingSlots);

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];

        // Verificar se é imagem
        if (!file.type.startsWith('image/')) {
          console.warn(`Arquivo ${file.name} não é uma imagem válida`);
          continue;
        }

        try {
          const optimizedData = await convertToWebP(file);
          newPhotos.push(optimizedData);
        } catch (error) {
          console.error(`Erro ao converter ${file.name}:`, error);
        }
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }

      if (files.length > remainingSlots) {
        alert(`Limite de ${maxPhotos} fotos atingido. Apenas ${remainingSlots} fotos foram adicionadas.`);
      }
    } catch (error) {
      console.error('Erro ao processar fotos:', error);
      alert('Erro ao processar fotos. Tente novamente.');
    } finally {
      setIsUploading(false);
      // Limpar input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Label e botões */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-300">{label}</h3>
          {showCounter && (
            <span className="text-sm text-gray-400">
              (<span className="font-bold text-blue-400">{photos.length}</span> / {maxPhotos})
            </span>
          )}
        </div>

        {canAddMore && (
          <div className="flex gap-2">
            {/* Botão da Câmera */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Camera className="w-4 h-4" />
              Tirar Foto
            </button>

            {/* Botão de Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Escolher Fotos
            </button>
          </div>
        )}
      </div>

      {/* Input oculto para câmera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Input oculto para galeria */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Loading */}
      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-blue-900/20 rounded-md border border-blue-500/30">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-300">Convertendo fotos para WebP...</span>
        </div>
      )}

      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-md border-2 border-gray-700 group-hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => setPreviewImage(photo)}
              />

              {/* Botão de remover */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Botão de zoom */}
              <button
                type="button"
                onClick={() => setPreviewImage(photo)}
                className="absolute bottom-1 right-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              {/* Número da foto */}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
