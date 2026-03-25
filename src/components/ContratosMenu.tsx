import { SectionTabs } from './SectionTabs';
import { useState } from 'react';
import {
  LayoutGrid,
  FileText,
  TrendingUp,
  FileCheck,
  Search,
  ClipboardList,
  FolderOpen,
  CheckCircle,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';

type SectionType = 'implantacao' | 'supervisao';
type SubMenuType = 'kanban' | 'relatorio-pendencias' | 'evolucao-recebimentos' | null;

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  hasSubMenu?: boolean;
  onClick: () => void;
}

interface ContratosMenuProps {
  onNavigate: (destination: string) => void;
}

export function ContratosMenu({ onNavigate }: ContratosMenuProps) {
  const [currentSection, setCurrentSection] = useState<SectionType>('implantacao');
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>(null);

  const implantacaoItems: MenuItem[] = [
    {
      id: 'kanban',
      title: 'Kanban',
      description: 'Gerencie vistorias, recebimentos e conferências',
      icon: LayoutGrid,
      hasSubMenu: true,
      onClick: () => setActiveSubMenu('kanban')
    },
    {
      id: 'relatorio-pendencias',
      title: 'Relatório de Pendências',
      description: 'Visualize áreas técnicas e itens de bombeiro',
      icon: FileText,
      hasSubMenu: true,
      onClick: () => setActiveSubMenu('relatorio-pendencias')
    },
    {
      id: 'evolucao-recebimentos',
      title: 'Evolução dos Recebimentos',
      description: 'Acompanhe o progresso dos recebimentos',
      icon: TrendingUp,
      hasSubMenu: true,
      onClick: () => setActiveSubMenu('evolucao-recebimentos')
    },
    {
      id: 'documentacao-tecnica',
      title: 'Documentação Técnica',
      description: 'Acesse documentos e relatórios técnicos',
      icon: FileCheck,
      onClick: () => onNavigate('documentacao-tecnica')
    },
  ];

  const supervisaoItems: MenuItem[] = [
    {
      id: 'rondas-supervisao',
      title: 'Rondas de Supervisão',
      description: 'Realize e acompanhe rondas de supervisão',
      icon: Search,
      onClick: () => onNavigate('rondas-supervisao')
    },
    {
      id: 'parecer-tecnico',
      title: 'Parecer Técnico',
      description: 'Crie e gerencie pareceres técnicos',
      icon: ClipboardList,
      onClick: () => onNavigate('parecer-tecnico')
    },
    {
      id: 'documentos-condominio',
      title: 'Documentos do Condomínio',
      description: 'Gerencie documentos do condomínio',
      icon: FolderOpen,
      onClick: () => onNavigate('documentos-condominio')
    },
    {
      id: 'verificar-preventivas',
      title: 'Verificar as Preventivas',
      description: 'Confira manutenções preventivas programadas',
      icon: CheckCircle,
      onClick: () => onNavigate('verificar-preventivas')
    },
  ];

  // Sub-menus
  const kanbanSubItems: MenuItem[] = [
    { id: 'vistoria', title: 'Vistoria', description: 'Gerencie vistorias', icon: Search, onClick: () => onNavigate('kanban-vistoria') },
    { id: 'recebimento', title: 'Recebimento', description: 'Gerencie recebimentos', icon: CheckCircle, onClick: () => onNavigate('kanban-recebimento') },
    { id: 'conferencia', title: 'Conferência', description: 'Gerencie conferências', icon: FileCheck, onClick: () => onNavigate('kanban-conferencia') },
    { id: 'comissionamento', title: 'Comissionamento', description: 'Gerencie comissionamentos', icon: ClipboardList, onClick: () => onNavigate('kanban-comissionamento') },
    { id: 'documentacao', title: 'Documentação', description: 'Gerencie documentação', icon: FolderOpen, onClick: () => onNavigate('kanban-documentacao') },
  ];

  const relatorioPendenciasSubItems: MenuItem[] = [
    { id: 'vistorias-areas', title: 'Vistorias das Áreas', description: 'Visualize vistorias', icon: Search, onClick: () => onNavigate('pendencias-vistorias-areas') },
    { id: 'itens-bombeiro', title: 'Itens de Bombeiro', description: 'Itens relacionados ao bombeiro', icon: FileCheck, onClick: () => onNavigate('pendencias-itens-bombeiro') },
    { id: 'acessibilidade', title: 'Acessibilidade', description: 'Questões de acessibilidade', icon: CheckCircle, onClick: () => onNavigate('pendencias-acessibilidade') },
    { id: 'memorial-descritivo', title: 'Memorial Descritivo', description: 'Documentação descritiva', icon: FileText, onClick: () => onNavigate('pendencias-memorial-descritivo') },
    { id: 'comissionamento', title: 'Comissionamento', description: 'Comissionamento de sistemas', icon: ClipboardList, onClick: () => onNavigate('pendencias-comissionamento') },
  ];

  const evolucaoRecebimentosSubItems: MenuItem[] = [
    { id: 'relatorios', title: 'Relatórios', description: 'Relatórios de recebimentos', icon: FileText, onClick: () => onNavigate('recebimentos-relatorios') },
    { id: 'documentacao', title: 'Documentação', description: 'Documentação de recebimentos', icon: FolderOpen, onClick: () => onNavigate('recebimentos-documentacao') },
  ];

  const currentItems = currentSection === 'implantacao' ? implantacaoItems : supervisaoItems;

  // Se tem sub-menu ativo, mostrar sub-menu
  if (activeSubMenu === 'kanban') {
    return (
      <div className="w-full">
        <SectionTabs currentSection={currentSection} onSectionChange={setCurrentSection} />

        <button
          onClick={() => setActiveSubMenu(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Implantação
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Kanban</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kanbanSubItems.map((item) => {
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
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600
                                group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600
                                       group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600
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
      </div>
    );
  }

  if (activeSubMenu === 'relatorio-pendencias') {
    return (
      <div className="w-full">
        <SectionTabs currentSection={currentSection} onSectionChange={setCurrentSection} />

        <button
          onClick={() => setActiveSubMenu(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Implantação
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Relatório de Pendências</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatorioPendenciasSubItems.map((item) => {
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
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600
                                group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600
                                       group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600
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
      </div>
    );
  }

  if (activeSubMenu === 'evolucao-recebimentos') {
    return (
      <div className="w-full">
        <SectionTabs currentSection={currentSection} onSectionChange={setCurrentSection} />

        <button
          onClick={() => setActiveSubMenu(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Implantação
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Evolução dos Recebimentos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evolucaoRecebimentosSubItems.map((item) => {
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
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600
                                group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600
                                       group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600
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
      </div>
    );
  }

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
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600
                              group-hover:text-white transition-colors duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600
                                     group-hover:translate-x-1 transition-all duration-200" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600
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
