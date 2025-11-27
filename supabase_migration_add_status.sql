-- Migration to add status column to contratos table

ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'EM IMPLANTACAO';

-- Update existing records to have a default status
UPDATE contratos 
SET status = 'EM IMPLANTACAO' 
WHERE status IS NULL;
