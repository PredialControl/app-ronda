import { useEffect, useRef, useCallback } from 'react';

interface AutoSaveOptions {
  data: any;
  key: string;
  intervalMs?: number; // Padrão: 2 minutos
  enabled?: boolean;
}

export function useAutoSave({ data, key, intervalMs = 120000, enabled = true }: AutoSaveOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const saveToLocalStorage = useCallback(() => {
    try {
      const dataString = JSON.stringify(data);

      // Só salvar se houver mudanças
      if (dataString === lastSavedRef.current) {
        return;
      }

      localStorage.setItem(key, dataString);
      localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
      lastSavedRef.current = dataString;

      console.log('💾 Auto-save: Dados salvos localmente', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  }, [data, key]);

  const getFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);

      if (saved) {
        return {
          data: JSON.parse(saved),
          timestamp: timestamp ? new Date(timestamp) : null
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao recuperar do localStorage:', error);
      return null;
    }
  }, [key]);

  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      lastSavedRef.current = '';
      console.log('🗑️ Auto-save: Backup local removido');
    } catch (error) {
      console.error('❌ Erro ao limpar localStorage:', error);
    }
  }, [key]);

  // Auto-save periódico
  useEffect(() => {
    if (!enabled) return;

    // Salvar imediatamente ao iniciar
    saveToLocalStorage();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      saveToLocalStorage();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs, saveToLocalStorage]);

  // Salvar ao desmontar componente (navegação/fechamento de página)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveToLocalStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveToLocalStorage]);

  return {
    saveToLocalStorage,
    getFromLocalStorage,
    clearLocalStorage
  };
}
