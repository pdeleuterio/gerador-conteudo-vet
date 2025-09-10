import React, { useState } from 'react';
import { DailyPostContent } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { StockMediaLinks } from './StockMediaLinks';

interface GeneratedPostDisplayProps {
    content: DailyPostContent;
}

export const GeneratedPostDisplay: React.FC<GeneratedPostDisplayProps> = ({ content }) => {
    const [copied, setCopied] = useState(false);

    // Usa os campos corretos retornados pela nova API
    const fullPostText = `
${content.caption}

${content.hashtags.join(' ')}
    `.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(fullPostText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-sm font-semibold text-teal-600 uppercase">Ideia do dia</span>
                    <h2 className="text-xl font-bold text-slate-800">{content.post_idea}</h2>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex-shrink-0 flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    title="Copiar legenda e hashtags"
                >
                    <ClipboardIcon className="w-4 h-4 mr-2" />
                    {copied ? 'Copiado!' : 'Copiar'}
                </button>
            </div>

            <div className="space-y-4 text-slate-700">
                <p className="whitespace-pre-wrap leading-relaxed">{content.caption}</p>
                <p className="text-teal-600 font-medium break-words">{content.hashtags.join(' ')}</p>
            </div>

            <hr className="my-6 border-slate-200" />
            
            <div className="p-4 bg-slate-50 rounded-md">
                 <h3 className="text-lg font-semibold text-slate-700">Sugestão de Prompt de Imagem (IA)</h3>
                 <p className="mt-1 text-sm text-slate-500 italic">"{content.image_prompt}"</p>
            </div>

            <div className="mt-4">
                {/* Passa o termo de busca otimizado para o componente de imagens */}
                <StockMediaLinks searchTerm={content.image_keywords} />
            </div>
        </div>
    );
};
