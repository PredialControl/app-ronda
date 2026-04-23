-- ============================================================
-- Migração: Link Drive + resetar laudos em Em Análise
-- Data: 2026-04-23
-- Executar no SQL Editor do Supabase
-- ============================================================
-- 1) Adiciona coluna link_drive
-- 2) Apaga todos os laudos existentes
-- 3) Re-semeia a lista dos 15 documentos em status 'em-analise'
-- ============================================================

BEGIN;

-- 1. Adicionar coluna link_drive (se não existir)
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS link_drive TEXT;

-- 2. Apagar todos os laudos existentes
DELETE FROM laudos;

-- 3. Semear a lista nova com status 'em-analise' e SEM data_vencimento
INSERT INTO laudos (contrato_id, titulo, periodicidade, status)
SELECT c.id, l.titulo, l.periodicidade, 'em-analise'
FROM contratos c
CROSS JOIN (VALUES
    ('Auto de Vistoria do Corpo de Bombeiros (AVCB)', 'A cada 5 anos'),
    ('Laudo de Estanqueidade de Gás', 'A cada 3 anos'),
    ('Laudo de Arrancamento dos Pontos de Ancoragem', 'Anual'),
    ('Certificado de Teste e Funcionamento do SDAI', 'Anual'),
    ('Certificado de Teste e Funcionamento da Bomba de Incêndio', 'Anual'),
    ('Certificado de Pressurização dos Extintores', 'Anual'),
    ('Certificado de Teste Hidrostático das Mangueiras dos Hidrantes', 'Anual'),
    ('Relatório de Inspeção Anual dos Elevadores (RIA)', 'Anual'),
    ('Laudo de SPDA', 'Anual'),
    ('Plano de Manutenção Operação e Controle (PMOC)', 'Anual'),
    ('Análise de Qualidade do Ar', 'Anual'),
    ('Certificado de Limpeza dos Poços e Prumadas', 'Anual'),
    ('Certificado de Desinsetização e Desratização', 'Semestral'),
    ('Certificado de Limpeza dos Reservatórios', 'Semestral'),
    ('Análise de Potabilidade', 'Semestral')
) AS l(titulo, periodicidade);

-- 4. Verificação
SELECT c.nome AS contrato, COUNT(l.id) AS total_laudos
FROM contratos c
LEFT JOIN laudos l ON l.contrato_id = c.id
GROUP BY c.nome
ORDER BY c.nome;

COMMIT;
