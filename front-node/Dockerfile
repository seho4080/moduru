# 1) 베이스 이미지
FROM node:20-alpine

# 2) 작업 디렉토리
WORKDIR /app

# 3) 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci

# 4) 소스 복사
COPY . .

# 5) 개발 서버 포트 (React 기본 3000)
EXPOSE 3000

# 6) 개발 모드로 시작
CMD ["npm", "run", "dev"]