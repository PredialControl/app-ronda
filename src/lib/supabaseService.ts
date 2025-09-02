import { supabase } from './supabase';
import { Contrato, Ronda, AreaTecnica, FotoRonda, OutroItemCorrigido } from '@/types';

// Serviços para Contratos
export const contratoService = {
  // Buscar todos os contratos
  async getAll(): Promise<Contrato[]> {
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id.toString(),
        nome: row.nome,
        sindico: row.sindico,
        endereco: row.endereco,
        periodicidade: row.periodicidade,
        observacoes: row.observacoes,
        dataCriacao: row.data_criacao
      }));
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      throw error;
    }
  },

  // Criar novo contrato
  async create(contrato: Omit<Contrato, 'id'>): Promise<Contrato> {
    try {
      console.log('🔄 Tentando criar contrato:', contrato);
      
      // Preparar dados para inserção (sem campos que podem causar conflito)
      const dadosInserir = {
        nome: contrato.nome,
        sindico: contrato.sindico,
        endereco: contrato.endereco,
        periodicidade: contrato.periodicidade,
        observacoes: contrato.observacoes || null
      };
      
      console.log('🔄 Dados para inserção:', dadosInserir);
      
      const { data, error } = await supabase
        .from('contratos')
        .insert([dadosInserir])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro na criação:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado da criação');
        throw new Error('Nenhum dado retornado da criação');
      }

      console.log('✅ Contrato criado com sucesso:', data);

      return {
        id: data.id.toString(),
        nome: data.nome,
        sindico: data.sindico,
        endereco: data.endereco,
        periodicidade: data.periodicidade,
        observacoes: data.observacoes,
        dataCriacao: data.data_criacao
      };
    } catch (error) {
      console.error('❌ Erro ao criar contrato:', error);
      throw error;
    }
  },

  // Atualizar contrato
  async update(id: string, updates: Partial<Contrato>): Promise<Contrato> {
    try {
      console.log('🔄 Tentando atualizar contrato com ID:', id);
      console.log('🔄 Updates:', updates);
      
      // Preparar dados para atualização (apenas campos válidos)
      const dadosUpdate: any = {};
      if (updates.nome !== undefined) dadosUpdate.nome = updates.nome;
      if (updates.sindico !== undefined) dadosUpdate.sindico = updates.sindico;
      if (updates.endereco !== undefined) dadosUpdate.endereco = updates.endereco;
      if (updates.periodicidade !== undefined) dadosUpdate.periodicidade = updates.periodicidade;
      if (updates.observacoes !== undefined) dadosUpdate.observacoes = updates.observacoes || null;
      
      console.log('🔄 Dados para atualização:', dadosUpdate);
      
      const { data, error } = await supabase
        .from('contratos')
        .update(dadosUpdate)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do update');
        throw new Error('Nenhum dado retornado do update');
      }

      console.log('✅ Contrato atualizado com sucesso:', data);

      return {
        id: data.id.toString(),
        nome: data.nome,
        sindico: data.sindico,
        endereco: data.endereco,
        periodicidade: data.periodicidade,
        observacoes: data.observacoes,
        dataCriacao: data.data_criacao
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar contrato:', error);
      throw error;
    }
  },

  // Deletar contrato
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      throw error;
    }
  }
};

// Serviços para Rondas
export const rondaService = {
  // Buscar todas as rondas
  async getAll(): Promise<Ronda[]> {
    try {
      // Consulta leve com relações mínimas para manter contagens e status
      const { data, error } = await supabase
        .from('rondas')
        .select(`
          id, nome, contrato, data, hora, responsavel, observacoes_gerais,
          areas_tecnicas (id, status),
          fotos_ronda (id),
          outros_itens_corrigidos (id)
        `)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id.toString(),
        nome: row.nome,
        contrato: row.contrato,
        data: row.data,
        hora: row.hora,
        responsavel: row.responsavel,
        observacoesGerais: row.observacoes_gerais,
        // Mapear relações mínimas para objetos tipados completos (placeholders),
        // garantindo contagens e compatibilidade com a UI sem carregar blobs
        areasTecnicas: (row.areas_tecnicas || []).map((at: any) => ({
          id: String(at.id),
          nome: '',
          status: at.status,
          contrato: row.contrato,
          endereco: '',
          data: row.data,
          hora: row.hora,
          foto: null,
          observacoes: ''
        })),
        fotosRonda: (row.fotos_ronda || []).map((fr: any) => ({
          id: String(fr.id),
          foto: '',
          local: '',
          pendencia: '',
          especialidade: '',
          responsavel: 'CONDOMÍNIO',
          observacoes: undefined,
          data: row.data,
          hora: row.hora,
          criticidade: undefined
        })),
        outrosItensCorrigidos: (row.outros_itens_corrigidos || []).map((oi: any) => ({
          id: String(oi.id),
          nome: '',
          descricao: '',
          local: '',
          tipo: 'OUTRO',
          prioridade: 'BAIXA',
          status: 'PENDENTE',
          contrato: row.contrato,
          endereco: '',
          responsavel: undefined,
          foto: null,
          observacoes: undefined,
          data: row.data,
          hora: row.hora
        }))
      }));
    } catch (error) {
      console.error('Erro ao buscar rondas:', error);
      throw error;
    }
  },

  // Buscar rondas por contrato
  async getByContrato(contratoNome: string): Promise<Ronda[]> {
    try {
      const { data, error } = await supabase
        .from('rondas')
        .select('*')
        .eq('contrato', contratoNome)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id.toString(),
        nome: row.nome,
        contrato: row.contrato,
        data: row.data,
        hora: row.hora,
        responsavel: row.responsavel,
        observacoesGerais: row.observacoes_gerais,
        areasTecnicas: [],
        fotosRonda: [],
        outrosItensCorrigidos: []
      }));
    } catch (error) {
      console.error('Erro ao buscar rondas por contrato:', error);
      throw error;
    }
  },

  // Buscar ronda por ID com todos os dados relacionados
  async getById(id: string): Promise<Ronda | null> {
    try {
      console.log('🔄 Buscando ronda por ID:', id);
      
      const { data, error } = await supabase
        .from('rondas')
        .select(`
          *,
          areas_tecnicas (*),
          fotos_ronda (*),
          outros_itens_corrigidos (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar ronda por ID:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ Ronda não encontrada com ID:', id);
        return null;
      }

      const rondaCompleta = {
        id: data.id.toString(),
        nome: data.nome,
        contrato: data.contrato,
        data: data.data,
        hora: data.hora,
        responsavel: data.responsavel,
        observacoesGerais: data.observacoes_gerais,
        areasTecnicas: data.areas_tecnicas || [],
        fotosRonda: data.fotos_ronda || [],
        outrosItensCorrigidos: data.outros_itens_corrigidos || []
      };

      console.log('✅ Ronda encontrada com dados completos:', rondaCompleta);
      console.log('📸 Fotos:', rondaCompleta.fotosRonda.length);
      console.log('🔧 Áreas técnicas:', rondaCompleta.areasTecnicas.length);
      console.log('📝 Outros itens:', rondaCompleta.outrosItensCorrigidos.length);

      return rondaCompleta;
    } catch (error) {
      console.error('❌ Erro ao buscar ronda por ID:', error);
      throw error;
    }
  },

  // Criar nova ronda
  async create(ronda: Omit<Ronda, 'id'>): Promise<Ronda> {
    try {
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
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        nome: data.nome,
        contrato: data.contrato,
        data: data.data,
        hora: data.hora,
        responsavel: data.responsavel,
        observacoesGerais: data.observacoes_gerais,
        areasTecnicas: [],
        fotosRonda: [],
        outrosItensCorrigidos: []
      };
    } catch (error) {
      console.error('Erro ao criar ronda:', error);
      throw error;
    }
  },

  // Atualizar ronda
  async update(id: string, updates: Partial<Ronda>): Promise<Ronda> {
    try {
      console.log('🔄 Tentando atualizar ronda com ID:', id);
      console.log('🔄 Updates:', updates);
      
      const { data, error } = await supabase
        .from('rondas')
        .update({
          nome: updates.nome,
          contrato: updates.contrato,
          data: updates.data,
          hora: updates.hora,
          responsavel: updates.responsavel,
          observacoes_gerais: updates.observacoesGerais
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do update');
        throw new Error('Nenhum dado retornado do update');
      }

      console.log('✅ Ronda atualizada com sucesso:', data);

      return {
        id: data.id.toString(),
        nome: data.nome,
        contrato: data.contrato,
        data: data.data,
        hora: data.hora,
        responsavel: data.responsavel,
        observacoesGerais: data.observacoes_gerais,
        areasTecnicas: updates.areasTecnicas || [],
        fotosRonda: updates.fotosRonda || [],
        outrosItensCorrigidos: updates.outrosItensCorrigidos || []
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar ronda:', error);
      throw error;
    }
  },

  // Deletar ronda
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rondas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar ronda:', error);
      throw error;
    }
  }
};

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
  async create(area: Omit<AreaTecnica, 'id'> & { ronda_id: string }): Promise<AreaTecnica> {
    const { data, error } = await supabase
      .from('areas_tecnicas')
      .insert([{
        ronda_id: area.ronda_id,
        nome: area.nome,
        status: area.status,
        contrato: area.contrato,
        endereco: area.endereco,
        data: area.data,
        hora: area.hora,
        foto: area.foto,
        observacoes: area.observacoes
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar área técnica:', error)
      throw error
    }

    return data
  },

  // Atualizar área técnica
  async update(id: string, updates: Partial<AreaTecnica>): Promise<AreaTecnica> {
    try {
      console.log('🔄 Tentando atualizar área técnica com ID:', id);
      
      const { data, error } = await supabase
        .from('areas_tecnicas')
        .update({
          nome: updates.nome,
          status: updates.status,
          contrato: updates.contrato,
          endereco: updates.endereco,
          data: updates.data,
          hora: updates.hora,
          foto: updates.foto,
          observacoes: updates.observacoes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do update');
        throw new Error('Nenhum dado retornado do update');
      }

      console.log('✅ Área técnica atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar área técnica:', error);
      throw error;
    }
  },

  // Deletar área técnica
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('areas_tecnicas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar área técnica:', error);
      throw error;
    }
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
  async create(foto: Omit<FotoRonda, 'id'> & { ronda_id: string }): Promise<FotoRonda> {
    // Monta payload com criticidade quando existir
    const payload: any = {
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
    if ((foto as any).criticidade) payload.criticidade = (foto as any).criticidade;

    let { data, error }: any = await supabase
      .from('fotos_ronda')
      .insert([payload])
      .select()
      .single();

    // Fallback: se a coluna criticidade não existir no banco, tenta novamente sem ela
    if (error && String(error?.message || '').toLowerCase().includes('criticidade')) {
      try {
        console.warn('Coluna criticidade ausente na tabela fotos_ronda. Tentando salvar sem o campo.');
        delete payload.criticidade;
        ({ data, error } = await supabase
          .from('fotos_ronda')
          .insert([payload])
          .select()
          .single());
      } catch {}
    }

    if (error) {
      console.error('Erro ao criar foto:', error)
      throw error
    }

    return data
  },

  // Atualizar foto
  async update(id: string, updates: Partial<FotoRonda>): Promise<FotoRonda> {
    try {
      console.log('🔄 Tentando atualizar foto com ID:', id);

      const payload: any = {
        foto: updates.foto,
        local: updates.local,
        pendencia: updates.pendencia,
        especialidade: updates.especialidade,
        responsavel: updates.responsavel,
        observacoes: updates.observacoes,
        data: updates.data,
        hora: updates.hora,
      };
      if ((updates as any).criticidade) payload.criticidade = (updates as any).criticidade;

      let { data, error }: any = await supabase
        .from('fotos_ronda')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error && String(error?.message || '').toLowerCase().includes('criticidade')) {
        console.warn('Coluna criticidade ausente na tabela fotos_ronda. Atualizando sem o campo.');
        delete payload.criticidade;
        ({ data, error } = await supabase
          .from('fotos_ronda')
          .update(payload)
          .eq('id', id)
          .select()
          .single());
      }

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do update');
        throw new Error('Nenhum dado retornado do update');
      }

      console.log('✅ Foto atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar foto:', error);
      throw error;
    }
  },

  // Deletar foto
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('fotos_ronda')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      throw error;
    }
  }
}

// Serviços para Outros Itens Corrigidos
export const outroItemService = {
  // Buscar itens por ronda
  async getByRonda(rondaId: string): Promise<OutroItemCorrigido[]> {
    const { data, error } = await supabase
      .from('outros_itens_corrigidos')
      .select('*')
      .eq('ronda_id', rondaId)

    if (error) {
      console.error('Erro ao buscar itens:', error)
      throw error
    }

    return data || []
  },

  // Criar item
  async create(item: Omit<OutroItemCorrigido, 'id'> & { ronda_id: string }): Promise<OutroItemCorrigido> {
    console.log('🔄 Tentando criar item no banco:', item);
    
    // Verificar se todos os campos obrigatórios estão presentes
    const camposObrigatorios = ['ronda_id', 'nome', 'descricao', 'local', 'tipo', 'prioridade', 'status', 'contrato', 'endereco', 'data', 'hora'];
    const camposFaltantes = camposObrigatorios.filter(campo => !item[campo as keyof typeof item]);
    
    if (camposFaltantes.length > 0) {
      console.error('❌ Campos obrigatórios faltando:', camposFaltantes);
      throw new Error(`Campos obrigatórios faltando: ${camposFaltantes.join(', ')}`);
    }
    
    const insertData = {
      ronda_id: item.ronda_id,
      nome: item.nome,
      descricao: item.descricao,
      local: item.local,
      tipo: item.tipo,
      prioridade: item.prioridade,
      status: item.status,
      contrato: item.contrato,
      endereco: item.endereco,
      responsavel: item.responsavel,
      foto: item.foto,
      observacoes: item.observacoes,
      data: item.data,
      hora: item.hora
    };
    
    console.log('📝 Dados para inserção:', insertData);
    
    // Tentar inserir e ver exatamente qual erro ocorre
    try {
      const { data, error } = await supabase
        .from('outros_itens_corrigidos')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar item:', error)
        console.error('❌ Detalhes do erro:', error.details, error.hint, error.message)
        console.error('❌ Código do erro:', error.code)
        throw error
      }

      console.log('✅ Item criado com sucesso:', data)
      return data
    } catch (error) {
      console.error('❌ Erro na inserção:', error)
      throw error
    }
  },

  // Atualizar item
  async update(id: string, updates: Partial<OutroItemCorrigido>): Promise<OutroItemCorrigido> {
    try {
      console.log('🔄 Tentando atualizar item com ID:', id);
      
      const { data, error } = await supabase
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
          foto: updates.foto,
          observacoes: updates.observacoes,
          data: updates.data,
          hora: updates.hora
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do update');
        throw new Error('Nenhum dado retornado do update');
      }

      console.log('✅ Item atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar item:', error);
      throw error;
    }
  },

  // Deletar item
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('outros_itens_corrigidos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      throw error;
    }
  }
}

// Função para migrar dados do localStorage para o banco
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    console.log('🔄 Iniciando migração do localStorage para o banco...');

    // Migrar contratos
    const savedContratos = localStorage.getItem('appRonda_contratos');
    if (savedContratos) {
      const contratos = JSON.parse(savedContratos);
      for (const contrato of contratos) {
        await contratoService.create(contrato);
      }
      console.log(`✅ ${contratos.length} contratos migrados`);
    }

    // Migrar rondas
    const savedRondas = localStorage.getItem('appRonda_rondas');
    if (savedRondas) {
      const rondas = JSON.parse(savedRondas);
      for (const ronda of rondas) {
        await rondaService.create(ronda);
      }
      console.log(`✅ ${rondas.length} rondas migradas`);
    }

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
};

// Função para debug do banco
export const debugDatabase = async (): Promise<void> => {
  try {
    console.log('🔍 DEBUG: Verificando estado do banco...');
    
    // Verificar se a tabela contratos existe e tem dados
    const { data: contratos, error: errorContratos } = await supabase
      .from('contratos')
      .select('*')
      .limit(5);
    
    if (errorContratos) {
      console.error('❌ Erro ao verificar tabela contratos:', errorContratos);
    } else {
      console.log('✅ Tabela contratos encontrada');
      console.log('📊 Total de contratos:', contratos?.length || 0);
      if (contratos && contratos.length > 0) {
        console.log('📋 Primeiros contratos:', contratos);
      }
    }
    
    // Verificar estrutura da tabela
    const { error: errorTable } = await supabase
      .from('contratos')
      .select('id, nome, sindico, endereco, periodicidade, observacoes, data_criacao')
      .limit(1);
    
    if (errorTable) {
      console.error('❌ Erro ao verificar estrutura da tabela:', errorTable);
    } else {
      console.log('✅ Estrutura da tabela OK');
    }
    
  } catch (error) {
    console.error('❌ Erro no debug do banco:', error);
  }
};
