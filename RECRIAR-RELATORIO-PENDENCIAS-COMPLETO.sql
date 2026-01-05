-- ========================================
-- DELETAR TUDO E RECRIAR DO ZERO
-- ========================================

-- 1. DELETAR TUDO
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

-- 5. CRIAR ÍNDICES
CREATE INDEX idx_relatorio_secoes_relatorio ON relatorio_secoes(relatorio_id);
CREATE INDEX idx_relatorio_pendencias_secao ON relatorio_pendencias(secao_id);
CREATE INDEX idx_relatorio_pendencias_ordem ON relatorio_pendencias(secao_id, ordem);

-- 6. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE relatorios_pendencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias DISABLE ROW LEVEL SECURITY;

-- 7. REMOVER TODAS AS POLICIES ANTIGAS
DROP POLICY IF EXISTS "Allow public read access" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Allow public insert access" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Allow public update access" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Allow public delete access" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Public Access - SELECT" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Public Access - INSERT" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Public Access - UPDATE" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Public Access - DELETE" ON relatorios_pendencias;

DROP POLICY IF EXISTS "Allow public read access" ON relatorio_secoes;
DROP POLICY IF EXISTS "Allow public insert access" ON relatorio_secoes;
DROP POLICY IF EXISTS "Allow public update access" ON relatorio_secoes;
DROP POLICY IF EXISTS "Allow public delete access" ON relatorio_secoes;
DROP POLICY IF EXISTS "Public Access - SELECT" ON relatorio_secoes;
DROP POLICY IF EXISTS "Public Access - INSERT" ON relatorio_secoes;
DROP POLICY IF EXISTS "Public Access - UPDATE" ON relatorio_secoes;
DROP POLICY IF EXISTS "Public Access - DELETE" ON relatorio_secoes;

DROP POLICY IF EXISTS "Allow public read access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Allow public insert access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Allow public update access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Allow public delete access" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Public Access - SELECT" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Public Access - INSERT" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Public Access - UPDATE" ON relatorio_pendencias;
DROP POLICY IF EXISTS "Public Access - DELETE" ON relatorio_pendencias;

-- 8. CRIAR POLICIES SIMPLES (SEM RLS)
-- Relatórios
CREATE POLICY "Enable all for relatorios_pendencias"
    ON relatorios_pendencias
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Seções
CREATE POLICY "Enable all for relatorio_secoes"
    ON relatorio_secoes
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Pendências
CREATE POLICY "Enable all for relatorio_pendencias"
    ON relatorio_pendencias
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 9. HABILITAR RLS (com policies permissivas)
ALTER TABLE relatorios_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- 10. GARANTIR QUE O BUCKET 'fotos' EXISTE E É PÚBLICO
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 11. REMOVER POLICIES ANTIGAS DO BUCKET
DROP POLICY IF EXISTS "Public Access - SELECT" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - DELETE" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Enable all for fotos bucket" ON storage.objects;

-- 12. CRIAR POLICY ÚNICA E SIMPLES PARA O BUCKET
CREATE POLICY "Enable all for fotos bucket"
    ON storage.objects
    FOR ALL
    TO public
    USING (bucket_id = 'fotos')
    WITH CHECK (bucket_id = 'fotos');

-- 13. VERIFICAÇÃO FINAL
SELECT 'TABELAS CRIADAS:' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%relatorio%'
ORDER BY table_name;

SELECT 'COLUNAS DE relatorio_pendencias:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'relatorio_pendencias'
ORDER BY ordinal_position;

SELECT 'RLS STATUS:' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%relatorio%';

SELECT 'POLICIES:' as info;
SELECT tablename, policyname
FROM pg_policies
WHERE tablename LIKE '%relatorio%';

SELECT 'BUCKET STATUS:' as info;
SELECT id, name, public
FROM storage.buckets
WHERE name = 'fotos';
