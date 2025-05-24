# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import traceback # Untuk logging traceback error yang lebih detail

# Pastikan import dari modul lokal Anda benar
from .models import TextInput, SummaryOutput
from .ai_processor import generate_cv_summary, initialize_model as initialize_ai_model 

# python-dotenv hanya berguna untuk pengembangan lokal jika ada .env file.
# Di produksi (HF Spaces), variabel lingkungan diset melalui secrets.
# from dotenv import load_dotenv
# load_dotenv() 

app = FastAPI(
    title="SmartCV API - Production", # Ganti title jika mau
    description="API untuk menghasilkan ringkasan CV profesional menggunakan AI.",
    version="1.0.0" # Ganti versi jika mau
)

# --- Konfigurasi CORS untuk Produksi dan Pengembangan ---
# Daftar origins default yang selalu diizinkan (untuk dev lokal)
allowed_origins_core = [
    "http://localhost:3000",
    "http://localhost:3001", # Jika Anda kadang menggunakan port lain untuk frontend dev
]

# Ambil URL frontend dari environment variables (diset di HF Spaces atau Vercel)
# Untuk HF Spaces, kita akan set VERCEL_FRONTEND_URL sebagai secret
vercel_url_from_env = os.getenv("VERCEL_FRONTEND_URL")
if vercel_url_from_env:
    # Pastikan tidak ada spasi dan hapus trailing slash jika ada
    cleaned_vercel_url = vercel_url_from_env.strip().rstrip('/')
    if cleaned_vercel_url: # Pastikan tidak kosong setelah strip
        allowed_origins_core.append(cleaned_vercel_url)
        print(f"INFO: Backend - Vercel frontend URL '{cleaned_vercel_url}' ditambahkan ke CORS.")
    else:
        print("WARN: Backend - VERCEL_FRONTEND_URL diset tapi kosong setelah dibersihkan.")


# Ambil URL Gitpod untuk pengembangan (jika berjalan di Gitpod)
gitpod_workspace_url_from_env = os.getenv("GITPOD_WORKSPACE_URL")
if gitpod_workspace_url_from_env:
    frontend_port_gitpod = 3000 # Asumsi port frontend React di Gitpod
    # Hapus "https://" sebelum membangun URL port
    gitpod_domain_part = gitpod_workspace_url_from_env.replace('https://', '', 1)
    gitpod_frontend_origin = f"https://{frontend_port_gitpod}-{gitpod_domain_part}"
    allowed_origins_core.append(gitpod_frontend_origin)
    print(f"INFO: Backend - Gitpod frontend URL '{gitpod_frontend_origin}' ditambahkan ke CORS.")

# Jika tidak ada URL produksi (Vercel) atau Gitpod yang valid terdeteksi selain localhost,
# mungkin lebih aman untuk TIDAK mengizinkan "*" di produksi.
# Namun, untuk portofolio ini, jika VERCEL_FRONTEND_URL tidak diset,
# mungkin kita perlu fallback ke "*" agar tidak error saat pertama kali deploy sebelum set secret.
# Ini adalah trade-off keamanan vs kemudahan setup awal.

# Hapus duplikat jika ada
final_allowed_origins = sorted(list(set(allowed_origins_core)))

if not any(origin.startswith("https://") for origin in final_allowed_origins if origin not in ["http://localhost:3000", "http://localhost:3001"]):
    # Jika tidak ada origin HTTPS (Vercel/Gitpod) yang valid, cetak peringatan.
    # Untuk produksi, idealnya ini tidak terjadi.
    print("WARN: Backend - Tidak ada origin HTTPS (Vercel/Gitpod) yang dikonfigurasi untuk CORS selain localhost. Ini mungkin tidak aman untuk produksi.")
    # Jika Anda ingin lebih ketat di produksi dan VERCEL_FRONTEND_URL WAJIB ada:
    # if not vercel_url_from_env:
    #     print("CRITICAL: VERCEL_FRONTEND_URL tidak diset! CORS mungkin tidak berfungsi untuk frontend produksi.")
    #     # Anda bisa memilih untuk raise error di sini atau biarkan (akan fallback ke localhost saja)

print(f"INFO: Backend - CORS akan mengizinkan origins: {final_allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=final_allowed_origins if final_allowed_origins else ["http://localhost:3000"], # Fallback minimal jika daftar kosong
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], 
    allow_headers=["*"], # Untuk kesederhanaan, izinkan semua header. Bisa diperketat.
)
# --- Akhir Konfigurasi CORS ---

@app.on_event("startup")
async def startup_event():
    print("INFO: Backend - Aplikasi FastAPI memulai proses startup...")
    if initialize_ai_model(): 
        print("INFO: Backend - Model AI berhasil diinisialisasi atau sudah siap.")
    else:
        # Ini adalah log error penting untuk produksi
        print("ERROR: Backend - Model AI GAGAL diinisialisasi saat startup! Endpoint AI tidak akan berfungsi.")

@app.get("/", include_in_schema=False) # Sembunyikan dari docs API jika mau
async def read_root():
    # Log ini bisa berguna untuk health check sederhana
    # print("INFO: Backend - Root endpoint '/' diakses.")
    return {"message": "Selamat datang di SmartCV API! API aktif."}

@app.post("/summarize", response_model=SummaryOutput)
async def summarize_text_endpoint(input_data: TextInput):
    # Log ini penting untuk melihat traffic
    print(f"INFO: Backend - Menerima permintaan ke /summarize. Panjang input: {len(input_data.text)} char.")
    
    if not input_data.text or not input_data.text.strip() or len(input_data.text) < 10 : # Tambahkan min_length di sini juga
        print(f"WARN: Backend - Input teks tidak valid atau terlalu pendek. Input: '{input_data.text[:30]}...'")
        raise HTTPException(status_code=400, detail="Input teks tidak boleh kosong dan minimal 10 karakter.")

    try:
        # print("DEBUG: Backend - Memanggil generate_cv_summary...") # Bisa dihapus
        summary = generate_cv_summary(input_data.text)
        # print(f"DEBUG: Backend - Hasil dari generate_cv_summary: '{summary[:50]}...'") # Bisa dihapus
        
        if summary.startswith("Error:"): # Cek jika fungsi AI mengembalikan pesan error internal
            print(f"ERROR: Backend - Error dari ai_processor: {summary}")
            # Untuk error dari AI processor, mungkin 500 lebih cocok daripada 503 jika itu error pemrosesan
            raise HTTPException(status_code=500, detail=summary) 

        # print("INFO: Backend - Ringkasan berhasil dibuat, mengirim respons.") # Bisa dihapus jika terlalu verbose
        return SummaryOutput(summary=summary)
    except HTTPException:
        # Re-raise HTTPException agar FastAPI menanganinya dengan benar (misal, 400 atau 503 dari atas)
        raise 
    except Exception as e:
        # Ini menangkap error tak terduga lainnya dari dalam endpoint
        print(f"CRITICAL: Backend - Error tidak terduga di endpoint /summarize: {str(e)}")
        # Cetak traceback lengkap ke log server untuk debugging mendalam
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan internal server saat memproses permintaan Anda.")