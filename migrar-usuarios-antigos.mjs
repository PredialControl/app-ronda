import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrarUsuarios() {
  console.log('🔄 Migrando usuários antigos para o banco...\n');

  const usuariosAntigos = [
    {
      email: 'gessica@manutencaopredial.net.br',
      nome: 'Gessica',
      cargo: 'Técnica de Manutenção',
      senha: 'manutencao2024',
      is_admin: false
    },
    {
      email: 'felipe@manutencaopredial.net.br',
      nome: 'Felipe',
      cargo: 'Técnico de Manutenção',
      senha: 'manutencao2024',
      is_admin: false
    }
  ];

  for (const user of usuariosAntigos) {
    console.log(`📝 Processando ${user.nome}...`);

    // Verificar se já existe
    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existe) {
      console.log(`   ⚠️  ${user.nome} já existe no banco`);
      continue;
    }

    // Criar hash da senha
    const senhaHash = await hash(user.senha, 10);

    // Inserir no banco
    const { error } = await supabase
      .from('usuarios')
      .insert([{
        email: user.email,
        senha_hash: senhaHash,
        nome: user.nome,
        cargo: user.cargo,
        is_admin: user.is_admin,
        ativo: true
      }]);

    if (error) {
      console.log(`   ❌ Erro ao criar ${user.nome}:`, error.message);
    } else {
      console.log(`   ✅ ${user.nome} criado!`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Senha: ${user.senha}`);
    }
  }

  console.log('\n✅ Migração concluída!');
}

migrarUsuarios().then(() => process.exit(0));
