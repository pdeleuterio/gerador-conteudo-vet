
import React from 'react';

export const Loader: React.FC = () => {
    const messages = [
        "Consultando os melhores especialistas...",
        "Preparando uma dose de criatividade...",
        "Buscando as melhores ideias para pets...",
        "Aguardando a inspiração chegar...",
        "Quase lá! Adestrando as palavras finais..."
    ];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 3000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center justify-center my-12 text-center">
            <div className="relative w-16 h-16">
                 <div className="w-16 h-16 border-4 border-teal-200 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-16 h-16 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-500 font-medium transition-opacity duration-500">{message}</p>
        </div>
    );
};
