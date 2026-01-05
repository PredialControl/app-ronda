-- ========================================
-- SOLUÇÃO IMEDIATA - RECARREGAR SCHEMA CACHE
-- ========================================

-- Este script força o PostgREST a recarregar o schema cache
-- Execute este script e aguarde 10 segundos antes de testar

-- 1. Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

-- 2. Garantir permissões corretas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Permissões específicas para as novas tabelas
GRANT ALL PRIVILEGES ON relatorios_pendencias TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON relatorio_secoes TO anon, authenticated, service_role, postgres;
GRANT ALL PRIVILEGES ON relatorio_pendencias TO anon, authenticated, service_role, postgres;

-- 4. Garantir que RLS está habilitado com policies permissivas
ALTER TABLE relatorios_pendencias FORCE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes FORCE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias FORCE ROW LEVEL SECURITY;

-- 5. Recriar policies se necessário
DROP POLICY IF EXISTS "Enable all for relatorios_pendencias" ON relatorios_pendencias;
DROP POLICY IF EXISTS "Enable all for relatorio_secoes" ON relatorio_secoes;
DROP POLICY IF EXISTS "Enable all for relatorio_pendencias" ON relatorio_pendencias;

CREATE POLICY "Enable all for relatorios_pendencias"
    ON relatorios_pendencias
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for relatorio_secoes"
    ON relatorio_secoes
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for relatorio_pendencias"
    ON relatorio_pendencias
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Verificação rápida
SELECT 'TABELAS CRIADAS:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%relatorio%';

SELECT 'PERMISSÕES OK:' as status;
SELECT DISTINCT grantee, table_name
FROM information_schema.table_privileges
WHERE table_name IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
AND grantee IN ('anon', 'authenticated');

SELECT '✅ EXECUTADO COM SUCESSO!' as resultado;
SELECT 'Aguarde 10-30 segundos para o cache recarregar' as instrucao;
