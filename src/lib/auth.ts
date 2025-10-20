import { supabase } from './supabase';

// Tipos para usuários autorizados
export interface UsuarioAutorizado {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  permissoes: string[];
  ativo: boolean;
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
      // Verificar se email está autorizado
      const usuario = await this.verificarEmailAutorizado(email);
      if (!usuario) {
        return { 
          sucesso: false, 
          erro: 'Email não autorizado para acessar o sistema' 
        };
      }

      // Para simplificar, vamos usar uma senha padrão (você pode mudar depois)
      const senhaPadrao = 'manutencao2024';
      if (senha !== senhaPadrao) {
        return { 
          sucesso: false, 
          erro: 'Senha incorreta' 
        };
      }

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

      // Log de acesso
      await this.registrarAcesso(usuario, 'LOGIN');

      return { sucesso: true, usuario };
    } catch (error) {
      console.error('Erro no login:', error);
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
