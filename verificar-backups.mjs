import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBackups() {
  console.log('\n🔍 VERIFICANDO BACKUPS DISPONÍVEIS\n');
  console.log('='.repeat(70));
  console.log('\n⚠️ MODO SOMENTE LEITURA - NÃO VOU ALTERAR NADA\n');
  console.log('='.repeat(70));

  try {
    // Tentar buscar informações de sistema sobre backups
    console.log('\n📊 Verificando configurações do projeto...\n');

    // Verificar se há tabelas de auditoria/backup
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_info', {})
      .catch(() => null);

    console.log('🔍 Tentando acessar metadados do sistema...\n');

    // Verificar storage de backups (se existir)
    const { data: buckets } = await supabase.storage.listBuckets();

    console.log('📦 Buckets de storage encontrados:\n');
    if (buckets && buckets.length > 0) {
      buckets.forEach(b => {
        console.log(`   - ${b.name} (${b.public ? 'público' : 'privado'})`);
      });
    } else {
      console.log('   (nenhum bucket encontrado ou sem permissão)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n❌ INFORMAÇÃO IMPORTANTE:\n');
    console.log('A API anônima (anon key) NÃO tem permissão para acessar');
    console.log('informações sobre backups do Supabase.\n');
    console.log('Os backups SÃO gerenciados pelo painel administrativo.\n');
    console.log('='.repeat(70));
    console.log('\n📍 VOCÊ PRECISA ACESSAR MANUALMENTE:\n');
    console.log('1. Vá em: https://supabase.com/dashboard/sign-in');
    console.log('2. Faça login com sua conta');
    console.log('3. Selecione o projeto "tvuwrrovxzakxrhsplvd"');
    console.log('4. No menu lateral, clique em: Database → Backups');
    console.log('5. Você verá a lista de backups disponíveis\n');
    console.log('⚠️ NÃO CLIQUE EM "RESTORE" ainda - apenas veja se tem backups!\n');
    console.log('='.repeat(70));
    console.log('\n📋 INFORMAÇÕES SOBRE BACKUPS:\n');
    console.log('Plano GRATUITO do Supabase:');
    console.log('   - Backups automáticos: 1 por dia');
    console.log('   - Retenção: últimos 7 dias');
    console.log('   - Você deve ter backups de: 27/02 até 04/03\n');
    console.log('Plano PRO:');
    console.log('   - Backups automáticos: várias vezes ao dia');
    console.log('   - Retenção: 30 dias');
    console.log('   - Point-in-Time Recovery disponível\n');
    console.log('='.repeat(70));
    console.log('\n🎯 PRÓXIMO PASSO:\n');
    console.log('1. Acesse o dashboard do Supabase');
    console.log('2. Veja se tem backup do dia 16/02/2026 (quando criou o relatório)');
    console.log('3. Me diga: TEM ou NÃO TEM backup disponível\n');
    console.log('Aí eu te ajudo no próximo passo!\n');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

verificarBackups();
