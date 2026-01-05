-- Adicionar coluna foto_localidade_url à tabela relatorios_pendencias
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS foto_localidade_url TEXT;

-- Comentário descrevendo o campo
COMMENT ON COLUMN relatorios_pendencias.foto_localidade_url IS 'URL da foto da localidade do empreendimento';
