import React, { useEffect, useState } from 'react';

function CVOutput({ summary }) {
    const [copySuccess, setCopySuccess] = useState('');
    
    useEffect (() => {
        if (copySuccess){
            const timer = setTimeout(() => {
                setCopySuccess('');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [copySuccess]);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary)
        .then(() => setCopySuccess('Ringkasan berhasil disalin!'))
        .catch(err => setCopySuccess('Gagal menyalin. Coba lagi'));
    };

    //format output
    const renderSummary = () => {
        return summary.split('\n').map((line,index) => {
            line = line.trim();
            if(line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>;
            }
            if (line) {
                return <p key={index} className="mb-2">{line}</p>;
            }
            return null;
        }).filter(Boolean);
    };
    return (
        <div className="mt-10 p-6 bg-slate-700/70 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-sky-300">
                    Ringkasan Profesional Anda:
                </h2>
                <button
                    onClick={handleCopy}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-sm transition-color duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus-ring-emerald-500">
                        Salin Teks
                    </button>
            </div>
            {copySuccess && <p className="mb-3 text-sm text-emerald-400 text-center">{copySuccess}</p>}

            <div className="prose prose-sm prose-invert max-w-none text-slate-200 space-y-1 bg-slate-800 p-4 rounded-md border border-slate-600">
                <ul className="list-disc list-outside">
                    {renderSummary()}
                </ul>
            </div>
            <p className="mt-4 text-xs text-slate-400">
                Periksa kembali ringkasan ini dan sesuaikan jika perlu sbelum digunakan.
            </p>
        </div>
    );
}

export default CVOutput;