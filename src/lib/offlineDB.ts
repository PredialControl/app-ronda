/**
 * offlineDB.ts - Banco de dados local usando IndexedDB
 * Armazena rondas, áreas técnicas, fotos e pendências offline
 */

const DB_NAME = 'app-ronda-offline';
const DB_VERSION = 1;

// Stores
const STORES = {
  CONTRATOS: 'contratos',
  RONDAS: 'rondas',
  AREAS_TECNICAS: 'areas_tecnicas',
  FOTOS_RONDA: 'fotos_ronda',
  OUTROS_ITENS: 'outros_itens',
  SYNC_QUEUE: 'sync_queue',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Contratos cache (read-only, para funcionar offline)
      if (!db.objectStoreNames.contains(STORES.CONTRATOS)) {
        db.createObjectStore(STORES.CONTRATOS, { keyPath: 'id' });
      }

      // Rondas criadas offline
      if (!db.objectStoreNames.contains(STORES.RONDAS)) {
        const rondaStore = db.createObjectStore(STORES.RONDAS, { keyPath: 'id' });
        rondaStore.createIndex('contrato', 'contrato', { unique: false });
        rondaStore.createIndex('synced', 'synced', { unique: false });
      }

      // Áreas técnicas
      if (!db.objectStoreNames.contains(STORES.AREAS_TECNICAS)) {
        const areaStore = db.createObjectStore(STORES.AREAS_TECNICAS, { keyPath: 'id' });
        areaStore.createIndex('ronda_id', 'ronda_id', { unique: false });
      }

      // Fotos de ronda
      if (!db.objectStoreNames.contains(STORES.FOTOS_RONDA)) {
        const fotoStore = db.createObjectStore(STORES.FOTOS_RONDA, { keyPath: 'id' });
        fotoStore.createIndex('ronda_id', 'ronda_id', { unique: false });
      }

      // Outros itens (pendências/corrigidos)
      if (!db.objectStoreNames.contains(STORES.OUTROS_ITENS)) {
        const itemStore = db.createObjectStore(STORES.OUTROS_ITENS, { keyPath: 'id' });
        itemStore.createIndex('ronda_id', 'ronda_id', { unique: false });
      }

      // Fila de sincronização
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Helpers genéricos para CRUD no IndexedDB
async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getById<T>(storeName: string, id: string | number): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function put<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putAll<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function remove(storeName: string, id: string | number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================
// API pública do offlineDB
// ============================================

export const offlineDB = {
  // --- Contratos (cache local) ---
  async cacheContratos(contratos: any[]) {
    await clearStore(STORES.CONTRATOS);
    await putAll(STORES.CONTRATOS, contratos);
  },
  async getContratos() {
    return getAll(STORES.CONTRATOS);
  },

  // --- Rondas ---
  async saveRonda(ronda: any) {
    await put(STORES.RONDAS, { ...ronda, synced: false, updatedAt: Date.now() });
  },
  async getRondas() {
    return getAll(STORES.RONDAS);
  },
  async getRondasByContrato(contrato: string) {
    return getByIndex(STORES.RONDAS, 'contrato', contrato);
  },
  async getRonda(id: string) {
    return getById(STORES.RONDAS, id);
  },
  async deleteRonda(id: string) {
    // Deletar ronda e dados relacionados
    await remove(STORES.RONDAS, id);
    const areas = await getByIndex(STORES.AREAS_TECNICAS, 'ronda_id', id);
    for (const area of areas) await remove(STORES.AREAS_TECNICAS, (area as any).id);
    const fotos = await getByIndex(STORES.FOTOS_RONDA, 'ronda_id', id);
    for (const foto of fotos) await remove(STORES.FOTOS_RONDA, (foto as any).id);
    const itens = await getByIndex(STORES.OUTROS_ITENS, 'ronda_id', id);
    for (const item of itens) await remove(STORES.OUTROS_ITENS, (item as any).id);
  },
  async getUnsyncedRondas() {
    return getByIndex(STORES.RONDAS, 'synced', 'false');
  },
  async markRondaSynced(id: string) {
    const ronda = await getById<any>(STORES.RONDAS, id);
    if (ronda) {
      await put(STORES.RONDAS, { ...ronda, synced: true });
    }
  },

  // --- Áreas Técnicas ---
  async saveAreaTecnica(area: any & { ronda_id: string }) {
    await put(STORES.AREAS_TECNICAS, area);
  },
  async getAreasByRonda(rondaId: string) {
    return getByIndex(STORES.AREAS_TECNICAS, 'ronda_id', rondaId);
  },
  async deleteAreaTecnica(id: string) {
    await remove(STORES.AREAS_TECNICAS, id);
  },

  // --- Fotos de Ronda ---
  async saveFotoRonda(foto: any & { ronda_id: string }) {
    await put(STORES.FOTOS_RONDA, foto);
  },
  async getFotosByRonda(rondaId: string) {
    return getByIndex(STORES.FOTOS_RONDA, 'ronda_id', rondaId);
  },
  async deleteFotoRonda(id: string) {
    await remove(STORES.FOTOS_RONDA, id);
  },

  // --- Outros Itens (Pendências) ---
  async saveOutroItem(item: any & { ronda_id: string }) {
    await put(STORES.OUTROS_ITENS, item);
  },
  async getItensByRonda(rondaId: string) {
    return getByIndex(STORES.OUTROS_ITENS, 'ronda_id', rondaId);
  },
  async deleteOutroItem(id: string) {
    await remove(STORES.OUTROS_ITENS, id);
  },

  // --- Fila de Sincronização ---
  async addToSyncQueue(operation: {
    type: 'CREATE_RONDA' | 'CREATE_AREA' | 'CREATE_FOTO' | 'CREATE_ITEM' | 'UPDATE_RONDA' | 'DELETE_RONDA' | 'UPDATE_AREA' | 'DELETE_AREA' | 'UPDATE_FOTO' | 'DELETE_FOTO' | 'UPDATE_ITEM' | 'DELETE_ITEM';
    data: any;
    localId: string;
  }) {
    await put(STORES.SYNC_QUEUE, {
      ...operation,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    });
  },

  async getPendingSyncItems() {
    const all = await getAll<any>(STORES.SYNC_QUEUE);
    return all.filter(item => item.status === 'pending').sort((a, b) => a.timestamp - b.timestamp);
  },

  async markSyncItemDone(id: number) {
    await remove(STORES.SYNC_QUEUE, id);
  },

  async markSyncItemFailed(id: number, error: string) {
    const item = await getById<any>(STORES.SYNC_QUEUE, id);
    if (item) {
      await put(STORES.SYNC_QUEUE, {
        ...item,
        status: item.retries >= 3 ? 'failed' : 'pending',
        retries: (item.retries || 0) + 1,
        lastError: error,
      });
    }
  },

  async getSyncQueueCount(): Promise<number> {
    const pending = await this.getPendingSyncItems();
    return pending.length;
  },

  async clearSyncedData() {
    // Limpar dados que já foram sincronizados
    const rondas = await getAll<any>(STORES.RONDAS);
    for (const ronda of rondas) {
      if (ronda.synced) {
        await this.deleteRonda(ronda.id);
      }
    }
  },
};
