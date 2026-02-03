import { PhotoUpload } from './PhotoUpload';

interface KanbanPhotoUploadProps {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
  maxFotos?: number;
}

export function KanbanPhotoUpload({ fotos, onFotosChange, maxFotos = 40 }: KanbanPhotoUploadProps) {
  return (
    <PhotoUpload
      photos={fotos}
      onPhotosChange={onFotosChange}
      maxPhotos={maxFotos}
      label="📸 Fotos do Card"
      showCounter={true}
    />
  );
}
