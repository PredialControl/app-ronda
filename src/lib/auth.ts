import { supabase } from './supabase';
import { compare } from 'bcryptjs';

// Tipos para usuários autorizados
export interface UsuarioAutorizado {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  permissoes: string[];
  ativo: boolean;
  is_admin?: boolean;
  ultimoAcesso?: string;
}

// Lista de usuários autorizados
export const USUARIOS_AUTORIZADOS: UsuarioAutorizado[] = [
  {
    id: 'admin',
    email: 'ricardo@manutencaopredial.net.br',
    nome: 'Ricardo Oliveira',
    cargo: 'Administrador do Sistema',
    permissoes: ['admin', 'visualizar_contratos', 'visualizar_rondas', 'adicionar_fotos', 'gerenciar_usuarios'],
    ativo: true
  },
  {
    id: '1',
    email: 'gessica@manutencaopredial.net.br',
    nome: 'Gessica',
    cargo: 'Técnica de Manutenção',
    permissoes: ['visualizar_contratos', 'visualizar_rondas', 'adicionar_fotos'],
    ativo: true
  },
  {
    id: '2',
    email: 'felipe@manutencaopredial.net.br',
    nome: 'Felipe',
    cargo: 'Técnico de Manutenção',
    permissoes: ['visualizar_contratos', 'visualizar_rondas', 'adicionar_fotos'],
    ativo: true
  }
];

// Interface para sessão do usuário
export interface SessaoUsuario {
  usuario: UsuarioAutorizado;
  dataLogin: string;
  ultimaAtividade: string;
  token: string;
}

// Classe para gerenciar autenticação
export class AuthService {
  private static instance: AuthService;
  private sessaoAtual: SessaoUsuario | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Verificar se email está autorizado
  async verificarEmailAutorizado(email: string): Promise<UsuarioAutorizado | null> {
    const usuario = USUARIOS_AUTORIZADOS.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.ativo
    );
    return usuario || null;
  }

  // Fazer login
  async fazerLogin(email: string, senha: string): Promise<{ sucesso: boolean; usuario?: UsuarioAutorizado; erro?: string }> {
    try {
      console.log('🔐 Tentando login:', email);

      // Buscar usuário na tabela usuarios do Supabase
      const { data: usuarioDB, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (error || !usuarioDB) {
        console.log('❌ Usuário não encontrado');
        return {
          sucesso: false,
          erro: 'Email ou senha incorretos'
        };
      }

      // Verificar senha com bcrypt
      const senhaCorreta = await compare(senha, usuarioDB.senha_hash);

      if (!senhaCorreta) {
        console.log('❌ Senha incorreta');
        return {
          sucesso: false,
          erro: 'Email ou senha incorretos'
        };
      }

      // Atualizar último acesso
      await supabase
        .from('usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuarioDB.id);

      // Criar objeto de usuário
      const usuario: UsuarioAutorizado = {
        id: usuarioDB.id,
        email: usuarioDB.email,
        nome: usuarioDB.nome,
        cargo: usuarioDB.cargo || 'Usuário',
        permissoes: usuarioDB.is_admin ? ['admin'] : [],
        ativo: usuarioDB.ativo,
        is_admin: usuarioDB.is_admin,
      };

      // Criar sessão
      const sessao: SessaoUsuario = {
        usuario,
        dataLogin: new Date().toISOString(),
        ultimaAtividade: new Date().toISOString(),
        token: this.gerarToken()
      };

      this.sessaoAtual = sessao;

      // Salvar no localStorage
      localStorage.setItem('appRonda_sessao', JSON.stringify(sessao));
      localStorage.setItem('usuario_logado', JSON.stringify(usuario));

      console.log('✅ Login bem-sucedido:', usuario.nome);

      return { sucesso: true, usuario };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do sistema'
      };
    }
  }

  // Fazer logout
  async fazerLogout(): Promise<void> {
    if (this.sessaoAtual) {
      await this.registrarAcesso(this.sessaoAtual.usuario, 'LOGOUT');
    }

    this.sessaoAtual = null;
    localStorage.removeItem('appRonda_sessao');
  }

  // Verificar se usuário está logado
  isLogado(): boolean {
    return this.sessaoAtual !== null;
  }

  // Obter usuário atual
  getUsuarioAtual(): UsuarioAutorizado | null {
    return this.sessaoAtual?.usuario || null;
  }

  // Atualizar última atividade
  atualizarAtividade(): void {
    if (this.sessaoAtual) {
      this.sessaoAtual.ultimaAtividade = new Date().toISOString();
      localStorage.setItem('appRonda_sessao', JSON.stringify(this.sessaoAtual));
    }
  }

  // Verificar permissão
  temPermissao(permissao: string): boolean {
    if (!this.sessaoAtual) return false;
    return this.sessaoAtual.usuario.permissoes.includes(permissao);
  }

  // Restaurar sessão do localStorage
  restaurarSessao(): boolean {
    try {
      const sessaoSalva = localStorage.getItem('appRonda_sessao');
      if (sessaoSalva) {
        const sessao: SessaoUsuario = JSON.parse(sessaoSalva);
        
        // Verificar se a sessão não expirou (24 horas)
        const dataLogin = new Date(sessao.dataLogin);
        const agora = new Date();
        const diferencaHoras = (agora.getTime() - dataLogin.getTime()) / (1000 * 60 * 60);
        
        if (diferencaHoras < 24) {
          this.sessaoAtual = sessao;
          return true;
        } else {
          localStorage.removeItem('appRonda_sessao');
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      localStorage.removeItem('appRonda_sessao');
    }
    return false;
  }

  // Gerar token simples
  private gerarToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Registrar acesso no banco - DESABILITADO para evitar erros
  private async registrarAcesso(usuario: UsuarioAutorizado, tipo: 'LOGIN' | 'LOGOUT'): Promise<void> {
    console.log('📝 Registro de acesso desabilitado:', { usuario: usuario.nome, tipo });
  }
}

// Instância global
export const authService = AuthService.getInstance();
