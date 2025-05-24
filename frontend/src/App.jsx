// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVOutput from './components/CVOutput';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState(''); // Inisialisasi dengan string kosong

  useEffect(() => {
    let determinedBackendUrl = ''; // Inisialisasi dengan string kosong
    // Variabel defaultLocalhostUrl DIHAPUS sepenuhnya

    // Uncomment log ini jika perlu untuk debugging saat pengembangan
    /*
    console.log(
      "App.jsx useEffect: Initializing URL detection.",
      "REACT_APP_BACKEND_URL:", process.env.REACT_APP_BACKEND_URL,
      "window.GITPOD_WORKSPACE_URL:", typeof window !== 'undefined' ? window.GITPOD_WORKSPACE_URL : "N/A"
    );
    */

    if (process.env.REACT_APP_BACKEND_URL) {
      // Prioritas 1: Digunakan oleh Vercel (dari Environment Variables di Vercel)
      determinedBackendUrl = process.env.REACT_APP_BACKEND_URL;
      // console.log("App.jsx useEffect: Using REACT_APP_BACKEND_URL:", determinedBackendUrl);
    } else if (typeof window !== 'undefined' && window.GITPOD_WORKSPACE_URL) {
      // Prioritas 2: Digunakan untuk pengembangan di Gitpod (atau jika backend HF Spaces diakses dari Gitpod)
      const gitpodWorkspaceUrl = window.GITPOD_WORKSPACE_URL;
      const backendPort = 8000; // Port backend Anda di Gitpod/HF Spaces
      const gitpodUrlWithoutProtocol = gitpodWorkspaceUrl.startsWith('https://')
                                     ? gitpodWorkspaceUrl.substring("https://".length)
                                     : gitpodWorkspaceUrl;
      determinedBackendUrl = `https://${backendPort}-${gitpodUrlWithoutProtocol}`;
      // console.log("App.jsx useEffect: Using Gitpod URL:", determinedBackendUrl);
    } else {
      // Jika tidak ada URL yang valid terdeteksi, determinedBackendUrl akan tetap string kosong.
      // Pesan error akan ditangani di handleGenerateSummary jika backendUrl kosong.
      console.error(
        "App.jsx useEffect: CRITICAL - No valid backend URL could be determined. " +
        "REACT_APP_BACKEND_URL (for Vercel/Gradio) or " +
        "window.GITPOD_WORKSPACE_URL (for Gitpod dev) is missing. " +
        "Frontend will not be able to contact the backend."
      );
    }
    
    setBackendUrl(determinedBackendUrl);
    // console.log("App.jsx useEffect: Final backendUrl in state:", determinedBackendUrl);

  }, []); // Dependency array kosong, hanya run sekali saat mount

  const handleGenerateSummary = async (inputText) => {
    setIsLoading(true);
    setError(null);
    setSummary('');

    if (!backendUrl) { // Validasi jika backendUrl kosong setelah useEffect
        const errMsg = "Konfigurasi URL Backend bermasalah. URL tidak diset atau kosong. " +
                       "Pastikan REACT_APP_BACKEND_URL (di Vercel) atau " +
                       "deteksi URL Gitpod (saat di Gitpod) berfungsi dengan benar.";
        setError(errMsg);
        console.error("App.jsx handleGenerateSummary Error:", errMsg, "Current backendUrl state is empty.");
        setIsLoading(false);
        return;
    }

    // Konstruksi URL API berdasarkan apakah backendUrl adalah Gradio atau FastAPI biasa
    let finalApiUrl = backendUrl;
    const isLikelyGradioUrl = backendUrl.includes('.gradio.live');
    
    if (isLikelyGradioUrl) {
        const gradioApiEndpointPath = "/api/predict/"; // Verifikasi path ini!
        if (!finalApiUrl.endsWith('/')) {
            finalApiUrl += '/';
        }
        // Hati-hati agar tidak menambahkan path API jika sudah ada
        if (finalApiUrl.includes('/api/')) {
             // Jika sudah ada /api/, asumsikan sudah benar atau path API berbeda, gunakan apa adanya.
             // Ini mungkin perlu disesuaikan jika URL Gradio bisa sangat bervariasi.
             // console.warn(`App.jsx: backendUrl (${backendUrl}) sudah mengandung /api/. Menggunakan URL apa adanya untuk Gradio: ${finalApiUrl}`);
        } else {
            finalApiUrl = finalApiUrl.endsWith('/') 
                          ? `${finalApiUrl.slice(0, -1)}${gradioApiEndpointPath}` 
                          : `${finalApiUrl}${gradioApiEndpointPath}`;
        }
    } else {
        // Untuk FastAPI biasa, tambahkan /summarize
        if (!finalApiUrl.endsWith('/')) {
            finalApiUrl += '/';
        }
        // Hanya tambahkan 'summarize' jika belum ada di akhir URL
        if (!finalApiUrl.endsWith('summarize')) {
            finalApiUrl += 'summarize';
        }
    }

    // console.log(`App.jsx handleGenerateSummary: Submitting to final API URL: ${finalApiUrl}`);

    try {
      const payload = isLikelyGradioUrl 
                      ? { data: [inputText] } 
                      : { text: inputText };

      const response = await fetch(finalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData;
        let responseTextForError = '';
        try {
            responseTextForError = await response.clone().text();
            errorData = await response.json(); 
        } catch (e) {
            errorData = { detail: responseTextForError || response.statusText || `HTTP error! status: ${response.status}` };
        }
        const apiErrorMsg = errorData.error || errorData.detail || 'Gagal mengambil data dari server.';
        throw new Error(`(${response.status}) ${apiErrorMsg} - URL: ${response.url}`);
      }

      const data = await response.json();
      
      let resultSummary = '';
      if (isLikelyGradioUrl) {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          resultSummary = data.data[0];
        } else if (data && data.error) {
          throw new Error(`Backend Gradio mengembalikan error: ${data.error}`);
        } else {
          throw new Error("Format respons dari Gradio API tidak sesuai.");
        }
      } else { // FastAPI
        if (data && data.summary) {
          resultSummary = data.summary;
        } else {
          throw new Error("Format respons dari FastAPI tidak sesuai (field 'summary' tidak ditemukan).");
        }
      }

      if (typeof resultSummary === 'string' && (resultSummary.startsWith("ERROR:") || resultSummary.startsWith("Error:"))) {
          setError(`Backend mengembalikan error: ${resultSummary}`);
          setSummary('');
      } else {
          setSummary(resultSummary);
      }

    } catch (err) {
      console.error("App.jsx handleGenerateSummary: Error during API call:", err);
      const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
      let displayError = errorMessage;
      if (!(errorMessage.includes("URL:") || errorMessage.toLowerCase().includes("backend")) && 
          (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.toLowerCase().includes("cors"))) {
        displayError = `Tidak dapat terhubung atau ada masalah CORS dengan server backend. Pastikan server berjalan dan dapat diakses di ${backendUrl}. Detail: ${errorMessage}`;
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
        <p>Powered by React, dan AI.</p>
        {/* 
        <p className="text-xs mt-1">
          DevInfo: Backend URL -> {backendUrl || "Not set/configured"}
        </p>
        */}
      </footer>
    </div>
  );
}

export default App;