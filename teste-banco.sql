-- Script para testar o banco de dados
-- Execute este script no Supabase SQL Editor após o setup-banco-completo.sql

-- 1. Teste de inserção de contrato
INSERT INTO contratos (nome, sindico, endereco, periodicidade, observacoes) 
VALUES (
    'Teste Contrato', 
    'João Silva', 
    'Rua Teste, 123', 
    'MENSAL', 
    'Contrato de teste'
) RETURNING id, nome;

-- 2. Teste de inserção de ronda
INSERT INTO rondas (nome, contrato, data, hora, responsavel, observacoes_gerais)
VALUES (
    'Ronda Teste',
    'Teste Contrato',
    CURRENT_DATE,
    CURRENT_TIME,
    'Ricardo Oliveira',
    'Ronda de teste'
) RETURNING id, nome;

-- 3. Teste de inserção de foto da ronda
INSERT INTO fotos_ronda (ronda_id, foto, local, pendencia, especialidade, responsavel, observacoes, data, hora)
VALUES (
    (SELECT id FROM rondas WHERE nome = 'Ronda Teste' LIMIT 1),
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
    'Corredor Principal',
    'URGENTE',
    'Elétrica',
    'CONDOMÍNIO',
    'Lâmpada queimada',
    CURRENT_DATE,
    CURRENT_TIME
) RETURNING id, local;

-- 4. Verificar se os dados foram inseridos
SELECT 'Contratos' as tipo, COUNT(*) as total FROM contratos
UNION ALL
SELECT 'Rondas' as tipo, COUNT(*) as total FROM rondas
UNION ALL
SELECT 'Fotos Ronda' as tipo, COUNT(*) as total FROM fotos_ronda;

-- 5. Limpar dados de teste (opcional)
-- DELETE FROM fotos_ronda WHERE local = 'Corredor Principal';
-- DELETE FROM rondas WHERE nome = 'Ronda Teste';
-- DELETE FROM contratos WHERE nome = 'Teste Contrato';












