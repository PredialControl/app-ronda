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
            <div className="flex items-center gap-2">
              {/* ManuFlow logo inline */}
              <svg viewBox="0 0 56 56" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lgSide" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#06d6a0"/>
                  </linearGradient>
                </defs>
                <path d="M4 46 L4 18 L18 34 L32 18 L32 46" stroke="url(#lgSide)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="36" y1="24" x2="52" y2="24" stroke="url(#lgSide)" strokeWidth="4" strokeLinecap="round"/>
                <line x1="36" y1="32" x2="49" y2="32" stroke="url(#lgSide)" strokeWidth="4" strokeLinecap="round"/>
                <line x1="36" y1="40" x2="45" y2="40" stroke="url(#lgSide)" strokeWidth="4" strokeLinecap="round"/>
                <path d="M46 16 L54 24 L46 32" stroke="#06d6a0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <div>
                <div className="flex items-baseline gap-1 leading-none">
                  <span style={{ fontWeight: 900, fontSize: 18, color: '#ffffff', letterSpacing: 1 }}>MANU</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: '#06d6a0', letterSpacing: 1 }}>FLOW</span>
                </div>
                <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1, marginTop: 2 }}>MANUTENÇÃO PREDIAL</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <svg viewBox="0 0 56 56" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lgCol" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#06d6a0"/>
                  </linearGradient>
                </defs>
                <path d="M4 46 L4 18 L18 34 L32 18 L32 46" stroke="url(#lgCol)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="36" y1="24" x2="52" y2="24" stroke="url(#lgCol)" strokeWidth="4" strokeLinecap="round"/>
                <line x1="36" y1="32" x2="49" y2="32" stroke="url(#lgCol)" strokeWidth="4" strokeLinecap="round"/>
                <line x1="36" y1="40" x2="45" y2="40" stroke="url(#lgCol)" strokeWidth="4" strokeLinecap="round"/>
                <path d="M46 16 L54 24 L46 32" stroke="#06d6a0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
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
