import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface PostGeneratorFormProps {
    onGenerate: (date: Date, tone: string) => void;
    isLoading: boolean;
}

// Helper to format date as YYYY-MM-DD for the input
const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const PostGeneratorForm: React.FC<PostGeneratorFormProps> = ({ onGenerate, isLoading }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tone, setTone] = useState('Informativo');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(selectedDate, tone);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // The input value is in YYYY-MM-DD format. The Date constructor
        // can parse this, but it will be in UTC time. Adding 'T00:00:00'
        // ensures it's interpreted in the local timezone correctly.
        const date = new Date(`${e.target.value}T00:00:00`);
        setSelectedDate(date);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="date-selector" className="block text-sm font-medium text-slate-700 mb-1">
                        Selecione a Data do Post
                    </label>
                    <input
                        type="date"
                        id="date-selector"
                        value={formatDateForInput(selectedDate)}
                        onChange={handleDateChange}
                        className="block w-full px-4 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-1">
                        Tom da Comunicação
                    </label>
                    <select
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="block w-full px-4 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option>Informativo</option>
                        <option>Divertido</option>
                        <option>Profissional</option>
                        <option>Urgente</option>
                        <option>Empático</option>
                    </select>
                </div>
            </div>
            
            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Gerando ideia...
                        </>
                    ) : (
                       <>
                         <SparklesIcon className="w-5 h-5 mr-2" />
                         Gerar Ideia de Post
                       </>
                    )}
                </button>
            </div>
        </form>
    );
};