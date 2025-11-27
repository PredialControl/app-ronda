// Script de debug para verificar conexão com Supabase
import { supabase } from './supabase';

export const debugSupabaseConnection = async () => {
  console.log('🔍 Iniciando debug da conexão Supabase...');
  
  try {
    // 1. Testar conexão básica
    console.log('1️⃣ Testando conexão básica...');
    const { data, error } = await supabase.from('contratos').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão básica:', error);
      return false;
    }
    
    console.log('✅ Conexão básica OK');
    
    // 2. Testar inserção de contrato
    console.log('2️⃣ Testando inserção de contrato...');
    const novoContrato = {
      nome: `Teste Debug ${Date.now()}`,
      sindico: 'Debug User',
      endereco: 'Rua Debug, 123',
      periodicidade: 'MENSAL',
      observacoes: 'Contrato de teste para debug'
    };
    
    const { data: contratoData, error: contratoError } = await supabase
      .from('contratos')
      .insert([novoContrato])
      .select()
      .single();
    
    if (contratoError) {
      console.error('❌ Erro ao inserir contrato:', contratoError);
      return false;
    }
    
    console.log('✅ Contrato inserido:', contratoData);
    
    // 3. Testar inserção de ronda
    console.log('3️⃣ Testando inserção de ronda...');
    const novaRonda = {
      nome: `Ronda Debug ${Date.now()}`,
      contrato: contratoData.nome,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      responsavel: 'Debug User',
      observacoes_gerais: 'Ronda de teste para debug'
    };
    
    const { data: rondaData, error: rondaError } = await supabase
      .from('rondas')
      .insert([novaRonda])
      .select()
      .single();
    
    if (rondaError) {
      console.error('❌ Erro ao inserir ronda:', rondaError);
      return false;
    }
    
    console.log('✅ Ronda inserida:', rondaData);
    
    // 4. Testar inserção de foto
    console.log('4️⃣ Testando inserção de foto...');
    const novaFoto = {
      ronda_id: rondaData.id,
      foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      local: 'Corredor Debug',
      pendencia: 'URGENTE',
      especialidade: 'Elétrica',
      responsavel: 'CONDOMÍNIO',
      observacoes: 'Teste de debug',
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].substring(0, 5)
    };
    
    const { data: fotoData, error: fotoError } = await supabase
      .from('fotos_ronda')
      .insert([novaFoto])
      .select()
      .single();
    
    if (fotoError) {
      console.error('❌ Erro ao inserir foto:', fotoError);
      return false;
    }
    
    console.log('✅ Foto inserida:', fotoData);
    
    // 5. Testar busca de fotos
    console.log('5️⃣ Testando busca de fotos...');
    const { data: fotosData, error: fotosError } = await supabase
      .from('fotos_ronda')
      .select('*')
      .eq('ronda_id', rondaData.id);
    
    if (fotosError) {
      console.error('❌ Erro ao buscar fotos:', fotosError);
      return false;
    }
    
    console.log('✅ Fotos encontradas:', fotosData);
    
    // 6. Limpar dados de teste
    console.log('6️⃣ Limpando dados de teste...');
    await supabase.from('fotos_ronda').delete().eq('id', fotoData.id);
    await supabase.from('rondas').delete().eq('id', rondaData.id);
    await supabase.from('contratos').delete().eq('id', contratoData.id);
    
    console.log('✅ Debug completo - Tudo funcionando!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
    return false;
  }
};

// Função para testar apenas a estrutura das tabelas
export const debugTableStructure = async () => {
  console.log('🔍 Verificando estrutura das tabelas...');
  
  const tables = ['contratos', 'rondas', 'fotos_ronda', 'areas_tecnicas', 'outros_itens_corrigidos'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Erro na tabela ${table}:`, error);
      } else {
        console.log(`✅ Tabela ${table} OK`);
      }
    } catch (error) {
      console.error(`❌ Erro ao acessar tabela ${table}:`, error);
    }
  }
};













