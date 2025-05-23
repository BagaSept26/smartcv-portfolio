import React, { useState } from 'react';
// import CVForm from './components/CVForm';
// import CVOutput from './components/CVOutput';
// import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateSummary = async (inputText) => {
    console.log("Input Text Diterima:", inputText);
    setIsLoading(true);
    setError(null);
    //simulasi API call
    setTimeout(() => {
      setSummary(`Ringkasan untuk: ${inputText.substring(0, 50)}... (ini masih data dummy)`);
      setIsLoading(false);
    }, 2000);
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
