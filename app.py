import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import BartForConditionalGeneration, PreTrainedTokenizerFast
from peft import PeftModel
import uvicorn

app = FastAPI(title="KoBART 요약 API")

# ── 모델 로드 (서버 시작 시 1회만) ──────────────────────────────
BASE_MODEL = "gogamza/kobart-base-v2"
ADAPTER_PATH = "./kobart-retrain-v2"  # HF Spaces 기준 경로

print("모델 로딩 중...")
tokenizer = PreTrainedTokenizerFast.from_pretrained(ADAPTER_PATH)
base_model = BartForConditionalGeneration.from_pretrained(BASE_MODEL)
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()
print("모델 로딩 완료!")

# ── 요청/응답 스키마 ─────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 256
    min_length: int = 30
    num_beams: int = 4

class SummarizeResponse(BaseModel):
    summary: str

# ── 엔드포인트 ───────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "KoBART 요약 서버 동작 중"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="text가 비어있습니다.")

    inputs = tokenizer(
        req.text,
        return_tensors="pt",
        max_length=1024,
        truncation=True,
        padding=True,
    )

    with torch.no_grad():
        output_ids = model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=req.max_length,
            min_length=req.min_length,
            num_beams=req.num_beams,
            early_stopping=True,
            no_repeat_ngram_size=3,
        )

    summary = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return SummarizeResponse(summary=summary)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
