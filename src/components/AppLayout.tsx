import { useState, ReactNode } from 'react';
import { Sidebar, MenuLevel } from './Sidebar';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { LogOut, User, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  menuLevel: MenuLevel;
  activeMenuItem?: string;
  contratoNome?: string;
  breadcrumbItems: BreadcrumbItem[];
  onNavigate: (destination: string) => void;
  onBack?: () => void;
  onLogout: () => void;
  onColetaInspecao?: () => void;
  onUsuarios?: () => void;
  usuarioNome?: string;
  usuarioCargo?: string;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function AppLayout({
  children,
  menuLevel,
  activeMenuItem,
  contratoNome,
  breadcrumbItems,
  onNavigate,
  onBack,
  onLogout,
  onColetaInspecao,
  onUsuarios,
  usuarioNome,
  usuarioCargo,
  isAdmin,
  isLoading
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      <Sidebar
        currentLevel={menuLevel}
        contratoNome={contratoNome}
        activeItem={activeMenuItem}
        onNavigate={onNavigate}
        onBack={onBack}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex-shrink-0 border-b px-5 lg:px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(10,10,15,0.9)',
            borderColor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0 pl-12 lg:pl-0">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* User info */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-300 leading-none">{usuarioNome}</div>
                {usuarioCargo && (
                  <div className="text-[10px] text-gray-600 mt-0.5">{usuarioCargo}</div>
                )}
              </div>
            </div>

            {/* Admin */}
            {isAdmin && onUsuarios && (
              <button
                onClick={onUsuarios}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/10 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Usuários</span>
              </button>
            )}

            {/* Coleta */}
            {onColetaInspecao && (
              <button
                onClick={onColetaInspecao}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Coleta</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-white/10 hover:bg-white/5 hover:text-gray-300 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Carregando...</p>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
