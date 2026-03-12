import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function tornarAdmin() {
  console.log('🔧 Tornando ricardo@manutencaopredial.net.br ADMIN (SEM alterar senha)...\n');

  const { error } = await supabase
    .from('usuarios')
    .update({ is_admin: true })
    .eq('email', 'ricardo@manutencaopredial.net.br');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('✅ PRONTO! Agora você é admin.');
  console.log('   Use sua senha ANTIGA para fazer login.');
  console.log('   O botão "Usuários" vai aparecer no header.');
}

tornarAdmin().then(() => process.exit(0));
