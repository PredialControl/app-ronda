import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recuperar() {
  console.log('\n🔧 RECUPERAÇÃO DE PENDÊNCIAS OCULTAS\n');
  console.log('='.repeat(70));

  try {
    // 1. Buscar contrato Nik
    const { data: contratos } = await supabase
      .from('contratos')
      .select('id, nome')
      .ilike('nome', '%Nik%');

    const contratoNik = contratos?.[0];

    if (!contratoNik) {
      console.log('❌ Contrato não encontrado!');
      return;
    }

    console.log(`\n✅ Contrato: ${contratoNik.nome}\n`);

    // 2. Buscar relatório de áreas molhadas
    const { data: relatorios } = await supabase
      .from('relatorios_pendencias')
      .select('id, titulo')
      .eq('contrato_id', contratoNik.id);

    const relatorio = relatorios?.find(r =>
      r.titulo.toLowerCase().includes('molhadas') ||
      r.titulo.toLowerCase().includes('mobilhadas')
    );

    if (!relatorio) {
      console.log('❌ Relatório não encontrado!');
      return;
    }

    console.log(`✅ Relatório: ${relatorio.titulo}\n`);
    console.log('='.repeat(70));

    // 3. Buscar todas as pendências com subsecao_id
    const { data: secoes } = await supabase
      .from('relatorio_secoes')
      .select('id')
      .eq('relatorio_id', relatorio.id);

    const secaoIds = secoes?.map(s => s.id) || [];

    const { data: pendenciasOcultas } = await supabase
      .from('relatorio_pendencias')
      .select('id, local, descricao, subsecao_id')
      .in('secao_id', secaoIds)
      .not('subsecao_id', 'is', null);

    console.log(`\n🔍 Encontradas ${pendenciasOcultas?.length || 0} pendências ocultas:\n`);

    pendenciasOcultas?.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.local}`);
      console.log(`      ID: ${p.id}`);
      console.log(`      subsecao_id: ${p.subsecao_id}\n`);
    });

    if (!pendenciasOcultas || pendenciasOcultas.length === 0) {
      console.log('✅ Nenhuma pendência oculta encontrada!');
      return;
    }

    console.log('='.repeat(70));
    console.log('\n🔧 Iniciando recuperação...\n');

    // 4. Remover subsecao_id de todas essas pendências
    let recuperadas = 0;
    let erros = 0;

    for (const pendencia of pendenciasOcultas) {
      const { error } = await supabase
        .from('relatorio_pendencias')
        .update({ subsecao_id: null })
        .eq('id', pendencia.id);

      if (error) {
        console.log(`   ❌ Erro ao recuperar: ${pendencia.local}`);
        console.error(`      ${error.message}`);
        erros++;
      } else {
        console.log(`   ✅ Recuperada: ${pendencia.local}`);
        recuperadas++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESULTADO FINAL\n');
    console.log(`   ✅ Recuperadas: ${recuperadas} pendências`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`\n✅ Agora você deve ter ${22 + recuperadas} pendências visíveis no app!\n`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

recuperar();
