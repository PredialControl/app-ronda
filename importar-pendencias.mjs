import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importarPendencias() {
  console.log('\n📥 IMPORTAÇÃO DE PENDÊNCIAS DO ARQUIVO\n');
  console.log('='.repeat(70));

  try {
    // 1. Ler arquivo
    const arquivo = 'template-pendencias.txt';
    if (!fs.existsSync(arquivo)) {
      console.log(`❌ Arquivo "${arquivo}" não encontrado!`);
      console.log(`   Crie o arquivo primeiro ou edite o existente.\n`);
      return;
    }

    const conteudo = fs.readFileSync(arquivo, 'utf-8');
    const linhas = conteudo.split('\n');

    console.log(`✅ Arquivo lido: ${linhas.length} linhas\n`);

    // 2. Buscar relatório e seções
    const { data: contratos } = await supabase
      .from('contratos')
      .select('id, nome')
      .ilike('nome', '%Nik%');

    const contratoNik = contratos?.[0];

    const { data: relatorios } = await supabase
      .from('relatorios_pendencias')
      .select('id, titulo')
      .eq('contrato_id', contratoNik.id);

    const relatorio = relatorios?.find(r =>
      r.titulo.toLowerCase().includes('molhadas') ||
      r.titulo.toLowerCase().includes('mobilhadas')
    );

    const { data: secoes } = await supabase
      .from('relatorio_secoes')
      .select('id, ordem, titulo_principal')
      .eq('relatorio_id', relatorio.id)
      .order('ordem');

    console.log(`✅ Relatório: ${relatorio.titulo}`);
    console.log(`✅ Seções disponíveis: ${secoes?.length}\n`);

    // Criar mapa de seções por nome
    const mapaSecoes = {};
    secoes?.forEach(s => {
      mapaSecoes[s.titulo_principal.toUpperCase()] = s;
    });

    console.log('='.repeat(70));
    console.log('\n📝 Processando pendências...\n');

    let totalCriadas = 0;
    let totalErros = 0;
    let totalIgnoradas = 0;

    // Cache de próximas ordens por seção
    const proximasOrdens = {};

    for (const [idx, linha] of linhas.entries()) {
      const linhaLimpa = linha.trim();

      // Ignorar comentários e linhas vazias
      if (!linhaLimpa || linhaLimpa.startsWith('#')) {
        continue;
      }

      // Formato: SECAO | LOCAL | DESCRIÇÃO
      const partes = linhaLimpa.split('|').map(p => p.trim());

      if (partes.length !== 3) {
        console.log(`   ⚠️ Linha ${idx + 1}: Formato inválido (use: SECAO | LOCAL | DESCRIÇÃO)`);
        totalIgnoradas++;
        continue;
      }

      const [nomeSecao, local, descricao] = partes;

      // Buscar seção
      const secao = mapaSecoes[nomeSecao.toUpperCase()];

      if (!secao) {
        console.log(`   ⚠️ Linha ${idx + 1}: Seção "${nomeSecao}" não encontrada`);
        totalIgnoradas++;
        continue;
      }

      // Obter próxima ordem para essa seção
      if (!proximasOrdens[secao.id]) {
        const { data: existentes } = await supabase
          .from('relatorio_pendencias')
          .select('ordem')
          .eq('secao_id', secao.id)
          .order('ordem', { ascending: false })
          .limit(1);

        proximasOrdens[secao.id] = existentes?.[0]?.ordem ? existentes[0].ordem + 1 : 0;
      }

      // Criar pendência
      const { error } = await supabase
        .from('relatorio_pendencias')
        .insert({
          secao_id: secao.id,
          local,
          descricao,
          ordem: proximasOrdens[secao.id],
          subsecao_id: null
        });

      if (error) {
        console.log(`   ❌ Linha ${idx + 1}: Erro ao criar - ${error.message}`);
        totalErros++;
      } else {
        console.log(`   ✅ Linha ${idx + 1}: ${nomeSecao} → ${local}`);
        proximasOrdens[secao.id]++;
        totalCriadas++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESULTADO:\n');
    console.log(`   ✅ Criadas: ${totalCriadas} pendências`);
    console.log(`   ⚠️ Ignoradas: ${totalIgnoradas} linhas`);
    console.log(`   ❌ Erros: ${totalErros}`);
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

importarPendencias();
