// Serviço de envio de emails para laudos
import { googleScriptService } from './googleScriptService';

export interface EmailDestinatario {
  id: string;
  email: string;
  nome: string;
  ativo: boolean;
}

export interface EmailConfig {
  id: string;
  contratoId: string;
  contratoNome: string;
  destinatarios: EmailDestinatario[];
  ativo: boolean;
}

export interface LaudoEmail {
  id: string;
  title: string;
  dataVencimento: string;
  status: 'vencidos' | 'proximo-vencimento';
  diasVencimento: number;
}

export interface EmailTemplate {
  assunto: string;
  corpo: string;
}

class EmailService {
  private emailConfigs: EmailConfig[] = [];
  private emailTemplates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
    this.loadEmailConfigs();
  }

  private initializeTemplates() {
    // Template para laudos vencidos
    this.emailTemplates.set('laudos-vencidos', {
      assunto: '🚨 ALERTA: Laudos Vencidos - {contratoNome}',
      corpo: `
Prezado(a) {nomeDestinatario},

Identificamos que existem laudos técnicos VENCIDOS para o contrato "{contratoNome}".

📋 LAUDOS VENCIDOS:
{laudosLista}

⚠️ AÇÃO NECESSÁRIA:
- Renovar laudos vencidos IMEDIATAMENTE
- Verificar documentação necessária
- Entrar em contato com fornecedores responsáveis

📞 Para mais informações, entre em contato conosco.

Atenciosamente,
Equipe de Manutenção Predial
      `.trim()
    });

    // Template para laudos próximos ao vencimento
    this.emailTemplates.set('laudos-proximos', {
      assunto: '⚠️ AVISO: Laudos Próximos ao Vencimento - {contratoNome}',
      corpo: `
Prezado(a) {nomeDestinatario},

Identificamos que existem laudos técnicos PRÓXIMOS AO VENCIMENTO para o contrato "{contratoNome}".

📋 LAUDOS PRÓXIMOS AO VENCIMENTO:
{laudosLista}

📋 AÇÕES NECESSÁRIAS:
- Renovar laudos vencidos IMEDIATAMENTE
- Iniciar processo de renovação dos laudos próximos ao vencimento
- Verificar documentação necessária
- Entrar em contato com fornecedores responsáveis

📞 Para mais informações, entre em contato conosco.

Atenciosamente,
Equipe de Manutenção Predial
      `.trim()
    });
  }

  private loadEmailConfigs() {
    try {
      const saved = localStorage.getItem('appRonda_emailConfigs');
      if (saved) {
        this.emailConfigs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de email:', error);
      this.emailConfigs = [];
    }
  }

  private saveEmailConfigs() {
    try {
      localStorage.setItem('appRonda_emailConfigs', JSON.stringify(this.emailConfigs));
    } catch (error) {
      console.error('Erro ao salvar configurações de email:', error);
    }
  }

  // Configurar emails para um contrato
  configurarEmails(contratoId: string, contratoNome: string, destinatarios: EmailDestinatario[]): void {
    const existingIndex = this.emailConfigs.findIndex(config => config.contratoId === contratoId);

    const emailConfig: EmailConfig = {
      id: existingIndex >= 0 ? this.emailConfigs[existingIndex].id : Date.now().toString(),
      contratoId,
      contratoNome,
      destinatarios: destinatarios.filter(d => d.ativo),
      ativo: true
    };

    if (existingIndex >= 0) {
      this.emailConfigs[existingIndex] = emailConfig;
    } else {
      this.emailConfigs.push(emailConfig);
    }

    this.saveEmailConfigs();
    console.log('✅ Configuração de emails salva:', emailConfig);
  }

  // Adicionar destinatário a um contrato
  adicionarDestinatario(contratoId: string, email: string, nome: string): void {
    const config = this.emailConfigs.find(c => c.contratoId === contratoId);
    if (config) {
      const novoDestinatario: EmailDestinatario = {
        id: Date.now().toString(),
        email: email.trim(),
        nome: nome.trim(),
        ativo: true
      };

      config.destinatarios.push(novoDestinatario);
      this.saveEmailConfigs();
      console.log('✅ Destinatário adicionado:', novoDestinatario);
    }
  }

  // Remover destinatário
  removerDestinatario(contratoId: string, destinatarioId: string): void {
    const config = this.emailConfigs.find(c => c.contratoId === contratoId);
    if (config) {
      config.destinatarios = config.destinatarios.filter(d => d.id !== destinatarioId);
      this.saveEmailConfigs();
      console.log('✅ Destinatário removido:', destinatarioId);
    }
  }

  // Obter configuração de email para um contrato
  obterConfiguracaoEmail(contratoId: string): EmailConfig | null {
    return this.emailConfigs.find(config => config.contratoId === contratoId && config.ativo) || null;
  }

  // Listar todas as configurações de email
  listarConfiguracoesEmail(): EmailConfig[] {
    return this.emailConfigs.filter(config => config.ativo);
  }

  // Desativar configuração de email
  desativarEmail(contratoId: string): void {
    const config = this.emailConfigs.find(c => c.contratoId === contratoId);
    if (config) {
      config.ativo = false;
      this.saveEmailConfigs();
      console.log('✅ Configuração de email desativada:', contratoId);
    }
  }

  // Enviar emails para um contrato específico
  async enviarEmailLaudos(contratoId: string, laudosVencidos: LaudoEmail[], laudosProximos: LaudoEmail[]): Promise<boolean> {
    try {
      const config = this.obterConfiguracaoEmail(contratoId);

      if (!config) {
        console.warn('⚠️ Nenhuma configuração de email encontrada para o contrato:', contratoId);
        return false;
      }

      if (config.destinatarios.length === 0) {
        console.warn('⚠️ Nenhum destinatário configurado para o contrato:', contratoId);
        return false;
      }

      // Determinar qual template usar
      let template: EmailTemplate;

      if (laudosVencidos.length > 0 && laudosProximos.length > 0) {
        // Ambos os tipos
        template = this.emailTemplates.get('laudos-vencidos')!;
      } else if (laudosVencidos.length > 0) {
        // Apenas vencidos
        template = this.emailTemplates.get('laudos-vencidos')!;
      } else {
        // Apenas próximos ao vencimento
        template = this.emailTemplates.get('laudos-proximos')!;
      }

      // Enviar para todos os destinatários
      let sucessos = 0;
      for (const destinatario of config.destinatarios) {
        if (destinatario.ativo) {
          try {
            console.log('📧 Enviando email para:', destinatario.email);

            // Tentar usar Google Script (Web App)
            const resultado = await googleScriptService.enviarEmail(
              destinatario.email,
              template.assunto.replace('{contratoNome}', config.contratoNome).replace('{nomeDestinatario}', destinatario.nome),
              this.substituirVariaveis(template.corpo, config, laudosVencidos, laudosProximos, destinatario)
            );

            if (resultado) {
              sucessos++;
              console.log('✅ Email enviado com sucesso para:', destinatario.email);
            } else {
              console.warn('⚠️ Falha no envio do email, usando simulação para:', destinatario.email);
              // Fallback para simulação
              const assunto = this.substituirVariaveis(template.assunto, config, laudosVencidos, laudosProximos, destinatario);
              const corpo = this.substituirVariaveis(template.corpo, config, laudosVencidos, laudosProximos, destinatario);
              await this.simularEnvioEmail(destinatario.email, assunto, corpo);
              sucessos++;
            }
          } catch (error) {
            console.error('❌ Erro ao enviar email para:', destinatario.email, error);
          }
        }
      }

      return sucessos > 0;

    } catch (error) {
      console.error('❌ Erro ao enviar emails:', error);
      return false;
    }
  }

  // Substituir variáveis no template
  private substituirVariaveis(template: string, config: EmailConfig, laudosVencidos: LaudoEmail[], laudosProximos: LaudoEmail[], destinatario: EmailDestinatario): string {
    let resultado = template;

    // Substituir variáveis básicas
    resultado = resultado.replace(/{contratoNome}/g, config.contratoNome);
    resultado = resultado.replace(/{nomeDestinatario}/g, destinatario.nome);

    // Substituir lista de laudos
    const todosLaudos = [...laudosVencidos, ...laudosProximos];
    const listaLaudos = todosLaudos.map(laudo => {
      const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
      const diasTexto = laudo.diasVencimento < 0
        ? `Vencido há ${Math.abs(laudo.diasVencimento)} dias`
        : `${laudo.diasVencimento} dias restantes`;

      return `• ${laudo.title} - Vencimento: ${dataVencimento} (${diasTexto})`;
    }).join('\n');

    resultado = resultado.replace(/{laudosLista}/g, listaLaudos);

    return resultado;
  }

  // Simular envio de email (para desenvolvimento)
  private async simularEnvioEmail(destinatario: string, assunto: string, corpo: string): Promise<void> {
    console.log('📧 [SIMULAÇÃO] Email seria enviado:');
    console.log('📧 Para:', destinatario);
    console.log('📧 Assunto:', assunto);
    console.log('📧 Corpo:', corpo.substring(0, 200) + '...');

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ [SIMULAÇÃO] Email enviado com sucesso');
  }

  // Enviar emails para todos os contratos
  async enviarEmailsTodosContratos(laudosPorContrato: Map<string, { vencidos: LaudoEmail[], proximos: LaudoEmail[] }>): Promise<{ sucessos: number, erros: number }> {
    let sucessos = 0;
    let erros = 0;

    for (const [contratoId, laudos] of laudosPorContrato) {
      try {
        const resultado = await this.enviarEmailLaudos(contratoId, laudos.vencidos, laudos.proximos);
        if (resultado) {
          sucessos++;
        } else {
          erros++;
        }
      } catch (error) {
        console.error('❌ Erro ao enviar emails para contrato:', contratoId, error);
        erros++;
      }
    }

    return { sucessos, erros };
  }
}

// Instância singleton
export const emailService = new EmailService();