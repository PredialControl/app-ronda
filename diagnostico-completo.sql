-- DIAGNÓSTICO COMPLETO E SOLUÇÃO PARA TABELA outros_itens_corrigidos
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'outros_itens_corrigidos';

-- 2. SE A TABELA NÃO EXISTIR, CRIE-A:
-- CREATE TABLE IF NOT EXISTS outros_itens_corrigidos (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     ronda_id UUID,
--     nome TEXT NOT NULL,
--     descricao TEXT NOT NULL,
--     local TEXT NOT NULL,
--     tipo TEXT NOT NULL,
--     prioridade TEXT NOT NULL,
--     status TEXT NOT NULL,
--     contrato TEXT NOT NULL,
--     endereco TEXT NOT NULL,
--     data TEXT NOT NULL,
--     hora TEXT NOT NULL,
--     foto TEXT,
--     observacoes TEXT,
--     responsavel TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 3. VERIFICAR ESTRUTURA ATUAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 4. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'outros_itens_corrigidos';

-- 5. REMOVER TODAS AS POLÍTICAS EXISTENTES (se houver)
-- DROP POLICY IF EXISTS "Permitir acesso total aos outros_itens_corrigidos" ON outros_itens_corrigidos;
-- DROP POLICY IF EXISTS "outros_itens_corrigidos_policy" ON outros_itens_corrigidos;

-- 6. DESABILITAR RLS FORÇADAMENTE
ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- 7. VERIFICAR SE RLS FOI DESABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'outros_itens_corrigidos';

-- 8. TESTAR INSERÇÃO DIRETA
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
    foto,
    observacoes,
    responsavel
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Teste RLS',
    'Teste para verificar se RLS está funcionando',
    'Local de teste',
    'CORREÇÃO',
    'MÉDIA',
    'PENDENTE',
    'Contrato teste',
    'Endereço teste',
    '2024-01-01',
    '10:00',
    NULL,
    'Teste de RLS',
    'Sistema'
);

-- 9. VERIFICAR SE A INSERÇÃO FUNCIONOU
SELECT COUNT(*) as total_itens FROM outros_itens_corrigidos;

-- 10. SE TUDO FUNCIONAR, LIMPAR O ITEM DE TESTE
-- DELETE FROM outros_itens_corrigidos WHERE nome = 'Teste RLS';

-- RESULTADO ESPERADO:
-- rowsecurity deve ser 'f' (false)
-- A inserção de teste deve funcionar
-- Se não funcionar, a tabela precisa ser recriada


