-- Migration to add tipo_visita column to rondas table

ALTER TABLE rondas 
ADD COLUMN IF NOT EXISTS tipo_visita VARCHAR(50) DEFAULT 'RONDA';

-- Update existing records to have a default type
UPDATE rondas 
SET tipo_visita = 'RONDA' 
WHERE tipo_visita IS NULL;
