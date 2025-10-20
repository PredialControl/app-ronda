-- DIAGNÓSTICO COMPLETO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR TODAS AS TABELAS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFICAR ESTRUTURA DA TABELA outros_itens_corrigidos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 3. VERIFICAR DADOS NA TABELA
SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT ronda_id) as rondas_diferentes
FROM outros_itens_corrigidos;

-- 4. VERIFICAR SE HÁ DADOS CORROMPIDOS
SELECT 
    id,
    nome,
    categoria,
    status,
    prioridade,
    local,
    created_at
FROM outros_itens_corrigidos 
ORDER BY created_at DESC
LIMIT 10;

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'outros_itens_corrigidos';

-- 6. VERIFICAR ÍNDICES
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'outros_itens_corrigidos';

-- 7. TESTAR INSERÇÃO SIMPLES
INSERT INTO outros_itens_corrigidos (
    ronda_id,
    nome,
    descricao,
    local,
    tipo,
    prioridade,
    status,
    contrato,
    endereco,
    data,
    hora,
    categoria
) VALUES (
    gen_random_uuid(),
    'Teste Diagnóstico',
    'Item de teste para verificar funcionamento',
    'Local de teste',
    'CORREÇÃO',
    'BAIXA',
    'PENDENTE',
    'Contrato teste',
    'Endereço teste',
    '2024-01-01',
    '10:00',
    'CHAMADO'
) RETURNING id, nome, categoria;

-- 8. LIMPAR DADOS DE TESTE
DELETE FROM outros_itens_corrigidos 
WHERE nome = 'Teste Diagnóstico';

-- RESULTADO: Diagnóstico completo do banco!
