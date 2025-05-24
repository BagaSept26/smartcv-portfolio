# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

from .models import TextInput, SummaryOutput
from .ai_processor import generate_cv_summary, initialize_model as initialize_ai_model 

app = FastAPI(
    title="SmartCV API",
    description="API untuk menghasilkan ringkasan CV profesional menggunakan AI (Dummy).",
    version="0.1.0-dummy-restored"
)

# --- Konfigurasi CORS ---
allowed_origins = [
    "http://localhost:3000", 
]

gitpod_workspace_url = os.getenv("GITPOD_WORKSPACE_URL")
if gitpod_workspace_url:
    frontend_port_gitpod = 3000 
    gitpod_frontend_url = f"https://{frontend_port_gitpod}-{gitpod_workspace_url.replace('https://', '')}"
    allowed_origins.append(gitpod_frontend_url)
    print(f"Backend: Menambahkan Gitpod frontend URL ke CORS: {gitpod_frontend_url}")

vercel_frontend_url = os.getenv("VERCEL_FRONTEND_URL") 
if vercel_frontend_url:
    allowed_origins.append(vercel_frontend_url)
    print(f"Backend: Menambahkan Vercel frontend URL ke CORS: {vercel_frontend_url}")

# Logika untuk final_origins
# Jika tidak ada origin spesifik yang terdeteksi (selain localhost), izinkan semua untuk dev.
# Ini bisa disesuaikan agar lebih ketat jika diperlukan.
if not any(origin for origin in allowed_origins if origin not in ["http://localhost:3000"]):
    print("Backend: PERINGATAN CORS: Tidak ada origin spesifik (Gitpod/Vercel) terdeteksi selain localhost. Mengizinkan semua origin ('*') untuk kemudahan development awal.")
    final_origins = ["*"]
else:
    final_origins = [origin for origin in allowed_origins if origin] 
    print(f"Backend: CORS akan diizinkan untuk origins: {final_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=final_origins, 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], 
    allow_headers=["*"],
)
# --- Akhir Konfigurasi CORS ---

@app.on_event("startup")
async def startup_event():
    print("Backend: Aplikasi FastAPI memulai...")
    if initialize_ai_model(): # Fungsi dari ai_processor.py
        print("Backend: Model AI (Sungguhan) berhasil diinisialisasi saat startup.")
    else:
        print("Backend: PERINGATAN PENTING: Model AI (sungguhan) GAGAL diinisialisasi saat startup.")

@app.get("/")
async def read_root():
    return {"message": "Selamat datang di SmartCV API! Endpoint utama adalah /summarize."}

@app.post("/summarize", response_model=SummaryOutput)
async def summarize_text_endpoint(input_data: TextInput): # Ganti nama fungsi agar unik jika diperlukan
    print(f"Backend: Menerima permintaan ke /summarize dengan data: {input_data.text[:50]}...")
    if not input_data.text or not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Input teks tidak boleh kosong.")

    try:
        summary = generate_cv_summary(input_data.text) # Panggil fungsi dari ai_processor
        
        if "Error: Model AI gagal" in summary: 
             raise HTTPException(status_code=503, detail=summary)

        return SummaryOutput(summary=summary)
    except HTTPException:
        raise 
    except Exception as e:
        print(f"Backend: Error tak terduga di endpoint /summarize: {e}")
        import traceback
        traceback.print_exc() # Cetak traceback ke log backend
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal server: {str(e)}")