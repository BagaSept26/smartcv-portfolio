```markdown
# SmartCV Generator (Development Branch 🧠📄✨)

**Status Saat Ini (Branch `development`): Fungsional di Gitpod dengan Model AI Dummy/Ringan.**

Selamat datang di branch `development` untuk **SmartCV Generator**! Ini adalah tempat di mana fitur-fitur terbaru dikembangkan dan diuji. SmartCV Generator adalah tool AI fullstack untuk meringkas pengalaman kerja menjadi format CV yang profesional dan ATS-friendly.

**Tujuan Branch Ini:**
*   Menyediakan lingkungan pengembangan yang stabil dan berfungsi di Gitpod.
*   Melakukan iterasi pada fitur, prompt AI, dan perbaikan bug.
*   Mempersiapkan kode untuk di-merge ke branch `main` untuk deployment.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/BagaSept26/smartcv-portfolio/tree/development)

---

## Fitur yang Sedang Dikembangkan / Status Saat Ini

*   **Frontend (React + TailwindCSS):**
    *   Form input untuk teks pengalaman kerja.
    *   Area output untuk menampilkan ringkasan.
    *   Loading spinner dan penanganan error dasar.
    *   Terhubung ke backend API.
*   **Backend (Python FastAPI + Hugging Face Transformers):**
    *   Endpoint `/summarize` menerima teks dan mengembalikan ringkasan.
    *   Menggunakan model AI: `google/flan-t5-small` (atau sebutkan model aktif Anda di branch ini).
    *   Logika pemrosesan AI dasar sudah ada di `ai_processor.py`.
    *   Konfigurasi CORS untuk pengembangan di Gitpod.
*   **Integrasi Frontend-Backend:** Berhasil diuji di lingkungan Gitpod.

---

## Teknologi yang Digunakan (di Branch Ini)

### Frontend
*   **React.js**
*   **TailwindCSS**
*   **Fetch API**

### Backend
*   **Python 3.10+**
*   **FastAPI**
*   **Uvicorn**
*   **Pydantic**
*   **Hugging Face Transformers**
    *   Model AI Saat Ini: `google/flan-t5-small` (sesuaikan jika berbeda)

### Lingkungan Pengembangan
*   **Git & GitHub**
*   **Gitpod:** Lingkungan pengembangan cloud utama untuk branch ini.
*   **(Persiapan untuk Docker):** `Dockerfile` awal mungkin sudah ada di `backend/`.

---

## Cara Menjalankan Proyek (dari Branch `development`)

### 1. Menggunakan Gitpod (Cara Tercepat dan Direkomendasikan)
   [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/BagaSept26/smartcv-portfolio/tree/development)
   
   1.  Klik tombol "Open in Gitpod" di atas. Ini akan membuka workspace Gitpod langsung dari branch `development`.
   2.  Gitpod akan secara otomatis (berdasarkan `.gitpod.yml`):
       *   Meng-clone repository (branch `development`).
       *   Menginstal dependensi untuk frontend (`npm install`) dan backend (`pip install -r requirements.txt`).
       *   Menjalankan server development frontend (`npm start` di port 3000).
       *   Menjalankan server backend FastAPI (`uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`).
   3.  Setelah workspace siap, aplikasi frontend akan otomatis terbuka di preview browser Gitpod.
   4.  **Catatan Penting Saat Startup Pertama Kali di Gitpod:** Pemuatan model AI di backend (`initialize_model()` di `ai_processor.py`) akan men-download file model jika belum ada di cache Gitpod. Ini mungkin memakan waktu beberapa menit. Harap bersabar dan perhatikan log di terminal backend.

### 2. Menjalankan Lokal (dari Branch `development`)

   **Prasyarat:**
   *   Pastikan Anda sudah meng-clone repository dan checkout ke branch `development`:
     ```bash
     git clone https://github.com/BagaSept26/smartcv-portfolio.git
     cd smartcv-portfolio
     git checkout development
     ```
   *   Node.js dan npm (atau Yarn).
   *   Python 3.8+ dan pip.

   **A. Backend (FastAPI):**
   ```bash
   cd backend
   # (Opsional, tapi direkomendasikan) Buat dan aktifkan virtual environment Python
   # python3 -m venv venv
   # source venv/bin/activate  # Untuk Linux/Mac
   # venv\Scripts\activate    # Untuk Windows

   pip install -r requirements.txt
   # Jalankan dari dalam folder backend/
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Backend akan berjalan di `http://localhost:8000`.

   **B. Frontend (React):**
   Buka terminal baru:
   ```bash
   cd frontend
   npm install
   # Untuk pengembangan lokal, frontend akan mencoba menghubungi backend di http://localhost:8000
   # Ini dikonfigurasi secara dinamis di src/App.jsx sebagai fallback jika
   # REACT_APP_BACKEND_URL atau window.GITPOD_WORKSPACE_URL tidak ditemukan.
   # Anda bisa juga membuat file frontend/.env dengan:
   # REACT_APP_BACKEND_URL=http://localhost:8000
   npm start
   ```
   Frontend akan berjalan di `http://localhost:3000`.

---

## Struktur Folder ( relevan untuk branch `development`)

```
smartcv-project/
├── frontend/
│   ├── src/App.jsx  # Logika utama frontend, termasuk koneksi ke backend
│   └── ...
├── backend/
│   ├── app/
│   │   ├── main.py       # Endpoint FastAPI
│   │   ├── ai_processor.py # Logika model AI (saat ini dengan google/flan-t5-small)
│   │   └── models.py     # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile    # (Mungkin dalam pengembangan)
├── .gitpod.yml       # Konfigurasi Gitpod (sangat penting untuk branch ini)
└── README.md         # README ini
```

---

## Langkah Selanjutnya (Rencana Pengembangan)

*   [ ] Iterasi lebih lanjut pada *prompt engineering* untuk kualitas ringkasan AI yang lebih baik.
*   [ ] (Jika perlu) Eksplorasi model AI alternatif yang lebih optimal.
*   [ ] Implementasi fitur tambahan (misal: pilihan template output CV, upload file CV).
*   [ ] Penyempurnaan UI/UX.
*   [ ] Penambahan unit test dan integration test.
*   [ ] Finalisasi `Dockerfile` dan persiapan untuk deployment ke Hugging Face Spaces.
*   [ ] Persiapan frontend untuk deployment ke Vercel.
*   [ ] Merge ke branch `main` untuk rilis/deployment.

---

## Catatan untuk Kontributor / Diri Sendiri di Masa Depan
*   Pastikan semua perubahan diuji di Gitpod sebelum dipertimbangkan untuk merge.
*   Jaga agar dependensi tetap update.
*   Perhatikan penggunaan resource saat bekerja dengan model AI di Gitpod (terutama RAM).

```