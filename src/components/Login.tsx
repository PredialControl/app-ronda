import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compare } from 'bcryptjs';

interface LoginProps {
  onLoginSuccess: (usuario: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      console.log('🔐 Tentando login:', email);

      // Buscar usuário no banco
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (error || !usuario) {
        setErro('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      // Verificar senha
      const senhaCorreta = await compare(senha, usuario.senha_hash);

      if (!senhaCorreta) {
        setErro('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      // Atualizar último acesso
      await supabase
        .from('usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuario.id);

      console.log('✅ Login bem-sucedido:', usuario.nome);

      // Salvar no localStorage
      localStorage.setItem('usuario_logado', JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        cargo: usuario.cargo,
        is_admin: usuario.is_admin,
      }));

      onLoginSuccess(usuario);
    } catch (err) {
      console.error('❌ Erro no login:', err);
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-white">
            App Ronda
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-400">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              Credenciais padrão: admin@ronda.com / Admin123!
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
