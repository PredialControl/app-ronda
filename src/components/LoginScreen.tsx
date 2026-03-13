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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Avatar do Manutencionista - Escondido no mobile */}
      <div className="fixed bottom-0 left-0 z-10 pointer-events-none flex-col items-center hidden lg:flex">
        <div className="text-center mb-2 ml-8">
          <div className="text-blue-400 font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            SALVE! SALVE!
          </div>
          <div className="text-blue-400 font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            MANUTENCISTA
          </div>
        </div>
        <img
          src="/avatar-manutencionista.png"
          alt="Manutencionista"
          className="w-64 h-auto object-contain"
          style={{ backgroundColor: 'transparent' }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mb-4 sm:mb-6 shadow-2xl">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Portal de Visitas</h1>
          <p className="text-blue-200 text-base sm:text-lg font-medium">Manutenção Predial</p>
          <p className="text-blue-300 text-sm sm:text-base mt-1">Sistema de Gestão de Rondas Técnicas</p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl border-2 border-white/20 bg-white/95 backdrop-blur-md">
          <CardHeader className="text-center pb-4 bg-blue-600">
            <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl text-white">
              <Lock className="w-6 h-6 text-white" />
              Acesso ao Sistema
            </CardTitle>
            <p className="text-sm sm:text-base text-blue-100">
              Digite suas credenciais para acessar
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-400 text-base focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sm sm:text-base font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-400 text-base focus:border-blue-500 focus:ring-blue-500"
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
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-base sm:text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-base">Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span className="text-base">Entrar no Sistema</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs sm:text-sm text-blue-200">
            © 2024 Portal de Visitas Manutenção Predial
          </p>
          <p className="text-xs text-blue-300 mt-1">
            Sistema de Gestão de Rondas Técnicas
          </p>
        </div>
      </div>
    </div>
  );
}
