// api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type } from '@google/genai';

// --- Calendário de posts (mantém igual ao seu) ---
const calendar: { [key: string]: string } = {
    "01-01": "Dicas de cuidados para pets no Ano Novo",
    "02-14": "Como incluir seu pet no Dia dos Namorados",
    "04-04": "Importância da vacinação em pets",
    "07-09": "Dia da Saúde Animal - importância da prevenção",
    "10-04": "Dia Mundial dos Animais - homenagem aos bichinhos",
    "12-25": "Natal Pet: cuidados durante as festas"
};

/**
 * Retorna a ideia de post para uma data específica.
 */
function getPostIdeaForDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const key = `${month}-${day}` as keyof typeof calendar;
    return calendar[key] || "Crie um post sobre um caso de sucesso da sua clínica ou compartilhe uma dica útil!";
}

/**
 * Mapeia o tom de comunicação para um estilo de imagem específico.
 */
function getImageStyleForTone(tone: string): string {
    const styleMap: { [key: string]: string } = {
        'Informativo': 'foto realista, clara e bem iluminada',
        'Profissional': 'foto profissional de estúdio, com fundo neutro',
        'Divertido': 'ilustração colorida e divertida no estilo cartoon ou 3D Pixar',
        'Empático': 'foto com iluminação suave e quente, transmitindo emoção',
        'Urgente': 'foto com um leve toque dramático, foco nítido no problema'
    };
    return styleMap[tone] || 'foto realista';
}

/**
 * Lida com a ação 'generateContent' chamando a API Google Gemini.
 */
async function handleGenerateContent(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { date: dateString, tone } = req.body;
        if (!dateString || !tone) {
            return res.status(400).json({ error: 'Data e tom são obrigatórios.' });
        }

        if (!process.env.API_KEY) {
            return res.status(500).json({ error: 'Chave da API Gemini não configurada no servidor.' });
        }

        const date = new Date(dateString);
        const postIdea = getPostIdeaForDate(date);
        const imageStyle = getImageStyleForTone(tone);

        const prompt = `Você é um copywriter especialista em marketing para o setor veterinário. Sua tarefa é criar o conteúdo para um post de Instagram.
        
        Ideia Central do Post: "${postIdea}"
        Tom da Comunicação: ${tone}
        
        Com base nisso, gere o seguinte conteúdo em formato JSON:
        - "caption": Uma legenda completa e envolvente para o post. Use emojis de forma natural. Não use nenhuma formatação como **, __, ~~ ou markdown.
        - "hashtags": Uma lista de 7 a 10 hashtags relevantes em português.
        - "image_prompt": Um prompt curto e direto em PORTUGUÊS para um gerador de imagens IA, descrevendo a imagem ideal para este post. O estilo deve ser: ${imageStyle}.`;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        caption: { type: Type.STRING, description: "Legenda para o post, sem markdown ou **." },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        image_prompt: { type: Type.STRING, description: "Prompt em português para gerar a imagem." }
                    },
                    required: ['caption', 'hashtags', 'image_prompt']
                },
            },
        });

        const text = response.text.trim();
        const jsonData = JSON.parse(text);
        
        // Remove qualquer vestígio de negrito ou markdown
        const cleanCaption = jsonData.caption.replace(/\*\*/g, '').replace(/__|~~|`/g, '');

        const finalResponse = {
            ...jsonData,
            post_idea: postIdea,
            caption: cleanCaption
        };
        
        return res.status(200).json(finalResponse);

    } catch (error) {
        console.error('Erro ao gerar conteúdo com Gemini:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return res.status(500).json({ error: `Falha ao gerar conteúdo: ${errorMessage}` });
    }
}

/**
 * Lida com a ação 'searchImages' chamando a API do Unsplash.
 */
async function handleSearchImages(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { searchTerm } = req.body;
        if (!searchTerm) {
            return res.status(400).json({ error: 'O termo de busca é obrigatório.' });
        }

        const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!unsplashAccessKey) {
            return res.status(500).json({ error: 'Chave da API Unsplash não configurada no servidor.' });
        }

        // Força busca a pets/animais
        const petFocusedSearchTerm = `${searchTerm} pet animal cachorro gato veterinário`;

        const unsplashApiUrl = new URL('https://api.unsplash.com/search/photos');
        unsplashApiUrl.searchParams.append('query', petFocusedSearchTerm);
        unsplashApiUrl.searchParams.append('per_page', '15'); // mais resultados para filtrar
        unsplashApiUrl.searchParams.append('orientation', 'squarish'); // ideal p/ Instagram
        unsplashApiUrl.searchParams.append('content_filter', 'high');

        const unsplashResponse = await fetch(unsplashApiUrl.toString(), {
            headers: { 'Authorization': `Client-ID ${unsplashAccessKey}` }
        });

        if (!unsplashResponse.ok) {
            const errorBody = await unsplashResponse.json();
            throw new Error(`Erro da API Unsplash: ${unsplashResponse.status}. ${errorBody.errors?.join(', ') || ''}`);
        }
        
        const data = await unsplashResponse.json();

        // Lista de palavras-chave que obrigatoriamente devem aparecer
        const petKeywords = [
            'dog','cat','puppy','kitten','pet','animal','animals',
            'cachorro','cão','gato','gatinho','veterinário','pet shop'
        ];

        // Filtro: só retorna fotos que tenham ligação clara com pets/animais
        const onlyPetPhotos = data.results.filter((img: any) => {
            if (img.type !== 'photo') return false;

            const alt = img.alt_description?.toLowerCase() || '';
            const tags = (img.tags || []).map((t: any) => t.title?.toLowerCase() || '');

            return petKeywords.some(keyword => alt.includes(keyword) || tags.some((t: string) => t.includes(keyword)));
        });

        return res.status(200).json({ ...data, results: onlyPetPhotos });

    } catch (error) {
        console.error('Erro ao buscar imagens no Unsplash:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return res.status(500).json({ error: `Falha ao buscar imagens: ${errorMessage}` });
    }
}

/**
 * Roteador principal para o endpoint /api/generate.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const { action } = req.body;

    switch (action) {
        case 'generateContent':
            return await handleGenerateContent(req, res);
        case 'searchImages':
            return await handleSearchImages(req, res);
        default:
            return res.status(400).json({ error: 'Ação inválida ou não especificada.' });
    }
}
