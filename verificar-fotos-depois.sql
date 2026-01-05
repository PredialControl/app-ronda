-- ========================================
-- VERIFICAR FOTOS "DEPOIS" NO BANCO
-- ========================================

-- Ver todas as pendências com suas fotos
SELECT
    rp.id,
    rp.ordem,
    rp.local,
    SUBSTRING(rp.descricao, 1, 50) as descricao,
    CASE
        WHEN rp.foto_url IS NULL THEN '❌ SEM FOTO'
        ELSE '✅ TEM FOTO'
    END as foto_antes,
    CASE
        WHEN rp.foto_depois_url IS NULL THEN '❌ SEM FOTO DEPOIS'
        ELSE '✅ TEM FOTO DEPOIS'
    END as foto_depois,
    rp.foto_url,
    rp.foto_depois_url,
    rp.created_at
FROM relatorio_pendencias rp
ORDER BY rp.created_at DESC
LIMIT 20;

-- Contar quantas pendências têm foto_depois_url
SELECT
    COUNT(*) FILTER (WHERE foto_depois_url IS NOT NULL) as com_foto_depois,
    COUNT(*) FILTER (WHERE foto_depois_url IS NULL) as sem_foto_depois,
    COUNT(*) as total
FROM relatorio_pendencias;

-- Ver estrutura da última pendência inserida/atualizada
SELECT
    id,
    ordem,
    local,
    descricao,
    foto_url,
    foto_depois_url,
    created_at,
    secao_id
FROM relatorio_pendencias
ORDER BY created_at DESC
LIMIT 1;
