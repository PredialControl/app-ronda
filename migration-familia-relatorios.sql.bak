-- Adicionar coluna família nos relatórios de pendências
ALTER TABLE relatorios_pendencias ADD COLUMN IF NOT EXISTS familia TEXT;

-- Índice para busca por família dentro de um contrato
CREATE INDEX IF NOT EXISTS idx_relatorios_pendencias_familia
  ON relatorios_pendencias (contrato_id, familia);
