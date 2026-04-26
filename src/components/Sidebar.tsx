import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  MessageSquare,
  BarChart3,
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
  Menu,
  X,
  Home,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MenuLevel = 'main' | 'contrato' | 'implantacao' | 'supervisao';

export interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  onClick?: () => void;
  active?: boolean;
  children?: SidebarItem[];
}

interface SidebarProps {
  currentLevel: MenuLevel;
  contratoNome?: string;
  activeItem?: string;
  onNavigate: (destination: string) => void;
  onBack?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isAdmin?: boolean;
}

export function Sidebar({
  currentLevel,
  contratoNome,
  activeItem,
  onNavigate,
  onBack,
  collapsed = false,
  onToggleCollapse,
  isAdmin = false,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Menu principal
  const mainMenuItems: SidebarItem[] = [
    { id: 'contratos', label: 'Contratos', icon: Building2 },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'chamados', label: 'Chamados', icon: MessageSquare },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'usuarios', label: 'Usuários', icon: Shield }] : []),
  ];

  // Menu do contrato selecionado
  const contratoMenuItems: SidebarItem[] = [
    { id: 'implantacao', label: 'Implantação', icon: Hammer },
    { id: 'supervisao', label: 'Supervisão', icon: Shield },
  ];

  // Menu de Implantação
  const implantacaoMenuItems: SidebarItem[] = [
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'relatorio-pendencias', label: 'Relatório de Pendências', icon: FileText },
    { id: 'evolucao-recebimentos', label: 'Evolução dos Recebimentos', icon: TrendingUp },
    { id: 'documentacao-tecnica', label: 'Documentação Técnica', icon: FileCheck },
    { id: 'plano-manutencao', label: 'Plano de Manutenção', icon: ClipboardList },
  ];

  // Menu de Supervisão
  const supervisaoMenuItems: SidebarItem[] = [
    { id: 'rondas-supervisao', label: 'Rondas de Supervisão', icon: Search },
    { id: 'itens-relevantes', label: 'Itens Relevantes', icon: AlertTriangle },
    { id: 'parecer-tecnico', label: 'Parecer Técnico', icon: ClipboardList },
    { id: 'documentos-condominio', label: 'Documentos do Condomínio', icon: FolderOpen },
    { id: 'verificar-preventivas', label: 'Verificar Preventivas', icon: CheckCircle },
  ];

  const getCurrentItems = (): SidebarItem[] => {
    switch (currentLevel) {
      case 'main':
        return mainMenuItems;
      case 'contrato':
        return contratoMenuItems;
      case 'implantacao':
        return implantacaoMenuItems;
      case 'supervisao':
        return supervisaoMenuItems;
      default:
        return mainMenuItems;
    }
  };

  const getTitle = (): string => {
    switch (currentLevel) {
      case 'main':
        return 'Menu Principal';
      case 'contrato':
        return contratoNome || 'Contrato';
      case 'implantacao':
        return 'Implantação';
      case 'supervisao':
        return 'Supervisão';
      default:
        return 'Menu';
    }
  };

  const items = getCurrentItems();

  const renderMenuItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
          "hover:bg-white/10 hover:translate-x-1 hover:scale-[1.02]",
          isActive
            ? "bg-gradient-to-r from-emerald-500/25 to-emerald-600/15 text-emerald-400 border-l-4 border-emerald-500 shadow-lg shadow-emerald-500/20"
            : "text-gray-300 hover:text-white border-l-4 border-transparent",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn(
          "w-5 h-5 flex-shrink-0 transition-all duration-300",
          isActive ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : ""
        )} />
        {!collapsed && (
          <span className={cn(
            "truncate font-medium transition-all duration-300",
            isActive && "text-emerald-300"
          )}>{item.label}</span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img
                src="/logo-mp-full.svg"
                alt="ManuFlow"
                className="h-11 w-auto"
              />
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl overflow-hidden">
              <img
                src="/logo-mp-icon.svg"
                alt="MP"
                className="w-10 h-10"
              />
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      {currentLevel !== 'main' && onBack && (
        <button
          onClick={onBack}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-all",
            "border-b border-white/10",
            collapsed && "justify-center px-2"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          {!collapsed && <span>Voltar</span>}
        </button>
      )}

      {/* Title */}
      {!collapsed && (
        <div className="px-4 py-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {getTitle()}
          </h2>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {items.map(renderMenuItem)}
      </nav>

      {/* Collapse Button - Desktop */}
      <div className="hidden lg:block p-3 border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Recolher</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800/90 backdrop-blur text-white shadow-lg hover:bg-gray-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-300",
          "bg-[rgba(15,23,42,0.85)] backdrop-blur-xl shadow-2xl",
          "border-r border-white/10",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-72"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen transition-all duration-300",
          "bg-[rgba(15,23,42,0.7)] backdrop-blur-xl",
          "border-r border-white/10",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
