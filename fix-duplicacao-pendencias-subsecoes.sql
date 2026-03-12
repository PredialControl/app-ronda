-- ================================================================
-- FIX: Remover duplicação de pendências entre seções e subseções
-- ================================================================
-- PROBLEMA: Pendências de subseções estavam sendo salvas com
--           secao_id E subsecao_id ao mesmo tempo, causando
--           duplicação visual (apareciam na seção E na subseção)
--
-- SOLUÇÃO: Pendências de subseções devem ter APENAS subsecao_id
--          (a ligação com a seção é através da subseção)
-- ================================================================

-- 1. IDENTIFICAR pendências duplicadas (com secao_id E subsecao_id)
SELECT
    id,
    local,
    descricao,
    secao_id,
    subsecao_id,
    'DUPLICADA (tem secao_id E subsecao_id)' as status
FROM relatorio_pendencias
WHERE subsecao_id IS NOT NULL
  AND secao_id IS NOT NULL;

-- 2. CORRIGIR: Remover secao_id de pendências que pertencem a subseções
UPDATE relatorio_pendencias
SET secao_id = NULL
WHERE subsecao_id IS NOT NULL
  AND secao_id IS NOT NULL;

-- 3. VERIFICAR resultado
SELECT
    COUNT(*) as total_pendencias,
    COUNT(CASE WHEN secao_id IS NOT NULL AND subsecao_id IS NULL THEN 1 END) as pendencias_diretas_secao,
    COUNT(CASE WHEN subsecao_id IS NOT NULL AND secao_id IS NULL THEN 1 END) as pendencias_em_subsecao,
    COUNT(CASE WHEN subsecao_id IS NOT NULL AND secao_id IS NOT NULL THEN 1 END) as pendencias_duplicadas
FROM relatorio_pendencias;

-- 4. RESULTADO ESPERADO:
--    - pendencias_duplicadas = 0 ✅
--    - pendencias_diretas_secao = pendências que estão direto na seção (sem subseção)
--    - pendencias_em_subsecao = pendências que estão dentro de subseções
