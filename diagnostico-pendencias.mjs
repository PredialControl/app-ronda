import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticar() {
  console.log('\n🔍 DIAGNÓSTICO DE PENDÊNCIAS PERDIDAS\n');
  console.log('='.repeat(70));

  try {
    // 1. Buscar contrato "Nik Sunset"
    console.log('\n1️⃣ Buscando contrato "Nik Sunset Paulista"...\n');
    const { data: contratos, error: contError } = await supabase
      .from('contratos')
      .select('id, nome')
      .ilike('nome', '%Nik%');

    if (contError) {
      console.error('❌ Erro:', contError);
      return;
    }

    console.log(`📋 Encontrados ${contratos?.length || 0} contratos:\n`);
    contratos?.forEach(c => {
      console.log(`   📄 ${c.nome}`);
      console.log(`      ID: ${c.id}\n`);
    });

    const contratoNik = contratos?.find(c =>
      c.nome.toLowerCase().includes('nik') ||
      c.nome.toLowerCase().includes('sunset')
    );

    if (!contratoNik) {
      console.log('❌ Contrato "Nik Sunset" não encontrado!');
      return;
    }

    console.log(`✅ Contrato encontrado: ${contratoNik.nome}\n`);

    // 2. Buscar relatórios desse contrato
    console.log('\n' + '='.repeat(70));
    console.log('\n2️⃣ Buscando relatórios do contrato...\n');

    const { data: relatorios, error: relError } = await supabase
      .from('relatorios_pendencias')
      .select('id, titulo, created_at, updated_at')
      .eq('contrato_id', contratoNik.id)
      .order('created_at', { ascending: false });

    if (relError) {
      console.error('❌ Erro:', relError);
      return;
    }

    console.log(`📋 Encontrados ${relatorios?.length || 0} relatórios:\n`);
    relatorios?.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.titulo}`);
      console.log(`      ID: ${r.id}`);
      console.log(`      Criado: ${new Date(r.created_at).toLocaleString('pt-BR')}`);
      console.log(`      Atualizado: ${new Date(r.updated_at).toLocaleString('pt-BR')}\n`);
    });

    // Buscar o relatório de áreas molhadas
    const relatorioMolhadas = relatorios?.find(r =>
      r.titulo.toLowerCase().includes('molhadas') ||
      r.titulo.toLowerCase().includes('área')
    );

    if (!relatorioMolhadas && relatorios?.length === 0) {
      console.log('❌ Nenhum relatório encontrado!');
      return;
    }

    const relatorio = relatorioMolhadas || relatorios?.[0];

    console.log('\n' + '='.repeat(70));
    console.log(`\n3️⃣ Analisando relatório: ${relatorio.titulo}\n`);

    // 3. Buscar seções
    const { data: secoes, error: secError } = await supabase
      .from('relatorio_secoes')
      .select('id, titulo_principal, subtitulo, ordem')
      .eq('relatorio_id', relatorio.id)
      .order('ordem');

    if (secError) {
      console.error('❌ Erro ao buscar seções:', secError);
      return;
    }

    console.log(`📑 Total de seções: ${secoes?.length || 0}\n`);

    let totalPendencias = 0;
    let pendenciasSemSubsecao = 0;
    let pendenciasComSubsecao = 0;
    const detalhesSubsecoes = [];

    // 4. Para cada seção, analisar pendências
    for (const secao of secoes || []) {
      const { data: pendencias } = await supabase
        .from('relatorio_pendencias')
        .select('id, local, descricao, ordem, subsecao_id, created_at')
        .eq('secao_id', secao.id)
        .order('ordem');

      const pendDiretas = pendencias?.filter(p => !p.subsecao_id) || [];
      const pendSubsecoes = pendencias?.filter(p => p.subsecao_id) || [];

      totalPendencias += (pendencias?.length || 0);
      pendenciasSemSubsecao += pendDiretas.length;
      pendenciasComSubsecao += pendSubsecoes.length;

      console.log(`   📌 Seção ${secao.ordem}: ${secao.titulo_principal}`);
      if (secao.subtitulo) {
        console.log(`      Subtítulo: ${secao.subtitulo}`);
      }
      console.log(`      ├─ Pendências diretas (VISÍVEIS): ${pendDiretas.length}`);
      console.log(`      └─ Pendências em subseções (OCULTAS): ${pendSubsecoes.length}`);

      if (pendSubsecoes.length > 0) {
        detalhesSubsecoes.push({
          secao: secao.titulo_principal,
          secaoId: secao.id,
          pendencias: pendSubsecoes
        });
      }
      console.log('');
    }

    // 5. Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO FINAL\n');
    console.log(`   Total no banco de dados: ${totalPendencias}`);
    console.log(`   Visíveis no app: ${pendenciasSemSubsecao}`);
    console.log(`   OCULTAS pelo filtro: ${pendenciasComSubsecao}\n`);

    if (pendenciasComSubsecao > 0) {
      console.log('⚠️ PROBLEMA ENCONTRADO!\n');
      console.log(`   Há ${pendenciasComSubsecao} pendências sendo FILTRADAS pelo código!`);
      console.log(`   Elas NÃO foram deletadas, apenas estão OCULTAS.\n`);
      console.log('📍 Localização do problema:');
      console.log('   Arquivo: src/lib/relatorioPendenciasService.ts');
      console.log('   Linhas: 33 e 84');
      console.log('   Código: secao.pendencias.filter((p) => !p.subsecao_id)\n');

      console.log('🔧 SOLUÇÃO DISPONÍVEL:');
      console.log('   Vou remover o subsecao_id dessas pendências para torná-las visíveis\n');

      if (detalhesSubsecoes.length > 0) {
        console.log('📋 DETALHES DAS PENDÊNCIAS OCULTAS:\n');
        for (const det of detalhesSubsecoes) {
          console.log(`   🏗️ Seção: ${det.secao} (${det.pendencias.length} pendências ocultas)`);
          det.pendencias.forEach((p, idx) => {
            console.log(`      ${idx + 1}. ${p.local.substring(0, 60)}${p.local.length > 60 ? '...' : ''}`);
          });
          console.log('');
        }
      }

      // Criar lista de IDs para correção
      const idsParaCorrigir = detalhesSubsecoes.flatMap(d => d.pendencias.map(p => p.id));
      console.log(`📝 Total de pendências para recuperar: ${idsParaCorrigir.length}`);
      console.log(`📝 IDs: ${idsParaCorrigir.slice(0, 3).join(', ')}... (mostrando 3 de ${idsParaCorrigir.length})\n`);

    } else if (totalPendencias === 32) {
      console.log('❌ DADOS FORAM DELETADOS!\n');
      console.log('   As 51 pendências foram PERMANENTEMENTE removidas do banco.');
      console.log('   Será necessário restaurar do backup do Supabase.\n');
    } else {
      console.log('✅ Tudo OK!');
      console.log('   Não há pendências sendo filtradas.\n');
    }

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error);
  }

  console.log('='.repeat(70));
  console.log('\n✅ Diagnóstico concluído!\n');
}

diagnosticar();
