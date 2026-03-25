import { SectionTabs } from './SectionTabs';
import { useState } from 'react';
import {
  Eye,
  DollarSign,
  Calendar,
  CheckSquare,
  Search,
  ClipboardList,
  FolderOpen,
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

interface AgendaMenuProps {
  onNavigate: (destination: string) => void;
}

export function AgendaMenu({ onNavigate }: AgendaMenuProps) {
  const [currentSection, setCurrentSection] = useState<SectionType>('implantacao');

  const implantacaoItems: MenuItem[] = [
    {
      id: 'vistoria',
      title: 'Vistoria',
      description: 'Agende e realize vistorias de implantação',
      icon: Eye,
      onClick: () => onNavigate('agenda-vistoria')
    },
    {
      id: 'recebimentos',
      title: 'Recebimentos',
      description: 'Gerencie agenda de recebimentos',
      icon: DollarSign,
      onClick: () => onNavigate('agenda-recebimentos')
    },
    {
      id: 'conferencias',
      title: 'Conferências',
      description: 'Agende conferências e verificações',
      icon: CheckSquare,
      onClick: () => onNavigate('agenda-conferencias')
    },
    {
      id: 'comissionamento',
      title: 'Comissionamento',
      description: 'Gerencie agenda de comissionamento',
      icon: Calendar,
      onClick: () => onNavigate('agenda-comissionamento')
    },
  ];

  const supervisaoItems: MenuItem[] = [
    {
      id: 'rondas-supervisao',
      title: 'Rondas de Supervisão',
      description: 'Agende rondas de supervisão',
      icon: Search,
      onClick: () => onNavigate('agenda-rondas-supervisao')
    },
    {
      id: 'parecer-tecnico',
      title: 'Parecer Técnico',
      description: 'Agende elaboração de pareceres',
      icon: ClipboardList,
      onClick: () => onNavigate('agenda-parecer-tecnico')
    },
    {
      id: 'documentos-condominio',
      title: 'Documentos do Condomínio',
      description: 'Agende revisão de documentos',
      icon: FolderOpen,
      onClick: () => onNavigate('agenda-documentos-condominio')
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
                       hover:border-blue-500 hover:shadow-lg transition-all duration-200
                       hover:scale-105 active:scale-95"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-green-100 text-green-600 p-3 rounded-lg group-hover:bg-green-600
                              group-hover:text-white transition-colors duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600
                                     group-hover:translate-x-1 transition-all duration-200" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600
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
