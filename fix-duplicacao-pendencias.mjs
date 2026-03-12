import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (mesma do arquivo supabase.ts)
const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicates() {
  console.log('🔍 1. Identificando pendências duplicadas...');

  // Buscar pendências duplicadas
  const { data: duplicadas, error: errorBusca } = await supabase
    .from('relatorio_pendencias')
    .select('id, local, descricao, secao_id, subsecao_id')
    .not('subsecao_id', 'is', null)
    .not('secao_id', 'is', null);

  if (errorBusca) {
    console.error('❌ Erro ao buscar:', errorBusca);
    return;
  }

  console.log('📊 Total de pendências duplicadas:', duplicadas?.length || 0);

  if (duplicadas && duplicadas.length > 0) {
    console.log('📋 Pendências com problema:');
    duplicadas.forEach(p => {
      console.log('  -', p.local || p.descricao?.substring(0, 50), '(ID:', p.id + ')');
    });

    console.log('\n🔧 2. Corrigindo (removendo secao_id das pendências de subseções)...');

    const { error: errorUpdate } = await supabase
      .from('relatorio_pendencias')
      .update({ secao_id: null })
      .not('subsecao_id', 'is', null)
      .not('secao_id', 'is', null);

    if (errorUpdate) {
      console.error('❌ Erro ao atualizar:', errorUpdate);
      return;
    }

    console.log('✅ Pendências corrigidas com sucesso!');
  } else {
    console.log('✅ Nenhuma pendência duplicada encontrada!');
  }

  console.log('\n📊 3. Verificando resultado final...');

  // Contar tipos de pendências
  const { data: todas } = await supabase
    .from('relatorio_pendencias')
    .select('id, secao_id, subsecao_id');

  if (todas) {
    const diretasSecao = todas.filter(p => p.secao_id && !p.subsecao_id).length;
    const emSubsecao = todas.filter(p => p.subsecao_id && !p.secao_id).length;
    const duplicadas2 = todas.filter(p => p.secao_id && p.subsecao_id).length;

    console.log('  - Total de pendências:', todas.length);
    console.log('  - Pendências diretas na seção:', diretasSecao);
    console.log('  - Pendências em subseções:', emSubsecao);
    console.log('  - Pendências DUPLICADAS:', duplicadas2, duplicadas2 === 0 ? '✅' : '⚠️');
  }
}

fixDuplicates().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
