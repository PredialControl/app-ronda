-- ========================================
-- DIAGNÓSTICO E CORREÇÃO DO ERRO 500 EM AREAS_TECNICAS
-- ========================================

-- 1. Verificar se a tabela existe
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'areas_tecnicas';

-- 2. Verificar colunas da tabela
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'areas_tecnicas'
ORDER BY ordinal_position;

-- 3. Verificar policies RLS
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
WHERE tablename = 'areas_tecnicas';

-- 4. Verificar se RLS está ativado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'areas_tecnicas';

-- 5. CORREÇÃO: Desabilitar RLS temporariamente para debug
ALTER TABLE areas_tecnicas DISABLE ROW LEVEL SECURITY;

-- 6. CORREÇÃO: Adicionar coluna teste_status se não existir
ALTER TABLE areas_tecnicas
ADD COLUMN IF NOT EXISTS teste_status VARCHAR(50);

-- 7. CORREÇÃO: Recriar policies básicas
DROP POLICY IF EXISTS "Allow public read access" ON areas_tecnicas;
DROP POLICY IF EXISTS "Allow public insert access" ON areas_tecnicas;
DROP POLICY IF EXISTS "Allow public update access" ON areas_tecnicas;
DROP POLICY IF EXISTS "Allow public delete access" ON areas_tecnicas;

-- Criar policies permissivas para acesso público
CREATE POLICY "Allow public read access"
    ON areas_tecnicas FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access"
    ON areas_tecnicas FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access"
    ON areas_tecnicas FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete access"
    ON areas_tecnicas FOR DELETE
    USING (true);

-- 8. Reabilitar RLS
ALTER TABLE areas_tecnicas ENABLE ROW LEVEL SECURITY;

-- 9. Verificar índices
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'areas_tecnicas';

-- 10. Contar registros
SELECT COUNT(*) as total_areas_tecnicas FROM areas_tecnicas;

-- 11. Mostrar alguns registros de exemplo
SELECT * FROM areas_tecnicas LIMIT 5;
