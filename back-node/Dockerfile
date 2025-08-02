# 베이스 이미지
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# 종속성 복사 및 설치
COPY package*.json ./
RUN npm install

# 앱 코드 복사
COPY . .

# 서버 실행
CMD ["node", "index.js"]

# 필요시 포트 설정 (예: 4000 포트 사용 시)
EXPOSE 4000
