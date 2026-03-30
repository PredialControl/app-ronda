import { useState, ReactNode } from 'react';
import { Sidebar, MenuLevel } from './Sidebar';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { LogOut, User, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  // Navegação
  menuLevel: MenuLevel;
  activeMenuItem?: string;
  contratoNome?: string;
  breadcrumbItems: BreadcrumbItem[];
  // Callbacks
  onNavigate: (destination: string) => void;
  onBack?: () => void;
  onLogout: () => void;
  onColetaInspecao?: () => void;
  onUsuarios?: () => void;
  // Usuário
  usuarioNome?: string;
  usuarioCargo?: string;
  isAdmin?: boolean;
  // Loading
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
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentLevel={menuLevel}
        contratoNome={contratoNome}
        activeItem={activeMenuItem}
        onNavigate={onNavigate}
        onBack={onBack}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-[rgba(26,47,42,0.95)] backdrop-blur-lg border-b border-white/10 px-4 lg:px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left - Breadcrumb */}
            <div className="flex items-center gap-4 min-w-0 pl-12 lg:pl-0">
              <Breadcrumb items={breadcrumbItems} />
            </div>

            {/* Right - User Info & Actions */}
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {/* User Info - Desktop */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>{usuarioNome}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{usuarioCargo}</span>
              </div>

              {/* Admin Button */}
              {isAdmin && onUsuarios && (
                <Button
                  onClick={onUsuarios}
                  variant="outline"
                  size="sm"
                  className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500/50 px-2 lg:px-3"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline ml-2">Usuários</span>
                </Button>
              )}

              {/* Coleta Inspeção */}
              {onColetaInspecao && (
                <Button
                  onClick={onColetaInspecao}
                  variant="outline"
                  size="sm"
                  className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 px-2 lg:px-3"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="hidden lg:inline ml-2">Coleta</span>
                </Button>
              )}

              {/* Logout */}
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 px-2 lg:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-gray-400">Carregando...</p>
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
