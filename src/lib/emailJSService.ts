// Serviço de email usando EmailJS (gratuito e confiável)
export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  ativo: boolean;
}

export interface LaudoEmail {
  id: string;
  title: string;
  dataVencimento: string;
  status: 'vencidos' | 'proximo-vencimento';
  diasVencimento: number;
}

class EmailJSService {
  private config: EmailConfig | null = null;
  private emailjsLoaded = false;

  constructor() {
    this.carregarConfiguracao();
    this.carregarEmailJS();
  }

  // Carregar EmailJS dinamicamente
  private async carregarEmailJS() {
    if (this.emailjsLoaded) return;
    
    try {
      // Carregar EmailJS via CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        this.emailjsLoaded = true;
        console.log('✅ EmailJS carregado com sucesso');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('❌ Erro ao carregar EmailJS:', error);
    }
  }

  // Carregar configuração salva
  private carregarConfiguracao() {
    try {
      const saved = localStorage.getItem('emailjs_config');
      if (saved) {
        this.config = JSON.parse(saved);
        console.log('✅ Configuração EmailJS carregada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error);
    }
  }

  // Salvar configuração
  salvarConfiguracao(config: EmailConfig): boolean {
    try {
      this.config = config;
      localStorage.setItem('emailjs_config', JSON.stringify(config));
      console.log('✅ Configuração EmailJS salva');
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
    return this.config !== null && this.config.ativo && 
           this.config.serviceId.trim() !== '' && 
           this.config.templateId.trim() !== '' && 
           this.config.publicKey.trim() !== '';
  }

  // Enviar email usando EmailJS
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

    if (!this.emailjsLoaded) {
      console.error('❌ EmailJS não carregado');
      return false;
    }

    try {
      // Aguardar EmailJS estar disponível
      let attempts = 0;
      while (!window.emailjs && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.emailjs) {
        console.error('❌ EmailJS não disponível após tentativas');
        return false;
      }

      // Inicializar EmailJS
      window.emailjs.init(this.config.publicKey);

      const templateParams = {
        to_email: destinatario,
        to_name: nomeDestinatario,
        subject: assunto,
        message: corpo,
        from_name: 'Sistema de Laudos'
      };

      console.log('📧 Enviando email via EmailJS:', { destinatario, assunto });

      const response = await window.emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      console.log('✅ Email enviado com sucesso via EmailJS:', response);
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar email via EmailJS:', error);
      return false;
    }
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
      this.config!.publicKey.includes('@') ? this.config!.publicKey : 'teste@exemplo.com',
      'Teste',
      '✅ Teste de Configuração - Sistema de Laudos',
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

// Declaração global para EmailJS
declare global {
  interface Window {
    emailjs: any;
  }
}

// Instância singleton
export const emailJSService = new EmailJSService();

















