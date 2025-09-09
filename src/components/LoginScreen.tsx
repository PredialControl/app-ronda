import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsuarioAutorizado, authService } from '@/lib/auth';
import { Building2, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (usuario: UsuarioAutorizado) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErro('');
    setSucesso('');

    try {
      const resultado = await authService.fazerLogin(email, senha);
      
      if (resultado.sucesso && resultado.usuario) {
        setSucesso(`Bem-vindo(a), ${resultado.usuario.nome}!`);
        setTimeout(() => {
          onLoginSuccess(resultado.usuario!);
        }, 1000);
      } else {
        setErro(resultado.erro || 'Erro no login');
      }
    } catch (error) {
      setErro('Erro interno do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Portal de Visitas Manutenção Predial</h1>
          <p className="text-gray-300">Sistema de Gestão de Rondas Técnicas</p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-xl text-white">
              <Lock className="w-5 h-5 text-blue-400" />
              Acesso ao Sistema
            </CardTitle>
            <p className="text-sm text-gray-300">
              Digite suas credenciais para acessar
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder-gray-300 focus:bg-white/30"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sm font-medium text-white">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder-gray-300 focus:bg-white/30"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Mensagens de Erro/Sucesso */}
              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-200">{erro}</span>
                </div>
              )}

              {sucesso && (
                <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-200">{sucesso}</span>
                </div>
              )}

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Entrar no Sistema
                  </div>
                )}
              </Button>
            </form>

            {/* Informações de Acesso */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-xs text-gray-300 mb-2">Usuários Autorizados:</p>
                <div className="space-y-1 text-xs text-gray-300">
                  <div className="font-medium text-blue-400">• Ricardo (ricardo@manutencaopredial.net.br) - Admin</div>
                  <div>• Gessica (gessica@manutencaopredial.net.br)</div>
                  <div>• Felipe (felipe@manutencaopredial.net.br)</div>
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  Senha padrão: <span className="font-mono bg-white/20 px-1 rounded text-white">manutencao2024</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            © 2024 Portal de Visitas Manutenção Predial - Sistema de Gestão de Rondas Técnicas
          </p>
        </div>
      </div>
    </div>
  );
}
