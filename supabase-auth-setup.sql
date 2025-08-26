-- Script para configurar sistema de autenticação no App Ronda
-- Execute este script no SQL Editor do Supabase

-- Tabela para logs de acesso dos usuários
CREATE TABLE IF NOT EXISTS public.logs_acesso (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo_acesso VARCHAR(50) NOT NULL CHECK (tipo_acesso IN ('LOGIN', 'LOGOUT')),
    data_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45), -- Suporte para IPv6
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario_id ON logs_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_email ON logs_acesso(email);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_data_acesso ON logs_acesso(data_acesso DESC);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_tipo_acesso ON logs_acesso(tipo_acesso);

-- Políticas de segurança (RLS)
ALTER TABLE logs_acesso ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de logs
CREATE POLICY "Permitir inserção de logs de acesso" ON logs_acesso
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura de logs (apenas para auditoria)
CREATE POLICY "Permitir leitura de logs de acesso" ON logs_acesso
    FOR SELECT USING (true);

-- Função para limpar logs antigos (manter apenas últimos 90 dias)
CREATE OR REPLACE FUNCTION limpar_logs_antigos()
RETURNS void AS $$
BEGIN
    DELETE FROM logs_acesso 
    WHERE data_acesso < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar a cada 7 dias)
-- Nota: Em alguns planos do Supabase, você pode precisar configurar isso manualmente
-- ou usar um cron job externo

-- Inserir alguns logs de exemplo para teste
INSERT INTO logs_acesso (usuario_id, email, nome, tipo_acesso, data_acesso, ip_address, user_agent) VALUES
('1', 'gessica@manutencaopredial.net.br', 'Gessica', 'LOGIN', NOW() - INTERVAL '2 hours', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('2', 'felipe@manutencaopredial.net.br', 'Felipe', 'LOGIN', NOW() - INTERVAL '1 hour', '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'),
('1', 'gessica@manutencaopredial.net.br', 'Gessica', 'LOGOUT', NOW() - INTERVAL '1 hour', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- Comentários sobre a estrutura
COMMENT ON TABLE logs_acesso IS 'Registra todos os acessos (login/logout) dos usuários ao sistema';
COMMENT ON COLUMN logs_acesso.usuario_id IS 'ID do usuário que fez o acesso';
COMMENT ON COLUMN logs_acesso.email IS 'Email do usuário';
COMMENT ON COLUMN logs_acesso.nome IS 'Nome do usuário';
COMMENT ON COLUMN logs_acesso.tipo_acesso IS 'Tipo de acesso: LOGIN ou LOGOUT';
COMMENT ON COLUMN logs_acesso.data_acesso IS 'Data e hora do acesso';
COMMENT ON COLUMN logs_acesso.ip_address IS 'Endereço IP do usuário (para auditoria)';
COMMENT ON COLUMN logs_acesso.user_agent IS 'Navegador/dispositivo usado para o acesso';
