import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContratoCard } from '@/components/ContratoCard';
import { ContratoModal } from '@/components/ContratoModal';
import { Contrato } from '@/types';
import { Plus, Search, Filter, FileText } from 'lucide-react';

interface GerenciarContratosProps {
  contratos: Contrato[];
  onSaveContrato: (contrato: Contrato) => void;
  onDeleteContrato: (id: string) => void;
  onSelectContrato: (contrato: Contrato) => void;
  onVoltar: () => void;
}

export function GerenciarContratos({
  contratos,
  onSaveContrato,
  onDeleteContrato,
  onSelectContrato,
  onVoltar
}: GerenciarContratosProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodicidadeFilter, setPeriodicidadeFilter] = useState<string>('TODOS');

  const handleAddContrato = () => {
    setEditingContrato(null);
    setIsModalOpen(true);
  };

  const handleEditContrato = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setIsModalOpen(true);
  };

  const handleSaveContrato = (contrato: Contrato) => {
    onSaveContrato(contrato);
    setIsModalOpen(false);
    setEditingContrato(null);
  };

  const handleDeleteContrato = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      onDeleteContrato(id);
    }
  };

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = contrato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.sindico.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.endereco.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriodicidade = periodicidadeFilter === 'TODOS' || contrato.periodicidade === periodicidadeFilter;

    return matchesSearch && matchesPeriodicidade;
  });

  const getPeriodicidadeOptions = () => [
    { value: 'TODOS', label: 'Todas as Periodicidades' },
    { value: 'DIARIA', label: 'Diária' },
    { value: 'SEMANAL', label: 'Semanal' },
    { value: 'QUINZENAL', label: 'Quinzenal' },
    { value: 'MENSAL', label: 'Mensal' },
    { value: 'BIMESTRAL', label: 'Bimestral' },
    { value: 'TRIMESTRAL', label: 'Trimestral' },
    { value: 'SEMESTRAL', label: 'Semestral' },
    { value: 'ANUAL', label: 'Anual' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Gerenciar Contratos
            </h1>
            <Button onClick={handleAddContrato} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Visão Geral dos Contratos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{contratos.length}</div>
              <div className="text-blue-800">Total de Contratos</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {contratos.filter(c => c.periodicidade === 'MENSAL').length}
              </div>
              <div className="text-green-800">Mensais</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {contratos.filter(c => c.periodicidade === 'SEMANAL').length}
              </div>
              <div className="text-orange-800">Semanais</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {contratos.filter(c => c.periodicidade === 'ANUAL').length}
              </div>
              <div className="text-purple-800">Anuais</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar
              </label>
              <Input
                placeholder="Nome, síndico ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Periodicidade
              </label>
              <select
                value={periodicidadeFilter}
                onChange={(e) => setPeriodicidadeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getPeriodicidadeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setPeriodicidadeFilter('TODOS');
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContratos.map((contrato) => (
            <ContratoCard
              key={contrato.id}
              contrato={contrato}
              onEdit={handleEditContrato}
              onDelete={handleDeleteContrato}
              onSelect={onSelectContrato}
            />
          ))}
        </div>

        {filteredContratos.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {contratos.length === 0 
                ? 'Nenhum contrato cadastrado ainda.'
                : 'Nenhum contrato encontrado com os filtros aplicados.'
              }
            </p>
            {contratos.length === 0 && (
              <Button onClick={handleAddContrato} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Contrato
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      <ContratoModal
        contrato={editingContrato}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContrato(null);
        }}
        onSave={handleSaveContrato}
      />
    </div>
  );
}
