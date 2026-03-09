const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigar() {
  console.log('\n🔍 INVESTIGAÇÃO DE PENDÊNCIAS PERDIDAS\n');
  console.log('=' .repeat(60));

  try {
    // 1. Buscar relatórios que contenham "Nik Sunset" no título
    console.log('\n1️⃣ Buscando relatórios com "Nik Sunset"...\n');
    const { data: relatorios, error: relError } = await supabase
      .from('relatorios_pendencias')
      .select('id, titulo, created_at, updated_at')
      .ilike('titulo', '%Nik Sunset%');

    if (relError) {
      console.error('❌ Erro ao buscar relatórios:', relError);
      return;
    }

    console.log(`📋 Encontrados ${relatorios?.length || 0} relatórios:`);
    relatorios?.forEach(r => {
      console.log(`   - [${r.id}] ${r.titulo}`);
      console.log(`     Criado: ${new Date(r.created_at).toLocaleString()}`);
      console.log(`     Atualizado: ${new Date(r.updated_at).toLocaleString()}\n`);
    });

    if (!relatorios || relatorios.length === 0) {
      console.log('⚠️ Nenhum relatório encontrado com "Nik Sunset"');
      return;
    }

    // 2. Para cada relatório, contar pendências
    for (const relatorio of relatorios) {
      console.log('\n' + '='.repeat(60));
      console.log(`\n2️⃣ Analisando relatório: ${relatorio.titulo}\n`);

      // Buscar seções
      const { data: secoes, error: secError } = await supabase
        .from('relatorio_secoes')
        .select('id, titulo_principal, subtitulo, ordem')
        .eq('relatorio_id', relatorio.id)
        .order('ordem');

      if (secError) {
        console.error('❌ Erro ao buscar seções:', secError);
        continue;
      }

      console.log(`📑 Seções: ${secoes?.length || 0}`);

      let totalPendencias = 0;
      let pendenciasSemSubsecao = 0;
      let pendenciasComSubsecao = 0;

      // Para cada seção, contar pendências
      for (const secao of secoes || []) {
        // Buscar subseções
        const { data: subsecoes } = await supabase
          .from('relatorio_subsecoes')
          .select('id, titulo, ordem')
          .eq('secao_id', secao.id)
          .order('ordem');

        // Buscar pendências da seção
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

        console.log(`\n   📌 Seção [${secao.ordem}]: ${secao.titulo_principal}`);
        if (secao.subtitulo) {
          console.log(`      Subtítulo: ${secao.subtitulo}`);
        }
        console.log(`      Subseções: ${subsecoes?.length || 0}`);
        console.log(`      Pendências diretas: ${pendDiretas.length}`);
        console.log(`      Pendências em subseções: ${pendSubsecoes.length}`);
        console.log(`      Total de pendências: ${pendencias?.length || 0}`);

        // Mostrar detalhes das pendências com subsecao_id
        if (pendSubsecoes.length > 0) {
          console.log(`\n      ⚠️ Pendências com subsecao_id (PODEM ESTAR SENDO FILTRADAS):`);
          pendSubsecoes.forEach(p => {
            console.log(`         - [${p.id.slice(0, 8)}...] ${p.local.substring(0, 40)}...`);
            console.log(`           subsecao_id: ${p.subsecao_id}`);
          });
        }
      }

      console.log(`\n📊 RESUMO DO RELATÓRIO:`);
      console.log(`   Total de pendências no banco: ${totalPendencias}`);
      console.log(`   Pendências SEM subsecao_id: ${pendenciasSemSubsecao}`);
      console.log(`   Pendências COM subsecao_id: ${pendenciasComSubsecao}`);
      console.log(`\n⚠️ O código está filtrando ${pendenciasComSubsecao} pendências!`);
    }

    // 3. Buscar pendências deletadas recentemente (se houver tabela de auditoria)
    console.log('\n' + '='.repeat(60));
    console.log('\n3️⃣ Verificando se há tabela de auditoria...\n');

    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%audit%');

    if (tables && tables.length > 0) {
      console.log('✅ Tabelas de auditoria encontradas:', tables);
    } else {
      console.log('⚠️ Nenhuma tabela de auditoria encontrada');
      console.log('   Não é possível recuperar pendências deletadas sem backup');
    }

  } catch (error) {
    console.error('\n❌ Erro durante investigação:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Investigação concluída\n');
}

investigar();
