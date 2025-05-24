// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVOutput from './components/CVOutput';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState(''); // Default string kosong

  // Efek untuk menentukan URL backend saat komponen dimuat
  useEffect(() => {
    // --- HARDCODE URL BACKEND GITPOD ANDA DI SINI ---
    // !!! PENTING: GANTI STRING DI BAWAH INI DENGAN URL BACKEND GITPOD ANDA YANG SEBENARNYA (PORT 8000) !!!
    const yourActualGitpodBackendUrl = "https://8000-bagasept26-smartcvportf-gfmr49aks7w.ws-us119.gitpod.io";
    // Contoh penggantian:
    // const yourActualGitpodBackendUrl = "https://8000-bagasept26-smartcvportf-gfmr49aks7w.ws-us119.gitpod.io"; 

    // Cek sederhana apakah placeholder masih ada (untuk pengingat)
    if (yourActualGitpodBackendUrl.includes("GANTI_INI_DENGAN_URL_BACKEND_GITPOD_ANDA_YANG_SEBENARNYA")) {
        const placeholderErrorMsg = "APP.JSX ERROR: Placeholder URL backend 'yourActualGitpodBackendUrl' belum diganti dengan URL yang benar. Silakan edit file frontend/src/App.jsx.";
        console.error(placeholderErrorMsg);
        // Anda bisa set error di sini agar terlihat di UI saat load jika mau, tapi validasi di handleGenerateSummary juga akan menangkapnya.
        // setError(placeholderErrorMsg); 
        setBackendUrl(''); // Set ke kosong agar jelas gagal di validasi handleGenerateSummary
        return; 
    }

    setBackendUrl(yourActualGitpodBackendUrl);
    console.log("App.jsx: Menggunakan URL Backend Gitpod (HARDCODED):", yourActualGitpodBackendUrl);

  }, []); // Dependency array kosong agar hanya jalan sekali saat mount

  const handleGenerateSummary = async (inputText) => {
    setIsLoading(true);
    setError(null);
    setSummary('');

    console.log("App.jsx: handleGenerateSummary dipanggil. Backend URL yang akan digunakan:", backendUrl);

    // Validasi backendUrl sebelum fetch
    if (!backendUrl || backendUrl.includes("GANTI_INI_DENGAN_URL_BACKEND_GITPOD_ANDA_YANG_SEBENARNYA")) {
        let errMsg = "URL Backend tidak valid atau placeholder di App.jsx belum diganti.";
        if (backendUrl.includes("GANTI_INI_DENGAN_URL_BACKEND_GITPOD_ANDA_YANG_SEBENARNYA")) {
            errMsg = "KESALAHAN DI KODE: Placeholder URL backend di App.jsx belum diganti dengan URL yang benar. Edit file frontend/src/App.jsx.";
        } else if (!backendUrl) {
            errMsg = `URL Backend kosong. Periksa useEffect di App.jsx. Mungkin placeholder belum diganti atau ada masalah lain.`;
        }
        setError(errMsg);
        console.error("App.jsx: Kesalahan konfigurasi Backend URL sebelum fetch:", errMsg, "Nilai backendUrl saat ini:", `'${backendUrl}'`);
        setIsLoading(false);
        return;
    }

    try {
      console.log(`App.jsx: Mencoba fetch ke endpoint: ${backendUrl}/summarize`);
      const response = await fetch(`${backendUrl}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json(); 
        } catch (e) {
            // Jika body bukan JSON atau tidak ada body, coba baca sebagai teks lalu gunakan statusText
            let responseTextError = '';
            try {
                responseTextError = await response.text();
            } catch (textErr) {
                // Abaikan jika pembacaan teks juga gagal
            }
            errorData = { detail: responseTextError || response.statusText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(`(${response.status}) ${errorData.detail || 'Gagal mengambil data dari server.'} - URL: ${response.url}`);
      }

      const data = await response.json();
      setSummary(data.summary);

    } catch (err) {
      console.error("App.jsx: Gagal menghasilkan ringkasan (error di blok catch):", err);
      const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
      // Periksa apakah pesan error sudah mencakup URL (dari blok if !response.ok)
      // Jika tidak, tambahkan informasi URL dan koneksi
      let displayError = errorMessage;
      if (!(errorMessage.includes("URL:") || errorMessage.toLowerCase().includes("backend")) && 
          (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.toLowerCase().includes("cors"))) {
        displayError = `Tidak dapat terhubung atau ada masalah CORS dengan server backend di ${backendUrl}. Pastikan server backend berjalan, URL benar, dan CORS dikonfigurasi. Detail: ${errorMessage}`;
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <header className="w-full max-w-3xl text-center my-8 md:my-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
          SmartCV <span className="text-2xl sm:text-3xl text-slate-400 align-middle">Generator</span>
        </h1>
        <p className="text-slate-300 mt-3 text-sm sm:text-base">
          Masukkan pengalaman kerja Anda dan biarkan AI membuat ringkasan CV yang ATS-friendly.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8">
        <CVForm onSubmit={handleGenerateSummary} isLoading={isLoading} />
        {isLoading && <LoadingSpinner />}
        {error && (
          <div className="mt-6 bg-red-800/80 border border-red-700 text-red-100 px-4 py-3 rounded-md relative" role="alert">
            <strong className="font-bold">Oops! Terjadi Kesalahan:</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
        )}
        {summary && !isLoading && !error && <CVOutput summary={summary} />}
      </main>

      <footer className="w-full max-w-3xl text-center mt-12 mb-6 text-slate-500 text-xs sm:text-sm">
        <p>© {new Date().getFullYear()} [Ganti dengan Nama Anda]. Dibuat untuk Portofolio.</p>
        <p>Powered by React, FastAPI, dan Model AI.</p>
        {/* Untuk debugging, tampilkan URL backend yang digunakan */}
        {/* <p className="text-xs mt-1">Current Backend URL: {backendUrl.includes("GANTI_INI_DENGAN_URL_BACKEND_GITPOD_ANDA_YANG_SEBENARNYA") ? "PLACEHOLDER BELUM DIGANTI!" : (backendUrl || "Kosong/Belum diset")}</p> */}
      </footer>
    </div>
  );
}

export default App;