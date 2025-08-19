import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, AlertTriangle, MapPin, Wrench, Plus, User } from 'lucide-react';

interface FotoRonda {
  id: string;
  foto: string;
  local: string;
  pendencia: string;
  especialidade: string;
  responsavel: 'CONSTRUTORA' | 'CONDOMÍNIO';
  observacoes?: string;
  data: string;
  hora: string;
}

interface FotoRondaCardProps {
  fotoRonda: FotoRonda;
  onEdit: (fotoRonda: FotoRonda) => void;
  onDelete: (id: string) => void;
  isPrintMode?: boolean;
}

const ESPECIALIDADES = [
  'Elétrica',
  'Hidráulica',
  'Ar Condicionado',
  'Incêndio',
  'Segurança',
  'Limpeza',
  'Jardinagem',
  'Outros'
];

const PENDENCIAS = [
  'Nenhuma',
  'Pequena',
  'Média',
  'Alta',
  'Crítica'
];

export function FotoRondaCard({
  fotoRonda,
  onEdit,
  onDelete,
  isPrintMode = false
}: FotoRondaCardProps) {
  const getPendenciaColor = (pendencia: string) => {
    switch (pendencia) {
      case 'Nenhuma': return 'success';
      case 'Pequena': return 'default';
      case 'Média': return 'warning';
      case 'Alta': return 'warning';
      case 'Crítica': return 'destructive';
      default: return 'default';
    }
  };

  if (isPrintMode) {
    return (
      <div className="print-card bg-white border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            Item Abertura de Chamado
          </h3>
          <Badge variant={getPendenciaColor(fotoRonda.pendencia)}>
            {fotoRonda.pendencia}
          </Badge>
        </div>
        
        <div className="relative">
          <img 
            src={fotoRonda.foto} 
            alt={`Foto da ronda - ${fotoRonda.local}`}
            className="w-full h-32 object-cover rounded border"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {fotoRonda.especialidade}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Local:</span> {fotoRonda.local}
          </div>
          <div>
            <span className="font-medium">Especialidade:</span> {fotoRonda.especialidade}
          </div>
          <div>
            <span className="font-medium">Responsável:</span> 
            <span className={`font-semibold ${
              fotoRonda.responsavel === 'CONSTRUTORA' ? 'text-blue-600' : 'text-green-600'
            }`}>
              {fotoRonda.responsavel}
            </span>
          </div>
          <div>
            <span className="font-medium">Data:</span> {new Date().toLocaleDateString('pt-BR')}
          </div>
          <div>
            <span className="font-medium">Hora:</span> {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {fotoRonda.observacoes && (
          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span>
              <div className="mt-1 text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {fotoRonda.observacoes}
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
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Item Abertura de Chamado
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(fotoRonda)}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(fotoRonda.id)}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={getPendenciaColor(fotoRonda.pendencia)}>
            {fotoRonda.pendencia}
          </Badge>
        </div>
        
        <div className="relative">
          <img 
            src={fotoRonda.foto} 
            alt={`Foto da ronda - ${fotoRonda.local}`}
            className="w-full h-32 object-cover rounded-lg border shadow-sm"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {fotoRonda.especialidade}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Local:</span>
          <span>{fotoRonda.local}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wrench className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Especialidade:</span>
          <span>{fotoRonda.especialidade}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Pendência:</span>
          <span>{fotoRonda.pendencia}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Responsável:</span>
          <span className={`font-semibold ${
            fotoRonda.responsavel === 'CONSTRUTORA' ? 'text-blue-600' : 'text-green-600'
          }`}>
            {fotoRonda.responsavel}
          </span>
        </div>
        
        {fotoRonda.observacoes && (
          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span>
              <div className="mt-1 text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {fotoRonda.observacoes}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
