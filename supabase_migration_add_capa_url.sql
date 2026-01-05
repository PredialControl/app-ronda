-- Adicionar coluna capa_url à tabela relatorios_pendencias
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS capa_url TEXT;

-- Comentário descrevendo o campo
COMMENT ON COLUMN relatorios_pendencias.capa_url IS 'URL da imagem de capa personalizada do relatório';
