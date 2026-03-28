import React, { useState, useEffect } from 'react';
import { UsuarioAutorizado, authService } from '@/lib/auth';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle, Shield, Wifi, WifiOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (usuario: UsuarioAutorizado) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

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
        }, 1200);
      } else {
        setErro(resultado.erro || 'Erro no login');
      }
    } catch {
      setErro('Erro interno do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2847 30%, #0a1628 60%, #162040 100%)' }}>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        {/* Floating orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div className="absolute -bottom-48 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #06b6d4, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #8b5cf6, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Online/Offline indicator */}
      <div className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-500 ${
        isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
      }`}>
        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        {isOnline ? 'Online' : 'Offline'}
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-5 py-8 z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Logo area */}
        <div className="text-center mb-8">
          {/* Company logo with glow */}
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
            <img
              src="/logo-mp-full.svg"
              alt="Manutenção Predial"
              className="relative h-20 sm:h-24 w-auto drop-shadow-2xl"
              style={{ filter: 'brightness(1.8) saturate(1.2)' }}
            />
          </div>
          <p className="text-sm text-blue-300/60 font-medium tracking-wide uppercase">
            Sistema de Gestão Técnica
          </p>
        </div>

        {/* Login Card */}
        <div className={`w-full max-w-sm transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(20px)' }}>

            {/* Card header accent */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6)' }} />

            <div className="p-6 pt-5">
              <h2 className="text-lg font-semibold text-white mb-1">Entrar</h2>
              <p className="text-sm text-gray-400 mb-6">Acesse com suas credenciais</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErro(''); }}
                      placeholder="seu@email.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 border border-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type={showSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => { setSenha(e.target.value); setErro(''); }}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-xl text-sm text-white placeholder-gray-500 border border-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-0.5"
                      tabIndex={-1}
                    >
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {erro && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-500/20"
                    style={{ background: 'rgba(239,68,68,0.08)' }}>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-300">{erro}</span>
                  </div>
                )}

                {/* Success message */}
                {sucesso && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-500/20"
                    style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-emerald-300">{sucesso}</span>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading || !email || !senha}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: isLoading
                      ? 'linear-gradient(135deg, #1e40af, #0e7490)'
                      : 'linear-gradient(135deg, #2563eb, #0891b2)',
                  }}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Entrar
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Avatar + Salve Salve (desktop only) */}
        <div className="hidden lg:flex fixed bottom-0 left-8 flex-col items-center z-20">
          <div className="text-center mb-2">
            <p className="text-cyan-400 font-bold text-lg" style={{ textShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
              SALVE! SALVE!
            </p>
            <p className="text-cyan-300/70 font-semibold text-sm">
              MANUTENCIONISTA
            </p>
          </div>
          <img
            src="/avatar-manutencionista.png"
            alt="Manutencionista"
            className="w-56 h-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Footer */}
      <div className={`text-center py-5 z-10 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-xs text-gray-500">
          Manutenção Predial © {new Date().getFullYear()}
        </p>
        <p className="text-[10px] text-gray-600 mt-0.5 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          Conexão segura
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
