-- Migration: Add teste_status column to areas_tecnicas table
-- Description: Adds a new column to store the test status for technical areas

-- Add teste_status column
ALTER TABLE areas_tecnicas 
ADD COLUMN IF NOT EXISTS teste_status TEXT CHECK (teste_status IN ('TESTADO', 'NAO_TESTADO')) DEFAULT 'TESTADO';

-- Add comment to document the column
COMMENT ON COLUMN areas_tecnicas.teste_status IS 'Status do teste do ativo: TESTADO ou NAO_TESTADO';

-- Update existing rows to have default value
UPDATE areas_tecnicas SET teste_status = 'TESTADO' WHERE teste_status IS NULL;
