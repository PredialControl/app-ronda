import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaTecnica } from '@/types';
import { Edit, Trash2, Wrench, Camera } from 'lucide-react';

interface AreaTecnicaCardProps {
  areaTecnica: AreaTecnica;
  onEdit: (areaTecnica: AreaTecnica) => void;
  onDelete: (id: string) => void;
  isPrintMode?: boolean;
}

export function AreaTecnicaCard({
  areaTecnica,
  onEdit,
  onDelete,
  isPrintMode = false
}: AreaTecnicaCardProps) {
  const getStatusColor = (status: string) => {
    if (status === 'ATIVO') return 'success';
    if (status === 'EM MANUTENÇÃO') return 'warning';
    if (status === 'ATENÇÃO') return 'attention';
    return 'default';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ATIVO') return 'Ativo';
    if (status === 'EM MANUTENÇÃO') return 'Em Manutenção';
    if (status === 'ATENÇÃO') return 'Atenção';
    return status;
  };

  if (isPrintMode) {
    return (
      <div className="print-card bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            {areaTecnica.nome}
          </h3>
          <Badge variant={getStatusColor(areaTecnica.status)}>
            {getStatusLabel(areaTecnica.status)}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600">
          <div>
            <span className="font-medium">Contrato:</span> {areaTecnica.contrato}
          </div>
        </div>
        
        {areaTecnica.observacoes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span> {areaTecnica.observacoes}
            </p>
          </div>
        )}
        
        {areaTecnica.foto && (
          <div className="pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Foto:</span>
              </div>
              <div className="relative">
                <img 
                  src={areaTecnica.foto} 
                  alt={`Foto da ${areaTecnica.nome}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                  {areaTecnica.nome}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            {areaTecnica.nome}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Botão editar clicado para:', areaTecnica);
                onEdit(areaTecnica);
              }}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(areaTecnica.id)}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(areaTecnica.status)}>
            {getStatusLabel(areaTecnica.status)}
          </Badge>
        </div>
        
        {areaTecnica.foto && (
          <div className="pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Foto:</span>
              </div>
              <div className="relative">
                <img 
                  src={areaTecnica.foto} 
                  alt={`Foto da ${areaTecnica.nome}`}
                  className="w-full h-32 object-cover rounded-lg border shadow-sm"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {areaTecnica.nome}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {areaTecnica.observacoes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span> {areaTecnica.observacoes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
