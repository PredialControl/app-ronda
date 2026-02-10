/**
 * offlineFirstService.ts - Wrapper offline-first para os serviços do Supabase
 *
 * Estratégia:
 * - ONLINE: salva no Supabase E no IndexedDB (cache)
 * - OFFLINE: salva no IndexedDB + adiciona na fila de sync
 * - Na leitura: tenta Supabase primeiro, se falhar usa IndexedDB
 */

import { offlineDB } from './offlineDB';
import { rondaService, areaTecnicaService, fotoRondaService, outroItemService, contratoService } from './supabaseService';
import { Ronda, AreaTecnica, FotoRonda, OutroItemCorrigido, Contrato } from '@/types';

function isOnline(): boolean {
  return navigator.onLine;
}

// ============================================
// Contratos (read-only offline, cache)
// ============================================
export const offlineContratoService = {
  async getAll(): Promise<Contrato[]> {
    try {
      if (isOnline()) {
        const contratos = await contratoService.getAll();
        // Cachear no IndexedDB
        await offlineDB.cacheContratos(contratos);
        return contratos;
      }
    } catch (error) {
      console.warn('[Offline] Falha ao buscar contratos online, usando cache:', error);
    }
    // Fallback: dados do IndexedDB
    const cached = await offlineDB.getContratos();
    return cached as Contrato[];
  },
};

// ============================================
// Rondas (offline-first)
// ============================================
export const offlineRondaService = {
  async getAll(): Promise<Ronda[]> {
    try {
      if (isOnline()) {
        const rondas = await rondaService.getAll();
        return rondas;
      }
    } catch (error) {
      console.warn('[Offline] Falha ao buscar rondas online:', error);
    }
    // Offline: retornar rondas do IndexedDB
    const localRondas = await offlineDB.getRondas() as any[];
    return localRondas.map(r => ({
      id: r.id,
      nome: r.nome,
      contrato: r.contrato,
      data: r.data,
      hora: r.hora,
      tipoVisita: r.tipoVisita,
      responsavel: r.responsavel,
      observacoesGerais: r.observacoesGerais,
      secoes: r.secoes,
      areasTecnicas: [],
      fotosRonda: [],
      outrosItensCorrigidos: [],
      _offline: !r.synced,
    }));
  },

  async create(ronda: Omit<Ronda, 'id'>): Promise<Ronda> {
    const novoId = crypto.randomUUID();

    const rondaData = {
      id: novoId,
      nome: ronda.nome,
      contrato: ronda.contrato,
      data: ronda.data,
      hora: ronda.hora,
      tipoVisita: ronda.tipoVisita || 'RONDA',
      responsavel: ronda.responsavel,
      observacoesGerais: ronda.observacoesGerais || '',
      secoes: ronda.secoes,
    };

    // Sempre salvar localmente
    await offlineDB.saveRonda(rondaData);

    if (isOnline()) {
      try {
        const resultado = await rondaService.create(ronda);
        // Marcar como sincronizado
        await offlineDB.markRondaSynced(novoId);
        return resultado;
      } catch (error) {
        console.warn('[Offline] Falha ao criar ronda online, salvando offline:', error);
      }
    }

    // Adicionar à fila de sync
    await offlineDB.addToSyncQueue({
      type: 'CREATE_RONDA',
      data: rondaData,
      localId: novoId,
    });

    return {
      ...rondaData,
      areasTecnicas: [],
      fotosRonda: [],
      outrosItensCorrigidos: [],
    } as Ronda;
  },

  async update(id: string, updates: Partial<Ronda>): Promise<Ronda> {
    // Atualizar localmente
    const existing = await offlineDB.getRonda(id) as any;
    if (existing) {
      await offlineDB.saveRonda({ ...existing, ...updates });
    }

    if (isOnline()) {
      try {
        return await rondaService.update(id, updates);
      } catch (error) {
        console.warn('[Offline] Falha ao atualizar ronda online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'UPDATE_RONDA',
      data: { id, updates },
      localId: id,
    });

    return { id, ...updates, areasTecnicas: [], fotosRonda: [], outrosItensCorrigidos: [] } as Ronda;
  },

  async delete(id: string): Promise<void> {
    await offlineDB.deleteRonda(id);

    if (isOnline()) {
      try {
        await rondaService.delete(id);
        return;
      } catch (error) {
        console.warn('[Offline] Falha ao deletar ronda online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'DELETE_RONDA',
      data: { id },
      localId: id,
    });
  },

  // Carregar ronda completa (com áreas, fotos, itens)
  async loadCompleteRonda(ronda: Ronda): Promise<Ronda> {
    if (isOnline()) {
      try {
        return await rondaService.loadCompleteRonda(ronda);
      } catch (error) {
        console.warn('[Offline] Falha ao carregar ronda completa online:', error);
      }
    }

    // Carregar dados do IndexedDB
    const areas = await offlineDB.getAreasByRonda(ronda.id) as AreaTecnica[];
    const fotos = await offlineDB.getFotosByRonda(ronda.id) as FotoRonda[];
    const itens = await offlineDB.getItensByRonda(ronda.id) as OutroItemCorrigido[];

    return {
      ...ronda,
      areasTecnicas: areas,
      fotosRonda: fotos,
      outrosItensCorrigidos: itens,
    };
  },

  async getById(id: string): Promise<Ronda | null> {
    if (isOnline()) {
      try {
        return await rondaService.getById(id);
      } catch (error) {
        console.warn('[Offline] Falha ao buscar ronda por ID online:', error);
      }
    }

    const local = await offlineDB.getRonda(id) as any;
    if (!local) return null;

    return {
      id: local.id,
      nome: local.nome,
      contrato: local.contrato,
      data: local.data,
      hora: local.hora,
      tipoVisita: local.tipoVisita,
      responsavel: local.responsavel,
      observacoesGerais: local.observacoesGerais,
      areasTecnicas: [],
      fotosRonda: [],
      outrosItensCorrigidos: [],
    };
  },

  // Manter compatibilidade
  getRondasLocais: rondaService.getRondasLocais,
  getByContrato: rondaService.getByContrato,
};

// ============================================
// Áreas Técnicas (offline-first)
// ============================================
export const offlineAreaTecnicaService = {
  async getByRonda(rondaId: string): Promise<AreaTecnica[]> {
    if (isOnline()) {
      try {
        return await areaTecnicaService.getByRonda(rondaId);
      } catch { /* fallback abaixo */ }
    }
    return (await offlineDB.getAreasByRonda(rondaId)) as AreaTecnica[];
  },

  async create(area: Omit<AreaTecnica, 'id'> & { ronda_id: string }): Promise<AreaTecnica> {
    const novoId = crypto.randomUUID();
    const areaData = { ...area, id: novoId };

    // Salvar localmente
    await offlineDB.saveAreaTecnica(areaData);

    if (isOnline()) {
      try {
        const result = await areaTecnicaService.create(area);
        return result;
      } catch (error) {
        console.warn('[Offline] Falha ao criar área online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'CREATE_AREA',
      data: areaData,
      localId: novoId,
    });

    return {
      id: novoId,
      nome: area.nome,
      status: area.status,
      contrato: area.contrato,
      endereco: area.endereco,
      data: area.data,
      hora: area.hora,
      foto: area.foto,
      observacoes: area.observacoes || '',
    };
  },

  async update(id: string, updates: Partial<AreaTecnica>): Promise<AreaTecnica> {
    if (isOnline()) {
      try {
        return await areaTecnicaService.update(id, updates);
      } catch (error) {
        console.warn('[Offline] Falha ao atualizar área online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'UPDATE_AREA',
      data: { id, updates },
      localId: id,
    });

    return { id, ...updates } as AreaTecnica;
  },

  async delete(id: string): Promise<void> {
    await offlineDB.deleteAreaTecnica(id);

    if (isOnline()) {
      try {
        await areaTecnicaService.delete(id);
        return;
      } catch (error) {
        console.warn('[Offline] Falha ao deletar área online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'DELETE_AREA',
      data: { id },
      localId: id,
    });
  },
};

// ============================================
// Fotos de Ronda (offline-first)
// ============================================
export const offlineFotoRondaService = {
  async getByRonda(rondaId: string): Promise<FotoRonda[]> {
    if (isOnline()) {
      try {
        return await fotoRondaService.getByRonda(rondaId);
      } catch { /* fallback abaixo */ }
    }
    return (await offlineDB.getFotosByRonda(rondaId)) as FotoRonda[];
  },

  compressImage: fotoRondaService.compressImage,

  async create(foto: Omit<FotoRonda, 'id'> & { ronda_id: string }): Promise<FotoRonda> {
    const novoId = crypto.randomUUID();
    const fotoData = { ...foto, id: novoId };

    // Salvar localmente (a foto em base64 fica no IndexedDB)
    await offlineDB.saveFotoRonda(fotoData);

    if (isOnline()) {
      try {
        const result = await fotoRondaService.create(foto);
        return result;
      } catch (error) {
        console.warn('[Offline] Falha ao criar foto online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'CREATE_FOTO',
      data: fotoData,
      localId: novoId,
    });

    return {
      id: novoId,
      foto: foto.foto,
      local: foto.local,
      pendencia: foto.pendencia,
      especialidade: foto.especialidade,
      responsavel: foto.responsavel,
      observacoes: foto.observacoes,
      data: foto.data,
      hora: foto.hora,
      criticidade: (foto as any).criticidade,
    };
  },

  async update(id: string, updates: Partial<FotoRonda>): Promise<FotoRonda> {
    if (isOnline()) {
      try {
        return await fotoRondaService.update(id, updates);
      } catch (error) {
        console.warn('[Offline] Falha ao atualizar foto online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'UPDATE_FOTO',
      data: { id, updates },
      localId: id,
    });

    return { id, ...updates } as FotoRonda;
  },

  async delete(id: string): Promise<void> {
    await offlineDB.deleteFotoRonda(id);

    if (isOnline()) {
      try {
        await fotoRondaService.delete(id);
        return;
      } catch (error) {
        console.warn('[Offline] Falha ao deletar foto online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'DELETE_FOTO',
      data: { id },
      localId: id,
    });
  },
};

// ============================================
// Outros Itens / Pendências (offline-first)
// ============================================
export const offlineOutroItemService = {
  async getByRonda(rondaId: string): Promise<OutroItemCorrigido[]> {
    if (isOnline()) {
      try {
        return await outroItemService.getByRonda(rondaId);
      } catch { /* fallback abaixo */ }
    }
    return (await offlineDB.getItensByRonda(rondaId)) as OutroItemCorrigido[];
  },

  async create(item: Omit<OutroItemCorrigido, 'id'> & { ronda_id: string }): Promise<OutroItemCorrigido> {
    const novoId = crypto.randomUUID();
    const itemData = { ...item, id: novoId };

    // Salvar localmente
    await offlineDB.saveOutroItem(itemData);

    if (isOnline()) {
      try {
        const result = await outroItemService.create(item);
        return result;
      } catch (error) {
        console.warn('[Offline] Falha ao criar item online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'CREATE_ITEM',
      data: itemData,
      localId: novoId,
    });

    return {
      id: novoId,
      nome: item.nome,
      descricao: item.descricao,
      local: item.local,
      tipo: item.tipo,
      prioridade: item.prioridade,
      status: item.status,
      contrato: item.contrato,
      endereco: item.endereco,
      responsavel: item.responsavel,
      observacoes: item.observacoes,
      foto: item.foto,
      fotos: item.fotos || [],
      categoria: item.categoria,
      data: item.data,
      hora: item.hora,
    };
  },

  async update(id: string, updates: Partial<OutroItemCorrigido>): Promise<OutroItemCorrigido> {
    if (isOnline()) {
      try {
        return await outroItemService.update(id, updates);
      } catch (error) {
        console.warn('[Offline] Falha ao atualizar item online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'UPDATE_ITEM',
      data: { id, updates },
      localId: id,
    });

    return { id, ...updates } as OutroItemCorrigido;
  },

  async delete(id: string): Promise<void> {
    await offlineDB.deleteOutroItem(id);

    if (isOnline()) {
      try {
        await outroItemService.delete(id);
        return;
      } catch (error) {
        console.warn('[Offline] Falha ao deletar item online:', error);
      }
    }

    await offlineDB.addToSyncQueue({
      type: 'DELETE_ITEM',
      data: { id },
      localId: id,
    });
  },
};
