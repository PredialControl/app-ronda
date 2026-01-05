-- ========================================
-- TESTE: Verificar se executou o script de migração
-- ========================================

-- 1. Verificar se a tabela relatorio_subsecoes existe
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'relatorio_subsecoes'
) AS tabela_subsecoes_existe;

-- 2. Verificar se a coluna tem_subsecoes existe
SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'relatorio_secoes'
    AND column_name = 'tem_subsecoes'
) AS coluna_tem_subsecoes_existe;

-- 3. Verificar se a coluna subsecao_id existe
SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'relatorio_pendencias'
    AND column_name = 'subsecao_id'
) AS coluna_subsecao_id_existe;

-- ========================================
-- RESULTADO ESPERADO:
-- Se as 3 queries retornarem "true", o script foi executado!
-- Se alguma retornar "false", você PRECISA executar o migration_subsecoes.sql
-- ========================================
