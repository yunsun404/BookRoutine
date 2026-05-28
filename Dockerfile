FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 어댑터 파일 복사
COPY kobart-retrain-v2/ ./kobart-retrain-v2/

# 앱 파일 복사
COPY app.py .

EXPOSE 7860

CMD ["python", "app.py"]
