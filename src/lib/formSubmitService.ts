// Serviço de email usando FormSubmit.co (Gratuito, sem cadastro, automático)
export interface LaudoEmail {
    id: string;
    title: string;
    dataVencimento: string;
    status: 'vencidos' | 'proximo-vencimento';
    diasVencimento: number;
}

class FormSubmitService {
    // Enviar email usando FormSubmit.co
    async enviarEmail(
        destinatario: string,
        nomeDestinatario: string,
        assunto: string,
        corpo: string,
        dadosEstruturados: any = {}
    ): Promise<boolean> {
        try {
            console.log('📧 Enviando email via FormSubmit para:', destinatario);

            // Preparar dados para envio
            const data = {
                _subject: assunto,
                _template: 'table', // Usa um template de tabela bonito
                _captcha: 'false',  // Desativa captcha
                _honey: '',         // Campo honeypot para spam
                nome_destinatario: nomeDestinatario,
                mensagem: corpo,
                ...dadosEstruturados
            };

            // Enviar requisição POST
            const response = await fetch(`https://formsubmit.co/ajax/${destinatario}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('✅ Resposta FormSubmit:', result);

            if (response.ok) {
                return true;
            } else {
                console.error('❌ Erro FormSubmit:', result);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao enviar email via FormSubmit:', error);
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
                // Preparar dados estruturados para o template do FormSubmit
                const dadosEstruturados: any = {
                    contrato: contratoNome,
                    data_relatorio: new Date().toLocaleDateString('pt-BR'),
                };

                // Adicionar laudos vencidos aos dados
                if (laudosVencidos.length > 0) {
                    laudosVencidos.forEach((laudo, index) => {
                        dadosEstruturados[`🚨 VENCIDO ${index + 1}`] = `${laudo.title} - Venceu em: ${new Date(laudo.dataVencimento).toLocaleDateString('pt-BR')}`;
                    });
                }

                // Adicionar laudos próximos aos dados
                if (laudosProximos.length > 0) {
                    laudosProximos.forEach((laudo, index) => {
                        dadosEstruturados[`⚠️ PRÓXIMO ${index + 1}`] = `${laudo.title} - Vence em: ${new Date(laudo.dataVencimento).toLocaleDateString('pt-BR')}`;
                    });
                }

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
                    corpo,
                    dadosEstruturados
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

    // Gerar conteúdo do email (fallback para mensagem de texto)
    gerarEmailLaudos(
        destinatarioNome: string,
        contratoNome: string,
        laudosVencidos: LaudoEmail[],
        laudosProximos: LaudoEmail[]
    ) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        let corpo = `Relatório de Laudos - ${contratoNome}\n\n`;
        corpo += `Olá ${destinatarioNome},\n\n`;

        if (laudosVencidos.length > 0) {
            corpo += `LAUDOS VENCIDOS (${laudosVencidos.length}):\n`;
            laudosVencidos.forEach(laudo => {
                const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
                corpo += `- ${laudo.title} (Venceu em ${dataVencimento})\n`;
            });
            corpo += '\n';
        }

        if (laudosProximos.length > 0) {
            corpo += `PRÓXIMOS AO VENCIMENTO (${laudosProximos.length}):\n`;
            laudosProximos.forEach(laudo => {
                const dataVencimento = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
                corpo += `- ${laudo.title} (Vence em ${dataVencimento})\n`;
            });
        }

        const assunto = `🚨 Alerta de Laudos - ${contratoNome}`;

        return { assunto, corpo };
    }
}

// Instância singleton
export const formSubmitService = new FormSubmitService();
