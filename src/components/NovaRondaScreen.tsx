import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { Contrato } from '@/types';

interface NovaRondaScreenProps {
  contrato: Contrato;
  onVoltar: () => void;
  onSalvar: (rondaData: {
    nome: string;
    data: string;
    hora: string;
    observacoesGerais?: string;
    tipoVisita?: 'RONDA' | 'REUNIAO' | 'OUTROS';
  }) => void;
}

export function NovaRondaScreen({
  contrato,
  onVoltar,
  onSalvar
}: NovaRondaScreenProps) {
  const [formData, setFormData] = React.useState({
    nome: '',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    observacoesGerais: '',
    tipoVisita: 'RONDA' as 'RONDA' | 'REUNIAO' | 'OUTROS'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      alert('Por favor, informe o nome da ronda');
      return;
    }

    onSalvar(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Atualizar nome automaticamente quando o tipo de visita mudar
    if (field === 'tipoVisita') {
      let novoNome = '';
      if (value === 'RONDA') {
        novoNome = 'VISITA TÉCNICA';
      } else if (value === 'REUNIAO') {
        novoNome = 'REUNIÃO DE ALINHAMENTO';
      }
      setFormData(prev => ({ ...prev, nome: novoNome, [field]: value as 'RONDA' | 'REUNIAO' | 'OUTROS' }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onVoltar} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Contrato
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Ronda</h1>
          <p className="text-gray-600">Contrato: {contrato.nome}</p>
        </div>
      </div>

      {/* Informações do Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Informações do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Síndico:</span> {contrato.sindico}
            </div>
            <div>
              <span className="font-medium">Endereço:</span> {contrato.endereco}
            </div>
            <div>
              <span className="font-medium">Periodicidade:</span> {contrato.periodicidade}
            </div>
            <div>
              <span className="font-medium">Data de Criação:</span> {new Date(contrato.dataCriacao).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário da Nova Ronda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Dados da Nova Ronda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Visita */}
            <div className="space-y-2">
              <Label>Tipo de Visita *</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('tipoVisita', 'RONDA')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'RONDA'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                >
                  🔍 Ronda
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('tipoVisita', 'REUNIAO')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'REUNIAO'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                >
                  👥 Reunião
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('tipoVisita', 'OUTROS')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${formData.tipoVisita === 'OUTROS'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                >
                  📋 Outros
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Ronda *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Ronda Matutina, Ronda Vespertina"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => handleInputChange('hora', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                  Ricardo Oliveira
                </div>
                <p className="text-xs text-gray-500">Responsável padrão definido automaticamente</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Gerais (Opcional)</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoesGerais}
                onChange={(e) => handleInputChange('observacoesGerais', e.target.value)}
                placeholder="Observações gerais sobre a ronda..."
                rows={4}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">ℹ️ O que acontece ao criar a ronda:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 8 áreas técnicas serão criadas automaticamente (Gerador, Nível óleo diesel, etc.)</li>
                  <li>• Todas as áreas ficarão com status "Ativo" por padrão</li>
                  <li>• Você poderá editar cada área, adicionar fotos e alterar status</li>
                  <li>• Poderá registrar itens para abertura de chamado</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onVoltar} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Ronda
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
