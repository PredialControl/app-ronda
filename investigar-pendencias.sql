-- ================================================================
-- INVESTIGAÇÃO DE PENDÊNCIAS PERDIDAS - NIK SUNSET PAULISTA
-- RODE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- ================================================================

-- 1. Buscar relatórios com "Nik Sunset" no título
SELECT '========== 1. RELATÓRIOS COM "NIK SUNSET" ==========' as info;

SELECT
    id,
    titulo,
    created_at,
    updated_at
FROM relatorios_pendencias
WHERE titulo ILIKE '%Nik Sunset%'
ORDER BY created_at DESC;

-- 2. Contar TODAS as pendências do relatório (incluindo as com subsecao_id)
SELECT '========== 2. TOTAL DE PENDÊNCIAS (TODAS) ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
)
SELECT COUNT(*) as total_pendencias_no_banco
FROM relatorio_pendencias rp
JOIN relatorio_secoes rs ON rp.secao_id = rs.id
JOIN relatorio r ON rs.relatorio_id = r.id;

-- 3. Contar pendências SEM subsecao_id (as que aparecem no app)
SELECT '========== 3. PENDÊNCIAS SEM SUBSECAO_ID (VISÍVEIS) ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
)
SELECT COUNT(*) as pendencias_sem_subsecao
FROM relatorio_pendencias rp
JOIN relatorio_secoes rs ON rp.secao_id = rs.id
JOIN relatorio r ON rs.relatorio_id = r.id
WHERE rp.subsecao_id IS NULL;

-- 4. Contar pendências COM subsecao_id (as que estão sendo FILTRADAS)
SELECT '========== 4. PENDÊNCIAS COM SUBSECAO_ID (FILTRADAS!) ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
)
SELECT COUNT(*) as pendencias_com_subsecao_FILTRADAS
FROM relatorio_pendencias rp
JOIN relatorio_secoes rs ON rp.secao_id = rs.id
JOIN relatorio r ON rs.relatorio_id = r.id
WHERE rp.subsecao_id IS NOT NULL;

-- 5. Listar TODAS as pendências com subsecao_id (para análise)
SELECT '========== 5. DETALHES DAS PENDÊNCIAS FILTRADAS ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
)
SELECT
    rp.id,
    rp.ordem,
    rp.local,
    rp.descricao,
    rp.subsecao_id,
    rs.titulo_principal as secao,
    rsub.titulo as subsecao_titulo,
    rp.created_at
FROM relatorio_pendencias rp
JOIN relatorio_secoes rs ON rp.secao_id = rs.id
JOIN relatorio r ON rs.relatorio_id = r.id
LEFT JOIN relatorio_subsecoes rsub ON rp.subsecao_id = rsub.id
WHERE rp.subsecao_id IS NOT NULL
ORDER BY rs.ordem, rp.ordem;

-- 6. Análise por seção
SELECT '========== 6. ANÁLISE POR SEÇÃO ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
)
SELECT
    rs.ordem,
    rs.titulo_principal,
    rs.subtitulo,
    COUNT(CASE WHEN rp.subsecao_id IS NULL THEN 1 END) as pendencias_diretas,
    COUNT(CASE WHEN rp.subsecao_id IS NOT NULL THEN 1 END) as pendencias_em_subsecoes,
    COUNT(*) as total
FROM relatorio_secoes rs
LEFT JOIN relatorio_pendencias rp ON rp.secao_id = rs.id
WHERE rs.relatorio_id = (SELECT id FROM relatorio)
GROUP BY rs.id, rs.ordem, rs.titulo_principal, rs.subtitulo
ORDER BY rs.ordem;

-- 7. Listar subseções existentes
SELECT '========== 7. SUBSEÇÕES DO RELATÓRIO ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
)
SELECT
    rsub.id,
    rs.titulo_principal as secao,
    rsub.titulo as subsecao,
    rsub.ordem,
    COUNT(rp.id) as num_pendencias
FROM relatorio_subsecoes rsub
JOIN relatorio_secoes rs ON rsub.secao_id = rs.id
LEFT JOIN relatorio_pendencias rp ON rp.subsecao_id = rsub.id
WHERE rs.relatorio_id = (SELECT id FROM relatorio)
GROUP BY rsub.id, rs.titulo_principal, rsub.titulo, rsub.ordem
ORDER BY rs.ordem, rsub.ordem;

-- 8. RESUMO FINAL
SELECT '========== 8. RESUMO FINAL ==========' as info;

WITH relatorio AS (
    SELECT id FROM relatorios_pendencias
    WHERE titulo ILIKE '%Nik Sunset%' AND titulo ILIKE '%molhadas%'
    LIMIT 1
),
contagens AS (
    SELECT
        COUNT(*) as total_no_banco,
        COUNT(CASE WHEN rp.subsecao_id IS NULL THEN 1 END) as visiveis_no_app,
        COUNT(CASE WHEN rp.subsecao_id IS NOT NULL THEN 1 END) as sendo_filtradas
    FROM relatorio_pendencias rp
    JOIN relatorio_secoes rs ON rp.secao_id = rs.id
    WHERE rs.relatorio_id = (SELECT id FROM relatorio)
)
SELECT
    total_no_banco as "Total de pendências no banco de dados",
    visiveis_no_app as "Pendências visíveis no app (sem subsecao_id)",
    sendo_filtradas as "Pendências OCULTAS pelo filtro (com subsecao_id)",
    CASE
        WHEN sendo_filtradas > 0 THEN
            '⚠️ PROBLEMA ENCONTRADO! Há ' || sendo_filtradas || ' pendências sendo filtradas pelo código!'
        ELSE
            '✅ OK - Nenhuma pendência está sendo filtrada'
    END as diagnostico
FROM contagens;

-- ================================================================
-- DIAGNÓSTICO:
-- Se "sendo_filtradas" > 0, significa que o problema é no código
-- (linhas 33 e 84 do relatorioPendenciasService.ts)
--
-- Se "total_no_banco" = 32, significa que os dados foram DELETADOS
-- e será necessário restaurar do backup
-- ================================================================
