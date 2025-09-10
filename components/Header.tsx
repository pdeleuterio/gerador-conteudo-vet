
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.41,11.58l-9-9C12.05,2.22,11.55,2,11,2H4C2.9,2,2,2.9,2,4v7c0,0.55,0.22,1.05,0.59,1.42l9,9C11.95,21.78,12.45,22,13,22s1.05-0.22,1.41-0.59l7-7C22.2,13.63,22.2,12.37,21.41,11.58z M13,20.01L4,11V4h7l9,9L13,20.01z"/>
                            <circle cx="6.5" cy="6.5" r="1.5"/>
                        </svg>
                        <span className="ml-3 text-xl font-bold text-slate-700">Gerador de Conteúdo Vet</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
