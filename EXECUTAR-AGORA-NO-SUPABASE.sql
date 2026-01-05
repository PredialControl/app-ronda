-- ========================================
-- CRIAR TABELAS DE RELATÓRIOS DE PENDÊNCIAS
-- Execute este script no SQL Editor do Supabase
-- ========================================

-- 1. DELETAR TUDO (se já existir)
DROP TABLE IF EXISTS relatorio_pendencias CASCADE;
DROP TABLE IF EXISTS relatorio_secoes CASCADE;
DROP TABLE IF EXISTS relatorios_pendencias CASCADE;

-- 2. CRIAR TABELA DE RELATÓRIOS
CREATE TABLE relatorios_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contrato_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    capa_url TEXT,
    foto_localidade_url TEXT,
    data_inicio_vistoria TEXT,
    historico_visitas TEXT[],
    data_situacao_atual TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE SEÇÕES
CREATE TABLE relatorio_secoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relatorio_id UUID NOT NULL REFERENCES relatorios_pendencias(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo_principal TEXT NOT NULL,
    subtitulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE PENDÊNCIAS
CREATE TABLE relatorio_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    foto_depois_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_relatorio_secoes_relatorio ON relatorio_secoes(relatorio_id);
CREATE INDEX idx_relatorio_pendencias_secao ON relatorio_pendencias(secao_id);
CREATE INDEX idx_relatorio_pendencias_ordem ON relatorio_pendencias(secao_id, ordem);

-- 6. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE relatorios_pendencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias DISABLE ROW LEVEL SECURITY;

-- 7. REMOVER POLICIES ANTIGAS (se existirem)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all for relatorios_pendencias" ON relatorios_pendencias;
    DROP POLICY IF EXISTS "Enable all for relatorio_secoes" ON relatorio_secoes;
    DROP POLICY IF EXISTS "Enable all for relatorio_pendencias" ON relatorio_pendencias;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 8. CRIAR POLICIES PÚBLICAS
CREATE POLICY "Enable all for relatorios_pendencias"
    ON relatorios_pendencias
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for relatorio_secoes"
    ON relatorio_secoes
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for relatorio_pendencias"
    ON relatorio_pendencias
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 9. HABILITAR RLS
ALTER TABLE relatorios_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- 10. GARANTIR QUE O BUCKET 'fotos' EXISTE E É PÚBLICO
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 11. REMOVER POLICIES ANTIGAS DO BUCKET
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all for fotos bucket" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 12. CRIAR POLICY PARA O BUCKET
CREATE POLICY "Enable all for fotos bucket"
    ON storage.objects
    FOR ALL
    TO public
    USING (bucket_id = 'fotos')
    WITH CHECK (bucket_id = 'fotos');

-- 13. VERIFICAÇÃO FINAL
SELECT 'TABELAS CRIADAS:' as info;
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%relatorio%'
ORDER BY table_name;

SELECT 'COLUNAS DE relatorios_pendencias:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'relatorios_pendencias'
ORDER BY ordinal_position;

SELECT 'COLUNAS DE relatorio_secoes:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'relatorio_secoes'
ORDER BY ordinal_position;

SELECT 'COLUNAS DE relatorio_pendencias:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'relatorio_pendencias'
ORDER BY ordinal_position;

SELECT 'RLS STATUS:' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%relatorio%'
ORDER BY tablename;

SELECT 'POLICIES:' as info;
SELECT tablename, policyname
FROM pg_policies
WHERE tablename LIKE '%relatorio%'
ORDER BY tablename, policyname;

SELECT 'BUCKET STATUS:' as info;
SELECT id, name, public
FROM storage.buckets
WHERE name = 'fotos';

SELECT '✅ SETUP COMPLETO!' as status;
