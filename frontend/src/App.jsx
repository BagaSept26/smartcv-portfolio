// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVOutput from './components/CVOutput';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    let determinedBackendUrl = '';
    const defaultLocalhostUrl = 'http://localhost:8000';

    // Log ini bisa dipertahankan jika Anda ingin melihat URL mana yang digunakan saat runtime awal,
    // atau bisa dihapus jika sudah yakin.
    // console.log("App.jsx: Initializing. REACT_APP_BACKEND_URL:", process.env.REACT_APP_BACKEND_URL, "GITPOD_WORKSPACE_URL:", typeof window !== 'undefined' ? window.GITPOD_WORKSPACE_URL : "N/A");

    if (process.env.REACT_APP_BACKEND_URL) {
      // Prioritas 1: Untuk Vercel (atau jika .env diset manual dengan variabel ini)
      determinedBackendUrl = process.env.REACT_APP_BACKEND_URL;
      // console.log("App.jsx: Using REACT_APP_BACKEND_URL:", determinedBackendUrl);
    } else if (typeof window !== 'undefined' && window.GITPOD_WORKSPACE_URL) {
      // Prioritas 2: Untuk Gitpod
      const gitpodWorkspaceUrl = window.GITPOD_WORKSPACE_URL;
      const backendPort = 8000;
      const gitpodUrlWithoutProtocol = gitpodWorkspaceUrl.startsWith('https://')
                                     ? gitpodWorkspaceUrl.substring("https://".length)
                                     : gitpodWorkspaceUrl;
      determinedBackendUrl = `https://${backendPort}-${gitpodUrlWithoutProtocol}`;
      // console.log("App.jsx: Using Gitpod URL:", determinedBackendUrl);
    } else {
      // Prioritas 3: Fallback untuk pengembangan lokal biasa
      determinedBackendUrl = defaultLocalhostUrl;
      // console.warn("App.jsx: Fallback: Using localhost URL:", determinedBackendUrl);
    }
    
    setBackendUrl(determinedBackendUrl);
    // console.log("App.jsx: Final backendUrl in state:", determinedBackendUrl);

  }, []);

  const handleGenerateSummary = async (inputText) => {
    setIsLoading(true);
    setError(null);
    setSummary('');

    // Validasi backendUrl sebelum fetch
    if (!backendUrl) {
        const errMsg = "Konfigurasi URL Backend bermasalah. URL tidak diset.";
        setError(errMsg);
        console.error("App.jsx handleGenerateSummary Error:", errMsg, "Current backendUrl state is empty.");
        setIsLoading(false);
        return;
    }
    // Hapus console.log yang terlalu detail jika sudah tidak perlu
    // console.log(`App.jsx: Submitting to backend: ${backendUrl}/summarize`);

    try {
      const response = await fetch(`${backendUrl}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        let errorData;
        let responseTextForError = ''; // Untuk menyimpan teks respons jika parsing JSON gagal
        try {
            // Coba baca sebagai teks dulu, karena kadang error 500 dari proxy/server tidak JSON
            responseTextForError = await response.clone().text(); // clone() agar bisa dibaca lagi sebagai JSON jika perlu
            errorData = await response.json(); 
        } catch (e) {
            // Jika parsing JSON gagal, gunakan responseTextForError atau statusText
            errorData = { detail: responseTextForError || response.statusText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(`(${response.status}) ${errorData.detail || 'Gagal mengambil data dari server.'} - URL: ${response.url}`);
      }

      const data = await response.json();
      setSummary(data.summary);

    } catch (err) {
      // Log error ini penting untuk debugging di production jika terjadi masalah
      console.error("App.jsx: Error during API call to /summarize:", err);
      const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
      
      let displayError = errorMessage;
      // Periksa apakah pesan error sudah informatif, jika tidak, tambahkan konteks
      if (!(errorMessage.includes("URL:") || errorMessage.toLowerCase().includes("backend")) && 
          (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.toLowerCase().includes("cors"))) {
        displayError = `Tidak dapat terhubung atau ada masalah CORS dengan server backend. Pastikan server backend berjalan dan dapat diakses di ${backendUrl}. Detail: ${errorMessage}`;
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
        <p>© {new Date().getFullYear()} Bagas Septian. Dibuat untuk Portofolio.</p>
        <p>Powered by React, FastAPI, dan Model AI.</p>
        {/* Anda bisa hapus atau biarkan log URL backend ini untuk tahap awal produksi jika masih ingin mudah cek */}
        {/* <p className="text-xs mt-1">DevInfo: Backend URL -> {backendUrl || "Not set"}</p> */}
      </footer>
    </div>
  );
}

export default App;