import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function aplicarMigration() {
  console.log('📦 Lendo arquivo de migration...');

  const sql = readFileSync('migration-itens-relevantes-relatorio.sql', 'utf-8');

  console.log('🚀 Aplicando migration no Supabase...');
  console.log('SQL:', sql.substring(0, 200) + '...');

  // Nota: O Supabase não permite executar SQL diretamente via JavaScript
  // É necessário executar pelo painel do Supabase ou usar a API de admin
  console.log('\n⚠️  ATENÇÃO: Execute o SQL manualmente no painel do Supabase:');
  console.log('1. Acesse: https://supabase.com/dashboard/project/tvuwrrovxzakxrhsplvd/editor');
  console.log('2. Clique em "SQL Editor"');
  console.log('3. Cole o conteúdo do arquivo: migration-itens-relevantes-relatorio.sql');
  console.log('4. Clique em "RUN"\n');
}

aplicarMigration();
