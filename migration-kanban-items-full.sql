-- ============================================================
-- Migração: tabela kanban_items_full (Kanban compartilhado entre devices)
-- Executar no SQL Editor do Supabase — UMA VEZ
-- ============================================================

CREATE TABLE IF NOT EXISTS kanban_items_full (
    contrato_id UUID PRIMARY KEY REFERENCES contratos(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_items_full_updated ON kanban_items_full(updated_at);

ALTER TABLE kanban_items_full ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso total a kanban_items_full" ON kanban_items_full;
CREATE POLICY "Permitir acesso total a kanban_items_full"
    ON kanban_items_full FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verificação
SELECT COUNT(*) AS linhas FROM kanban_items_full;
