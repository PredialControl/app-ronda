import { supabase } from './supabase';
import { RelatorioPendencias, RelatorioSecao, RelatorioPendencia } from '@/types';

export const relatorioPendenciasService = {
    // ==================== RELATÓRIOS ===================
    async getAll(contratoId: string): Promise<RelatorioPendencias[]> {
        const { data, error } = await supabase
            .from('relatorios_pendencias')
            .select(`
                *,
                secoes:relatorio_secoes(
                    *,
                    pendencias:relatorio_pendencias(*)
                )
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
        const { data, error } = await supabase
            .from('relatorios_pendencias')
            .select(`
                *,
                secoes:relatorio_secoes(
                    *,
                    pendencias:relatorio_pendencias(*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar relatório:', error);
            throw error;
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

    // ==================== PENDÊNCIAS ====================
    async createPendencia(pendencia: Omit<RelatorioPendencia, 'id' | 'created_at'>): Promise<RelatorioPendencia> {
        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .insert([pendencia])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar pendência:', error);
            throw error;
        }

        return data;
    },

    async updatePendencia(id: string, pendencia: Partial<RelatorioPendencia>): Promise<RelatorioPendencia> {
        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .update(pendencia)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar pendência:', error);
            throw error;
        }

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
        const fileExt = file.name.split('.').pop();
        const fileName = `${relatorioId}/${pendenciaId}-${Date.now()}.${fileExt}`;
        const filePath = `relatorios-pendencias/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('fotos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Erro ao fazer upload da foto:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('fotos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },
};
