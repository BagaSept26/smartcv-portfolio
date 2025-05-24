// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVOutput from './components/CVOutput';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState(''); // Akan berisi URL publik Gradio

  useEffect(() => {
    // Logika penentuan backendUrl (URL Gradio akan diset via REACT_APP_BACKEND_URL di Vercel)
    let determinedBackendUrl = '';
    const defaultLocalhostUrl = 'http://localhost:8000'; // Kurang relevan untuk Gradio, tapi sebagai fallback

    if (process.env.REACT_APP_BACKEND_URL) {
      determinedBackendUrl = process.env.REACT_APP_BACKEND_URL;
      // console.log("App.jsx: Using REACT_APP_BACKEND_URL (for Gradio):", determinedBackendUrl);
    } else {
      // Untuk pengembangan lokal jika ingin mengetes dengan URL Gradio yang di-hardcode sementara
      // determinedBackendUrl = "https://xxxxxxxxxx.gradio.live"; // Ganti dengan URL Gradio Anda jika tes lokal
      console.warn("App.jsx: REACT_APP_BACKEND_URL tidak diset. Frontend mungkin tidak bisa menghubungi backend Gradio.");
      // Jika tidak ada, mungkin set ke string kosong atau fallback yang tidak akan jalan agar error jelas
      determinedBackendUrl = defaultLocalhostUrl; 
    }
    
    setBackendUrl(determinedBackendUrl);

  }, []);

  const handleGenerateSummary = async (inputText) => {
    setIsLoading(true);
    setError(null);
    setSummary('');

    if (!backendUrl) {
        const errMsg = "URL Backend (Gradio) belum dikonfigurasi. Set REACT_APP_BACKEND_URL di Vercel.";
        setError(errMsg);
        console.error("App.jsx handleGenerateSummary Error:", errMsg);
        setIsLoading(false);
        return;
    }

    // Default Gradio API endpoint. VERIFIKASI INI DENGAN INSPEKSI NETWORK!
    // Bisa jadi /api/run/ atau path lain tergantung versi Gradio atau setup.
    let gradioApiEndpointPath = "/api/predict/"; 

    // Cek apakah backendUrl sudah mengandung path API (misal dari copy-paste yang salah)
    // Atau jika backendUrl tidak diakhiri slash
    let finalApiUrl = backendUrl;
    if (!finalApiUrl.endsWith('/')) {
        finalApiUrl += '/';
    }
    if (!finalApiUrl.includes('/api/')) { // Jika path API belum ada di backendUrl
        finalApiUrl = finalApiUrl.endsWith('/') 
                      ? `${finalApiUrl.slice(0, -1)}${gradioApiEndpointPath}` 
                      : `${finalApiUrl}${gradioApiEndpointPath}`;
    } else {
        // Jika sudah ada /api/, pastikan pathnya benar dan tidak duplikat
        // Ini hanya asumsi sederhana, mungkin perlu logika lebih canggih jika URL bisa bervariasi
        if (!finalApiUrl.endsWith(gradioApiEndpointPath.substring(1))) { // Hapus slash awal dari path untuk perbandingan
             console.warn(`App.jsx: backendUrl sudah mengandung /api/ tapi pathnya mungkin berbeda dari asumsi '${gradioApiEndpointPath}'. Menggunakan URL apa adanya: ${finalApiUrl}`);
        }
    }


    console.log(`App.jsx: Submitting to Gradio API: ${finalApiUrl}`);

    try {
      const payload = {
        data: [inputText] // Input teks sebagai elemen pertama array untuk Gradio
      };

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
        const gradioErrorMsg = errorData.error || errorData.detail || 'Gagal mengambil data dari server Gradio.';
        throw new Error(`(${response.status}) ${gradioErrorMsg} - URL: ${response.url}`);
      }

      const data = await response.json();
      
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        let resultSummary = data.data[0];
        if (typeof resultSummary === 'string' && (resultSummary.startsWith("ERROR:") || resultSummary.startsWith("Error:"))) {
            setError(`Backend Gradio mengembalikan error: ${resultSummary}`);
            setSummary('');
        } else {
            setSummary(resultSummary);
        }
      } else if (data && data.error) { // Kadang Gradio mengembalikan error di field 'error'
        setError(`Backend Gradio mengembalikan error: ${data.error}`);
        setSummary('');
        console.error("App.jsx: Error dari Gradio API:", data.error);
      }
      else {
        console.error("App.jsx: Respons Gradio tidak dalam format yang diharapkan:", data);
        throw new Error("Format respons dari Gradio API tidak sesuai.");
      }

    } catch (err) {
      console.error("App.jsx: Error during API call to Gradio:", err);
      const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
      let displayError = errorMessage;
      if (!(errorMessage.includes("URL:") || errorMessage.toLowerCase().includes("gradio")) && 
          (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.toLowerCase().includes("cors"))) {
        displayError = `Tidak dapat terhubung atau ada masalah CORS dengan server Gradio di ${backendUrl}. Pastikan Colab berjalan dan URL publik Gradio benar. Detail: ${errorMessage}`;
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
          Masukkan pengalaman kerja Anda dan biarkan AI membuat ringkasan CV yang ATS-friendly. (Backend via Gradio/Colab)
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
        <p>Powered by React, Gradio (Colab), dan Model AI.</p>
        {/* <p className="text-xs mt-1">DevInfo: Gradio Backend URL -> {backendUrl || "Not set"}</p> */}
      </footer>
    </div>
  );
}

export default App;