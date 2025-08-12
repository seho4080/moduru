# FROM node:18
FROM node:20

# 컨테이너 작업 디렉토리 설정
WORKDIR /app

# 종속성 설치용 파일 복사
COPY package*.json ./
# COPY .env ./  # 지금 안 쓴다 해서 주석 처리

# 패키지 설치
RUN npm install

# 전체 프로젝트 복사
COPY . .

# Vite 개발 서버 실행
CMD ["npm", "run", "dev"]

# Vite 기본 포트
EXPOSE 5173