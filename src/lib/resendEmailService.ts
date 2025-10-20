// Serviço de email usando Resend API (mais confiável)
export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  ativo: boolean;
}

export interface LaudoEmail {
  id: string;
  title: string;
  dataVencimento: string;
  status: 'vencidos' | 'proximo-vencimento';
  diasVencimento: number;
}

class ResendEmailService {
  private config: EmailConfig | null = null;
  private readonly RESEND_API_URL = 'https://api.resend.com/emails';

  constructor() {
    this.carregarConfiguracao();
  }

  // Carregar configuração salva
  private carregarConfiguracao() {
    try {
      const saved = localStorage.getItem('resend_email_config');
      if (saved) {
        this.config = JSON.parse(saved);
        console.log('✅ Configuração Resend carregada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error);
    }
  }

  // Salvar configuração
  salvarConfiguracao(config: EmailConfig): boolean {
    try {
      this.config = config;
      localStorage.setItem('resend_email_config', JSON.stringify(config));
      console.log('✅ Configuração Resend salva');
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
    return this.config !== null && this.config.ativo && this.config.apiKey.trim() !== '' && this.config.fromEmail.trim() !== '';
  }

  // Enviar email usando Resend API
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
      const emailData = {
        from: this.config.fromEmail,
        to: [destinatario],
        subject: assunto,
        html: corpo.replace(/\n/g, '<br>'),
        text: corpo
      };

      console.log('📧 Enviando email via Resend:', { destinatario, assunto });

      const response = await fetch(this.RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email enviado com sucesso via Resend:', result);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Erro ao enviar email via Resend:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
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
    
    let corpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        📋 RELATÓRIO DE LAUDOS - ${contratoNome}
      </h2>
      
      <p>Olá <strong>${destinatarioNome}</strong>,</p>
      
      <p>Segue o relatório de laudos atualizado em <strong>${dataAtual}</strong>:</p>
    `;

    if (laudosVencidos.length > 0) {
      corpo += `
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">🚨 LAUDOS VENCIDOS (${laudosVencidos.length})</h3>
          <ul style="margin: 10px 0;">
      `;
      laudosVencidos.forEach(laudo => {
        const diasVencido = Math.abs(laudo.diasVencimento);
        const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
        corpo += `<li><strong>${laudo.title}</strong> - Vencido em ${dataVencimento} (há ${diasVencido} dias)</li>`;
      });
      corpo += `</ul></div>`;
    }

    if (laudosProximos.length > 0) {
      corpo += `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <h3 style="color: #f59e0b; margin-top: 0;">⚠️ PRÓXIMOS AO VENCIMENTO (${laudosProximos.length})</h3>
          <ul style="margin: 10px 0;">
      `;
      laudosProximos.forEach(laudo => {
        const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
        corpo += `<li><strong>${laudo.title}</strong> - Vence em ${dataVencimento} (${laudo.diasVencimento} dias restantes)</li>`;
      });
      corpo += `</ul></div>`;
    }

    if (laudosVencidos.length === 0 && laudosProximos.length === 0) {
      corpo += `
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
          <h3 style="color: #22c55e; margin-top: 0;">✅ Todos os laudos estão em dia!</h3>
        </div>
      `;
    }

    corpo += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Data de envio: ${dataAtual}<br>
          Este é um email automático do sistema de gestão de laudos.
        </p>
      </div>
    </div>
    `;

    const assunto = `📋 Laudos ${contratoNome} - ${laudosVencidos.length} vencidos, ${laudosProximos.length} próximos`;

    return { assunto, corpo };
  }

  // Testar configuração
  async testarConfiguracao(): Promise<boolean> {
    if (!this.estaConfigurado()) {
      return false;
    }

    const corpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">✅ Teste de Configuração</h2>
      <p>Este é um email de teste para verificar se a configuração está funcionando.</p>
      <p><strong>Data do teste:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      <p>Se você recebeu este email, a configuração está funcionando corretamente!</p>
    </div>
    `;

    return await this.enviarEmail(
      this.config!.fromEmail, // Enviar para o próprio email configurado
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

// Instância singleton
export const resendEmailService = new ResendEmailService();

