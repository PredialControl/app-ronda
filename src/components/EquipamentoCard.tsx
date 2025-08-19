import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Equipamento } from '@/types';
import { Copy, ExternalLink } from 'lucide-react';

interface EquipamentoCardProps {
  equipamento: any; // Temporariamente comentado
  onEdit?: (equipamento: any) => void;
  onDelete?: (id: string) => void;
  isPrintMode?: boolean;
}

export function EquipamentoCard({ 
  equipamento, 
  onEdit, 
  onDelete, 
  isPrintMode = false 
}: EquipamentoCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'success';
      case 'EM MANUTENÇÃO':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <Card className={`w-full max-w-sm ${isPrintMode ? 'print-card' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">
            {equipamento.nome}
          </h3>
          <Badge 
            variant={getStatusVariant(equipamento.status) as any}
            className="text-black"
          >
            Status: {equipamento.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Contrato:</span>
            <span>{equipamento.contrato}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Endereço:</span>
            <span>{equipamento.endereco}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Data:</span>
            <span>{formatDateTime(equipamento.data, equipamento.hora)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Hora:</span>
            <span>{formatTime(equipamento.hora)}</span>
          </div>
        </div>

        {equipamento.foto && (
          <div className="relative">
            <img
              src={equipamento.foto}
              alt={`Foto do ${equipamento.nome}`}
              className="w-full h-48 object-cover rounded-md"
            />
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
              900×596
            </div>
            <div className="absolute bottom-2 right-2 text-white text-xs bg-black/50 px-2 py-1 rounded flex items-center gap-1">
              meimargeradores.com.br
              <ExternalLink className="w-3 h-3" />
            </div>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isPrintMode && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <button
                onClick={() => onEdit(equipamento)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(equipamento.id)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
              >
                Excluir
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
