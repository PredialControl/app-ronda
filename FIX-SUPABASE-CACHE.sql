-- ========================================
-- FORÇAR ATUALIZAÇÃO DO CACHE DO SUPABASE
-- ========================================

-- 1. Verificar se a tabela existe
SELECT
    'VERIFICAÇÃO: Tabela existe?' as info,
    EXISTS(
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'relatorios_pendencias'
    ) as tabela_existe;

-- 2. Se não existir, criar
CREATE TABLE IF NOT EXISTS relatorios_pendencias (
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

CREATE TABLE IF NOT EXISTS relatorio_secoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relatorio_id UUID NOT NULL REFERENCES relatorios_pendencias(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo_principal TEXT NOT NULL,
    subtitulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relatorio_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    foto_depois_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Garantir que RLS está DESABILITADO
ALTER TABLE relatorios_pendencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias DISABLE ROW LEVEL SECURITY;

-- 4. Remover TODAS as policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE tablename IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 5. Criar UMA ÚNICA policy para cada tabela
CREATE POLICY "Allow all operations"
    ON relatorios_pendencias
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations"
    ON relatorio_secoes
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations"
    ON relatorio_pendencias
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Habilitar RLS
ALTER TABLE relatorios_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- 7. FORÇAR reload do schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 8. Verificação final
SELECT 'TABELAS PÚBLICAS:' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%relatorio%';

SELECT 'POLICIES ATIVAS:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE '%relatorio%';
