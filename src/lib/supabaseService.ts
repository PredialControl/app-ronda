import { supabase } from './supabase';
import { Contrato, Ronda, AreaTecnica, FotoRonda, OutroItemCorrigido, AgendaItem } from '@/types';

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
        .select('*');

      if (error) {
        console.error('❌ Erro na criação:', error);
        
        // Se for erro de rede, tentar novamente após delay
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.log('🔄 Erro de rede detectado, tentando novamente em 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Segunda tentativa
          const { data: data2, error: error2 } = await supabase
            .from('contratos')
            .insert([dadosInserir])
            .select('*');
          
          if (error2) {
            console.error('❌ Segunda tentativa também falhou:', error2);
            throw new Error(`Erro de conexão: ${error2.message}`);
          }
          
          if (data2 && data2.length > 0) {
            const contratoRetornado = data2[0];
            return {
              id: contratoRetornado.id.toString(),
              nome: contratoRetornado.nome || '',
              sindico: contratoRetornado.sindico || '',
              endereco: contratoRetornado.endereco || '',
              periodicidade: contratoRetornado.periodicidade || '',
              observacoes: contratoRetornado.observacoes || '',
              dataCriacao: contratoRetornado.data_criacao
            };
          }
        }
        
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum dado retornado da criação');
        // Tentar buscar o contrato recém-criado pelo nome
        const { data: contratoBusca, error: erroBusca } = await supabase
          .from('contratos')
          .select('*')
          .eq('nome', dadosInserir.nome)
          .order('id', { ascending: false })
          .limit(1)
          .single();
        
        if (erroBusca || !contratoBusca || !contratoBusca.id) {
          console.error('❌ Fallback também falhou:', { erroBusca, contratoBusca });
        throw new Error('Nenhum dado retornado da criação');
      }

        return {
          id: contratoBusca.id.toString(),
          nome: contratoBusca.nome || '',
          sindico: contratoBusca.sindico || '',
          endereco: contratoBusca.endereco || '',
          periodicidade: contratoBusca.periodicidade || '',
          observacoes: contratoBusca.observacoes || '',
          dataCriacao: contratoBusca.data_criacao
        };
      }

      console.log('✅ Contrato criado com sucesso:', data[0]);

      const contratoRetornado = data[0];
      if (!contratoRetornado || !contratoRetornado.id) {
        console.error('❌ Dados inválidos retornados:', contratoRetornado);
        throw new Error('Dados inválidos retornados da criação');
      }

      return {
        id: contratoRetornado.id.toString(),
        nome: contratoRetornado.nome || '',
        sindico: contratoRetornado.sindico || '',
        endereco: contratoRetornado.endereco || '',
        periodicidade: contratoRetornado.periodicidade || '',
        observacoes: contratoRetornado.observacoes || '',
        dataCriacao: contratoRetornado.data_criacao
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
        .select('*');

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum dado retornado do update');
        // Tentar buscar o contrato atualizado
        const { data: contratoBusca, error: erroBusca } = await supabase
          .from('contratos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (erroBusca || !contratoBusca || !contratoBusca.id) {
          console.error('❌ Fallback update também falhou:', { erroBusca, contratoBusca });
        throw new Error('Nenhum dado retornado do update');
      }

        return {
          id: contratoBusca.id.toString(),
          nome: contratoBusca.nome || '',
          sindico: contratoBusca.sindico || '',
          endereco: contratoBusca.endereco || '',
          periodicidade: contratoBusca.periodicidade || '',
          observacoes: contratoBusca.observacoes || '',
          dataCriacao: contratoBusca.data_criacao
        };
      }

      console.log('✅ Contrato atualizado com sucesso:', data[0]);

      const contratoAtualizado = data[0];
      if (!contratoAtualizado || !contratoAtualizado.id) {
        console.error('❌ Dados inválidos retornados do update:', contratoAtualizado);
        throw new Error('Dados inválidos retornados do update');
      }

      return {
        id: contratoAtualizado.id.toString(),
        nome: contratoAtualizado.nome || '',
        sindico: contratoAtualizado.sindico || '',
        endereco: contratoAtualizado.endereco || '',
        periodicidade: contratoAtualizado.periodicidade || '',
        observacoes: contratoAtualizado.observacoes || '',
        dataCriacao: contratoAtualizado.data_criacao
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
  // Buscar todas as rondas (versão com fallback local)
  async getAll(): Promise<Ronda[]> {
    try {
      console.log('🔄 Tentando carregar rondas do banco...');
      
      // Tentar consulta simples primeiro (mais rápida)
      const { data, error } = await supabase
        .from('rondas')
        .select('id, nome, contrato, data, hora, responsavel, observacoes_gerais')
        .order('data_criacao', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('⚠️ Erro no banco, usando rondas locais:', error.message);
        return this.getRondasLocais();
      }

      if (data && data.length > 0) {
        console.log(`✅ ${data.length} rondas carregadas do banco (básicas)`);
        
        // Carregar dados completos para cada ronda
        const rondasCompletas = await Promise.all(
          data.filter(row => row && row.id && row.id.toString().trim() !== '').map(async (row) => {
            // Validar se o ID existe e não está vazio
            const rondaId = row.id ? row.id.toString() : '';
            if (!rondaId || rondaId.trim() === '') {
              console.warn('⚠️ Ronda com ID inválido encontrada:', row);
              return null;
            }
            
            const rondaBasica = {
              id: rondaId,
          nome: row.nome || 'Ronda sem nome',
          contrato: row.contrato || 'Contrato não especificado',
          data: row.data || new Date().toISOString().split('T')[0],
          hora: row.hora || '00:00',
          responsavel: row.responsavel || 'Responsável não informado',
          observacoesGerais: row.observacoes_gerais || '',
              areasTecnicas: [],
              fotosRonda: [],
              outrosItensCorrigidos: []
            };
            
            // Carregar dados completos desta ronda apenas se o ID for válido
            if (rondaBasica.id && rondaBasica.id.trim() !== '') {
              console.log('🔄 Carregando dados completos para ronda:', rondaBasica.id);
              const rondaCompleta = await this.loadCompleteRonda(rondaBasica);
              console.log('✅ Ronda completa carregada:', rondaCompleta.id, {
                outrosItensCorrigidos: rondaCompleta.outrosItensCorrigidos?.length || 0,
                fotosRonda: rondaCompleta.fotosRonda?.length || 0
              });
              return rondaCompleta;
            } else {
              console.warn('⚠️ Ronda com ID inválido, retornando dados básicos:', rondaBasica);
              return rondaBasica;
            }
          })
        );
        
        // Filtrar rondas nulas
        return rondasCompletas.filter(ronda => ronda !== null);
      }

      // Se não há dados no banco, usar rondas locais
      console.log('📝 Banco vazio, usando rondas de exemplo');
      return this.getRondasLocais();
    } catch (error) {
      console.warn('⚠️ Erro crítico, usando rondas locais:', error);
      return this.getRondasLocais();
    }
  },

  // Rondas de exemplo locais (fallback)
  getRondasLocais(): Ronda[] {
    console.log('🏠 Criando rondas de exemplo locais...');
    
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const anteontem = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const rondasExemplo: Ronda[] = [
      {
        id: 'local-1',
        nome: 'Ronda Matutina - Centro',
        contrato: 'CT001/2024 - Manutenção Preventiva',
        data: hoje,
        hora: '08:00',
        responsavel: 'Ricardo Oliveira',
        observacoesGerais: 'Verificação geral das áreas técnicas',
        areasTecnicas: [
          {
            id: 'at-1',
            nome: 'Sala de Bombas',
            status: 'ATIVO',
            contrato: 'CT001/2024 - Manutenção Preventiva',
            endereco: 'Rua das Flores, 123 - Centro',
            data: hoje,
            hora: '08:00',
            foto: null,
            observacoes: 'Funcionando normalmente'
          },
          {
            id: 'at-2',
            nome: 'Casa de Máquinas',
            status: 'ATIVO',
            contrato: 'CT001/2024 - Manutenção Preventiva',
            endereco: 'Rua das Flores, 123 - Centro',
            data: hoje,
            hora: '08:15',
            foto: null,
            observacoes: 'Equipamentos operacionais'
          }
        ],
        fotosRonda: [
          {
            id: 'foto-1',
            foto: '',
            local: 'Corredor Principal',
            pendencia: 'Lâmpada queimada',
            especialidade: 'Elétrica',
            responsavel: 'CONDOMÍNIO',
            observacoes: 'Substituir lâmpada LED',
            data: hoje,
            hora: '08:30',
            criticidade: 'BAIXA'
          }
        ],
        outrosItensCorrigidos: []
      },
      {
        id: 'local-2',
        nome: 'Ronda Vespertina - Jardim',
        contrato: 'CT002/2024 - Inspeção Semanal',
        data: ontem,
        hora: '14:00',
        responsavel: 'Maria Santos',
        observacoesGerais: 'Inspeção das áreas externas',
        areasTecnicas: [
          {
            id: 'at-3',
            nome: 'Jardim',
            status: 'ATIVO',
            contrato: 'CT002/2024 - Inspeção Semanal',
            endereco: 'Av. Principal, 456 - Bairro Novo',
            data: ontem,
            hora: '14:00',
            foto: null,
            observacoes: 'Irrigação funcionando'
          }
        ],
        fotosRonda: [],
        outrosItensCorrigidos: [
          {
            id: 'oi-1',
            nome: 'Portão Principal',
            descricao: 'Ajuste na fechadura',
            local: 'Entrada Principal',
            tipo: 'MANUTENÇÃO',
            prioridade: 'MÉDIA',
            status: 'CONCLUÍDO',
            contrato: 'CT002/2024 - Inspeção Semanal',
            endereco: 'Av. Principal, 456 - Bairro Novo',
            responsavel: 'João Silva',
            observacoes: 'Fechadura ajustada e lubrificada',
            foto: null,
            fotos: [],
            data: ontem,
            hora: '14:30'
          }
        ]
      },
      {
        id: 'local-3',
        nome: 'Ronda Noturna - Segurança',
        contrato: 'CT001/2024 - Manutenção Preventiva',
        data: anteontem,
        hora: '20:00',
        responsavel: 'Carlos Mendes',
        observacoesGerais: 'Verificação de segurança noturna',
        areasTecnicas: [],
        fotosRonda: [
          {
            id: 'foto-2',
            foto: '',
            local: 'Portaria',
            pendencia: 'Câmera com problema',
            especialidade: 'Segurança',
            responsavel: 'CONDOMÍNIO',
            observacoes: 'Câmera da portaria com imagem tremida',
            data: anteontem,
            hora: '20:15',
            criticidade: 'ALTA'
          }
        ],
        outrosItensCorrigidos: []
      }
    ];

    console.log(`✅ ${rondasExemplo.length} rondas de exemplo criadas`);
    return rondasExemplo;
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

      return data.filter(row => row && row.id && row.id.toString().trim() !== '').map(row => ({
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

  // Carregar dados completos de uma ronda (áreas técnicas, fotos, etc.)
  async loadCompleteRonda(ronda: Ronda): Promise<Ronda> {
    try {
      console.log('🔄 Carregando dados completos da ronda:', ronda.id);
      
      // Validar se o ID da ronda não está vazio
      if (!ronda.id || ronda.id.trim() === '') {
        console.warn('⚠️ ID da ronda está vazio ou inválido, retornando ronda sem dados relacionados:', ronda.id);
        return ronda;
      }
      
      // Se é uma ronda local, não tentar carregar do banco
      if (ronda.id.startsWith('local-')) {
        console.log('🏠 Ronda local detectada, retornando dados locais:', ronda.id);
        return ronda;
      }
      
      // Carregar fotos primeiro (mais importante para o problema atual)
      let fotosRonda: FotoRonda[] = [];
      try {
        console.log('📸 Buscando fotos da ronda:', ronda.id);
        const { data: fotosData, error: fotosError } = await supabase
          .from('fotos_ronda')
          .select('*')
          .eq('ronda_id', ronda.id)
          .order('id', { ascending: false });
        
        if (fotosError) {
          console.warn('⚠️ Erro ao carregar fotos (continuando sem fotos):', fotosError.message);
          // Não interromper o carregamento por erro de fotos
          fotosRonda = [];
        } else if (fotosData && fotosData.length > 0) {
          fotosRonda = fotosData.filter((foto: any) => foto && foto.id).map((foto: any) => ({
            id: foto.id?.toString() || '',
            foto: foto.foto || foto.url_foto || '',
            local: foto.local || foto.descricao || '',
            pendencia: foto.pendencia || '',
            especialidade: foto.especialidade || '',
            responsavel: foto.responsavel || 'CONDOMÍNIO',
            observacoes: foto.observacoes || '',
            data: foto.data || '',
            hora: foto.hora || '',
            criticidade: foto.criticidade || undefined
          }));
          console.log(`✅ ${fotosRonda.length} fotos carregadas para ronda ${ronda.id}`);
        } else {
          console.log(`📸 Nenhuma foto encontrada para ronda ${ronda.id}`);
        }
      } catch (fotoError) {
        console.warn('⚠️ Erro ao carregar fotos (continuando):', fotoError);
        // Continuar sem fotos em caso de erro
        fotosRonda = [];
      }

      // Carregar áreas técnicas separadamente
      let areasTecnicas: AreaTecnica[] = [];
      try {
        const { data: areasData, error: areasError } = await supabase
          .from('areas_tecnicas')
          .select('*')
          .eq('ronda_id', ronda.id);
        
        if (!areasError && areasData) {
          areasTecnicas = areasData.filter((area: any) => area && area.id).map((area: any) => ({
            id: area.id?.toString() || '',
            nome: area.nome || '',
            status: area.status || 'ATIVO',
            contrato: area.contrato || '',
            endereco: area.endereco || '',
            data: area.data || '',
            hora: area.hora || '',
            foto: area.foto || null,
            observacoes: area.observacoes || ''
          }));
          console.log(`✅ ${areasTecnicas.length} áreas técnicas carregadas para ronda ${ronda.id}`);
        }
      } catch (areaError) {
        console.warn('⚠️ Erro ao carregar áreas técnicas (continuando):', areaError);
        // Continuar sem áreas técnicas em caso de erro
        areasTecnicas = [];
      }

      // Carregar outros itens separadamente
      let outrosItensCorrigidos: OutroItemCorrigido[] = [];
      try {
        const { data: outrosData, error: outrosError } = await supabase
          .from('outros_itens_corrigidos')
          .select('*')
          .eq('ronda_id', ronda.id);
        
        if (!outrosError && outrosData) {
          outrosItensCorrigidos = outrosData.filter((item: any) => item && item.id).map((item: any) => {
            // Tentar parsear fotos como JSON se a coluna foto contém múltiplas fotos
            let fotos: string[] = [];
            let foto: string | null = null;
            
            if (item.fotos && Array.isArray(item.fotos)) {
              // Se há coluna fotos separada
              fotos = item.fotos;
              foto = item.foto;
            } else if (item.foto) {
              // Tentar parsear como JSON (múltiplas fotos)
              try {
                const parsed = JSON.parse(item.foto);
                if (Array.isArray(parsed)) {
                  fotos = parsed;
                  foto = parsed[0] || null; // Primeira foto como foto principal
                } else {
                  // Foto única
                  foto = item.foto;
                  fotos = [item.foto];
                }
              } catch {
                // Se não conseguir parsear, é foto única
                foto = item.foto;
                fotos = [item.foto];
              }
            }
            
            return {
            id: item.id?.toString() || '',
            nome: item.nome || '',
            descricao: item.descricao || '',
            local: item.local || '',
            tipo: item.tipo || '',
            prioridade: item.prioridade || '',
            status: item.status || '',
            contrato: item.contrato || '',
            endereco: item.endereco || '',
            responsavel: item.responsavel || '',
            observacoes: item.observacoes || '',
              foto: foto,
              fotos: fotos,
              categoria: item.categoria || 'CHAMADO', // Default para chamado (será usado apenas no frontend)
            data: item.data || '',
            hora: item.hora || ''
            };
          });
          console.log(`✅ ${outrosItensCorrigidos.length} outros itens carregados para ronda ${ronda.id}`);
        }
      } catch (outrosError) {
        console.warn('⚠️ Erro ao carregar outros itens (continuando):', outrosError);
        // Continuar sem outros itens em caso de erro
        outrosItensCorrigidos = [];
      }

      const rondaCompleta = {
        ...ronda,
        areasTecnicas,
        fotosRonda,
        outrosItensCorrigidos
      };

      console.log('✅ Dados completos carregados:', {
        areasTecnicas: rondaCompleta.areasTecnicas.length,
        fotosRonda: rondaCompleta.fotosRonda.length,
        outrosItens: rondaCompleta.outrosItensCorrigidos.length
      });

      return rondaCompleta;
    } catch (error) {
      console.error('❌ Erro ao carregar dados completos:', error);
      return ronda;
    }
  },

  // Buscar ronda por ID com todos os dados relacionados
  async getById(id: string): Promise<Ronda | null> {
    try {
      console.log('🔄 Buscando ronda por ID:', id);
      
      // Validar se o ID não está vazio
      if (!id || id.trim() === '') {
        console.warn('⚠️ ID da ronda está vazio ou inválido, retornando null:', id);
        return null;
      }
      
      // Se é uma ronda local, não buscar no banco
      if (id.startsWith('local-')) {
        console.log('🏠 Ronda local detectada, não buscando no banco:', id);
        return null;
      }
      
      const { data, error } = await supabase
        .from('rondas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.warn('⚠️ Erro ao buscar ronda por ID (retornando null):', error.message);
        return null;
      }

      if (!data) {
        console.log('⚠️ Ronda não encontrada com ID:', id);
        return null;
      }

      console.log('✅ Ronda básica encontrada no banco:', data);

      // Carregar dados relacionados separadamente
      const rondaBasica = {
        id: data.id ? data.id.toString() : '',
        nome: data.nome || '',
        contrato: data.contrato || '',
        data: data.data || '',
        hora: data.hora || '',
        responsavel: data.responsavel || '',
        observacoesGerais: data.observacoes_gerais || '',
        areasTecnicas: [],
        fotosRonda: [],
        outrosItensCorrigidos: []
      };

      // Usar loadCompleteRonda para carregar dados relacionados apenas se o ID for válido
      const rondaCompleta = rondaBasica.id && rondaBasica.id.trim() !== '' 
        ? await this.loadCompleteRonda(rondaBasica)
        : rondaBasica;
      console.log('✅ Ronda completa carregada:', {
        id: rondaCompleta.id,
        fotos: rondaCompleta.fotosRonda?.length || 0,
        areas: rondaCompleta.areasTecnicas?.length || 0
      });
      return rondaCompleta;
    } catch (error) {
      console.warn('⚠️ Erro ao buscar ronda por ID (retornando null):', error);
      return null;
    }
  },

  // Criar nova ronda
  async create(ronda: Omit<Ronda, 'id'>): Promise<Ronda> {
    try {
      console.log('🆕 Criando ronda no Supabase...', ronda);
      
      // GERAR UUID NO CLIENTE (solução definitiva!)
      const novoId = crypto.randomUUID();
      console.log('🔑 UUID gerado no cliente:', novoId);
      
      const { data, error } = await supabase
        .from('rondas')
        .insert([{
          id: novoId, // Enviar o ID gerado pelo cliente
          nome: ronda.nome,
          contrato: ronda.contrato,
          data: ronda.data,
          hora: ronda.hora,
          responsavel: ronda.responsavel,
          observacoes_gerais: ronda.observacoesGerais
        }])
        .select();

      console.log('🔍 Debug - Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro ao criar ronda no Supabase:', error);
        throw new Error(`Erro ao criar ronda no banco de dados: ${error.message}`);
      }

      // Pegar o primeiro item do array
      const rondaData = data && data.length > 0 ? data[0] : null;
      
      console.log('🔍 Debug - rondaData extraído:', rondaData);
      
      // Usar o ID que geramos, não o retornado pelo Supabase
      const rondaCriada = {
        id: novoId, // Usar o ID que geramos
        nome: rondaData?.nome || ronda.nome,
        contrato: rondaData?.contrato || ronda.contrato,
        data: rondaData?.data || ronda.data,
        hora: rondaData?.hora || ronda.hora,
        responsavel: rondaData?.responsavel || ronda.responsavel,
        observacoesGerais: rondaData?.observacoes_gerais || ronda.observacoesGerais || '',
        areasTecnicas: [],
        fotosRonda: [],
        outrosItensCorrigidos: []
      };
      
      console.log('✅ Ronda criada com sucesso no Supabase:', rondaCriada);
      return rondaCriada;
    } catch (error) {
      console.error('❌ Erro ao criar ronda:', error);
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
    try {
      const { data, error } = await supabase
        .from('areas_tecnicas')
        .select('*')
        .eq('ronda_id', rondaId);

      if (error) {
        console.error('Erro ao buscar áreas técnicas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar áreas técnicas:', error);
      throw error;
    }
  },

  // Criar área técnica
  async create(area: Omit<AreaTecnica, 'id'> & { ronda_id: string }): Promise<AreaTecnica> {
    try {
      console.log('🆕 Criando área técnica:', area);
      
      // Validar se o ronda_id não está vazio
      if (!area.ronda_id || area.ronda_id.trim() === '') {
        console.error('❌ ID da ronda está vazio ou inválido:', area.ronda_id);
        throw new Error('ID da ronda está vazio ou inválido. Não é possível criar área técnica.');
      }
      
      // Se é uma ronda local ou temporária, não tentar salvar no banco
      if (area.ronda_id.startsWith('local-') || area.ronda_id.startsWith('temp-')) {
        console.log('🏠 Ronda local/temporária detectada, criando área técnica local:', area.ronda_id);
        // Retornar área técnica local sem salvar no banco
        return {
          id: crypto.randomUUID(),
          nome: area.nome,
          status: area.status,
          contrato: area.contrato,
          endereco: area.endereco,
          data: area.data,
          hora: area.hora,
          foto: area.foto,
          observacoes: area.observacoes || ''
        };
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na criação')), 8000) // 8 segundos
      );
      
      const queryPromise = supabase
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
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro ao criar área técnica:', error);
        throw error;
      }

      console.log('✅ Área técnica criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar área técnica:', error);
      throw error;
    }
  },

  // Atualizar área técnica
  async update(id: string, updates: Partial<AreaTecnica>): Promise<AreaTecnica> {
    try {
      console.log('🔄 Tentando atualizar área técnica com ID:', id);
      
      // Validar se o ID não está vazio
      if (!id || id.trim() === '') {
        console.error('❌ ID da área técnica está vazio ou inválido:', id);
        throw new Error('ID da área técnica está vazio ou inválido.');
      }
      
      // Se é uma área técnica local ou temporária, não tentar atualizar no banco
      if (id.startsWith('local-') || id.startsWith('at-') || id.startsWith('temp-')) {
        console.log('🏠 Área técnica local/temporária detectada, retornando dados locais:', id);
        // Retornar área técnica atualizada localmente
        return {
          id: id,
          nome: updates.nome || '',
          status: updates.status || 'ATIVO',
          contrato: updates.contrato || '',
          endereco: updates.endereco || '',
          data: updates.data || '',
          hora: updates.hora || '',
          foto: updates.foto || null,
          observacoes: updates.observacoes || ''
        };
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na atualização')), 8000) // 8 segundos
      );
      
      const queryPromise = supabase
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

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

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
      console.log('🗑️ Tentando deletar área técnica com ID:', id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na exclusão')), 8000) // 8 segundos
      );
      
      const queryPromise = supabase
        .from('areas_tecnicas')
        .delete()
        .eq('id', id);

      const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro ao deletar área técnica:', error);
        throw error;
      }
      
      console.log('✅ Área técnica deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar área técnica:', error);
      throw error;
    }
  }
}

// Serviços para Fotos de Ronda
export const fotoRondaService = {
  // Buscar fotos por ronda
  async getByRonda(rondaId: string): Promise<FotoRonda[]> {
    try {
      console.log('📸 Buscando fotos da ronda:', rondaId);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na busca de fotos')), 8000) // 8 segundos
      );
      
      const queryPromise = supabase
        .from('fotos_ronda')
        .select('*')
        .eq('ronda_id', rondaId)
        .order('id', { ascending: false });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro ao buscar fotos:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} fotos encontradas`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar fotos:', error);
      throw error;
    }
  },

  // Função para comprimir imagem
  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem comprimida
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com qualidade reduzida
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  },

  // Criar foto
  async create(foto: Omit<FotoRonda, 'id'> & { ronda_id: string }): Promise<FotoRonda> {
    try {
      console.log('📸 Criando nova foto:', foto.local);
      
      // Validar se o ronda_id não está vazio
      if (!foto.ronda_id || foto.ronda_id.trim() === '') {
        console.error('❌ ID da ronda está vazio ou inválido:', foto.ronda_id);
        throw new Error('ID da ronda está vazio ou inválido. Não é possível criar foto.');
      }
      
      // Se é uma ronda local ou temporária, não tentar salvar no banco
      if (foto.ronda_id.startsWith('local-') || foto.ronda_id.startsWith('temp-')) {
        console.log('🏠 Ronda local/temporária detectada, criando foto local:', foto.ronda_id);
        // Retornar foto local sem salvar no banco
        return {
          id: crypto.randomUUID(),
          foto: foto.foto,
          local: foto.local,
          pendencia: foto.pendencia,
          especialidade: foto.especialidade,
          responsavel: foto.responsavel,
          observacoes: foto.observacoes,
          data: foto.data,
          hora: foto.hora,
          criticidade: (foto as any).criticidade
        };
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na criação da foto')), 15000) // 15 segundos para upload
      );
      
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

      const queryPromise = supabase
        .from('fotos_ronda')
        .insert([payload])
        .select()
        .single();

      let { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

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
        console.error('❌ Erro ao criar foto:', error);
        throw error;
      }

      console.log('✅ Foto criada com sucesso:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar foto:', error);
      throw error;
    }
  },

  // Atualizar foto
  async update(id: string, updates: Partial<FotoRonda>): Promise<FotoRonda> {
    try {
      console.log('🔄 Tentando atualizar foto com ID:', id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na atualização da foto')), 15000) // 15 segundos para upload
      );

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

      const queryPromise = supabase
        .from('fotos_ronda')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      let { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

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

      console.log('✅ Foto atualizada com sucesso:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar foto:', error);
      throw error;
    }
  },

  // Deletar foto
  async delete(id: string): Promise<void> {
    try {
      console.log('🗑️ Tentando deletar foto com ID:', id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na exclusão da foto')), 8000) // 8 segundos
      );
      
      const queryPromise = supabase
        .from('fotos_ronda')
        .delete()
        .eq('id', id);

      const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro ao deletar foto:', error);
        throw error;
      }
      
      console.log('✅ Foto deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar foto:', error);
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
    
    // Se é uma ronda local ou temporária, não tentar salvar no banco
    if (item.ronda_id.startsWith('local-') || item.ronda_id.startsWith('temp-')) {
      console.log('🏠 Ronda local/temporária detectada, criando item local:', item.ronda_id);
      // Retornar item local sem salvar no banco
      return {
        id: crypto.randomUUID(),
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
        fotos: item.fotos || [],
        observacoes: item.observacoes,
        data: item.data,
        hora: item.hora
      };
    }
    
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
    // Se há múltiplas fotos, salvar como JSON na coluna foto existente
    // Limitar tamanho para evitar timeout (máximo 5MB de dados)
    foto: item.fotos && item.fotos.length > 0 ? 
      (() => {
        const fotosJSON = JSON.stringify(item.fotos);
        const tamanhoMB = new Blob([fotosJSON]).size / 1024 / 1024;
        
        if (tamanhoMB > 2) {
          console.warn(`⚠️ JSON das fotos muito grande (${tamanhoMB.toFixed(2)}MB), limitando para 2MB`);
          // Se muito grande, salvar apenas as primeiras fotos
          const fotosLimitadas = item.fotos.slice(0, Math.floor(item.fotos.length * 0.5));
          return JSON.stringify(fotosLimitadas);
        }
        return fotosJSON;
      })() : item.foto,
      observacoes: item.observacoes,
      data: item.data,
      hora: item.hora
    };
    
    // Verificar tamanho dos dados antes de enviar
    const dadosJSON = JSON.stringify(insertData);
    const tamanhoMB = new Blob([dadosJSON]).size / 1024 / 1024;
    
    console.log(`📝 Dados para inserção (${tamanhoMB.toFixed(2)}MB):`, insertData);
    
    if (tamanhoMB > 2) {
      console.warn(`⚠️ Dados muito grandes (${tamanhoMB.toFixed(2)}MB), otimizando...`);
      
      // Reduzir fotos se muito grandes
      if (insertData.foto) {
        try {
          const fotos = JSON.parse(insertData.foto);
          if (Array.isArray(fotos) && fotos.length > 1) {
            // Usar apenas as primeiras 2 fotos se muito grande
            const fotosReduzidas = fotos.slice(0, 2);
            insertData.foto = JSON.stringify(fotosReduzidas);
            console.log(`🔄 Reduzido de ${fotos.length} para ${fotosReduzidas.length} fotos`);
          }
        } catch (e) {
          console.log('🔄 Foto não é JSON, mantendo como está');
        }
      }
    }
    
    // Tentar inserir e ver exatamente qual erro ocorre
    try {
      console.log('🔄 Tentando inserir item no banco...');
      
      const { data, error } = await supabase
        .from('outros_itens_corrigidos')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar item:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('❌ Dados que causaram erro:', insertData);
        
        // Se for erro 500, tentar com dados menores
        if (error.code === '500' || error.message.includes('500')) {
          console.log('🔄 Erro 500 detectado, tentando com dados reduzidos...');
          
          // Reduzir drasticamente as fotos
          if (item.fotos && item.fotos.length > 2) {
            const fotosReduzidas = item.fotos.slice(0, 2); // Apenas 2 fotos
            const insertDataReduzido = {
              ...insertData,
              foto: JSON.stringify(fotosReduzidas)
            };
            
            console.log('🔄 Tentando inserir com apenas 2 fotos...');
            const { data: dataRetry, error: errorRetry } = await supabase
              .from('outros_itens_corrigidos')
              .insert([insertDataReduzido])
              .select()
              .single();
              
            if (errorRetry) {
              console.error('❌ Retry também falhou:', errorRetry);
              throw new Error(`Erro 500: Dados muito grandes. Tente com menos fotos.`);
            }
            
            console.log('✅ Sucesso com dados reduzidos');
            const itemRetornado: OutroItemCorrigido = {
              id: dataRetry.id?.toString() || '',
              nome: dataRetry.nome || '',
              descricao: dataRetry.descricao || '',
              local: dataRetry.local || '',
              tipo: dataRetry.tipo || 'CORREÇÃO',
              prioridade: dataRetry.prioridade || 'MÉDIA',
              status: dataRetry.status || 'PENDENTE',
              contrato: dataRetry.contrato || '',
              endereco: dataRetry.endereco || '',
              responsavel: dataRetry.responsavel || '',
              observacoes: dataRetry.observacoes || '',
              foto: dataRetry.foto || null,
              fotos: fotosReduzidas, // Usar fotos reduzidas
              categoria: item.categoria || 'CHAMADO',
              data: dataRetry.data || '',
              hora: dataRetry.hora || ''
            };
            
            return itemRetornado;
          }
        }
        
        throw error;
      }

      console.log('✅ Item criado com sucesso:', data);
      
      // Mapear dados retornados para o formato correto
      const itemRetornado: OutroItemCorrigido = {
        id: data.id?.toString() || '',
        nome: data.nome || '',
        descricao: data.descricao || '',
        local: data.local || '',
        tipo: data.tipo || 'CORREÇÃO',
        prioridade: data.prioridade || 'MÉDIA',
        status: data.status || 'PENDENTE',
        contrato: data.contrato || '',
        endereco: data.endereco || '',
        responsavel: data.responsavel || '',
        observacoes: data.observacoes || '',
        foto: data.foto || null,
        fotos: item.fotos || [], // Usar as fotos originais
        categoria: item.categoria || 'CHAMADO', // Usar categoria do item original (frontend)
        data: data.data || '',
        hora: data.hora || ''
      };
      
      return itemRetornado;
    } catch (error) {
      console.error('❌ Erro na inserção:', error);
      throw error;
    }
  },

  // Atualizar item
  async update(id: string, updates: Partial<OutroItemCorrigido>): Promise<OutroItemCorrigido> {
    try {
      console.log('🔄 Tentando atualizar item com ID:', id);
      
      // Validar se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error('❌ ID inválido para UUID:', id);
        throw new Error(`ID inválido: ${id}. Esperado formato UUID.`);
      }
      
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
          foto: updates.fotos && updates.fotos.length > 0 ? JSON.stringify(updates.fotos) : updates.foto,
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
      
      // Mapear dados retornados para incluir categoria e fotos
      let fotos: string[] = [];
      let foto: string | null = null;
      
      if (data.foto) {
        try {
          const parsed = JSON.parse(data.foto);
          if (Array.isArray(parsed)) {
            fotos = parsed;
            foto = parsed[0] || null;
          } else {
            foto = data.foto;
            fotos = [data.foto];
          }
        } catch {
          foto = data.foto;
          fotos = [data.foto];
        }
      }
      
      return {
        id: data.id?.toString() || '',
        nome: data.nome || '',
        descricao: data.descricao || '',
        local: data.local || '',
        tipo: data.tipo || 'CORREÇÃO',
        prioridade: data.prioridade || 'MÉDIA',
        status: data.status || 'PENDENTE',
        contrato: data.contrato || '',
        endereco: data.endereco || '',
        responsavel: data.responsavel || '',
        observacoes: data.observacoes || '',
        foto: foto,
        fotos: fotos,
        categoria: updates.categoria || 'CHAMADO', // Preservar categoria do update
        data: data.data || '',
        hora: data.hora || ''
      };
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

// Serviços para Agenda
export const agendaService = {
  // Buscar todos os itens da agenda
  async getAll(): Promise<AgendaItem[]> {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id.toString(),
        contratoId: row.contrato_id,
        contratoNome: row.contrato_nome,
        endereco: row.endereco,
        diaSemana: row.dia_semana,
        horario: row.horario,
        observacoes: row.observacoes,
        ativo: row.ativo,
        dataCriacao: row.data_criacao,
        dataAtualizacao: row.data_atualizacao,
        recorrencia: row.recorrencia ? JSON.parse(row.recorrencia) : undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
      // Retornar array vazio em caso de erro (tabela não existe ainda)
      return [];
    }
  },

  // Criar novo item na agenda
  async create(item: Omit<AgendaItem, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<AgendaItem> {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .insert([{
          contrato_id: item.contratoId,
          contrato_nome: item.contratoNome,
          endereco: item.endereco,
          dia_semana: item.diaSemana,
          horario: item.horario,
          observacoes: item.observacoes,
          ativo: item.ativo,
          recorrencia: item.recorrencia ? JSON.stringify(item.recorrencia) : null
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        contratoId: data.contrato_id,
        contratoNome: data.contrato_nome,
        endereco: data.endereco,
        diaSemana: data.dia_semana,
        horario: data.horario,
        observacoes: data.observacoes,
        ativo: data.ativo,
        dataCriacao: data.data_criacao,
        dataAtualizacao: data.data_atualizacao,
        recorrencia: data.recorrencia ? JSON.parse(data.recorrencia) : undefined
      };
    } catch (error) {
      console.error('Erro ao criar item da agenda:', error);
      throw error;
    }
  },

  // Atualizar item da agenda
  async update(id: string, updates: Partial<AgendaItem>): Promise<AgendaItem> {
    try {
      const updateData: any = {};
      if (updates.contratoId !== undefined) updateData.contrato_id = updates.contratoId;
      if (updates.contratoNome !== undefined) updateData.contrato_nome = updates.contratoNome;
      if (updates.endereco !== undefined) updateData.endereco = updates.endereco;
      if (updates.diaSemana !== undefined) updateData.dia_semana = updates.diaSemana;
      if (updates.horario !== undefined) updateData.horario = updates.horario;
      if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
      if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
      if (updates.recorrencia !== undefined) updateData.recorrencia = updates.recorrencia ? JSON.stringify(updates.recorrencia) : null;

      const { data, error } = await supabase
        .from('agenda')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        contratoId: data.contrato_id,
        contratoNome: data.contrato_nome,
        endereco: data.endereco,
        diaSemana: data.dia_semana,
        horario: data.horario,
        observacoes: data.observacoes,
        ativo: data.ativo,
        dataCriacao: data.data_criacao,
        dataAtualizacao: data.data_atualizacao,
        recorrencia: data.recorrencia ? JSON.parse(data.recorrencia) : undefined
      };
    } catch (error) {
      console.error('Erro ao atualizar item da agenda:', error);
      throw error;
    }
  },

  // Deletar item da agenda
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agenda')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar item da agenda:', error);
      throw error;
    }
  },

  // Limpar itens cancelados
  async clearCanceledItems(): Promise<void> {
    try {
      const { error } = await supabase
        .from('agenda')
        .delete()
        .eq('ativo', false)
        .like('observacoes', '%[CANCELADO%');

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao limpar itens cancelados:', error);
      throw error;
    }
  }
};

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
