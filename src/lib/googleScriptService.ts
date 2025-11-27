import { LaudoEmail } from './emailService';

const GOOGLE_SCRIPT_URL_KEY = 'appRonda_googleScriptUrl';

interface EmailPayload {
    destinatario: string;
    assunto: string;
    corpo: string;
}

class GoogleScriptService {
    salvarUrl(url: string): void {
        localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, url.trim());
    }

    obterUrl(): string | null {
        return localStorage.getItem(GOOGLE_SCRIPT_URL_KEY);
    }

    estaConfigurado(): boolean {
        return !!this.obterUrl();
    }

    async enviarEmail(destinatario: string, assunto: string, corpo: string): Promise<boolean> {
        const url = this.obterUrl();
        if (!url) {
            console.error('URL do Google Script não configurada');
            return false;
        }
        const payload: EmailPayload = { destinatario, assunto, corpo };
        try {
            console.log('🔧 Enviando requisição para Google Script URL:', url);
            console.log('🔧 Payload:', payload);
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('✅ Requisição enviada para Google Script (modo no-cors)');
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar para Google Script:', error);
            return false;
        }
    }

    async enviarEmailsLaudos(
        destinatarios: { email: string; nome: string }[],
        contratoNome: string,
        laudosVencidos: LaudoEmail[],
        laudosProximos: LaudoEmail[]
    ): Promise<{ sucessos: number; erros: number }> {
        let sucessos = 0;
        let erros = 0;
        for (const dest of destinatarios) {
            const assunto = `Relatório de Laudos - ${contratoNome}`;
            const corpo = this.gerarCorpoEmail(dest.nome, contratoNome, laudosVencidos, laudosProximos);
            const enviado = await this.enviarEmail(dest.email, assunto, corpo);
            if (enviado) sucessos++; else erros++;
        }
        return { sucessos, erros };
    }

    private gerarCorpoEmail(
        nomeDestinatario: string,
        contratoNome: string,
        laudosVencidos: LaudoEmail[],
        laudosProximos: LaudoEmail[]
    ): string {
        let texto = `Olá ${nomeDestinatario},\n\n`;
        texto += `Este é um relatório automático de laudos do contrato: ${contratoNome}\n\n`;
        if (laudosVencidos.length > 0) {
            texto += `🚨 LAUDOS VENCIDOS (${laudosVencidos.length}):\n`;
            laudosVencidos.forEach(laudo => {
                const data = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
                texto += `- ${laudo.title} (Venceu em: ${data})\n`;
            });
            texto += '\n';
        }
        if (laudosProximos.length > 0) {
            texto += `⚠️ PRÓXIMOS AO VENCIMENTO (${laudosProximos.length}):\n`;
            laudosProximos.forEach(laudo => {
                const data = new Date(laudo.dataVencimento).toLocaleDateString('pt-BR');
                texto += `- ${laudo.title} (Vence em: ${data} - ${laudo.diasVencimento} dias)\n`;
            });
            texto += '\n';
        }
        texto += `\nPor favor, verifique a situação destes laudos no sistema.\n`;
        texto += `\nAtenciosamente,\nApp Ronda`;
        return texto;
    }

    async testarConfiguracao(): Promise<boolean> {
        const url = this.obterUrl();
        if (!url) return false;
        try {
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destinatario: 'teste@exemplo.com',
                    assunto: 'Teste de Conexão',
                    corpo: 'Teste de conexão do App Ronda'
                })
            });
            return true;
        } catch {
            return false;
        }
    }
}

export const googleScriptService = new GoogleScriptService();
