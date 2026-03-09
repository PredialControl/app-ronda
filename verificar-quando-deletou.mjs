import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarQuando() {
  console.log('\n🔍 VERIFICANDO QUANDO AS PENDÊNCIAS FORAM DELETADAS\n');
  console.log('='.repeat(70));

  try {
    // Buscar relatório
    const { data: contratos } = await supabase
      .from('contratos')
      .select('id')
      .ilike('nome', '%Nik%');

    const { data: relatorios } = await supabase
      .from('relatorios_pendencias')
      .select('id, titulo, updated_at')
      .eq('contrato_id', contratos[0].id);

    const relatorio = relatorios?.find(r =>
      r.titulo.toLowerCase().includes('molhadas') ||
      r.titulo.toLowerCase().includes('mobilhadas')
    );

    console.log(`\n📄 Relatório: ${relatorio.titulo}`);
    console.log(`📅 Última atualização do relatório: ${new Date(relatorio.updated_at).toLocaleString('pt-BR')}\n`);

    // Buscar as 32 pendências que ainda existem
    const { data: secoes } = await supabase
      .from('relatorio_secoes')
      .select('id')
      .eq('relatorio_id', relatorio.id);

    const secaoIds = secoes?.map(s => s.id) || [];

    const { data: pendencias } = await supabase
      .from('relatorio_pendencias')
      .select('id, local, created_at, ordem')
      .in('secao_id', secaoIds)
      .order('created_at', { ascending: false });

    console.log('='.repeat(70));
    console.log(`\n📊 ANÁLISE DAS 32 PENDÊNCIAS QUE AINDA EXISTEM:\n`);

    // Agrupar por data de criação
    const porData = {};
    pendencias?.forEach(p => {
      const data = new Date(p.created_at).toLocaleDateString('pt-BR');
      if (!porData[data]) {
        porData[data] = [];
      }
      porData[data].push(p);
    });

    console.log('Pendências criadas por data:\n');
    Object.keys(porData).sort().forEach(data => {
      console.log(`   ${data}: ${porData[data].length} pendências`);
    });

    // Mostrar a mais recente e a mais antiga
    const maisRecente = pendencias[0];
    const maisAntiga = pendencias[pendencias.length - 1];

    console.log(`\n📌 Mais antiga: ${new Date(maisAntiga.created_at).toLocaleString('pt-BR')}`);
    console.log(`   "${maisAntiga.local}"\n`);

    console.log(`📌 Mais recente: ${new Date(maisRecente.created_at).toLocaleString('pt-BR')}`);
    console.log(`   "${maisRecente.local}"\n`);

    console.log('='.repeat(70));
    console.log('\n🎯 DIAGNÓSTICO:\n');

    const dataAtualizacao = new Date(relatorio.updated_at);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    if (dataAtualizacao.toDateString() === hoje.toDateString()) {
      console.log('⚠️ O relatório foi atualizado HOJE (' + dataAtualizacao.toLocaleString('pt-BR') + ')');
      console.log('✅ BACKUP DE ONTEM DEVE TER AS 83 PENDÊNCIAS!\n');
      console.log('🔧 RECOMENDAÇÃO: RESTAURE O BACKUP DE ONTEM (03/03/2026)\n');
    } else if (dataAtualizacao.toDateString() === ontem.toDateString()) {
      console.log('⚠️ O relatório foi atualizado ONTEM (' + dataAtualizacao.toLocaleString('pt-BR') + ')');
      console.log('❌ Backup de ontem pode JÁ estar sem as pendências');
      console.log('🔧 RECOMENDAÇÃO: Procure backup mais antigo (16/02 ou 17/02)\n');
    } else {
      console.log('⚠️ O relatório foi atualizado em: ' + dataAtualizacao.toLocaleString('pt-BR'));
      console.log('📅 Procure backup ANTES dessa data\n');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

verificarQuando();
