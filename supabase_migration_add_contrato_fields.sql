-- Adicionar campos tipo_uso e quantidade_torres à tabela contratos
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS tipo_uso TEXT CHECK (tipo_uso IN ('RESIDENCIAL', 'NAO_RESIDENCIAL', 'RESIDENCIAL_E_NAO_RESIDENCIAL'));

ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS quantidade_torres INTEGER;

-- Comentários descrevendo os campos
COMMENT ON COLUMN contratos.tipo_uso IS 'Tipo de uso do empreendimento: Residencial, Não Residencial ou Residencial e Não Residencial';
COMMENT ON COLUMN contratos.quantidade_torres IS 'Quantidade de torres do empreendimento';
