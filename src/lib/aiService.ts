import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Serviço de IA para melhorar textos do parecer técnico
 * Utiliza Google Gemini API
 */

// Inicializar o cliente Gemini
const getGeminiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            'API Key do Gemini não configurada. Por favor, adicione VITE_GEMINI_API_KEY no arquivo .env'
        );
    }

    return new GoogleGenerativeAI(apiKey);
};

/**
 * Melhora um texto usando IA
 * @param text - Texto original a ser melhorado
 * @param context - Contexto do texto (finalidade, narrativa, descrição de tópico)
 * @returns Texto melhorado
 */
export async function improveText(text: string, context: string): Promise<string> {
    if (!text || text.trim().length === 0) {
        throw new Error('Por favor, digite algum texto para melhorar.');
    }

    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Criar prompt otimizado baseado no contexto
        const prompt = createPrompt(text, context);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const improvedText = response.text();

        return improvedText.trim();
    } catch (error: any) {
        console.error('Erro ao melhorar texto com IA:', error);

        if (error.message?.includes('API Key')) {
            throw new Error('Erro de configuração da API Key. Verifique suas credenciais.');
        }

        if (error.message?.includes('quota')) {
            throw new Error('Limite de uso da API atingido. Tente novamente mais tarde.');
        }

        throw new Error('Erro ao processar com IA. Tente novamente.');
    }
}

/**
 * Cria um prompt otimizado para cada tipo de contexto
 */
function createPrompt(text: string, context: string): string {
    const baseInstructions = `
Você é um engenheiro civil experiente escrevendo um parecer técnico profissional.
Reescreva o texto seguindo estas diretrizes:

1. Use linguagem técnica e formal apropriada para engenharia civil
2. Seja claro, objetivo e específico
3. Mantenha o significado original, mas melhore a estrutura e clareza
4. Use termos técnicos corretos da área de engenharia
5. Organize as informações de forma lógica
6. Evite redundâncias
7. Use vocabulário profissional sem ser excessivamente rebuscado
8. Mantenha o texto conciso, mas completo
9. Não adicione informações que não estavam no texto original
10. Retorne APENAS o texto melhorado, sem explicações adicionais
`;

    let specificInstructions = '';

    switch (context) {
        case 'finalidade':
            specificInstructions = `
Este é o campo "Finalidade do Relatório" de um parecer técnico.
Deve explicar o objetivo e escopo da vistoria/análise técnica.
Mantenha entre 2-4 parágrafos.
Exemplo de estrutura: objetivo da vistoria → metodologia aplicada → escopo do trabalho → resultados esperados.
`;
            break;

        case 'narrativa':
            specificInstructions = `
Este é o campo "Narrativa do Cenário" de um parecer técnico.
Deve descrever a situação encontrada, contexto do imóvel/instalação e condições observadas.
Mantenha entre 3-5 parágrafos.
Inclua: localização/contexto → características do sistema/estrutura → condições observadas → aspectos relevantes.
`;
            break;

        case 'topico':
            specificInstructions = `
Esta é a descrição de um tópico específico do parecer técnico.
Deve detalhar aspectos técnicos de um sistema ou instalação específica.
Mantenha entre 2-4 parágrafos.
Inclua: descrição técnica → condições encontradas → observações relevantes → recomendações se aplicável.
`;
            break;

        default:
            specificInstructions = `
Este é um texto de parecer técnico de engenharia.
Melhore mantendo o profissionalismo e clareza técnica.
`;
    }

    return `${baseInstructions}

${specificInstructions}

TEXTO ORIGINAL:
${text}

TEXTO MELHORADO:`;
}

/**
 * Valida se a API está configurada corretamente
 */
export function isAIConfigured(): boolean {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        return !!apiKey && apiKey.length > 0;
    } catch {
        return false;
    }
}
