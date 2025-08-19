import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OutroItemCorrigido } from '@/types';
import { Edit, Trash2, Camera, MapPin, AlertTriangle, Wrench, Star, Calendar, Clock } from 'lucide-react';

interface OutroItemCorrigidoCardProps {
  item: OutroItemCorrigido;
  onEdit: (item: OutroItemCorrigido) => void;
  onDelete: (id: string) => void;
}

export function OutroItemCorrigidoCard({ item, onEdit, onDelete }: OutroItemCorrigidoCardProps) {
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CORREÇÃO':
        return <Wrench className="w-4 h-4" />;
      case 'MELHORIA':
        return <Star className="w-4 h-4" />;
      case 'MANUTENÇÃO':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'BAIXA':
        return 'bg-green-100 text-green-800';
      case 'MÉDIA':
        return 'bg-yellow-100 text-yellow-800';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800';
      case 'URGENTE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'EM ANDAMENTO':
        return 'bg-blue-100 text-blue-800';
      case 'CONCLUÍDO':
        return 'bg-green-100 text-green-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getTipoIcon(item.tipo)}
          <h3 className="font-semibold text-gray-900 text-lg">{item.nome}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-gray-700 text-sm">{item.descricao}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{item.local}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={getTipoIcon(item.tipo) ? 'bg-blue-100 text-blue-800' : ''}>
            {item.tipo}
          </Badge>
          <Badge className={getPrioridadeColor(item.prioridade)}>
            {item.prioridade}
          </Badge>
          <Badge className={getStatusColor(item.status)}>
            {item.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(item.data).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{item.hora}</span>
          </div>
        </div>

        {item.responsavel && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Responsável:</span> {item.responsavel}
          </div>
        )}

        {item.foto && (
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Foto anexada</span>
          </div>
        )}

        {item.observacoes && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Observações:</span> {item.observacoes}
          </div>
        )}
      </div>
    </div>
  );
}
