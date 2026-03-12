import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

// Configuração do Supabase
const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarTabelaUsuarios() {
  console.log('🔧 Criando tabela de usuários...');

  // Criar tabela usuarios
  const { error: errorTabela } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS usuarios (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          cargo VARCHAR(100),
          is_admin BOOLEAN DEFAULT false,
          ativo BOOLEAN DEFAULT true,
          ultimo_acesso TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
    `
  });

  if (errorTabela) {
    console.error('❌ Erro ao criar tabela:', errorTabela);
    console.log('\n⚠️  Execute o SQL manualmente no Supabase Dashboard:');
    console.log('📋 Copie o conteúdo do arquivo: migration_usuarios.sql');
    return false;
  }

  console.log('✅ Tabela criada com sucesso!');
  return true;
}

async function criarUsuarioMaster() {
  console.log('\n🔐 Criando usuário master...');

  // Gerar hash da senha "Admin123!"
  const senha = 'Admin123!';
  const senhaHash = await hash(senha, 10);

  console.log('📝 Dados do usuário master:');
  console.log('   Email: admin@ronda.com');
  console.log('   Senha: Admin123!');
  console.log('   Hash:', senhaHash);

  // Verificar se já existe
  const { data: existente } = await supabase
    .from('usuarios')
    .select('id, email')
    .eq('email', 'admin@ronda.com')
    .single();

  if (existente) {
    console.log('\n⚠️  Usuário master já existe!');
    console.log('   Email:', existente.email);
    console.log('   ID:', existente.id);
    return true;
  }

  // Criar usuário master
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{
      email: 'admin@ronda.com',
      senha_hash: senhaHash,
      nome: 'Administrador Master',
      cargo: 'Administrador',
      is_admin: true,
      ativo: true,
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return false;
  }

  console.log('✅ Usuário master criado com sucesso!');
  console.log('   ID:', data.id);
  console.log('   Email:', data.email);
  console.log('   Nome:', data.nome);

  return true;
}

async function main() {
  console.log('🚀 Iniciando setup do sistema de autenticação...\n');

  // Criar usuário master (a tabela será criada automaticamente pelo Supabase)
  const sucesso = await criarUsuarioMaster();

  if (sucesso) {
    console.log('\n✅ Setup concluído com sucesso!');
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('   Email: admin@ronda.com');
    console.log('   Senha: Admin123!');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro acesso!');
  } else {
    console.log('\n❌ Setup falhou. Execute o SQL manualmente no Supabase.');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
