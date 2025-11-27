import { supabase } from './supabase';
import { ParecerTecnico, ParecerTopico, ParecerImagem } from '@/types';

class ParecerService {
    // ==================== PARECER TÉCNICO ====================

    async getAll(contratoId: string): Promise<ParecerTecnico[]> {
        try {
            const { data, error } = await supabase
                .from('pareceres_tecnicos')
                .select(`
          *,
          topicos:parecer_topicos(
            *,
            imagens:parecer_imagens(*)
          )
        `)
                .eq('contrato_id', contratoId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar pareceres:', error);
            throw error;
        }
    }

    async getById(id: string): Promise<ParecerTecnico | null> {
        try {
            const { data, error } = await supabase
                .from('pareceres_tecnicos')
                .select(`
          *,
          topicos:parecer_topicos(
            *,
            imagens:parecer_imagens(*)
          )
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar parecer:', error);
            throw error;
        }
    }

    async create(parecer: Omit<ParecerTecnico, 'id' | 'created_at' | 'updated_at'>): Promise<ParecerTecnico> {
        try {
            const { data, error } = await supabase
                .from('pareceres_tecnicos')
                .insert([parecer])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar parecer:', error);
            throw error;
        }
    }

    async update(id: string, parecer: Partial<ParecerTecnico>): Promise<ParecerTecnico> {
        try {
            const { data, error } = await supabase
                .from('pareceres_tecnicos')
                .update({ ...parecer, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar parecer:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('pareceres_tecnicos')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao deletar parecer:', error);
            throw error;
        }
    }

    // ==================== TÓPICOS ====================

    async createTopico(topico: Omit<ParecerTopico, 'id' | 'created_at'>): Promise<ParecerTopico> {
        try {
            const { data, error } = await supabase
                .from('parecer_topicos')
                .insert([topico])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar tópico:', error);
            throw error;
        }
    }

    async updateTopico(id: string, topico: Partial<ParecerTopico>): Promise<ParecerTopico> {
        try {
            const { data, error } = await supabase
                .from('parecer_topicos')
                .update(topico)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar tópico:', error);
            throw error;
        }
    }

    async deleteTopico(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('parecer_topicos')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao deletar tópico:', error);
            throw error;
        }
    }

    async reorderTopicos(updates: { id: string; ordem: number }[]): Promise<void> {
        try {
            const promises = updates.map(({ id, ordem }) =>
                supabase
                    .from('parecer_topicos')
                    .update({ ordem })
                    .eq('id', id)
            );

            await Promise.all(promises);
        } catch (error) {
            console.error('Erro ao reordenar tópicos:', error);
            throw error;
        }
    }

    // ==================== IMAGENS ====================

    async createImagem(imagem: Omit<ParecerImagem, 'id' | 'created_at'>): Promise<ParecerImagem> {
        try {
            const { data, error } = await supabase
                .from('parecer_imagens')
                .insert([imagem])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar imagem:', error);
            throw error;
        }
    }

    async updateImagem(id: string, imagem: Partial<ParecerImagem>): Promise<ParecerImagem> {
        try {
            const { data, error } = await supabase
                .from('parecer_imagens')
                .update(imagem)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar imagem:', error);
            throw error;
        }
    }

    async deleteImagem(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('parecer_imagens')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao deletar imagem:', error);
            throw error;
        }
    }

    async reorderImagens(updates: { id: string; ordem: number }[]): Promise<void> {
        try {
            const promises = updates.map(({ id, ordem }) =>
                supabase
                    .from('parecer_imagens')
                    .update({ ordem })
                    .eq('id', id)
            );

            await Promise.all(promises);
        } catch (error) {
            console.error('Erro ao reordenar imagens:', error);
            throw error;
        }
    }

    // ==================== UPLOAD DE IMAGENS ====================

    async uploadImagem(file: File, parecerId: string, topicoId: string): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${parecerId}/${topicoId}/${Date.now()}.${fileExt}`;
            const filePath = `parecer-imagens/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('app-ronda')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('app-ronda')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            throw error;
        }
    }
}

export const parecerService = new ParecerService();
