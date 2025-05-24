# backend/app/ai_processor.py
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import os
import traceback # Untuk logging error

# --- MODEL_NAME tetap sama seperti yang sudah Anda pilih dan uji ---
MODEL_NAME = "google/flan-t5-small" 
# MODEL_NAME = "facebook/bart-large-cnn" 
# MODEL_NAME = "sshleifer/distilbart-cnn-6-6"

model = None
tokenizer = None
device = None

def initialize_model():
    global model, tokenizer, device
    if model is not None and tokenizer is not None:
        # print("INFO: AI Processor - Model dan tokenizer sudah dimuat.") # Bisa di-uncomment jika perlu
        return True
    try:
        print(f"INFO: AI Processor - Memulai proses pemuatan model: {MODEL_NAME}...")
        if torch.cuda.is_available():
            device = torch.device("cuda")
            print("INFO: AI Processor - GPU (CUDA) terdeteksi.")
        else:
            device = torch.device("cpu")
            print("INFO: AI Processor - GPU tidak terdeteksi, menggunakan CPU.")

        print(f"INFO: AI Processor - Memuat tokenizer untuk {MODEL_NAME}...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        print("INFO: AI Processor - Tokenizer berhasil dimuat.")

        print(f"INFO: AI Processor - Memuat model {MODEL_NAME} ke device {device}...")
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        model.to(device)
        model.eval()
        print(f"INFO: AI Processor - Model {MODEL_NAME} berhasil dimuat ke {device}.")
        return True
    except Exception as e:
        print(f"ERROR: AI Processor - Gagal memuat model {MODEL_NAME}: {str(e)}")
        traceback.print_exc()
        model = None
        tokenizer = None
        return False

def generate_cv_summary(input_text: str) -> str:
    global model, tokenizer, device
    if model is None or tokenizer is None:
        error_msg = "ERROR: AI Processor - Model atau tokenizer belum berhasil diinisialisasi. Coba panggil initialize_model() lagi."
        print(error_msg)
        if not initialize_model(): # Coba inisialisasi ulang
            return error_msg + " Inisialisasi ulang juga gagal."
        if model is None or tokenizer is None: # Cek lagi setelah coba inisialisasi ulang
             return "ERROR: AI Processor - Model tetap tidak tersedia setelah mencoba inisialisasi ulang."
    
    # Log ini bisa dipertahankan untuk melihat apa yang diproses
    # print(f"INFO: AI Processor - Menerima teks untuk diringkas (panjang: {len(input_text)} char).")
    try:
        # --- PROMPT ANDA YANG SUDAH DISESUAIKAN ---
        prompt_prefix = "Summarize the following work experience for a professional, ATS-friendly CV. Focus on quantifiable achievements, key responsibilities, and relevant skills. Use concise bullet points if appropriate: "
        # Atau prompt lain yang sudah Anda temukan bekerja dengan baik.
        # -----------------------------------------
        text_to_summarize = prompt_prefix + input_text
        # print(f"DEBUG: AI Processor - Teks input ke tokenizer: '{text_to_summarize[:100]}...'") # Hapus jika terlalu verbose

        inputs = tokenizer(text_to_summarize, return_tensors="pt", max_length=1024, truncation=True, padding="longest")
        input_ids = inputs.input_ids.to(device)
        attention_mask = inputs.attention_mask.to(device)

        # print(f"DEBUG: AI Processor - Melakukan inferensi pada device {device}...") # Hapus jika terlalu verbose
        with torch.no_grad():
            summary_ids = model.generate(
                input_ids,
                attention_mask=attention_mask,
                max_length=250,  
                min_length=50,   
                num_beams=4,     
                early_stopping=True,
                no_repeat_ngram_size=3,
            )
        summary_text = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        # print(f"INFO: AI Processor - Ringkasan digenerate: '{summary_text[:100]}...'") # Bisa dipertahankan
        return summary_text.strip()
    except Exception as e:
        print(f"ERROR: AI Processor - Error saat proses generasi ringkasan: {str(e)}")
        traceback.print_exc()
        return "Error: Terjadi masalah internal pada AI saat mencoba membuat ringkasan. Silakan coba lagi."

# initialize_model() akan dipanggil dari startup event di main.py