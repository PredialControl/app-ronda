import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

// Configuração do Supabase
const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarRicardoMaster() {
  console.log('🚀 Criando Ricardo como usuário master...\n');

  // DEFINA SEU EMAIL E SENHA AQUI:
  const MEU_EMAIL = 'ricardo@manutencaopredial.net.br';
  const MINHA_SENHA = 'Ricardo2025!'; // Senha temporária - altere depois no painel

  console.log('📝 Dados do usuário:');
  console.log('   Email:', MEU_EMAIL);
  console.log('   Senha:', MINHA_SENHA);
  console.log('');

  // Gerar hash da senha
  const senhaHash = await hash(MINHA_SENHA, 10);

  // Verificar se já existe
  const { data: existente } = await supabase
    .from('usuarios')
    .select('id, email')
    .eq('email', MEU_EMAIL)
    .single();

  if (existente) {
    console.log('⚠️  Usuário já existe! Atualizando para admin...');

    const { error } = await supabase
      .from('usuarios')
      .update({
        senha_hash: senhaHash,
        is_admin: true,
        ativo: true,
        nome: 'Ricardo Oliveira',
        cargo: 'Administrador Master',
      })
      .eq('email', MEU_EMAIL);

    if (error) {
      console.error('❌ Erro ao atualizar:', error);
      return false;
    }

    console.log('✅ Usuário atualizado com sucesso!');
    return true;
  }

  // Criar novo usuário
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{
      email: MEU_EMAIL,
      senha_hash: senhaHash,
      nome: 'Ricardo Oliveira',
      cargo: 'Administrador Master',
      is_admin: true,
      ativo: true,
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return false;
  }

  console.log('✅ Usuário criado com sucesso!');
  console.log('   ID:', data.id);
  console.log('   Email:', data.email);
  console.log('   Nome:', data.nome);

  return true;
}

async function main() {
  const sucesso = await criarRicardoMaster();

  if (sucesso) {
    console.log('\n✅ PRONTO!');
    console.log('Agora você pode fazer login no sistema! 🎉');
  } else {
    console.log('\n❌ Algo deu errado. Verifique os erros acima.');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
