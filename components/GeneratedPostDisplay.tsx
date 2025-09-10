import React, { useState } from 'react';
import { DailyPostContent, ImagePrompt } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { StockMediaLinks } from './StockMediaLinks';

interface GeneratedPostDisplayProps {
    content: DailyPostContent;
    imagePrompt: ImagePrompt | null;
    tone: string;
}

export const GeneratedPostDisplay: React.FC<GeneratedPostDisplayProps> = ({ content, imagePrompt, tone }) => {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!content) return null;

    return (
        <div className="mt-8 space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3">Ideia de Post Gerada</h2>

            <div className="p-4 bg-slate-50 rounded-md">
                <h3 className="text-lg font-semibold text-slate-700">Ideia Principal</h3>
                <p className="mt-1 text-slate-600">{content.post_idea}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-md relative">
                 <h3 className="text-lg font-semibold text-slate-700">Legenda para Redes Sociais</h3>
                 <button 
                    onClick={() => handleCopy(content.caption, 'caption')}
                    className="absolute top-3 right-3 p-2 text-slate-500 hover:text-teal-600 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
                    aria-label="Copiar legenda"
                >
                    {copied === 'caption' ? <span className="text-sm font-semibold text-teal-600">Copiado!</span> : <ClipboardIcon className="w-5 h-5" />}
                 </button>
                 <p className="mt-2 text-slate-600 whitespace-pre-wrap">{content.caption}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-md">
                <h3 className="text-lg font-semibold text-slate-700">Hashtags</h3>
                <p className="mt-1 text-slate-500 italic">{content.hashtags.join(' ')}</p>
            </div>

            {imagePrompt && imagePrompt.image_prompt && (
                <div className="p-4 bg-teal-50 border-l-4 border-teal-500 rounded-r-md">
                     <h3 className="text-lg font-semibold text-teal-800">Sugestão de Prompt para Imagem</h3>
                     <div className="relative mt-2">
                        <p className="text-teal-700 pr-12 italic">"{imagePrompt.image_prompt}"</p>
                         <button 
                            onClick={() => handleCopy(imagePrompt.image_prompt, 'prompt')}
                            className="absolute -top-1 -right-1 p-2 text-slate-500 hover:text-teal-600 bg-teal-100 hover:bg-teal-200 rounded-full transition-colors"
                            aria-label="Copiar prompt de imagem"
                        >
                            {copied === 'prompt' ? <span className="text-sm font-semibold text-teal-600">Copiado!</span> : <ClipboardIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}
            
            {imagePrompt && <StockMediaLinks searchTerm={content.post_idea} tone={tone} />}
        </div>
    );
};
