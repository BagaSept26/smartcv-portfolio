---
title: SmartCV Backend API
emoji: बुद्धि 
colorFrom: blue
colorTo: green
sdk: docker
app_port: 8000
pinned: false

# SmartCV Backend API

Backend API untuk aplikasi SmartCV.
Dibangun dengan Python, FastAPI, dan menggunakan model AI dari Hugging Face Transformers untuk meringkas teks pengalaman kerja menjadi format CV yang profesional.

**Endpoint Utama:**
- `POST /summarize`: Menerima JSON dengan field `text` dan mengembalikan JSON dengan field `summary`.

**Teknologi:**
- Python 3.10
- FastAPI
- Uvicorn
- Pydantic
- Hugging Face Transformers (Model: [NAMA_MODEL_ANDA, misal google/flan-t5-small])

## Cara Menjalankan Lokal (Untuk Pengembangan)
1. `pip install -r requirements.txt`
2. `uvicorn app.main:app --reload --port 8000`

## Deployment
Dideploy ke Hugging Face Spaces menggunakan Docker.