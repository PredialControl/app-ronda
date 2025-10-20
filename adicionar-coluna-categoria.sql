-- ADICIONAR COLUNA CATEGORIA NA TABELA outros_itens_corrigidos
-- Execute este script no SQL Editor do Supabase

-- 1. ADICIONAR COLUNA CATEGORIA
ALTER TABLE outros_itens_corrigidos 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'CHAMADO';

-- 2. ATUALIZAR ITENS EXISTENTES SEM CATEGORIA
UPDATE outros_itens_corrigidos 
SET categoria = 'CHAMADO' 
WHERE categoria IS NULL;

-- 3. VERIFICAR SE A COLUNA FOI ADICIONADA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
AND column_name = 'categoria';

-- 4. VERIFICAR DADOS ATUALIZADOS
SELECT 
    id,
    nome,
    categoria,
    status,
    prioridade
FROM outros_itens_corrigidos 
LIMIT 5;

-- RESULTADO: Agora todos os itens terão categoria 'CHAMADO' por padrão
