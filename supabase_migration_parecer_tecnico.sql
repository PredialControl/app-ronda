-- Migration: Create Parecer Técnico Tables
-- Description: Creates tables for technical report system with topics and images

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pareceres_tecnicos table
CREATE TABLE IF NOT EXISTS pareceres_tecnicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  finalidade TEXT NOT NULL,
  narrativa_cenario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parecer_topicos table
CREATE TABLE IF NOT EXISTS parecer_topicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parecer_id UUID NOT NULL REFERENCES pareceres_tecnicos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parecer_imagens table
CREATE TABLE IF NOT EXISTS parecer_imagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topico_id UUID NOT NULL REFERENCES parecer_topicos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pareceres_contrato ON pareceres_tecnicos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_topicos_parecer ON parecer_topicos(parecer_id);
CREATE INDEX IF NOT EXISTS idx_topicos_ordem ON parecer_topicos(parecer_id, ordem);
CREATE INDEX IF NOT EXISTS idx_imagens_topico ON parecer_imagens(topico_id);
CREATE INDEX IF NOT EXISTS idx_imagens_ordem ON parecer_imagens(topico_id, ordem);

-- Enable Row Level Security (RLS)
ALTER TABLE pareceres_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parecer_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parecer_imagens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for authenticated users)
CREATE POLICY "Enable all operations for authenticated users" ON pareceres_tecnicos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON parecer_topicos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON parecer_imagens
  FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parecer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_parecer_timestamp
  BEFORE UPDATE ON pareceres_tecnicos
  FOR EACH ROW
  EXECUTE FUNCTION update_parecer_updated_at();

-- Comments for documentation
COMMENT ON TABLE pareceres_tecnicos IS 'Stores technical reports (pareceres técnicos) for contracts';
COMMENT ON TABLE parecer_topicos IS 'Stores topics/sections within technical reports';
COMMENT ON TABLE parecer_imagens IS 'Stores images associated with report topics';
