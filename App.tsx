import React, { useState } from 'react';
import { Header } from './components/Header';
import { PostGeneratorForm } from './components/PostGeneratorForm';
import { GeneratedPostDisplay } from './components/GeneratedPostDisplay';
import { Loader } from './components/Loader';
import { generateContentFromWordpress } from './services/geminiService';
import { DailyPostContent } from './types';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [postContent, setPostContent] = useState<DailyPostContent | null>(null);
    const [currentTone, setCurrentTone] = useState('Informativo');

    const handleGenerate = async (date: Date, tone: string) => {
        setIsLoading(true);
        setError(null);
        setPostContent(null);
        setCurrentTone(tone);

        try {
            const content = await generateContentFromWordpress(date, tone);
            setPostContent(content);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao gerar conteúdo: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header />
            <main className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gerador de Posts para Clínicas Veterinárias</h1>
                    <p className="text-slate-600 mb-6">
                        Crie ideias de posts para redes sociais em segundos. Selecione uma data e um tom de voz, e deixe a IA fazer o resto.
                    </p>
                    <PostGeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
                </div>

                {error && (
                    <div className="mt-8 p-4 bg-red-100 border border-red-200 rounded-md">
                        <strong className="font-semibold text-red-800">Erro!</strong>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
                
                {isLoading && <Loader />}

                {!isLoading && postContent && (
                    <GeneratedPostDisplay content={postContent} />
                )}

            </main>
            <footer className="text-center py-4">
                <p className="text-sm text-slate-500">
                    Criado com ❤️ para veterinários.
                </p>
            </footer>
        </div>
    );
};

export default App;
