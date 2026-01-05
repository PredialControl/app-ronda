-- Adicionar coluna foto_depois_url à tabela relatorio_pendencias
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS foto_depois_url TEXT;

-- Comentário descrevendo o campo
COMMENT ON COLUMN relatorio_pendencias.foto_depois_url IS 'URL da foto "depois" (item corrigido)';
