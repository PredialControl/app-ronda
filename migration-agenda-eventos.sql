-- ============================================================
-- Migração Agenda: agenda_eventos (manual) + kanban_eventos (shared)
-- Data: 2026-04-23
-- Executar no SQL Editor do Supabase
-- ============================================================

-- 1) Tabela agenda_eventos (eventos manuais — vermelho)
CREATE TABLE IF NOT EXISTS agenda_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'programado'
        CHECK (status IN ('programado', 'executado')),
    contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,
    contrato_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_eventos_data ON agenda_eventos(data);
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_contrato ON agenda_eventos(contrato_id);

ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total a agenda_eventos" ON agenda_eventos;
CREATE POLICY "Permitir acesso total a agenda_eventos"
    ON agenda_eventos FOR ALL
    USING (true)
    WITH CHECK (true);


-- 2) Tabela kanban_eventos (shadow table — sincroniza items do Kanban
--    que têm data, pra todos os logins/devices verem na Agenda)
CREATE TABLE IF NOT EXISTS kanban_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kanban_item_id TEXT NOT NULL,
    contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    contrato_nome TEXT NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT,
    status TEXT NOT NULL,
    data_andamento DATE,
    data_vistoria DATE,
    data_recebimento DATE,
    data_correcao DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (contrato_id, kanban_item_id)
);

CREATE INDEX IF NOT EXISTS idx_kanban_eventos_contrato ON kanban_eventos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_kanban_eventos_datas ON kanban_eventos(data_andamento, data_vistoria, data_recebimento, data_correcao);

ALTER TABLE kanban_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total a kanban_eventos" ON kanban_eventos;
CREATE POLICY "Permitir acesso total a kanban_eventos"
    ON kanban_eventos FOR ALL
    USING (true)
    WITH CHECK (true);


-- 3) Verificar
SELECT 'agenda_eventos' AS tabela, COUNT(*) AS linhas FROM agenda_eventos
UNION ALL
SELECT 'kanban_eventos' AS tabela, COUNT(*) AS linhas FROM kanban_eventos;
