FROM python:3.10.18-slim

WORKDIR /app

ENV PYTHONPATH=/app/src

# 시스템 패키지 업데이트 & 필수 라이브러리 설치 (필요에 따라)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사
COPY requirements.txt .

# 의존성 설치
RUN pip install -r requirements.txt

# 앱 소스 복사
COPY . .

# FastAPI 서버 실행
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
