import { supabase } from './supabase'
import { Ronda, Contrato, AreaTecnica, FotoRonda } from '@/types'

// Serviços para Rondas
export const rondaService = {
  // Buscar todas as rondas
  async getAll(): Promise<Ronda[]> {
    const { data, error } = await supabase
      .from('rondas')
      .select(`
        *,
        areas_tecnicas (*),
        fotos_ronda (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar rondas:', error)
      throw error
    }

    return data || []
  },

  // Criar nova ronda
  async create(ronda: Omit<Ronda, 'id'>): Promise<Ronda> {
    const { data, error } = await supabase
      .from('rondas')
      .insert([{
        nome: ronda.nome,
        contrato: ronda.contrato,
        data: ronda.data,
        hora: ronda.hora,
        responsavel: ronda.responsavel,
        observacoes_gerais: ronda.observacoesGerais
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar ronda:', error)
      throw error
    }

    return data
  },

  // Atualizar ronda
  async update(id: string, updates: Partial<Ronda>): Promise<Ronda> {
    const { data, error } = await supabase
      .from('rondas')
      .update({
        nome: updates.nome,
        contrato: updates.contrato,
        data: updates.data,
        hora: updates.hora,
        responsavel: updates.responsavel,
        observacoes_gerais: updates.observacoesGerais,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar ronda:', error)
      throw error
    }

    return data
  },

  // Deletar ronda
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rondas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar ronda:', error)
      throw error
    }
  }
}

// Serviços para Contratos
export const contratoService = {
  // Buscar todos os contratos
  async getAll(): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contratos:', error)
      throw error
    }

    return data || []
  },

  // Criar novo contrato
  async create(contrato: Omit<Contrato, 'id'>): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .insert([{
        nome: contrato.nome,
        sindico: contrato.sindico,
        endereco: contrato.endereco,
        periodicidade: contrato.periodicidade,
        observacoes: contrato.observacoes,
        data_criacao: contrato.dataCriacao
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar contrato:', error)
      throw error
    }

    return data
  },

  // Atualizar contrato
  async update(id: string, updates: Partial<Contrato>): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .update({
        nome: updates.nome,
        sindico: updates.sindico,
        endereco: updates.endereco,
        periodicidade: updates.periodicidade,
        observacoes: updates.observacoes,
        data_criacao: updates.dataCriacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar contrato:', error)
      throw error
    }

    return data
  },

  // Deletar contrato
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar contrato:', error)
      throw error
    }
  }
}

// Serviços para Áreas Técnicas
export const areaTecnicaService = {
  // Buscar áreas técnicas por ronda
  async getByRonda(rondaId: string): Promise<AreaTecnica[]> {
    const { data, error } = await supabase
      .from('areas_tecnicas')
      .select('*')
      .eq('ronda_id', rondaId)

    if (error) {
      console.error('Erro ao buscar áreas técnicas:', error)
      throw error
    }

    return data || []
  },

  // Criar área técnica
  async create(area: Omit<AreaTecnica, 'id'>): Promise<AreaTecnica> {
    const { data, error } = await supabase
      .from('areas_tecnicas')
      .insert([{
        nome: area.nome,
        status: area.status,
        contrato: area.contrato,
        endereco: area.endereco,
        data: area.data,
        hora: area.hora,
        foto: area.foto,
        observacoes: area.observacoes,
        ronda_id: area.rondaId || ''
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar área técnica:', error)
      throw error
    }

    return data
  }
}

// Serviços para Fotos de Ronda
export const fotoRondaService = {
  // Buscar fotos por ronda
  async getByRonda(rondaId: string): Promise<FotoRonda[]> {
    const { data, error } = await supabase
      .from('fotos_ronda')
      .select('*')
      .eq('ronda_id', rondaId)

    if (error) {
      console.error('Erro ao buscar fotos:', error)
      throw error
    }

    return data || []
  },

  // Criar foto
  async create(foto: Omit<FotoRonda, 'id'>): Promise<FotoRonda> {
    const { data, error } = await supabase
      .from('fotos_ronda')
      .insert([{
        ronda_id: foto.rondaId || '',
        descricao: foto.descricao,
        responsavel: foto.responsavel
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar foto:', error)
      throw error
    }

    return data
  }
}
