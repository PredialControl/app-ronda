-- ========================================
-- DIAGNÓSTICO COMPLETO - RELATÓRIO DE PENDÊNCIAS
-- ========================================

-- 1. Verificar se a tabela relatorio_pendencias existe
SELECT 'TABELA: relatorio_pendencias' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'relatorio_pendencias'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS da tabela relatorio_pendencias
SELECT 'POLICIES RLS: relatorio_pendencias' as info;
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'relatorio_pendencias';

-- 3. Verificar se RLS está habilitado
SELECT 'RLS STATUS: relatorio_pendencias' as info;
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'relatorio_pendencias';

-- 4. Contar registros
SELECT 'TOTAL DE REGISTROS: relatorio_pendencias' as info;
SELECT COUNT(*) as total FROM relatorio_pendencias;

-- 5. Mostrar últimos 3 registros
SELECT 'ÚLTIMOS 3 REGISTROS: relatorio_pendencias' as info;
SELECT
    id,
    local,
    descricao,
    foto_url,
    foto_depois_url,
    created_at
FROM relatorio_pendencias
ORDER BY created_at DESC
LIMIT 3;

-- 6. Verificar bucket 'fotos'
SELECT 'BUCKET: fotos' as info;
SELECT
    id,
    name,
    public
FROM storage.buckets
WHERE name = 'fotos';

-- 7. Verificar policies do bucket 'fotos'
SELECT 'POLICIES BUCKET: fotos' as info;
SELECT
    name,
    definition
FROM storage.policies
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'fotos');

-- ========================================
-- CORREÇÕES
-- ========================================

-- Garantir que a coluna foto_depois_url existe
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS foto_depois_url TEXT;

-- Desabilitar RLS temporariamente
ALTER TABLE relatorio_pendencias DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies antigas
DROP POLICY IF EXISTS "Allow public read access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Allow public insert access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Allow public update access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Allow public delete access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Enable read access for all users" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Enable insert access for all users" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Enable update access for all users" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Enable delete access for all users" ON relatorio_pendencias;

-- Criar policies PERMISSIVAS para acesso total
CREATE POLICY "Public Access - SELECT"
    ON relatorio_pendencias FOR SELECT
    USING (true);

CREATE POLICY "Public Access - INSERT"
    ON relatorio_pendencias FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public Access - UPDATE"
    ON relatorio_pendencias FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public Access - DELETE"
    ON relatorio_pendencias FOR DELETE
    USING (true);

-- Reabilitar RLS
ALTER TABLE relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- Garantir que o bucket 'fotos' está público
UPDATE storage.buckets
SET public = true
WHERE name = 'fotos';

-- Remover policies antigas do bucket
DROP POLICY IF EXISTS "Public Access - SELECT" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - DELETE" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Criar policies do bucket para acesso total
CREATE POLICY "Public Access - SELECT"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'fotos');

CREATE POLICY "Public Access - INSERT"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'fotos');

CREATE POLICY "Public Access - UPDATE"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'fotos');

CREATE POLICY "Public Access - DELETE"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'fotos');

-- Verificação final
SELECT 'VERIFICAÇÃO FINAL' as info;
SELECT
    'relatorio_pendencias tem coluna foto_depois_url?' as pergunta,
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'relatorio_pendencias'
        AND column_name = 'foto_depois_url'
    ) as resposta;

SELECT
    'Bucket fotos é público?' as pergunta,
    public as resposta
FROM storage.buckets
WHERE name = 'fotos';

SELECT
    'RLS está habilitado em relatorio_pendencias?' as pergunta,
    rowsecurity as resposta
FROM pg_tables
WHERE tablename = 'relatorio_pendencias';

SELECT
    'Quantas policies tem relatorio_pendencias?' as pergunta,
    COUNT(*) as resposta
FROM pg_policies
WHERE tablename = 'relatorio_pendencias';

SELECT
    'Quantas policies tem o bucket fotos?' as pergunta,
    COUNT(*) as resposta
FROM storage.policies
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'fotos');
