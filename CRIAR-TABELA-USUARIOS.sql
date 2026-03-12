-- ================================================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ================================================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este SQL e clique em "Run"
-- ================================================================

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    is_admin BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Criar usuário master
-- Email: admin@ronda.com
-- Senha: Admin123!
INSERT INTO usuarios (email, senha_hash, nome, cargo, is_admin, ativo)
VALUES (
    'admin@ronda.com',
    '$2b$10$yL7dMhbk8Ccdnm/DVkC1jOpmd/keyx4gHfpjc/M00R0WhqGc0APHy',
    'Administrador Master',
    'Administrador',
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se foi criado
SELECT id, email, nome, is_admin, ativo, created_at
FROM usuarios
WHERE email = 'admin@ronda.com';
