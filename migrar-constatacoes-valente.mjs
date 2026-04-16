// Script para migrar constatações do Valente para pendências
// Relatório: COMISSIONAMENTO (5d59e2b0-a1e0-4484-b369-0532b4e8a34a)
// Seção origem: 8ae3d767-9fdf-40ef-8096-295754518ab9

const SUPABASE_URL = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const RELATORIO_ID = '5d59e2b0-a1e0-4484-b369-0532b4e8a34a';
const SECAO_ID = '8ae3d767-9fdf-40ef-8096-295754518ab9';

async function fetchApi(endpoint, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        ...options,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': options.method === 'POST' ? 'return=representation' : undefined,
            ...options.headers
        }
    });

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function migrar() {
    console.log('🔍 Buscando constatações do relatório de Comissionamento do Valente...\n');

    // 1. Buscar todas as subseções do tipo CONSTATACAO
    const subsecoes = await fetchApi(
        `relatorio_subsecoes?secao_id=eq.${SECAO_ID}&tipo=eq.CONSTATACAO&order=ordem`
    );

    console.log(`📋 Encontradas ${subsecoes.length} constatações!\n`);

    // 2. Processar cada constatação e extrair dados
    const pendenciasParaCriar = [];

    for (const sub of subsecoes) {
        const fotos = sub.fotos_constatacao || [];
        let descricaoTexto = sub.descricao_constatacao || '';
        let legendas = [];

        // Tentar parsear legendas do JSON
        try {
            if (descricaoTexto.startsWith('{')) {
                const parsed = JSON.parse(descricaoTexto);
                descricaoTexto = parsed.text || '';
                legendas = parsed.legendas || [];
            }
        } catch (e) {
            // Não é JSON, usar como texto simples
        }

        // Para cada foto, criar uma pendência
        for (let i = 0; i < fotos.length; i++) {
            const legenda = legendas[i] || '';
            const local = legenda || sub.titulo || `Item ${pendenciasParaCriar.length + 1}`;
            const descricao = descricaoTexto || legenda || 'Constatação';

            pendenciasParaCriar.push({
                foto_url: fotos[i],
                local: local.substring(0, 200), // limitar tamanho
                descricao: descricao.substring(0, 500),
                subsecao_origem: sub.titulo
            });

            console.log(`  ${pendenciasParaCriar.length}. ${local.substring(0, 50)}...`);
        }
    }

    console.log(`\n📊 Total: ${pendenciasParaCriar.length} pendências a criar\n`);

    // 3. Atualizar a seção para NÃO ter subseções (pendências diretas)
    console.log('🔧 Atualizando seção para receber pendências diretas...');

    await fetchApi(
        `relatorio_secoes?id=eq.${SECAO_ID}`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                tem_subsecoes: false,
                titulo_principal: 'PENDÊNCIAS DE COMISSIONAMENTO'
            })
        }
    );

    // 4. Criar as pendências na seção
    console.log('📝 Criando pendências...\n');

    let criadas = 0;
    for (let i = 0; i < pendenciasParaCriar.length; i++) {
        const p = pendenciasParaCriar[i];

        const result = await fetchApi('relatorio_pendencias', {
            method: 'POST',
            body: JSON.stringify({
                secao_id: SECAO_ID,
                subsecao_id: null, // pendência direta na seção
                ordem: i,
                local: p.local,
                descricao: p.descricao,
                foto_url: p.foto_url,
                foto_depois_url: null
            })
        });

        if (result && !result.code) {
            criadas++;
            console.log(`  ✅ ${i + 1}/${pendenciasParaCriar.length} - ${p.local.substring(0, 40)}...`);
        } else {
            console.log(`  ❌ ${i + 1}/${pendenciasParaCriar.length} - Erro:`, result);
        }
    }

    // 5. Deletar as subseções de constatação antigas
    console.log('\n🗑️ Removendo constatações antigas...');

    for (const sub of subsecoes) {
        await fetchApi(
            `relatorio_subsecoes?id=eq.${sub.id}`,
            { method: 'DELETE' }
        );
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`   - ${criadas} pendências criadas`);
    console.log(`   - ${subsecoes.length} constatações removidas`);
}

migrar().catch(console.error);
