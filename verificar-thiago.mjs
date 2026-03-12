import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarThiago() {
  console.log('🔍 Verificando Thiago...\n');

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', 'thiago@manutencaopredial.net.br')
    .single();

  if (error || !data) {
    console.log('❌ Thiago NÃO encontrado no banco');
    console.log('   Precisa criar ele!');
    return;
  }

  console.log('✅ Thiago encontrado!');
  console.log('   ID:', data.id);
  console.log('   Nome:', data.nome);
  console.log('   Email:', data.email);
  console.log('   Cargo:', data.cargo);
  console.log('   Admin:', data.is_admin);
  console.log('   Ativo:', data.ativo);
  console.log('   Último acesso:', data.ultimo_acesso);
  console.log('   Senha hash:', data.senha_hash.substring(0, 20) + '...');
}

verificarThiago().then(() => process.exit(0));
