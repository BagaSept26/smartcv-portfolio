// frontend/src/App.jsx (Versi Debug untuk Vercel - useEffect Sangat Sederhana)
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
    // --- useEffect SANGAT DISEDERHANAKAN untuk DEBUG VERCEL BUILD ---
    let determinedBackendUrl = '';
    console.log("App.jsx DEBUG useEffect: Starting URL determination...");

    if (process.env.REACT_APP_BACKEND_URL) {
      determinedBackendUrl = process.env.REACT_APP_BACKEND_URL;
      console.log("App.jsx DEBUG useEffect: Using REACT_APP_BACKEND_URL:", determinedBackendUrl);
    } else {
      // Jika REACT_APP_BACKEND_URL tidak ada, biarkan determinedBackendUrl kosong.
      // Aplikasi akan error saat mencoba fetch, tapi ini untuk tes build dulu.
      console.error(
        "App.jsx DEBUG useEffect: CRITICAL - REACT_APP_BACKEND_URL is MISSING. " +
        "Frontend will not be able to contact the backend."
      );
    }
    
    setBackendUrl(determinedBackendUrl);
    console.log("App.jsx DEBUG useEffect: Final backendUrl in state:", determinedBackendUrl);
    // --- AKHIR useEffect SANGAT DISEDERHANAKAN ---
  }, []); // Dependency array kosong, hanya run sekali saat mount

  const handleGenerateSummary = async (inputText) => {
    setIsLoading(true);
    setError(null);
    setSummary('');

    // Log ini penting untuk melihat URL mana yang akhirnya digunakan
    console.log("App.jsx DEBUG handleGenerateSummary: Attempting to use backendUrl:", backendUrl);

    if (!backendUrl) { 
        const errMsg = "Konfigurasi URL Backend bermasalah. URL tidak diset atau kosong. " +
                       "Pastikan REACT_APP_BACKEND_URL (di Vercel) diset dengan benar.";
        setError(errMsg);
        console.error("App.jsx DEBUG handleGenerateSummary Error:", errMsg);
        setIsLoading(false);
        return;
    }

    let finalApiUrl = backendUrl;
    // Asumsi: Jika URL dari REACT_APP_BACKEND_URL adalah URL Gradio (misal, diakhiri .gradio.live)
    // Maka kita tambahkan path API Gradio. Jika tidak, kita asumsikan itu FastAPI biasa.
    const isLikelyGradioUrl = backendUrl.includes('.gradio.live');
    
    if (isLikelyGradioUrl) {
        const gradioApiEndpointPath = "/api/predict/"; // VERIFIKASI PATH INI!
        if (!finalApiUrl.endsWith('/')) {
            finalApiUrl += '/';
        }
        if (finalApiUrl.includes('/api/')) {
             // Jika sudah ada /api/, gunakan apa adanya (hati-hati jika path berbeda)
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
        if (!finalApiUrl.endsWith('summarize')) { // Hindari duplikasi jika sudah ada
            finalApiUrl += 'summarize';
        }
    }

    console.log(`App.jsx DEBUG handleGenerateSummary: Submitting to final API URL: ${finalApiUrl}`);

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
      console.error("App.jsx DEBUG handleGenerateSummary: Error during API call:", err);
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
          DevInfo (DEBUG): Backend URL -> {backendUrl || "Not set/configured"}
        </p>
        */}
      </footer>
    </div>
  );
}

export default App;