import { supabase } from './supabase';
import { RelatorioPendencias, RelatorioSecao, RelatorioPendencia, RelatorioSubsecao } from '@/types';

export const relatorioPendenciasService = {
    // ==================== RELATÓRIOS ===================
    // Query ultra-simplificada para evitar timeout
    async getAll(contratoId: string): Promise<RelatorioPendencias[]> {
        console.log('📋 getAll - Buscando relatórios para contrato:', contratoId);

        try {
            // Query mínima sem ordenação (ordenar no cliente)
            const { data, error } = await supabase
                .from('relatorios_pendencias')
                .select('id, contrato_id, titulo, created_at, updated_at')
                .eq('contrato_id', contratoId)
                .limit(50);

            if (error) {
                console.error('❌ Erro ao buscar relatórios:', error);
                // Se for timeout, retornar array vazio
                if (error.code === '57014') {
                    console.warn('⚠️ Timeout - retornando lista vazia');
                    return [];
                }
                throw error;
            }

            // Ordenar no cliente (mais recentes primeiro)
            const sorted = (data || []).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            console.log('✅ Relatórios encontrados:', sorted.length);
            return sorted;
        } catch (err) {
            console.error('❌ Exceção ao buscar relatórios:', err);
            return []; // Retornar vazio em vez de travar
        }
    },

    async getById(id: string): Promise<RelatorioPendencias | null> {
        console.log('🔍 getById - Buscando relatório:', id);

        try {
            // 1. Buscar relatório básico
            const { data: relatorio, error: relError } = await supabase
                .from('relatorios_pendencias')
                .select('*')
                .eq('id', id)
                .single();

            if (relError) {
                console.error('❌ Erro ao buscar relatório:', relError);
                throw relError;
            }

            if (!relatorio) {
                console.warn('⚠️ Relatório não encontrado:', id);
                return null;
            }

            console.log('✅ Relatório básico:', relatorio.id, relatorio.titulo);

            // 2. Buscar seções do relatório
            const { data: secoes, error: secError } = await supabase
                .from('relatorio_secoes')
                .select('*')
                .eq('relatorio_id', id)
                .order('ordem', { ascending: true });

            if (secError) {
                console.error('❌ Erro ao buscar seções:', secError);
            }

            console.log('✅ Seções encontradas:', secoes?.length || 0);

            // 3. Para cada seção, buscar pendências e subseções
            const secoesCompletas = await Promise.all((secoes || []).map(async (secao) => {
                // Buscar pendências da seção (que NÃO têm subsecao_id)
                const { data: pendencias, error: pendError } = await supabase
                    .from('relatorio_pendencias')
                    .select('*')
                    .eq('secao_id', secao.id)
                    .is('subsecao_id', null)
                    .order('ordem', { ascending: true });

                if (pendError) {
                    console.error('❌ Erro ao buscar pendências da seção:', secao.id, pendError);
                }

                console.log(`📋 Seção "${secao.titulo_principal}": ${pendencias?.length || 0} pendências`);

                // Buscar subseções
                const { data: subsecoes, error: subError } = await supabase
                    .from('relatorio_subsecoes')
                    .select('*')
                    .eq('secao_id', secao.id)
                    .order('ordem', { ascending: true });

                if (subError) {
                    console.error('❌ Erro ao buscar subseções:', subError);
                }

                // Para cada subseção, buscar pendências
                const subsecoesCompletas = await Promise.all((subsecoes || []).map(async (sub) => {
                    const { data: subPendencias } = await supabase
                        .from('relatorio_pendencias')
                        .select('*')
                        .eq('subsecao_id', sub.id)
                        .order('ordem', { ascending: true });

                    return {
                        ...sub,
                        pendencias: subPendencias || []
                    };
                }));

                return {
                    ...secao,
                    pendencias: pendencias || [],
                    subsecoes: subsecoesCompletas
                };
            }));

            const resultado = {
                ...relatorio,
                secoes: secoesCompletas
            };

            console.log('✅ getById COMPLETO:', {
                id: resultado.id,
                titulo: resultado.titulo,
                secoes: resultado.secoes?.length || 0,
                totalPendencias: resultado.secoes?.reduce((acc: number, s: any) => acc + (s.pendencias?.length || 0), 0) || 0
            });

            return resultado;
        } catch (err) {
            console.error('❌ Exceção em getById:', err);
            throw err;
        }
    },

    async create(relatorio: Omit<RelatorioPendencias, 'id' | 'created_at' | 'updated_at'>): Promise<RelatorioPendencias> {
        const { data, error } = await supabase
            .from('relatorios_pendencias')
            .insert([relatorio])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar relatório:', error);
            throw error;
        }

        return data;
    },

    async update(id: string, relatorio: Partial<RelatorioPendencias>): Promise<RelatorioPendencias> {
        const { data, error } = await supabase
            .from('relatorios_pendencias')
            .update({ ...relatorio, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar relatório:', error);
            throw error;
        }

        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('relatorios_pendencias')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar relatório:', error);
            throw error;
        }
    },

    // ==================== SEÇÕES ====================
    async createSecao(secao: Omit<RelatorioSecao, 'id' | 'created_at'>): Promise<RelatorioSecao> {
        const { data, error } = await supabase
            .from('relatorio_secoes')
            .insert([secao])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar seção:', error);
            throw error;
        }

        return data;
    },

    async updateSecao(id: string, secao: Partial<RelatorioSecao>): Promise<RelatorioSecao> {
        const { data, error } = await supabase
            .from('relatorio_secoes')
            .update(secao)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar seção:', error);
            throw error;
        }

        return data;
    },

    async deleteSecao(id: string): Promise<void> {
        const { error } = await supabase
            .from('relatorio_secoes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar seção:', error);
            throw error;
        }
    },

    // ==================== SUBSEÇÕES ====================
    async createSubsecao(subsecao: Omit<RelatorioSubsecao, 'id' | 'created_at'>): Promise<RelatorioSubsecao> {
        const { data, error } = await supabase
            .from('relatorio_subsecoes')
            .insert([subsecao])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar subseção:', error);
            throw error;
        }

        return data;
    },

    async updateSubsecao(id: string, subsecao: Partial<RelatorioSubsecao>): Promise<RelatorioSubsecao> {
        const { data, error } = await supabase
            .from('relatorio_subsecoes')
            .update(subsecao)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar subseção:', error);
            throw error;
        }

        return data;
    },

    async deleteSubsecao(id: string): Promise<void> {
        const { error } = await supabase
            .from('relatorio_subsecoes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar subseção:', error);
            throw error;
        }
    },

    // ==================== PENDÊNCIAS ====================
    async createPendencia(pendencia: Omit<RelatorioPendencia, 'id' | 'created_at'>): Promise<RelatorioPendencia> {
        console.log('➕ createPendencia - Dados enviados:', JSON.stringify(pendencia, null, 2));

        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .insert([pendencia])
            .select()
            .single();

        if (error) {
            console.error('❌ Erro ao criar pendência:', error);
            throw error;
        }

        console.log('✅ createPendencia - Dados retornados:', JSON.stringify(data, null, 2));
        return data;
    },

    async updatePendencia(id: string, pendencia: Partial<RelatorioPendencia>): Promise<RelatorioPendencia> {
        console.log('📝 updatePendencia - ID:', id);
        console.log('📝 updatePendencia - Dados enviados:', JSON.stringify(pendencia, null, 2));

        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .update(pendencia)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Erro ao atualizar pendência:', error);
            throw error;
        }

        console.log('✅ updatePendencia - Dados retornados:', JSON.stringify(data, null, 2));
        return data;
    },

    async deletePendencia(id: string): Promise<void> {
        const { error } = await supabase
            .from('relatorio_pendencias')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar pendência:', error);
            throw error;
        }
    },

    // ==================== UPLOAD DE FOTO ====================
    async uploadFoto(file: File, relatorioId: string, pendenciaId: string): Promise<string> {
        console.log('📸 uploadFoto - Iniciando upload');
        console.log('   - Nome do arquivo:', file.name);
        console.log('   - Tamanho:', file.size, 'bytes');
        console.log('   - Tipo:', file.type);
        console.log('   - Relatório ID:', relatorioId);
        console.log('   - Pendência ID:', pendenciaId);

        const fileExt = file.name.split('.').pop();
        const fileName = `${relatorioId}/${pendenciaId}-${Date.now()}.${fileExt}`;
        const filePath = `relatorios-pendencias/${fileName}`;

        console.log('   - Caminho completo:', filePath);

        const { error: uploadError } = await supabase.storage
            .from('fotos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('❌ Erro ao fazer upload da foto:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('fotos')
            .getPublicUrl(filePath);

        console.log('✅ Upload concluído! URL pública:', data.publicUrl);

        return data.publicUrl;
    },
};
