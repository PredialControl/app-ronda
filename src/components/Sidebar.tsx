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
}

export function Sidebar({
  currentLevel,
  contratoNome,
  activeItem,
  onNavigate,
  onBack,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainMenuItems: SidebarItem[] = [
    { id: 'contratos', label: 'Contratos', icon: Building2 },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'chamados', label: 'Chamados', icon: MessageSquare },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  const contratoMenuItems: SidebarItem[] = [
    { id: 'implantacao', label: 'Implantação', icon: Hammer },
    { id: 'supervisao', label: 'Supervisão', icon: Shield },
  ];

  const implantacaoMenuItems: SidebarItem[] = [
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'relatorio-pendencias', label: 'Rel. de Pendências', icon: FileText },
    { id: 'evolucao-recebimentos', label: 'Evolução', icon: TrendingUp },
    { id: 'documentacao-tecnica', label: 'Documentação Técnica', icon: FileCheck },
    { id: 'plano-manutencao', label: 'Plano de Manutenção', icon: ClipboardList },
  ];

  const supervisaoMenuItems: SidebarItem[] = [
    { id: 'rondas-supervisao', label: 'Rondas de Supervisão', icon: Search },
    { id: 'parecer-tecnico', label: 'Parecer Técnico', icon: ClipboardList },
    { id: 'documentos-condominio', label: 'Documentos', icon: FolderOpen },
    { id: 'verificar-preventivas', label: 'Verificar Preventivas', icon: CheckCircle },
  ];

  const getCurrentItems = (): SidebarItem[] => {
    switch (currentLevel) {
      case 'main': return mainMenuItems;
      case 'contrato': return contratoMenuItems;
      case 'implantacao': return implantacaoMenuItems;
      case 'supervisao': return supervisaoMenuItems;
      default: return mainMenuItems;
    }
  };

  const getSectionLabel = (): string => {
    switch (currentLevel) {
      case 'main': return 'Menu Principal';
      case 'contrato': return contratoNome || 'Contrato';
      case 'implantacao': return 'Implantação';
      case 'supervisao': return 'Supervisão';
      default: return 'Menu';
    }
  };

  // Accent color por nível
  const accentClass = currentLevel === 'supervisao'
    ? { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-l-blue-500', dot: 'bg-blue-400' }
    : { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-l-orange-500', dot: 'bg-orange-400' };

  const items = getCurrentItems();

  const renderMenuItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
          isActive
            ? `${accentClass.bg} ${accentClass.text} border-l-2 ${accentClass.border} pl-[10px]`
            : "text-gray-500 hover:text-gray-200 hover:bg-white/5",
          collapsed && "justify-center px-2 border-l-0 pl-2"
        )}
      >
        <Icon className={cn(
          "w-4 h-4 flex-shrink-0 transition-colors",
          isActive ? accentClass.text : "text-gray-600 group-hover:text-gray-300"
        )} />
        {!collapsed && (
          <span className="truncate text-sm font-medium">{item.label}</span>
        )}
        {!collapsed && isActive && (
          <div className={cn("w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0", accentClass.dot)} />
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "border-b border-white/[0.06] flex-shrink-0",
        collapsed ? "p-3" : "p-4"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img
              src="/logo-mp-full.svg"
              alt="Manutenção Predial"
              className="h-10 w-auto"
              style={{ filter: 'brightness(1.8) saturate(0.9)' }}
            />
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-xl overflow-hidden">
            <img src="/logo-mp-icon.svg" alt="MP" className="w-9 h-9" />
          </div>
        )}
      </div>

      {/* Contrato chip */}
      {contratoNome && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div className="text-[10px] font-600 text-gray-600 uppercase tracking-wider mb-0.5">Contrato</div>
          <div className="text-xs font-semibold text-gray-200 truncate">{contratoNome}</div>
        </div>
      )}

      {/* Back button */}
      {currentLevel !== 'main' && onBack && (
        <button
          onClick={onBack}
          className={cn(
            "flex items-center gap-2 mx-3 mt-2 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all text-sm",
            collapsed && "justify-center"
          )}
        >
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Voltar</span>}
        </button>
      )}

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-700 text-gray-600 uppercase tracking-widest">
            {getSectionLabel()}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map(renderMenuItem)}
      </nav>

      {/* Collapse toggle */}
      <div className="hidden lg:block p-3 border-t border-white/[0.06]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] rounded-lg transition-all text-xs"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>
          }
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#0f0f1a]/90 backdrop-blur border border-white/10 text-white shadow-xl hover:bg-[#1a1a2e] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full z-50 shadow-2xl transition-transform duration-300 w-72",
          "bg-[#0f0f1a] border-r border-white/[0.06]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen border-r border-white/[0.06] transition-all duration-300",
          "bg-[#0f0f1a]",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
