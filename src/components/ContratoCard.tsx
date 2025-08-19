import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contrato } from '@/types';
import { Edit, Trash2, FileText, MapPin, User, Calendar, Clock } from 'lucide-react';

interface ContratoCardProps {
  contrato: Contrato;
  onEdit: (contrato: Contrato) => void;
  onDelete: (id: string) => void;
  onSelect: (contrato: Contrato) => void;
  isSelected?: boolean;
}

export function ContratoCard({
  contrato,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false
}: ContratoCardProps) {
  const getPeriodicidadeColor = (periodicidade: string) => {
    switch (periodicidade) {
      case 'DIARIA':
        return 'bg-red-100 text-red-800';
      case 'SEMANAL':
        return 'bg-orange-100 text-orange-800';
      case 'QUINZENAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'MENSAL':
        return 'bg-blue-100 text-blue-800';
      case 'BIMESTRAL':
        return 'bg-indigo-100 text-indigo-800';
      case 'TRIMESTRAL':
        return 'bg-purple-100 text-purple-800';
      case 'SEMESTRAL':
        return 'bg-pink-100 text-pink-800';
      case 'ANUAL':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPeriodicidadeLabel = (periodicidade: string) => {
    switch (periodicidade) {
      case 'DIARIA':
        return 'Diária';
      case 'SEMANAL':
        return 'Semanal';
      case 'QUINZENAL':
        return 'Quinzenal';
      case 'MENSAL':
        return 'Mensal';
      case 'BIMESTRAL':
        return 'Bimestral';
      case 'TRIMESTRAL':
        return 'Trimestral';
      case 'SEMESTRAL':
        return 'Semestral';
      case 'ANUAL':
        return 'Anual';
      default:
        return periodicidade;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onSelect(contrato)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {contrato.nome}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contrato);
              }}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(contrato.id);
              }}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Síndico:</span>
          <span>{contrato.sindico}</span>
        </div>
        
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
          <span className="font-medium">Endereço:</span>
          <span className="flex-1">{contrato.endereco}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Periodicidade:</span>
          <Badge className={getPeriodicidadeColor(contrato.periodicidade)}>
            {getPeriodicidadeLabel(contrato.periodicidade)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Criado em:</span>
          <span>{new Date(contrato.dataCriacao).toLocaleDateString('pt-BR')}</span>
        </div>
        
        {contrato.observacoes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span> {contrato.observacoes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
