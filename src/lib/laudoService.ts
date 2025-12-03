import { supabase } from './supabase';

export interface Laudo {
    id: string;
    contrato_id: string;
    titulo: string;
    status: 'em-dia' | 'proximo-vencimento' | 'vencidos';
    data_vencimento?: string;
    data_emissao?: string;
    periodicidade?: string;
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
}

const DEFAULT_LAUDOS = [
    { titulo: 'Auto de Vistoria do Corpo de Bombeiros (AVCB)', periodicidade: 'Periódico (Variável)' },
    { titulo: 'Certificado de Pressurização dos Extintores', periodicidade: 'Anual' },
    { titulo: 'Recarga de Extintores', periodicidade: 'Anual' },
    { titulo: 'Teste Hidrostático de Extintores', periodicidade: 'A cada 5 anos' },
    { titulo: 'Certificado Teste Hidrostático das Mangueiras', periodicidade: 'A cada 5 anos' },
    { titulo: 'Laudo de Estanqueidade da Rede de Gás', periodicidade: 'Anual' },
    { titulo: 'Relatório de Inspeção Anual dos Elevadores (RIA)', periodicidade: 'Anual' },
    { titulo: 'Certificado de Funcionamento do SDAI', periodicidade: 'Anual' },
    { titulo: 'Certificado de Funcionamento Bombas de Incêndio', periodicidade: 'Anual' },
    { titulo: 'Certificado Desinsetização e Desratização', periodicidade: 'Semestral' },
    { titulo: 'Laudo de SPDA', periodicidade: 'A cada 3 anos' },
    { titulo: 'Certificado de Limpeza dos Reservatórios de Água Potável', periodicidade: 'Semestral' },
    { titulo: 'Análise de Potabilidade', periodicidade: 'Semestral' },
    { titulo: 'Relatório de Limpeza dos Poços e Ramais de Esgoto e Gordura', periodicidade: 'Semestral' },
    { titulo: 'PMOC', periodicidade: 'Anual' },
    { titulo: 'Análise de Qualidade do Ar', periodicidade: 'Semestral' },
    { titulo: 'Certificado de Manutenção das Válvulas Redutoras de Pressão (VRPs)', periodicidade: 'Anual' },
    { titulo: 'Certificado de Funcionamento dos Sistemas de Aquecimento de Água', periodicidade: 'Anual' },
    { titulo: 'Ensaio de Arrancamento dos Pontos de Ancoragem', periodicidade: 'A cada 5 anos' },
];

// Helper para localStorage
const getLocalLaudos = (): Laudo[] => {
    try {
        const data = localStorage.getItem('appRonda_laudos');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveLocalLaudos = (laudos: Laudo[]) => {
    try {
        localStorage.setItem('appRonda_laudos', JSON.stringify(laudos));
    } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
    }
};

export const laudoService = {
    // Buscar laudos por contrato
    async getByContrato(contratoId: string): Promise<Laudo[]> {
        try {
            const { data, error } = await supabase
                .from('laudos')
                .select('*')
                .eq('contrato_id', contratoId)
                .order('titulo');

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.warn('⚠️ Erro ao buscar laudos no Supabase (usando fallback local):', error.message);

            // Fallback LocalStorage
            const localLaudos = getLocalLaudos();
            const laudosDoContrato = localLaudos.filter(l => l.contrato_id === contratoId);

            // Se não tiver localmente também, inicializa defaults na memória/local
            if (laudosDoContrato.length === 0) {
                return await this.initializeDefaults(contratoId, true);
            }

            return laudosDoContrato.sort((a, b) => a.titulo.localeCompare(b.titulo));
        }
    },

    // Inicializar laudos padrão para um contrato
    async initializeDefaults(contratoId: string, forceLocal = false): Promise<Laudo[]> {
        // Data de vencimento ontem (para ficar vencido)
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const dataVencimento = ontem.toISOString().split('T')[0];

        const laudosParaCriar = DEFAULT_LAUDOS.map(def => ({
            contrato_id: contratoId,
            titulo: def.titulo,
            periodicidade: def.periodicidade,
            status: 'vencidos' as const,
            data_vencimento: dataVencimento,
            // Data de emissão vazia ou antiga? Vamos deixar vazia por enquanto ou igual vencimento - 1 ano
            // data_emissao: ...
        }));

        if (!forceLocal) {
            try {
                const { data, error } = await supabase
                    .from('laudos')
                    .insert(laudosParaCriar)
                    .select();

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.warn('⚠️ Falha ao criar defaults no banco, usando local:', error);
            }
        }

        // Fallback Local: Criar IDs locais e salvar
        const novosLaudosLocais: Laudo[] = laudosParaCriar.map(l => ({
            ...l,
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        const todosLaudos = getLocalLaudos();
        saveLocalLaudos([...todosLaudos, ...novosLaudosLocais]);

        return novosLaudosLocais;
    },

    // Criar novo laudo
    async create(laudo: Omit<Laudo, 'id' | 'created_at' | 'updated_at'>): Promise<Laudo | null> {
        try {
            const { data, error } = await supabase
                .from('laudos')
                .insert([laudo])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('⚠️ Erro ao criar laudo no banco, salvando localmente:', error);

            const novoLaudo: Laudo = {
                ...laudo,
                id: `local-${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const todos = getLocalLaudos();
            saveLocalLaudos([...todos, novoLaudo]);
            return novoLaudo;
        }
    },

    // Atualizar laudo
    async update(id: string, updates: Partial<Laudo>): Promise<Laudo | null> {
        try {
            // Se for ID local, nem tenta ir no banco
            if (id.startsWith('local-')) {
                throw new Error('ID local');
            }

            const { data, error } = await supabase
                .from('laudos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('⚠️ Erro ao atualizar laudo (usando local):', error);

            const todos = getLocalLaudos();
            const index = todos.findIndex(l => l.id === id);

            if (index >= 0) {
                const atualizado = { ...todos[index], ...updates, updated_at: new Date().toISOString() };
                todos[index] = atualizado;
                saveLocalLaudos(todos);
                return atualizado;
            }
            return null;
        }
    },

    // Deletar laudo
    async delete(id: string): Promise<boolean> {
        try {
            if (id.startsWith('local-')) {
                throw new Error('ID local');
            }

            const { error } = await supabase
                .from('laudos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.warn('⚠️ Erro ao deletar laudo (usando local):', error);

            const todos = getLocalLaudos();
            const novos = todos.filter(l => l.id !== id);
            if (novos.length !== todos.length) {
                saveLocalLaudos(novos);
                return true;
            }
            return false;
        }
    },

    // Resetar laudos de um contrato (apagar tudo e recriar padrão)
    async resetToDefaults(contratoId: string): Promise<Laudo[]> {
        try {
            // 1. Tentar deletar do banco
            await supabase.from('laudos').delete().eq('contrato_id', contratoId);

            // 2. Deletar local
            const todos = getLocalLaudos();
            const filtrados = todos.filter(l => l.contrato_id !== contratoId);
            saveLocalLaudos(filtrados);

            // 3. Inicializar padrões
            return await this.initializeDefaults(contratoId);
        } catch (error) {
            console.error('Erro ao resetar laudos:', error);
            // Mesmo com erro no banco, tenta resetar local
            return await this.initializeDefaults(contratoId, true);
        }
    }
};
