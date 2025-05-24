import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer #model summarization 
#utk model casual LM Phi-2 (lebih berat)
#from transformers import AutoModelForCasual
import os

# --- Pilih Model Anda ---
# Opsi 1: Flan-T5-Small (Ringan, bagus untuk summarization, direkomendasikan untuk memulai)
MODEL_NAME = "google/flan-t5-small"
# Opsi 2: BART-Large-CNN (Populer untuk summarization, sedikit lebih berat dari flan-t5-small)
# MODEL_NAME = "facebook/bart-large-cnn" 
# Opsi 3: DistilBART-CNN-6-6 (Versi DistilBART yang lebih kecil)
# MODEL_NAME = "sshleifer/distilbart-cnn-6-6"
# Opsi 4: Phi-2 (Model Causal LM, sangat berat untuk summarization CV kecuali promptnya sangat bagus, mungkin butuh resource lebih)
# MODEL_NAME = "microsoft/phi-2" 
# -------------------------

# Variabel global untuk model dan tokenizer
model = None
tokenizer = None
device = None #menentukan CPU atau GPU

def initialize_model():
    """
    Memuat Model AI dan tokenizer dari  huggingface hub.
    ini akan dijalankan saat startup aplikasi FastAPI
    """
    global model, tokenizer, device

    if model is not None and tokenizer is not None:
        print("AI Processor: Model dan tokenizer sudah dimuat sebelumnya.")
        return True

    try:
        print(f"AI Processor: Memulai proses pemuatan model:{MODEL_NAME}...")

        #tentukan device (CPU / GPU)
        #Karna di Gitpod dan hugging face freetier, maka hanya CPU
        if torch.cuda.is_available():
            device = torch.device("cuda")
            print("AI Processor: GPU (CUDA) terdeteksi. Model akan dimuat ke GPU.")
        # elif torch.backend.mps.is_available(): (utk Mac M1/M2)
        #     device = torch.device("mps")
        #     print("AI Processor: MPS (Apple Silicon) terdeteksi. Model akan dimuat ke MPS.")
        else:
            device = torch.device("cpu")
            print("AI Processor: GPU tidak terdeteksi. Model akan dimuat ke CPU")

            #tokenizer
        print(f"AI Processor: Memuat tokenizer untuk {MODEL_NAME}...")
        # if Phi-2 trust_remote_code=True
        # tokenizer = AutoTokenizer.from_pretained(MODEL_NAME, trust_remote_code=(MODEL_NAME == "microsoft/phi-2"))
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        print("AI Processor: Tokenizer berhasil dimuat.")

            #model
        print(f"AI Processor: Memuat model {MODEL_NAME} ke device {device}...")
        if MODEL_NAME == "microsoft/phi-2":
            # Untuk Phi-2, gunakan AutoM/workspace/smartcv-portfolio/backend/app/ai_processor.pyodelForCausalLM dan mungkin perlu torch_dtype
            # model = AutoModelForCausalLM.from_pretrained(
            #     MODEL_NAME, 
            #     torch_dtype="auto", # atau torch.float16 untuk menghemat memori jika didukung
            #     trust_remote_code=True/workspace/smartcv-portfolio/backend/app/ai_processor.py
            # )
            print("Peringatan: Phi-2 adalah model Casual LM, bukan khusus summarization. Prompting akan sangat penting.")
            #model seq2seq
            raise NotImplementedError("Pengguna Phi-2 untuk summarization CV memerlukan prompt engineering khusus atau mungkin tidak ideal.")
        else:
            #model seq2seq (t5,BART)
            model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        model.to(device) #Pindahkan model kedevice yang dipilih
        model.eval() #set model
        print(f"AI Processor: Model {MODEL_NAME} berhasil dmuat dan dipindah ke {device}.")
        return True

    except ImportError as e:
        print(f"AI Processor: Erorr ImportError saat memuat Model: {e}. Pastikan semua depedensi (torch,transformers,sentepiece terinstall).")
        model = None
        tokenizer = None
        return False
    except Exception as e:
        print(f"AI Processor: Error umum saat memuat model {MODEL_NAME}: {e}")
        import traceback
        traceback.print_exc()
        model = None
        tokenizer = None
        return False

def generate_cv_summary(input_text: str) -> str:
    """
    Menghasilkan ringkasan CV menggunakan model AI yang telah dimuat.
    """
    global model, tokenizer, device

    if model is None or tokenizer is None:
        error_msg = "AI Processor: Model atau tokenizer belum berhasil diinisialisasi."
        print(error_msg)

        if not initialize_model():
            return error_msg + "Gagal melakukan inisialisasi ulang."

        if model is None or tokenizer is None:
            return error_msg + "Gagal melakukan inisaialisasi ulang (setelah coba lagi)."
    
    print(f"AI Processor: mnerima teks untuk diringkas (panjang: {len(input_text)} karakter).")
    try:
        # Prompt Engineering: Sesuaikan prompt ini agar sesuai dengan tujuan (CV ATS-friendly)
        # Untuk model Seq2Seq seperti T5 atau BART, prefix "summarize: " sering digunakan.
        # Atau instruksi yang lebih deskriptif.
        prompt_prefix = "Summarize the following work experience for a professional, ATS-friendly CV. Focus on quantifiable achievements, key responsibilities, and relevant skills. Use concise bullet points if appropriate: "
        # Untuk Phi-2, promptnya akan sangat berbeda, lebih seperti chat atau instruksi langsung.

        text_to_summarize = prompt_prefix +input_text

        print(f"AI Processor: teks input ke tokenizer (setelah prefix) '{text_to_summarize[:150]}...'")

        #token input
        inputs = tokenizer(text_to_summarize, return_tensors="pt", max_length=1024, truncation=True, padding="longest")
        #pindah input ke device yang sama dgn model
        input_ids = inputs.input_ids.to(device)
        attention_mask = inputs.attention_mask.to(device)

        print(f"AI Processor: Melakukan inferensi pada device {device}...")
        # Generate summary
        # Parameter generation bisa di-fine-tune:
        # num_beams: untuk beam search (biasanya >1 menghasilkan hasil lebih baik tapi lebih lambat)
        # max_length: panjang maksimal output summary (jangan terlalu pendek)
        # min_length: panjang minimal output summary
        # early_stopping: True jika menggunakan beam search
        # no_repeat_ngram_size: Mencegah pengulangan n-gram
        with torch.no_grad():
            summary_ids = model.generate(
                input_ids,
                attention_mask=attention_mask,
                max_length = 250,
                min_length = 50,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3
            )
        
        #decode summary
        summary_text = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        print(f"AI Processor: Ringkasar berhasil digenerate (panjang:{len(summary_text)}): '{summary_text[:150]}...'")
        return summary_text.strip()

    except Exception as e:
        error_msg = f"AI Processor: error saat proses generasi ringkasan: {e}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return "Error: Terjadi masalah saat AI mencoba membuat ringkasan. Silahkan coba lagi atau input yang berbeda."

# Panggil initialize_model() di sini agar model coba dimuat saat modul ini diimpor pertama kali oleh main.py
# Ini bisa memakan waktu saat startup server.
# Jika gagal, aplikasi tetap bisa jalan tapi endpoint AI tidak akan berfungsi.
# initialize_model() # Kita akan panggil ini dari startup event di main.py