-- =====================================================
-- Script para corrigir a numeração (ordem) das pendências
-- que foram criadas com ordem errada pelo ColetaLite
-- =====================================================

-- Renumerar pendências SEM subseção (diretas na seção)
-- Ordena por created_at (ordem de criação) e renumera 0, 1, 2, 3...
WITH ranked AS (
  SELECT
    id,
    secao_id,
    ROW_NUMBER() OVER (PARTITION BY secao_id ORDER BY created_at ASC) - 1 AS nova_ordem
  FROM relatorio_pendencias
  WHERE subsecao_id IS NULL
)
UPDATE relatorio_pendencias
SET ordem = ranked.nova_ordem
FROM ranked
WHERE relatorio_pendencias.id = ranked.id;

-- Renumerar pendências COM subseção
-- Ordena por created_at (ordem de criação) e renumera 0, 1, 2, 3... por subseção
WITH ranked_sub AS (
  SELECT
    id,
    subsecao_id,
    ROW_NUMBER() OVER (PARTITION BY subsecao_id ORDER BY created_at ASC) - 1 AS nova_ordem
  FROM relatorio_pendencias
  WHERE subsecao_id IS NOT NULL
)
UPDATE relatorio_pendencias
SET ordem = ranked_sub.nova_ordem
FROM ranked_sub
WHERE relatorio_pendencias.id = ranked_sub.id;

-- Verificar resultado
SELECT
  secao_id,
  subsecao_id,
  ordem,
  local,
  LEFT(descricao, 50) as descricao_resumida,
  created_at
FROM relatorio_pendencias
ORDER BY secao_id, subsecao_id NULLS FIRST, ordem;
