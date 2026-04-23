-- ============================================================
-- Migração: Resetar laudos de TODOS os contratos com a nova lista
-- Data: 2026-04-23
-- Executar no SQL Editor do Supabase
-- ============================================================
-- Essa migração é DESTRUTIVA: apaga TODOS os laudos atuais e
-- substitui pela lista nova de 15 documentos para cada contrato.
-- ============================================================

BEGIN;

-- 1. Apagar TODOS os laudos existentes
DELETE FROM laudos;

-- 2. Inserir a nova lista padrão para cada contrato
-- (status = 'vencidos' e data_vencimento = ontem, igual ao que o initializeDefaults faz)
INSERT INTO laudos (contrato_id, titulo, periodicidade, status, data_vencimento)
SELECT c.id, l.titulo, l.periodicidade, 'vencidos', (CURRENT_DATE - INTERVAL '1 day')::date
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

-- 3. Verificar o resultado
SELECT
    c.nome AS contrato,
    COUNT(l.id) AS total_laudos
FROM contratos c
LEFT JOIN laudos l ON l.contrato_id = c.id
GROUP BY c.nome
ORDER BY c.nome;

COMMIT;
