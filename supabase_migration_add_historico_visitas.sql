-- Adicionar campos de histórico de visitas à tabela relatorios_pendencias
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS data_inicio_vistoria TEXT;

ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS historico_visitas TEXT[];

ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS data_situacao_atual TEXT;

-- Comentários descrevendo os campos
COMMENT ON COLUMN relatorios_pendencias.data_inicio_vistoria IS 'Data de início das vistorias (formato: DD/MM/YYYY)';
COMMENT ON COLUMN relatorios_pendencias.historico_visitas IS 'Lista de datas e descrições das visitas realizadas';
COMMENT ON COLUMN relatorios_pendencias.data_situacao_atual IS 'Data da situação atual das vistorias (formato: DD/MM/YYYY)';
