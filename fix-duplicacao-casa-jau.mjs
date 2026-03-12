import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (mesma do arquivo supabase.ts)
const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCasaJauDuplicates() {
  console.log('🔍 1. Listando TODOS os relatórios para você escolher...');

  // Buscar TODOS os relatórios
  const { data: todosRelatorios, error: errorTodos } = await supabase
    .from('relatorios_pendencias')
    .select('id, titulo, contrato_id')
    .order('created_at', { ascending: false });

  if (errorTodos) {
    console.error('❌ Erro ao buscar relatórios:', errorTodos);
    return;
  }

  console.log('\n📋 TODOS OS RELATÓRIOS:');
  todosRelatorios?.forEach((r, i) => console.log(`  ${i + 1}. ${r.titulo} (ID: ${r.id})`));

  // Buscar relatórios de "Áreas Técnicas"
  const { data: relatorios, error: errorRelatorios } = await supabase
    .from('relatorios_pendencias')
    .select('id, titulo')
    .ilike('titulo', '%áreas técnicas%');

  if (errorRelatorios) {
    console.error('❌ Erro ao buscar relatórios:', errorRelatorios);
    return;
  }

  console.log('\n📋 Relatórios de "Áreas Técnicas":', relatorios?.length || 0);
  relatorios?.forEach(r => console.log('  -', r.titulo, '(ID:', r.id + ')'));

  if (!relatorios || relatorios.length === 0) {
    console.log('⚠️ Nenhum relatório encontrado com "jau" ou "jardins"');
    return;
  }

  const relatorioIds = relatorios.map(r => r.id);

  console.log('\n🔍 2. Buscando seções desses relatórios...');

  // Buscar todas as seções desses relatórios
  const { data: secoes, error: errorSecoes } = await supabase
    .from('relatorio_secoes')
    .select('id, relatorio_id, titulo_principal, tem_subsecoes')
    .in('relatorio_id', relatorioIds);

  if (errorSecoes) {
    console.error('❌ Erro ao buscar seções:', errorSecoes);
    return;
  }

  console.log('📂 Total de seções:', secoes?.length || 0);

  // Filtrar apenas seções que TÊM subseções
  const secoesComSubsecoes = secoes?.filter(s => s.tem_subsecoes === true) || [];
  console.log('📂 Seções COM subseções:', secoesComSubsecoes.length);

  if (secoesComSubsecoes.length === 0) {
    console.log('⚠️ Nenhuma seção com subseções encontrada');
    return;
  }

  const secaoIds = secoesComSubsecoes.map(s => s.id);

  console.log('\n🔍 3. Buscando pendências duplicadas (que têm secao_id E subsecao_id)...');

  // Buscar pendências que estão duplicadas (têm secao_id E subsecao_id)
  const { data: duplicadas, error: errorDuplicadas } = await supabase
    .from('relatorio_pendencias')
    .select('id, local, descricao, secao_id, subsecao_id')
    .in('secao_id', secaoIds)
    .not('subsecao_id', 'is', null);

  if (errorDuplicadas) {
    console.error('❌ Erro ao buscar pendências duplicadas:', errorDuplicadas);
    return;
  }

  console.log('📊 Total de pendências duplicadas encontradas:', duplicadas?.length || 0);

  if (!duplicadas || duplicadas.length === 0) {
    console.log('✅ Nenhuma pendência duplicada encontrada!');
    return;
  }

  console.log('\n📋 Mostrando primeiras 20 pendências duplicadas:');
  duplicadas.slice(0, 20).forEach(p => {
    console.log('  -', p.local || p.descricao?.substring(0, 50), '(ID:', p.id + ')');
  });

  console.log('\n🔧 4. DELETANDO pendências duplicadas da SEÇÃO (mantendo apenas nas subseções)...');
  console.log('⚠️  IMPORTANTE: As pendências serão REMOVIDAS da seção, mas continuarão nas subseções!');

  const ids = duplicadas.map(p => p.id);

  // Vou buscar as subseções para criar novas pendências sem secao_id
  const { data: subsecoes, error: errorSubsecoes } = await supabase
    .from('relatorio_subsecoes')
    .select('id, secao_id')
    .in('id', duplicadas.map(p => p.subsecao_id).filter(Boolean));

  if (errorSubsecoes) {
    console.error('❌ Erro ao buscar subseções:', errorSubsecoes);
    return;
  }

  console.log('📂 Total de subseções encontradas:', subsecoes?.length || 0);

  // Criar um mapa subsecao_id -> secao_id
  const subsecaoMap = new Map();
  subsecoes?.forEach(s => subsecaoMap.set(s.id, s.secao_id));

  // Agora vamos atualizar cada pendência individualmente
  // Mantendo o secao_id da subseção (não da seção direta)
  let corrigidas = 0;
  for (const pend of duplicadas) {
    if (pend.subsecao_id) {
      const secaoIdDaSubsecao = subsecaoMap.get(pend.subsecao_id);

      // Se a pendência está com secao_id diferente da subseção, corrigir
      if (secaoIdDaSubsecao && pend.secao_id !== secaoIdDaSubsecao) {
        const { error } = await supabase
          .from('relatorio_pendencias')
          .update({ secao_id: secaoIdDaSubsecao })
          .eq('id', pend.id);

        if (!error) {
          corrigidas++;
        }
      }
    }
  }

  console.log('✅ Pendências corrigidas com sucesso!');
  console.log(`   Total corrigido: ${corrigidas} pendências`);

  console.log('\n📊 5. Verificação final...');

  // Verificar se ainda existem duplicadas nesses relatórios
  const { data: verificacao } = await supabase
    .from('relatorio_pendencias')
    .select('id, secao_id, subsecao_id')
    .in('secao_id', secaoIds)
    .not('subsecao_id', 'is', null);

  console.log('  - Pendências ainda duplicadas:', verificacao?.length || 0);

  if (verificacao && verificacao.length === 0) {
    console.log('  ✅ Todas as duplicações foram removidas!');
  }
}

fixCasaJauDuplicates().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
