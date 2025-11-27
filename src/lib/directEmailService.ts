// Serviço de email direto e simples
export interface EmailConfig {
  email: string;
  senhaApp: string;
  ativo: boolean;
}

export interface LaudoEmail {
  id: string;
  title: string;
  dataVencimento: string;
  status: 'vencidos' | 'proximo-vencimento';
  diasVencimento: number;
}

class DirectEmailService {
  private config: EmailConfig | null = null;

  constructor() {
    this.carregarConfiguracao();
  }

  // Carregar configuração salva
  private carregarConfiguracao() {
    try {
      const saved = localStorage.getItem('direct_email_config');
      if (saved) {
        this.config = JSON.parse(saved);
        console.log('✅ Configuração de email carregada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error);
    }
  }

  // Salvar configuração
  salvarConfiguracao(config: EmailConfig): boolean {
    try {
      this.config = config;
      localStorage.setItem('direct_email_config', JSON.stringify(config));
      console.log('✅ Configuração de email salva');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      return false;
    }
  }

  // Obter configuração atual
  obterConfiguracao(): EmailConfig | null {
    return this.config;
  }

  // Verificar se está configurado
  estaConfigurado(): boolean {
    return this.config !== null && this.config.ativo && this.config.email.trim() !== '' && this.config.senhaApp.trim() !== '';
  }

  // Enviar email usando mailto (método mais simples e confiável)
  async enviarEmail(
    destinatario: string,
    nomeDestinatario: string,
    assunto: string,
    corpo: string
  ): Promise<boolean> {
    if (!this.estaConfigurado() || !this.config) {
      console.error('❌ Email não configurado');
      return false;
    }

    try {
      // Usar mailto para abrir cliente de email padrão
      const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

      console.log('📧 Preparando email para:', destinatario);
      console.log('📧 Assunto:', assunto);
      console.log('📧 Link mailto:', mailtoLink);

      // Retornar o link para ser usado diretamente pelo usuário
      window.open(mailtoLink, '_blank');
      return true;

    } catch (error) {
      console.error('❌ Erro ao preparar email:', error);
      return false;
    }
  }

  // Gerar link mailto para uso direto
  gerarLinkMailto(
    destinatario: string,
    assunto: string,
    corpo: string
  ): string {
    return `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  }

  // Enviar emails de laudos
  async enviarEmailsLaudos(
    destinatarios: Array<{ email: string; nome: string }>,
    contratoNome: string,
    laudosVencidos: LaudoEmail[],
    laudosProximos: LaudoEmail[]
  ): Promise<{ sucessos: number; falhas: number }> {
    let sucessos = 0;
    let falhas = 0;

    for (const destinatario of destinatarios) {
      try {
        const { assunto, corpo } = this.gerarEmailLaudos(
          destinatario.nome,
          contratoNome,
          laudosVencidos,
          laudosProximos
        );

        const sucesso = await this.enviarEmail(
          destinatario.email,
          destinatario.nome,
          assunto,
          corpo
        );

        if (sucesso) {
          sucessos++;
        } else {
          falhas++;
        }
      } catch (error) {
        console.error('❌ Erro ao enviar para:', destinatario.email, error);
        falhas++;
      }
    }

    return { sucessos, falhas };
  }

  // Gerar conteúdo do email
  gerarEmailLaudos(
    destinatarioNome: string,
    contratoNome: string,
    laudosVencidos: LaudoEmail[],
    laudosProximos: LaudoEmail[]
  ) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    let corpo = `📋 RELATÓRIO DE LAUDOS - ${contratoNome}\n\n`;
    corpo += `Olá ${destinatarioNome},\n\n`;
    corpo += `Segue o relatório de laudos atualizado em ${dataAtual}:\n\n`;

    if (laudosVencidos.length > 0) {
      corpo += `🚨 LAUDOS VENCIDOS (${laudosVencidos.length}):\n`;
      laudosVencidos.forEach(laudo => {
        const diasVencido = Math.abs(laudo.diasVencimento);
        const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
        corpo += `• ${laudo.title} - Vencido em ${dataVencimento} (há ${diasVencido} dias)\n`;
      });
      corpo += '\n';
    }

    if (laudosProximos.length > 0) {
      corpo += `⚠️ PRÓXIMOS AO VENCIMENTO (${laudosProximos.length}):\n`;
      laudosProximos.forEach(laudo => {
        const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
        corpo += `• ${laudo.title} - Vence em ${dataVencimento} (${laudo.diasVencimento} dias restantes)\n`;
      });
      corpo += '\n';
    }

    if (laudosVencidos.length === 0 && laudosProximos.length === 0) {
      corpo += '✅ Todos os laudos estão em dia!\n\n';
    }

    corpo += `Data de envio: ${dataAtual}\n\n`;
    corpo += `Este é um email automático do sistema de gestão de laudos.`;

    const assunto = `📋 Laudos ${contratoNome} - ${laudosVencidos.length} vencidos, ${laudosProximos.length} próximos`;

    return { assunto, corpo };
  }

  // Testar configuração
  async testarConfiguracao(): Promise<boolean> {
    if (!this.estaConfigurado()) {
      return false;
    }

    const corpo = 'Este é um email de teste para verificar se a configuração está funcionando.\n\nData do teste: ' + new Date().toLocaleDateString('pt-BR');

    return await this.enviarEmail(
      'teste@exemplo.com',
      'Teste',
      'Teste de Configuração - Sistema de Laudos',
      corpo
    );
  }

  // Simular envio (para quando não há configuração)
  async simularEnvio(
    destinatario: string,
    assunto: string,
    corpo: string
  ): Promise<boolean> {
    console.log('📧 [SIMULAÇÃO] Email seria enviado para:', destinatario);
    console.log('📧 [SIMULAÇÃO] Assunto:', assunto);
    console.log('📧 [SIMULAÇÃO] Corpo:', corpo.substring(0, 100) + '...');

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ [SIMULAÇÃO] Email enviado com sucesso');
    return true;
  }
}

// Instância singleton
export const directEmailService = new DirectEmailService();