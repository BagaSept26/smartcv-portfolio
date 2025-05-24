from pydantic import BaseModel, Field
class TextInput(BaseModel):
    text: str = Field(..., min_length=10, description="Teks input dari pengguna yang akan diringkas.")
class SummaryOutput(BaseModel):
    summary: str = Field(..., description="Hasil ringkasan teks yang dihasilkan oleh AI.")