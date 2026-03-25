import { useState } from 'react';
import { Contrato } from '@/types';
import {
  ChevronLeft,
  Hammer,
  Shield,
  LayoutGrid,
  FileText,
  TrendingUp,
  FileCheck,
  Search,
  ClipboardList,
  FolderOpen,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

type ViewType = 'selecao' | 'implantacao' | 'supervisao';
type SubMenuType = 'kanban' | 'evolucao-recebimentos' | null;

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  hasSubMenu?: boolean;
  onClick: () => void;
}

interface ContratoDetalheProps {
  contrato: Contrato;
  onNavigate: (destination: string) => void;
  onVoltar: () => void;
}

export function ContratoDetalhe({ contrato, onNavigate, onVoltar }: ContratoDetalheProps) {
  const [currentView, setCurrentView] = useState<ViewType>('selecao');
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>(null);

  // Items do menu Implantação
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
      onClick: () => onNavigate('relatorio-pendencias')
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

  // Items do menu Supervisão
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

  const evolucaoRecebimentosSubItems: MenuItem[] = [
    { id: 'relatorios', title: 'Relatórios', description: 'Relatórios de recebimentos', icon: FileText, onClick: () => onNavigate('recebimentos-relatorios') },
    { id: 'documentacao', title: 'Documentação', description: 'Documentação de recebimentos', icon: FolderOpen, onClick: () => onNavigate('recebimentos-documentacao') },
  ];

  const renderMenuItems = (items: MenuItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
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
  );

  const renderSubMenu = (title: string, items: MenuItem[], backLabel: string, onBack: () => void) => (
    <div className="w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
      >
        <ChevronLeft className="w-5 h-5" />
        {backLabel}
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      {renderMenuItems(items)}
    </div>
  );

  // Renderizar sub-menus se ativos
  if (activeSubMenu === 'kanban') {
    return renderSubMenu('Kanban', kanbanSubItems, 'Voltar para Implantação', () => setActiveSubMenu(null));
  }

  if (activeSubMenu === 'evolucao-recebimentos') {
    return renderSubMenu('Evolução dos Recebimentos', evolucaoRecebimentosSubItems, 'Voltar para Implantação', () => setActiveSubMenu(null));
  }

  // Tela de Implantação
  if (currentView === 'implantacao') {
    return (
      <div className="w-full">
        <button
          onClick={() => setCurrentView('selecao')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Implantação</h2>
          <p className="text-gray-600">{contrato.nome}</p>
        </div>

        {renderMenuItems(implantacaoItems)}
      </div>
    );
  }

  // Tela de Supervisão
  if (currentView === 'supervisao') {
    return (
      <div className="w-full">
        <button
          onClick={() => setCurrentView('selecao')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Supervisão</h2>
          <p className="text-gray-600">{contrato.nome}</p>
        </div>

        {renderMenuItems(supervisaoItems)}
      </div>
    );
  }

  // Tela de Seleção (Implantação ou Supervisão)
  return (
    <div className="w-full">
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar para Contratos
      </button>

      {/* Card do Contrato */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 mb-8 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">{contrato.nome}</h1>
        <p className="text-blue-100">Endereço: {contrato.endereco}</p>
        <p className="text-blue-100">Periodicidade: {contrato.periodicidade}</p>
      </div>

      {/* Botões Implantação e Supervisão */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">O que você deseja fazer?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botão Implantação */}
        <button
          onClick={() => setCurrentView('implantacao')}
          className="group relative bg-gradient-to-br from-orange-500 to-orange-600
                   rounded-xl p-8 text-left text-white shadow-lg
                   hover:from-orange-600 hover:to-orange-700 hover:shadow-xl
                   transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <Hammer className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Implantação</h3>
              <p className="text-orange-100">Fase de implantação do contrato</p>
            </div>
          </div>
          <p className="text-orange-100 text-sm">
            Kanban, Relatório de Pendências, Evolução dos Recebimentos, Documentação Técnica e Plano de Manutenção
          </p>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 opacity-50
                               group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
        </button>

        {/* Botão Supervisão */}
        <button
          onClick={() => setCurrentView('supervisao')}
          className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600
                   rounded-xl p-8 text-left text-white shadow-lg
                   hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl
                   transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <Shield className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Supervisão</h3>
              <p className="text-emerald-100">Supervisão e acompanhamento</p>
            </div>
          </div>
          <p className="text-emerald-100 text-sm">
            Rondas de Supervisão, Parecer Técnico, Documentos do Condomínio e Verificar Preventivas
          </p>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 opacity-50
                               group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
        </button>
      </div>
    </div>
  );
}
