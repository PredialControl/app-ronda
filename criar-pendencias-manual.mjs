import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pergunta(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function criarPendenciasEmLote() {
  console.log('\n🔧 FERRAMENTA DE CRIAÇÃO DE PENDÊNCIAS EM LOTE\n');
  console.log('='.repeat(70));

  try {
    // 1. Buscar relatório
    const { data: contratos } = await supabase
      .from('contratos')
      .select('id, nome')
      .ilike('nome', '%Nik%');

    const contratoNik = contratos?.[0];
    console.log(`\n✅ Contrato: ${contratoNik.nome}\n`);

    const { data: relatorios } = await supabase
      .from('relatorios_pendencias')
      .select('id, titulo')
      .eq('contrato_id', contratoNik.id);

    const relatorio = relatorios?.find(r =>
      r.titulo.toLowerCase().includes('molhadas') ||
      r.titulo.toLowerCase().includes('mobilhadas')
    );

    console.log(`✅ Relatório: ${relatorio.titulo}\n`);

    // 2. Buscar seções
    const { data: secoes } = await supabase
      .from('relatorio_secoes')
      .select('id, ordem, titulo_principal, subtitulo')
      .eq('relatorio_id', relatorio.id)
      .order('ordem');

    console.log('📋 SEÇÕES DISPONÍVEIS:\n');
    secoes?.forEach((s, idx) => {
      console.log(`   ${idx + 1}. [Ordem ${s.ordem}] ${s.titulo_principal}`);
      if (s.subtitulo) console.log(`      "${s.subtitulo}"`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📝 MODO DE USO:\n');
    console.log('1. Digite o NÚMERO da seção (1, 2, 3, etc)');
    console.log('2. Digite as pendências no formato: LOCAL | DESCRIÇÃO');
    console.log('3. Digite uma linha vazia quando terminar a seção');
    console.log('4. Digite "sair" para finalizar\n');
    console.log('Exemplo:');
    console.log('  Lavanderia - Pia | Trinca no azulejo próximo à torneira');
    console.log('  Lavanderia - Piso | Rejunte deteriorado\n');
    console.log('='.repeat(70));

    let totalCriadas = 0;

    while (true) {
      const numSecao = await pergunta('\n📍 Escolha a seção (número) ou "sair": ');

      if (numSecao.toLowerCase() === 'sair') break;

      const secaoIdx = parseInt(numSecao) - 1;
      if (secaoIdx < 0 || secaoIdx >= secoes.length) {
        console.log('❌ Seção inválida!');
        continue;
      }

      const secao = secoes[secaoIdx];
      console.log(`\n✅ Seção selecionada: ${secao.titulo_principal}`);
      console.log('\n📝 Digite as pendências (formato: LOCAL | DESCRIÇÃO)');
      console.log('   Digite uma linha vazia para finalizar esta seção\n');

      // Buscar próxima ordem disponível
      const { data: existentes } = await supabase
        .from('relatorio_pendencias')
        .select('ordem')
        .eq('secao_id', secao.id)
        .order('ordem', { ascending: false })
        .limit(1);

      let proximaOrdem = existentes?.[0]?.ordem ? existentes[0].ordem + 1 : 0;

      while (true) {
        const linha = await pergunta('   > ');

        if (!linha.trim()) {
          console.log(`\n✅ Seção "${secao.titulo_principal}" finalizada!\n`);
          break;
        }

        const partes = linha.split('|').map(p => p.trim());
        if (partes.length !== 2) {
          console.log('   ⚠️ Formato inválido! Use: LOCAL | DESCRIÇÃO');
          continue;
        }

        const [local, descricao] = partes;

        // Criar pendência
        const { data, error } = await supabase
          .from('relatorio_pendencias')
          .insert({
            secao_id: secao.id,
            local,
            descricao,
            ordem: proximaOrdem,
            subsecao_id: null
          })
          .select()
          .single();

        if (error) {
          console.log(`   ❌ Erro ao criar: ${error.message}`);
        } else {
          console.log(`   ✅ Criada #${proximaOrdem + 1}: ${local}`);
          proximaOrdem++;
          totalCriadas++;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n🎉 CONCLUÍDO! Total de pendências criadas: ${totalCriadas}\n`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    rl.close();
  }
}

criarPendenciasEmLote();
