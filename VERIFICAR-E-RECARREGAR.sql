-- ========================================
-- VERIFICAR SE TABELAS EXISTEM E RECARREGAR CACHE
-- ========================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT 'VERIFICANDO TABELAS EXISTENTES:' as info;
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
ORDER BY tablename;

-- 2. VERIFICAR COLUNAS
SELECT 'COLUNAS DE relatorios_pendencias:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'relatorios_pendencias'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE AS TABELAS ESTÃO NO SCHEMA PUBLIC
SELECT 'TABELAS NO SCHEMA PUBLIC:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE '%relatorio%'
ORDER BY table_name;

-- 4. FORÇAR RELOAD DO SCHEMA CACHE DO POSTGREST
-- Método 1: Notificar o PostgREST via NOTIFY
NOTIFY pgrst, 'reload schema';

-- Método 2: Garantir que as permissões estão corretas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Permissões específicas para as tabelas de relatórios
GRANT ALL ON relatorios_pendencias TO anon, authenticated, service_role;
GRANT ALL ON relatorio_secoes TO anon, authenticated, service_role;
GRANT ALL ON relatorio_pendencias TO anon, authenticated, service_role;

-- 5. VERIFICAR PERMISSÕES
SELECT 'PERMISSÕES DAS TABELAS:' as info;
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
ORDER BY table_name, grantee, privilege_type;

-- 6. VERIFICAR RLS
SELECT 'STATUS RLS:' as info;
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
ORDER BY tablename;

-- 7. VERIFICAR POLICIES
SELECT 'POLICIES CONFIGURADAS:' as info;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
ORDER BY tablename, policyname;

-- 8. TENTAR INSERIR UM REGISTRO DE TESTE
INSERT INTO relatorios_pendencias (
    contrato_id,
    titulo,
    data_inicio_vistoria,
    data_situacao_atual
) VALUES (
    'df669db3-ce0c-4d05-af58-2445c39d930a',
    'Teste de Relatório',
    '2025-12-11',
    '2025-12-11'
) RETURNING id, titulo, created_at;

SELECT '✅ VERIFICAÇÃO COMPLETA!' as status;
SELECT 'Se você viu um ID retornado acima, as tabelas estão funcionando!' as mensagem;
SELECT 'Agora aguarde 10 segundos e tente novamente na aplicação.' as proxima_etapa;
