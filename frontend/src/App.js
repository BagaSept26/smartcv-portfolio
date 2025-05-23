import React, { useState, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVOutput from './components/CVOutput';
import LoadingSpinner from './components/LoadingSpinner';
// Kita tidak menggunakan Axios di contoh ini, tapi fetch() bawaan browser.
// Jika ingin pakai Axios, uncomment: import axios from 'axios';

function App() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');

  // Efek untuk menentukan URL backend saat komponen dimuat
  useEffect(() => {
    let determinedBackendUrl;
    if (process.env.REACT_APP_BACKEND_URL) {
      determinedBackendUrl = process.env.REACT_APP_BACKEND_URL;
    } else if (window.GITPOD_WORKSPACE_URL) { // Gitpod injects this into window
      const gitpodWorkspaceUrl = window.GITPOD_WORKSPACE_URL;
      const backendPort = 8000; // Port backend Anda di Gitpod
      determinedBackendUrl = `https://${backendPort}-${gitpodWorkspaceUrl.substring("https://".length)}`;
    } else {
      determinedBackendUrl = 'http://localhost:8000'; // Fallback
    }
    setBackendUrl(determinedBackendUrl);
    // console.log("Backend URL diatur ke:", determinedBackendUrl);
  }, []);

  const handleGenerateSummary = async (inputText) => {
    if (!backendUrl) {
      setError("URL Backend belum terkonfigurasi. Cek konsol.");
      console.error("Backend URL is not set!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(''); // Kosongkan ringkasan sebelumnya

    try {
      // Menggunakan fetch()
      const response = await fetch(`${backendUrl}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        // Coba baca error dari body response jika ada
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // Jika body bukan JSON atau tidak ada body
            errorData = { detail: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);

    } catch (err) {
      console.error("Gagal menghasilkan ringkasan:", err);
      // Pastikan err.message ada dan string
      const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
         setError(`Tidak dapat terhubung ke server backend di ${backendUrl}. Pastikan server backend berjalan dan CORS dikonfigurasi dengan benar.`);
      } else {
         setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-sreen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex flex-col items-center p-4">
      <header className="w-full max-w-3xl text-center my-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from sky-400 to-cyan-300">
          SmartCV <span className="text-2xl text-slate-400">Generator</span>
        </h1>
        <p className="text-slate-300 mt-2">
          Masukan Pengalaman kerja Anda dan biarkan AI membuat ringkasan profesional.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8">
        {/* <CVForm onSubmit={handleGenerateSummary} isLoading={isLoading} /> */}
        <div className="my-4 p-4 bg-yellow-200 text-yellow-800 rounded">
          Placeholder untuk CVForm
        </div>

        {isLoading && (
          <div className="my-4 p-4 text-center">
            Loading.. {/* Placeholder untuk LoadingSpinner */}
          </div>
        )}
        {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
        {summary && !isLoading && (
          <div className="mt-8 p-6 bg-slate-700/50 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-sky-300 mb-4">Ringkasan Professional:</h2>
            <p className="text-slate-200">{summary}</p>
          </div>
          //Placeholdeer untuk CVOutput
        )}
      </main>

      <footer className="w-full max-w-3xl text-center mt-12 mb-4 text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Bagas Septian. Dibuat untuk Portfolio.</p>
      </footer>
    </div>
  )
}

export default App;
