import os
import math
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import BartForConditionalGeneration, AutoTokenizer
from peft import PeftModel
import uvicorn

app = FastAPI(title="KoBART 요약 API")

BASE_DIR = os.path.dirname(__file__)
MERGED_PATH = os.path.join(BASE_DIR, "merged")

# 추론 설정 (학습 코드 Config와 동일하게)
OUTPUT_MIN_TOKENS = 20
OUTPUT_MAX_TOKENS = 256  # 이건 그대로
OUTPUT_RATIO      = 0.5  # 0.30 → 0.50으로 올려

print("모델 로딩 중...")
tokenizer = AutoTokenizer.from_pretrained(MERGED_PATH)
model = BartForConditionalGeneration.from_pretrained(MERGED_PATH)
model.eval()
print("모델 로딩 완료!")

def dynamic_max_tokens(input_token_len: int) -> int:
    proposed = math.ceil(input_token_len * 0.4)
    return max(20, min(proposed, 200))

class SummarizeRequest(BaseModel):
    text: str
    num_beams: int = 8

class SummarizeResponse(BaseModel):
    summary: str

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


    # 입력이 너무 짧으면 요약하지 않고 원문 그대로 반환
    if len(req.text.strip()) < 150:   # 글자 수 기준, 조정 가능
        return SummarizeResponse(summary=req.text.strip())
    
    # ✅ 학습 때와 동일하게 "요약: " prefix 추가
    inputs = tokenizer(
        req.text,
        return_tensors="pt",
        max_length=1024,
        truncation=True,
        padding=False,
    )
    inputs.pop("token_type_ids", None)

    input_len = inputs["input_ids"].shape[-1]
    max_new = 180

    with torch.no_grad():
        output_ids = model.generate(
    **inputs,
    max_new_tokens=max_new,
    min_length=OUTPUT_MIN_TOKENS,
    num_beams=req.num_beams,
    length_penalty=1.0,          # 2.0 → 1.0 (긴 출력 선호 제거)
    no_repeat_ngram_size=3,      # 2 → 3
    repetition_penalty=1.5,      # 3.0 → 1.5 (과한 억제 완화)
    early_stopping=True,
    forced_eos_token_id=tokenizer.eos_token_id,
)

    summary = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()
    return SummarizeResponse(summary=summary)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)