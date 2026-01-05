-- ========================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

-- 1. Listar todas as tabelas
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%pendencia%'
ORDER BY table_name;

-- 2. Ver colunas da tabela (tente cada uma dessas)
-- Opção 1: relatorio_pendencias
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'relatorio_pendencias'
ORDER BY ordinal_position;

-- Opção 2: relatorios_pendencias
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'relatorios_pendencias'
ORDER BY ordinal_position;

-- 3. Tentar SELECT em cada possível nome
-- Se der erro, ignore e tente o próximo
SELECT * FROM relatorio_pendencias LIMIT 1;
SELECT * FROM relatorios_pendencias LIMIT 1;
