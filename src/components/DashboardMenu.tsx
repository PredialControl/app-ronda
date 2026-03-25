import { SectionTabs } from './SectionTabs';
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PhoneCall,
  AlertCircle,
  MapPin,
  FileText,
  FileWarning,
  Calendar,
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

interface DashboardMenuProps {
  onNavigate: (destination: string) => void;
}

export function DashboardMenu({ onNavigate }: DashboardMenuProps) {
  const [currentSection, setCurrentSection] = useState<SectionType>('implantacao');

  const implantacaoItems: MenuItem[] = [
    {
      id: 'evolucao-kanban',
      title: 'Evolução do Kanban',
      description: 'Visualize o progresso das etapas',
      icon: BarChart3,
      onClick: () => onNavigate('dashboard-evolucao-kanban')
    },
    {
      id: 'evolucao-recebimentos',
      title: 'Evolução dos Recebimentos',
      description: 'Acompanhe evolução financeira',
      icon: TrendingUp,
      onClick: () => onNavigate('dashboard-evolucao-recebimentos')
    },
  ];

  const supervisaoItems: MenuItem[] = [
    {
      id: 'status-chamados',
      title: 'Status dos Chamados',
      description: 'Visualize status de todos os chamados',
      icon: PhoneCall,
      onClick: () => onNavigate('dashboard-status-chamados')
    },
    {
      id: 'itens-criticos',
      title: 'Itens Críticos sem Funcionamento',
      description: 'Itens que precisam de atenção imediata',
      icon: AlertCircle,
      onClick: () => onNavigate('dashboard-itens-criticos')
    },
    {
      id: 'visitas-predio',
      title: 'Visitas / Prédio',
      description: 'Frequência de visitas por prédio',
      icon: MapPin,
      onClick: () => onNavigate('dashboard-visitas-predio')
    },
    {
      id: 'pareceres-predio',
      title: 'Pareceres / Prédio',
      description: 'Pareceres técnicos por prédio',
      icon: FileText,
      onClick: () => onNavigate('dashboard-pareceres-predio')
    },
    {
      id: 'documentacao-vencida',
      title: 'Documentação Vencida / Prédio',
      description: 'Documentos com prazo vencido',
      icon: FileWarning,
      onClick: () => onNavigate('dashboard-documentacao-vencida')
    },
    {
      id: 'preventivas-executadas',
      title: 'Preventivas Programadas X Executadas',
      description: 'Compare preventivas planejadas vs realizadas',
      icon: Calendar,
      onClick: () => onNavigate('dashboard-preventivas-executadas')
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
                       hover:border-purple-500 hover:shadow-lg transition-all duration-200
                       hover:scale-105 active:scale-95"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-lg group-hover:bg-purple-600
                              group-hover:text-white transition-colors duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600
                                     group-hover:translate-x-1 transition-all duration-200" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600
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
