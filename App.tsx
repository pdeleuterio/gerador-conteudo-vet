import React, { useState } from 'react';
import { Header } from './components/Header';
import { PostGeneratorForm } from './components/PostGeneratorForm';
import { GeneratedPostDisplay } from './components/GeneratedPostDisplay';
import { Loader } from './components/Loader';
import { generateContentFromWordpress } from './services/geminiService';
import { DailyPostContent, ImagePrompt } from './types';

// Interface para a resposta combinada do nosso novo backend WordPress
interface CombinedContent extends DailyPostContent, ImagePrompt {}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<CombinedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTone, setCurrentTone] = useState('Informativo');

  const handleGenerate = async (date: Date, tone: string) => {
    setIsLoading(true);
    setGeneratedContent(null);
    setError(null);
    setCurrentTone(tone);

    try {
      const fullContent = await generateContentFromWordpress(date, tone);
      setGeneratedContent(fullContent);
      
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`Ocorreu um erro ao gerar o conteúdo. Detalhes: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-slate-800">Gerador de Conteúdo Vet</h1>
          <p className="mt-2 text-slate-600">
            Selecione uma data e um tom de comunicação para gerar uma ideia de post para as redes sociais da sua clínica veterinária.
          </p>
          <div className="mt-6 border-t border-slate-200 pt-6">
             <PostGeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
        </div>
        
        {isLoading && <Loader />}
        
        {error && (
          <div className="mt-8 p-4 bg-red-100 border border-red-40t-700 rounded-md" role="alert">
            <p className="font-bold">Erro!</p>
            <p>{error}</p>
          </div>
        )}

        {generatedContent && !isLoading && (
          <GeneratedPostDisplay content={generatedContent} imagePrompt={{ image_prompt: generatedContent.image_prompt }} tone={currentTone} />
        )}

      </main>
      <footer className="text-center py-4 mt-8">
        <p className="text-sm text-slate-500">
          Powered by a Secure WordPress Backend
        </p>
      </footer>
    </div>
  );
}

export default App;