-- ============================================================
-- Migração: aba Chamados (inspirada em registro-de-chamados)
-- Reusa a tabela existente `contratos` como "prédios".
-- Execute no SQL Editor do Supabase — UMA VEZ.
-- ============================================================

-- 1) Tabela principal de chamados
CREATE TABLE IF NOT EXISTS chamados (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id  UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  usuario_id   UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  numero_ticket TEXT NULL,                 -- identificador externo (opcional)
  local        TEXT NOT NULL,              -- onde foi encontrado
  descricao    TEXT NOT NULL,              -- o que foi apontado
  status       TEXT NOT NULL DEFAULT 'aguardando_vistoria'
    CHECK (status IN ('itens_apontados','em_andamento','improcedente','aguardando_vistoria','concluido','f_indevido')),
  responsavel  TEXT NULL
    CHECK (responsavel IN ('Condominio','Construtora') OR responsavel IS NULL),
  prazo        DATE NULL,
  reprogramacao_data DATE NULL,
  retorno_construtora TEXT NULL,
  parecer_engenharia  TEXT NULL,
  foto_urls    JSONB NOT NULL DEFAULT '[]'::jsonb,
  historico_reprogramacao JSONB NOT NULL DEFAULT '[]'::jsonb,
  atualizacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Índices para performance
CREATE INDEX IF NOT EXISTS idx_chamados_contrato  ON chamados (contrato_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status    ON chamados (status);
CREATE INDEX IF NOT EXISTS idx_chamados_created   ON chamados (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chamados_prazo     ON chamados (prazo);

-- 3) Trigger de updated_at automático
CREATE OR REPLACE FUNCTION chamados_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chamados_updated_at ON chamados;
CREATE TRIGGER chamados_updated_at
BEFORE UPDATE ON chamados
FOR EACH ROW EXECUTE FUNCTION chamados_set_updated_at();

-- 4) RLS opcional (por enquanto liberado para anon via authService do app)
ALTER TABLE chamados DISABLE ROW LEVEL SECURITY;

-- 5) Verificação
SELECT
  (SELECT COUNT(*) FROM chamados) AS total_chamados,
  (SELECT COUNT(*) FROM contratos) AS total_contratos;
