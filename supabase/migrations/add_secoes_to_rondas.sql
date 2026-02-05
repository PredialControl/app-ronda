-- Adicionar coluna secoes na tabela rondas
-- Esta coluna armazena as seções dinâmicas do relatório em formato JSON

ALTER TABLE rondas
ADD COLUMN IF NOT EXISTS secoes JSONB;

-- Adicionar comentário explicativo
COMMENT ON COLUMN rondas.secoes IS 'Seções dinâmicas do relatório (I - Objetivo, II - Observações, etc.) armazenadas como JSON';
