import { DailyPostContent, ImagePrompt } from '../types';

// O endpoint de API unificado que criamos.
const API_ENDPOINT = '/api/generate';

interface CombinedContent extends DailyPostContent, ImagePrompt {}

/**
 * Gera o conteúdo do post fazendo uma chamada segura para o nosso backend serverless.
 * @param date A data selecionada para o post.
 * @param tone O tom da comunicação.
 * @returns Uma promessa que resolve para o conteúdo completo do post e o prompt da imagem.
 */
export const generateContentFromWordpress = async (date: Date, tone: string): Promise<CombinedContent> => {
    
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'generateContent',
            // Passa a data no formato ISO para ser facilmente interpretada.
            date: date.toISOString(),
            tone: tone
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    return data as CombinedContent;
};
