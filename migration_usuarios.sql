-- ================================================================
-- SISTEMA DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS
-- ================================================================

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- Senha criptografada
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    is_admin BOOLEAN DEFAULT false, -- Se é administrador master
    ativo BOOLEAN DEFAULT true, -- Se o usuário está ativo
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- 3. Criar usuário master inicial (login: admin@ronda.com / senha: Admin123!)
-- Senha criptografada com bcrypt (10 rounds): Admin123!
INSERT INTO usuarios (email, senha_hash, nome, cargo, is_admin, ativo)
VALUES (
    'admin@ronda.com',
    '$2a$10$YourBcryptHashHere', -- Vamos gerar isso no código
    'Administrador Master',
    'Administrador',
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- 4. Criar tabela de sessões (opcional - para controle de sessões)
CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes(usuario_id);

-- 5. Habilitar RLS (Row Level Security) - OPCIONAL
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acesso (permitir tudo por enquanto - ajustar depois)
CREATE POLICY "Permitir acesso total a usuarios" ON usuarios FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a sessoes" ON sessoes FOR ALL USING (true);

-- 7. Comentários
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema com autenticação';
COMMENT ON TABLE sessoes IS 'Tabela de sessões ativas dos usuários';
