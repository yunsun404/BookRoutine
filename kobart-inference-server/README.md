---
title: KoBART 요약 API
emoji: 📚
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
---

# KoBART 요약 API

`gogamza/kobart-base-v2` + LoRA 어댑터 기반 한국어 도서 요약 모델입니다.

## 엔드포인트

### POST `/summarize`

**요청**
```json
{
  "text": "요약할 텍스트 (최대 1024 토큰)",
  "max_length": 256,
  "min_length": 30,
  "num_beams": 4
}
```

**응답**
```json
{
  "summary": "요약된 텍스트"
}
```

### GET `/health`
서버 상태 확인
