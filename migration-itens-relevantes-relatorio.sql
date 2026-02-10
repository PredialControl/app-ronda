-- Criação da tabela para armazenar itens relevantes do relatório
-- Cada item é vinculado a um contrato e mês específico

CREATE TABLE IF NOT EXISTS public.itens_relevantes_relatorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  mes TEXT NOT NULL, -- Formato: AAAA-MM (ex: 2026-02)
  descricao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_itens_relevantes_contrato_mes
  ON public.itens_relevantes_relatorio(contrato_id, mes);

CREATE INDEX IF NOT EXISTS idx_itens_relevantes_data
  ON public.itens_relevantes_relatorio(data DESC);

-- RLS (Row Level Security)
ALTER TABLE public.itens_relevantes_relatorio ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_itens_relevantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_itens_relevantes_updated_at
  BEFORE UPDATE ON public.itens_relevantes_relatorio
  FOR EACH ROW
  EXECUTE FUNCTION update_itens_relevantes_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.itens_relevantes_relatorio IS 'Armazena itens relevantes para inclusão no relatório mensal de cada contrato';
COMMENT ON COLUMN public.itens_relevantes_relatorio.contrato_id IS 'ID do contrato ao qual o item pertence';
COMMENT ON COLUMN public.itens_relevantes_relatorio.mes IS 'Mês de referência no formato AAAA-MM';
COMMENT ON COLUMN public.itens_relevantes_relatorio.descricao IS 'Descrição do item relevante';
COMMENT ON COLUMN public.itens_relevantes_relatorio.data IS 'Data de criação do item';
