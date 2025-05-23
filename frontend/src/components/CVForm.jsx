import React, { useState } from 'react';

function CVForm({ onSubmit, isLoading }) {
    const [inputText, setInputText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) {
            alert("Mohong masukan teks pengalaman kerja Anda.");
            return;
        }
        onSubmit(inputText);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="experience" className="block text-sm font-medium text-sky-300 mb-2">
                    Masukan Pengalaman Kerja / Deskripsi Diri Anda:
                </label>
                <textarea
                    id="experience"
                    name="experience"
                    rows="12"
                    className="w-full p-4 bg-slate-700 border border-slate-600
                    rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400 text-slate-100 transition-colors duration-150 text-sm"
                    placeholder="Contoh: 
                    - Bertanggung jawab atas pengembangan fitur X,Y,Z utk apliasi ABC menggunakan React dan Node.js.
                    - Berhasil meningkatkan performa sebesar 20% melalui optimasi query database.
                    - Memimpin tim kecil berisi 3 developer dalam proyek A.
                    - Keterampilan: JavaScript, Python, SQL, Git."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading} //nonaktifkan saat loading
                    />
                    <p className="mt-2 text-xs text-slate-400">
                        Tips: Semakin detail input Anda (termasuk pencapaian angka jika ada), semakin baik ringkasan yang dihasilkan.
                    </p>
            </div>
            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white
                        ${isLoading
                            ? 'bg-sky-800 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-transform trasform hover:scale-105'
                        }`}>
                            {isLoading ? (
                                <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Memproses...
                                </>
                            ) : (
                                'Buat Ringkasan CV Profesional'
                            )}
                        </button>
            </div>
        </form>
    );
}

export default CVForm;