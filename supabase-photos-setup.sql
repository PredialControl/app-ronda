-- Configuração otimizada para muitas fotos
-- Execute este SQL no Editor SQL do Supabase

-- 1. Atualizar a tabela fotos_ronda existente
ALTER TABLE fotos_ronda 
ADD COLUMN IF NOT EXISTS url_foto TEXT,
ADD COLUMN IF NOT EXISTS nome_arquivo TEXT,
ADD COLUMN IF NOT EXISTS tamanho INTEGER,
ADD COLUMN IF NOT EXISTS tipo_mime TEXT;

-- 2. Criar nova tabela para fotos de áreas técnicas (múltiplas fotos por área)
CREATE TABLE IF NOT EXISTS fotos_areas_tecnicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_tecnica_id UUID REFERENCES areas_tecnicas(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  tipo_mime TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de armazenamento de arquivos (bucket do Supabase)
-- Esta tabela será criada automaticamente pelo Supabase Storage

-- 4. Índices para melhor performance com muitas fotos
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_ronda_id ON fotos_ronda(ronda_id);
CREATE INDEX IF NOT EXISTS idx_fotos_areas_tecnicas_area_id ON fotos_areas_tecnicas(area_tecnica_id);
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_created_at ON fotos_ronda(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fotos_areas_tecnicas_created_at ON fotos_areas_tecnicas(created_at DESC);

-- 5. Políticas de segurança (RLS - Row Level Security)
-- Habilitar RLS nas tabelas
ALTER TABLE fotos_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_areas_tecnicas ENABLE ROW LEVEL SECURITY;

-- 6. Política para permitir leitura pública (pode ser ajustada conforme necessário)
CREATE POLICY "Permitir leitura pública de fotos" ON fotos_ronda
  FOR SELECT USING (true);

CREATE POLICY "Permitir leitura pública de fotos de áreas" ON fotos_areas_tecnicas
  FOR SELECT USING (true);

-- 7. Política para permitir inserção (pode ser ajustada conforme necessário)
CREATE POLICY "Permitir inserção de fotos" ON fotos_ronda
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir inserção de fotos de áreas" ON fotos_areas_tecnicas
  FOR INSERT WITH CHECK (true);

-- 8. Função para limpar fotos antigas (opcional - para manutenção)
CREATE OR REPLACE FUNCTION limpar_fotos_antigas(dias_para_manter INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  fotos_removidas INTEGER;
BEGIN
  -- Remover fotos de rondas antigas
  DELETE FROM fotos_ronda 
  WHERE created_at < NOW() - INTERVAL '1 day' * dias_para_manter;
  
  GET DIAGNOSTICS fotos_removidas = ROW_COUNT;
  
  -- Remover fotos de áreas técnicas antigas
  DELETE FROM fotos_areas_tecnicas 
  WHERE created_at < NOW() - INTERVAL '1 day' * dias_para_manter;
  
  GET DIAGNOSTICS fotos_removidas = fotos_removidas + ROW_COUNT;
  
  RETURN fotos_removidas;
END;
$$ LANGUAGE plpgsql;

-- 9. Comentários para documentação
COMMENT ON TABLE fotos_ronda IS 'Fotos gerais das rondas com metadados otimizados';
COMMENT ON TABLE fotos_areas_tecnicas IS 'Fotos específicas das áreas técnicas com metadados';
COMMENT ON COLUMN fotos_ronda.url_foto IS 'URL da foto no Supabase Storage';
COMMENT ON COLUMN fotos_ronda.tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN fotos_ronda.tipo_mime IS 'Tipo MIME da imagem (ex: image/jpeg)';

-- 10. Verificar se as tabelas foram criadas corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('fotos_ronda', 'fotos_areas_tecnicas')
ORDER BY table_name, ordinal_position;

