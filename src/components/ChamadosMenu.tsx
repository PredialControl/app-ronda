import { SectionTabs } from './SectionTabs';
import { useState } from 'react';
import {
  PhoneCall,
  Plus,
  List,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

type SectionType = 'implantacao' | 'supervisao';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
}

interface ChamadosMenuProps {
  onNavigate: (destination: string) => void;
}

export function ChamadosMenu({ onNavigate }: ChamadosMenuProps) {
  const [currentSection, setCurrentSection] = useState<SectionType>('implantacao');

  const implantacaoItems: MenuItem[] = [
    {
      id: 'novo-chamado',
      title: 'Novo Chamado',
      description: 'Abrir um novo chamado de implantação',
      icon: Plus,
      onClick: () => onNavigate('chamados-novo-implantacao')
    },
    {
      id: 'listar-chamados',
      title: 'Listar Chamados',
      description: 'Visualizar todos os chamados de implantação',
      icon: List,
      onClick: () => onNavigate('chamados-lista-implantacao')
    },
    {
      id: 'em-andamento',
      title: 'Em Andamento',
      description: 'Chamados em andamento na implantação',
      icon: Clock,
      onClick: () => onNavigate('chamados-andamento-implantacao')
    },
    {
      id: 'concluidos',
      title: 'Concluídos',
      description: 'Chamados finalizados da implantação',
      icon: CheckCircle,
      onClick: () => onNavigate('chamados-concluidos-implantacao')
    },
  ];

  const supervisaoItems: MenuItem[] = [
    {
      id: 'novo-chamado',
      title: 'Novo Chamado',
      description: 'Abrir um novo chamado de supervisão',
      icon: Plus,
      onClick: () => onNavigate('chamados-novo-supervisao')
    },
    {
      id: 'listar-chamados',
      title: 'Listar Chamados',
      description: 'Visualizar todos os chamados de supervisão',
      icon: List,
      onClick: () => onNavigate('chamados-lista-supervisao')
    },
    {
      id: 'em-andamento',
      title: 'Em Andamento',
      description: 'Chamados em andamento na supervisão',
      icon: Clock,
      onClick: () => onNavigate('chamados-andamento-supervisao')
    },
    {
      id: 'concluidos',
      title: 'Concluídos',
      description: 'Chamados finalizados da supervisão',
      icon: CheckCircle,
      onClick: () => onNavigate('chamados-concluidos-supervisao')
    },
    {
      id: 'cancelados',
      title: 'Cancelados',
      description: 'Chamados cancelados da supervisão',
      icon: XCircle,
      onClick: () => onNavigate('chamados-cancelados-supervisao')
    },
  ];

  const currentItems = currentSection === 'implantacao' ? implantacaoItems : supervisaoItems;

  return (
    <div className="w-full">
      <SectionTabs currentSection={currentSection} onSectionChange={setCurrentSection} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {currentItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="group relative bg-white border-2 border-gray-200 rounded-lg p-6 text-left
                       hover:border-orange-500 hover:shadow-lg transition-all duration-200
                       hover:scale-105 active:scale-95"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg group-hover:bg-orange-600
                              group-hover:text-white transition-colors duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600
                                     group-hover:translate-x-1 transition-all duration-200" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600
                           transition-colors duration-200">
                {item.title}
              </h3>

              <p className="text-sm text-gray-600 line-clamp-2">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {currentItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum item disponível nesta seção</p>
        </div>
      )}
    </div>
  );
}
