// Componente ChecklistRondaCard - Card para itens de checklist de ronda
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChecklistItem } from '@/types';
import {
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  MapPin,
  Camera,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistRondaCardProps {
  item: ChecklistItem;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
}

export function ChecklistRondaCard({
  item,
  onEdit,
  onDelete
}: ChecklistRondaCardProps) {
  const isOk = item.status === 'OK';

  return (
    <Card className={cn(
      "glass-card overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      isOk ? "border-emerald-500/30" : "border-red-500/30"
    )}>
      {/* Foto principal (se houver) */}
      {item.fotos && item.fotos.length > 0 && (
        <div className="relative h-32 bg-gray-900">
          <img
            src={item.fotos[0]}
            alt={item.tipo}
            className="w-full h-full object-cover"
          />
          {item.fotos.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {item.fotos.length}
            </div>
          )}
          {/* Badge de status sobre a foto */}
          <div className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            isOk ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          )}>
            {isOk ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {isOk ? 'OK' : 'NÃO OK'}
          </div>
        </div>
      )}

      <CardContent className="p-3">
        {/* Header sem foto */}
        {(!item.fotos || item.fotos.length === 0) && (
          <div className={cn(
            "flex items-center gap-2 pb-2 mb-2 border-b",
            isOk ? "border-emerald-500/20" : "border-red-500/20"
          )}>
            {isOk ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className={cn(
              "text-sm font-medium flex-1",
              isOk ? "text-emerald-300" : "text-red-300"
            )}>
              {isOk ? 'OK' : 'NÃO OK'}
            </span>
          </div>
        )}

        {/* Tipo e Local */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">{item.tipo}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.hora}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm">{item.local}</span>
          </div>
        </div>

        {/* Observação (se houver) */}
        {item.observacao && (
          <div className={cn(
            "text-xs p-2 rounded mb-2",
            isOk ? "bg-white/5 text-gray-400" : "bg-red-500/10 text-red-300"
          )}>
            {item.observacao}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs glass-button"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 glass-button text-red-400 hover:text-red-300 hover:border-red-500/50"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
