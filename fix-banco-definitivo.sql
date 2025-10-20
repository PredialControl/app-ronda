-- SCRIPT DEFINITIVO PARA CORRIGIR BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'outros_itens_corrigidos'
) as tabela_existe;

-- 2. VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 3. ADICIONAR COLUNA CATEGORIA SE NÃO EXISTIR
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outros_itens_corrigidos' 
        AND column_name = 'categoria'
    ) THEN
        ALTER TABLE outros_itens_corrigidos 
        ADD COLUMN categoria TEXT DEFAULT 'CHAMADO';
        
        RAISE NOTICE 'Coluna categoria adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna categoria já existe!';
    END IF;
END $$;

-- 4. ATUALIZAR ITENS EXISTENTES SEM CATEGORIA
UPDATE outros_itens_corrigidos 
SET categoria = 'CHAMADO' 
WHERE categoria IS NULL OR categoria = '';

-- 5. VERIFICAR DADOS ATUALIZADOS
SELECT 
    COUNT(*) as total_itens,
    COUNT(CASE WHEN categoria = 'CHAMADO' THEN 1 END) as itens_chamado,
    COUNT(CASE WHEN categoria IS NULL THEN 1 END) as itens_sem_categoria
FROM outros_itens_corrigidos;

-- 6. MOSTRAR ALGUNS EXEMPLOS
SELECT 
    id,
    nome,
    categoria,
    status,
    prioridade,
    local
FROM outros_itens_corrigidos 
ORDER BY created_at DESC
LIMIT 5;

-- 7. VERIFICAR SE RLS ESTÁ DESABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'outros_itens_corrigidos';

-- 8. DESABILITAR RLS SE ESTIVER HABILITADO
ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- RESULTADO: Tabela corrigida e pronta para uso!
