/**
 * syncService.ts - Serviço de sincronização offline → Supabase
 * Processa a fila de operações pendentes quando a conexão volta
 */

import { offlineDB } from './offlineDB';
import { supabase } from './supabase';

let isSyncing = false;
let syncListeners: ((status: SyncStatus) => void)[] = [];

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

let currentStatus: SyncStatus = {
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  lastError: null,
};

function notifyListeners() {
  syncListeners.forEach(listener => listener({ ...currentStatus }));
}

async function updatePendingCount() {
  currentStatus.pendingCount = await offlineDB.getSyncQueueCount();
  notifyListeners();
}

// Processar uma operação da fila
async function processOperation(op: any): Promise<void> {
  switch (op.type) {
    case 'CREATE_RONDA': {
      const ronda = op.data;
      const { error } = await supabase
        .from('rondas')
        .insert([{
          id: ronda.id,
          nome: ronda.nome,
          contrato: ronda.contrato,
          data: ronda.data,
          hora: ronda.hora,
          tipo_visita: ronda.tipoVisita || 'RONDA',
          responsavel: ronda.responsavel,
          observacoes_gerais: ronda.observacoesGerais,
        }]);
      if (error) throw error;
      await offlineDB.markRondaSynced(ronda.id);
      break;
    }

    case 'UPDATE_RONDA': {
      const { id, updates } = op.data;
      const updateData: any = {};
      if (updates.nome !== undefined) updateData.nome = updates.nome;
      if (updates.contrato !== undefined) updateData.contrato = updates.contrato;
      if (updates.data !== undefined) updateData.data = updates.data;
      if (updates.hora !== undefined) updateData.hora = updates.hora;
      if (updates.responsavel !== undefined) updateData.responsavel = updates.responsavel;
      if (updates.observacoesGerais !== undefined) updateData.observacoes_gerais = updates.observacoesGerais;
      if (updates.tipoVisita !== undefined) updateData.tipo_visita = updates.tipoVisita;
      if (updates.secoes !== undefined) updateData.secoes = JSON.stringify(updates.secoes);

      const { error } = await supabase.from('rondas').update(updateData).eq('id', id);
      if (error) throw error;
      break;
    }

    case 'DELETE_RONDA': {
      const { error } = await supabase.from('rondas').delete().eq('id', op.data.id);
      if (error) throw error;
      break;
    }

    case 'CREATE_AREA': {
      const area = op.data;
      const { error } = await supabase
        .from('areas_tecnicas')
        .insert([{
          id: area.id,
          ronda_id: area.ronda_id,
          nome: area.nome,
          status: area.status,
          teste_status: area.testeStatus || 'TESTADO',
          contrato: area.contrato,
          endereco: area.endereco,
          data: area.data,
          hora: area.hora,
          foto: area.foto,
          observacoes: area.observacoes,
        }]);
      if (error) throw error;
      break;
    }

    case 'UPDATE_AREA': {
      const { id, updates } = op.data;
      const { error } = await supabase
        .from('areas_tecnicas')
        .update({
          nome: updates.nome,
          status: updates.status,
          teste_status: updates.testeStatus,
          contrato: updates.contrato,
          endereco: updates.endereco,
          data: updates.data,
          hora: updates.hora,
          foto: updates.foto,
          observacoes: updates.observacoes,
        })
        .eq('id', id);
      if (error) throw error;
      break;
    }

    case 'DELETE_AREA': {
      const { error } = await supabase.from('areas_tecnicas').delete().eq('id', op.data.id);
      if (error) throw error;
      break;
    }

    case 'CREATE_FOTO': {
      const foto = op.data;
      const payload: any = {
        id: foto.id,
        ronda_id: foto.ronda_id,
        foto: foto.foto,
        local: foto.local,
        pendencia: foto.pendencia,
        especialidade: foto.especialidade,
        responsavel: foto.responsavel,
        observacoes: foto.observacoes,
        data: foto.data,
        hora: foto.hora,
      };
      if (foto.criticidade) payload.criticidade = foto.criticidade;

      let { error } = await supabase.from('fotos_ronda').insert([payload]);
      // Fallback sem criticidade
      if (error && String(error?.message || '').toLowerCase().includes('criticidade')) {
        delete payload.criticidade;
        ({ error } = await supabase.from('fotos_ronda').insert([payload]));
      }
      if (error) throw error;
      break;
    }

    case 'DELETE_FOTO': {
      const { error } = await supabase.from('fotos_ronda').delete().eq('id', op.data.id);
      if (error) throw error;
      break;
    }

    case 'CREATE_ITEM': {
      const item = op.data;
      const { error } = await supabase
        .from('outros_itens_corrigidos')
        .insert([{
          id: item.id,
          ronda_id: item.ronda_id,
          nome: item.nome || `Item - ${item.local}`,
          descricao: item.descricao || '',
          local: item.local || '',
          tipo: item.tipo || 'CIVIL',
          prioridade: item.prioridade || 'MÉDIA',
          status: item.status || 'PENDENTE',
          contrato: item.contrato || '',
          endereco: item.endereco || '',
          responsavel: item.responsavel || '',
          foto: item.fotos && item.fotos.length > 0 ? JSON.stringify(item.fotos) : (item.foto || null),
          observacoes: item.observacoes || '',
          data: item.data || '',
          hora: item.hora || '',
        }]);
      if (error) throw error;
      break;
    }

    case 'UPDATE_ITEM': {
      const { id, updates } = op.data;
      const { error } = await supabase
        .from('outros_itens_corrigidos')
        .update({
          nome: updates.nome,
          descricao: updates.descricao,
          local: updates.local,
          tipo: updates.tipo,
          prioridade: updates.prioridade,
          status: updates.status,
          contrato: updates.contrato,
          responsavel: updates.responsavel,
          foto: updates.fotos && updates.fotos.length > 0 ? JSON.stringify(updates.fotos) : updates.foto,
          observacoes: updates.observacoes,
          data: updates.data,
          hora: updates.hora,
        })
        .eq('id', id);
      if (error) throw error;
      break;
    }

    case 'DELETE_ITEM': {
      const { error } = await supabase.from('outros_itens_corrigidos').delete().eq('id', op.data.id);
      if (error) throw error;
      break;
    }

    default:
      console.warn('Operação de sync desconhecida:', op.type);
  }
}

export const syncService = {
  // Registrar listener de status
  onStatusChange(listener: (status: SyncStatus) => void) {
    syncListeners.push(listener);
    // Notificar imediatamente com status atual
    listener({ ...currentStatus });
    return () => {
      syncListeners = syncListeners.filter(l => l !== listener);
    };
  },

  getStatus(): SyncStatus {
    return { ...currentStatus };
  },

  // Processar toda a fila de sync
  async processQueue(): Promise<void> {
    if (isSyncing) return;
    if (!navigator.onLine) return;

    isSyncing = true;
    currentStatus.isSyncing = true;
    currentStatus.lastError = null;
    notifyListeners();

    try {
      const pendingItems = await offlineDB.getPendingSyncItems();

      if (pendingItems.length === 0) {
        currentStatus.isSyncing = false;
        isSyncing = false;
        currentStatus.lastSyncAt = Date.now();
        await updatePendingCount();
        return;
      }

      console.log(`[Sync] Processando ${pendingItems.length} operações pendentes...`);

      for (const item of pendingItems) {
        try {
          await processOperation(item);
          await offlineDB.markSyncItemDone(item.id);
          console.log(`[Sync] Operação ${item.type} concluída (ID: ${item.localId})`);
        } catch (error: any) {
          console.error(`[Sync] Erro na operação ${item.type}:`, error);
          await offlineDB.markSyncItemFailed(item.id, error.message || 'Erro desconhecido');
        }
      }

      currentStatus.lastSyncAt = Date.now();
    } catch (error: any) {
      console.error('[Sync] Erro geral:', error);
      currentStatus.lastError = error.message || 'Erro ao sincronizar';
    } finally {
      isSyncing = false;
      currentStatus.isSyncing = false;
      await updatePendingCount();
    }
  },

  // Iniciar monitoramento automático
  startAutoSync() {
    // Sincronizar quando ficar online
    window.addEventListener('online', () => {
      console.log('[Sync] Conexão restaurada, iniciando sincronização...');
      setTimeout(() => this.processQueue(), 2000); // Delay para estabilizar conexão
    });

    // Atualizar contagem quando ficar offline
    window.addEventListener('offline', () => {
      console.log('[Sync] Conexão perdida');
      notifyListeners();
    });

    // Sincronização periódica (a cada 30 segundos se online)
    setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 30000);

    // Tentar sincronizar na inicialização
    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 3000);
    }

    // Atualizar contagem inicial
    updatePendingCount();
  },
};
