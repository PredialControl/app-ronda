import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { syncService } from '@/lib/syncService';

export function OfflineIndicator() {
  const { isOnline, syncStatus } = useOnlineStatus();

  const handleForceSync = () => {
    if (isOnline) {
      syncService.processQueue();
    }
  };

  // Se está online e sem pendências, mostrar indicador discreto
  if (isOnline && syncStatus.pendingCount === 0 && !syncStatus.isSyncing) {
    return null; // Não mostrar nada quando tudo está ok
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Badge offline */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Modo Offline</span>
          {syncStatus.pendingCount > 0 && (
            <span className="bg-white text-amber-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {syncStatus.pendingCount}
            </span>
          )}
        </div>
      )}

      {/* Badge sincronizando */}
      {isOnline && syncStatus.isSyncing && (
        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Sincronizando...</span>
          <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {syncStatus.pendingCount}
          </span>
        </div>
      )}

      {/* Badge com pendências (online mas não sincronizando) */}
      {isOnline && !syncStatus.isSyncing && syncStatus.pendingCount > 0 && (
        <button
          onClick={handleForceSync}
          className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <CloudOff className="w-4 h-4" />
          <span>{syncStatus.pendingCount} pendente(s)</span>
          <RefreshCw className="w-3 h-3" />
        </button>
      )}

      {/* Erro de sync */}
      {syncStatus.lastError && (
        <div className="mt-2 flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
          <span>Erro: {syncStatus.lastError}</span>
          <button onClick={handleForceSync} className="underline">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
