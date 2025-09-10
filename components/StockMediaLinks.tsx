import React, { useState } from 'react';
import { searchImages } from '../services/unsplashService';
import { UnsplashImage } from '../types';

interface StockMediaLinksProps {
    searchTerm: string;
}

export const StockMediaLinks: React.FC<StockMediaLinksProps> = ({ searchTerm }) => {
    const [images, setImages] = useState<UnsplashImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const results = await searchImages(searchTerm);
            setImages(results);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(`Não foi possível buscar as imagens. Detalhes: ${errorMessage}`);
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 rounded-md">
            <h3 className="text-lg font-semibold text-slate-700">Encontre uma imagem para seu post</h3>
            <p className="mt-1 text-sm text-slate-500">
                Buscando por: <span className="font-semibold">"{searchTerm}"</span>
            </p>
            <div className="mt-4">
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-md transition-colors disabled:bg-slate-400"
                >
                     {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando...
                        </>
                    ) : (
                       'Buscar imagens no Unsplash'
                    )}
                </button>
            </div>
            
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {!isLoading && hasSearched && images.length === 0 && !error && (
                <p className="mt-4 text-sm text-slate-500">Nenhuma imagem encontrada. Tente gerar o conteúdo para outra data.</p>
            )}

            {images.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map(image => (
                        <a key={image.id} href={image.links.html} target="_blank" rel="noopener noreferrer" className="group block relative rounded-lg overflow-hidden">
                            <img src={image.urls.small} alt={image.alt_description || 'Imagem do Unsplash'} className="w-full h-32 object-cover" />
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-2">
                                <p className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    por {image.user.name}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};
