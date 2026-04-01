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
    <div className="flex h-screen overflow-hidden relative">
      {/* Background com gradiente para glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f1a] via-[#0d1b2a] to-[#1a1f2e]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMiA4djJoLTh2LTJoOHptNC0yNHYySDI2VjEyaDEyem0tMiA0djJoLTh2LTJoOHptLTQgMjR2Mmgtdjjtmi0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

      {/* Content wrapper */}
      <div className="relative flex w-full h-full">
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
          <header className="bg-[rgba(15,23,42,0.6)] backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 py-3 flex-shrink-0">
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
    </div>
  );
}
