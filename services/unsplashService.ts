import { UnsplashImage } from "../types";

// O endpoint de API unificado que criamos.
const API_ENDPOINT = '/api/generate';

interface UnsplashApiResponse {
    results: UnsplashImage[];
}

/**
 * Busca imagens no Unsplash através do nosso endpoint seguro serverless.
 * @param searchTerm O termo para buscar.
 * @returns Uma promessa que resolve para uma lista de imagens.
 */
export const searchImages = async (searchTerm: string): Promise<UnsplashImage[]> => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'searchImages',
            searchTerm
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao buscar imagens: ${response.status}`);
    }

    const data: UnsplashApiResponse = await response.json();
    return data.results || [];
};
