import { supabase } from './supabase';

/**
 * TESTE DE DIAGNÓSTICO DO SUPABASE
 * Execute esta função no console do navegador para testar a conexão
 */
export async function testarSupabasePendencias() {
    console.log('🔍 INICIANDO DIAGNÓSTICO DO SUPABASE...\n');

    // Teste 1: Verificar conexão básica
    console.log('1️⃣ Testando conexão com Supabase...');
    try {
        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Erro ao conectar:', error);
        } else {
            console.log('✅ Conexão OK! Total de registros:', data);
        }
    } catch (e) {
        console.error('❌ Exceção:', e);
    }

    // Teste 2: Verificar colunas da tabela
    console.log('\n2️⃣ Testando SELECT com todas as colunas...');
    try {
        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .select('id, local, descricao, foto_url, foto_depois_url')
            .limit(1);

        if (error) {
            console.error('❌ Erro no SELECT:', error);
        } else {
            console.log('✅ SELECT OK! Estrutura:', data);
        }
    } catch (e) {
        console.error('❌ Exceção:', e);
    }

    // Teste 3: Tentar INSERT
    console.log('\n3️⃣ Testando INSERT...');
    try {
        const testData = {
            secao_id: '00000000-0000-0000-0000-000000000000', // UUID fake para teste
            local: 'TESTE DIAGNÓSTICO',
            descricao: 'Teste de inserção',
            foto_url: null,
            foto_depois_url: 'https://exemplo.com/teste.jpg',
            ordem: 999,
        };

        const { data, error } = await supabase
            .from('relatorio_pendencias')
            .insert([testData])
            .select();

        if (error) {
            console.error('❌ Erro no INSERT:', error);
            console.error('   Detalhes:', error.message);
            console.error('   Código:', error.code);
        } else {
            console.log('✅ INSERT OK! Dados inseridos:', data);

            // Limpar o teste
            if (data && data.length > 0) {
                const { error: delError } = await supabase
                    .from('relatorio_pendencias')
                    .delete()
                    .eq('id', data[0].id);

                if (delError) {
                    console.error('⚠️ Erro ao deletar registro de teste:', delError);
                } else {
                    console.log('🧹 Registro de teste deletado');
                }
            }
        }
    } catch (e) {
        console.error('❌ Exceção:', e);
    }

    // Teste 4: Verificar bucket de fotos
    console.log('\n4️⃣ Testando bucket de fotos...');
    try {
        const { data, error } = await supabase
            .storage
            .from('fotos')
            .list('relatorios-pendencias', { limit: 5 });

        if (error) {
            console.error('❌ Erro ao acessar bucket:', error);
        } else {
            console.log('✅ Bucket OK! Arquivos encontrados:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('   Exemplos:', data.slice(0, 3).map(f => f.name));
            }
        }
    } catch (e) {
        console.error('❌ Exceção:', e);
    }

    // Teste 5: Tentar upload de foto teste
    console.log('\n5️⃣ Testando upload de foto...');
    try {
        // Criar um arquivo blob de teste (1x1 pixel PNG transparente)
        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const blob = await fetch(`data:image/png;base64,${base64}`).then(r => r.blob());
        const testFile = new File([blob], 'test.png', { type: 'image/png' });

        const testPath = `relatorios-pendencias/TESTE-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('fotos')
            .upload(testPath, testFile);

        if (uploadError) {
            console.error('❌ Erro no upload:', uploadError);
        } else {
            console.log('✅ Upload OK!');

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from('fotos')
                .getPublicUrl(testPath);

            console.log('   URL pública:', urlData.publicUrl);

            // Limpar o arquivo de teste
            const { error: delError } = await supabase.storage
                .from('fotos')
                .remove([testPath]);

            if (delError) {
                console.error('⚠️ Erro ao deletar arquivo de teste:', delError);
            } else {
                console.log('🧹 Arquivo de teste deletado');
            }
        }
    } catch (e) {
        console.error('❌ Exceção:', e);
    }

    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!\n');
}

// Exportar para uso global no console
if (typeof window !== 'undefined') {
    (window as any).testarSupabasePendencias = testarSupabasePendencias;
}
