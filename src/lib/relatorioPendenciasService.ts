import { supabase } from './supabase';
import { RelatorioPendencias, RelatorioSecao, RelatorioPendencia, RelatorioSubsecao } from '@/types';

export const relatorioPendenciasService = {
    // ==================== RELATÓRIOS ===================
    // Query simplificada para lista - carrega apenas dados básicos + contagem
    async getAll(contratoId: string): Promise<RelatorioPendencias[]> {
        const { data, error } = await supabase
            .from('relatorios_pendencias')
            .select(`
                id,
                contrato_id,
                titulo,
                capa_url,
                created_at,
                updated_at
            `)
            .eq('contrato_id', contratoId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar relatórios:', error);
            throw error;
        }

        return data || [];
    },

    async getById(id: string): Promise<RelatorioPendencias | null> {
        console.log('🔍 getById - Buscando relatório:', id);

        const { data, error } = await supabase
            .from('relatorios_pendencias')
            .select(`
                *,
                secoes:relatorio_secoes(
                    *,
                    pendencias:relatorio_pendencias(*),
                    subsecoes:relatorio_subsecoes(
                        *,
                        pendencias:relatorio_pendencias(*)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('❌ Erro ao buscar relatório:', error);
            throw error;
        }

        console.log('✅ getById - Dados brutos do Supabase:', data);

        // Ordenar seções, subseções e pendências, e FILTRAR pendências duplicadas
        if (data && data.secoes) {
            data.secoes.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
            data.secoes.forEach((secao: any) => {
                if (secao.pendencias) {
                    // ⚠️ FIX DUPLICAÇÃO: Filtrar pendências que têm subsecao_id
                    // Essas devem aparecer APENAS nas subseções, não na seção principal
                    secao.pendencias = secao.pendencias.filter((p: any) => !p.subsecao_id);
                    secao.pendencias.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
                }

                if (secao.subsecoes) {
                    secao.subsecoes.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
                    secao.subsecoes.forEach((sub: any) => {
                        if (sub.pendencias) {
                            sub.pendencias.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
                        }
                    });
                }
            });
        }

        return data;
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
