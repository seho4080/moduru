# Dockerfile
FROM node:18

# 앱 디렉토리 생성
WORKDIR /app

# package.json & lock 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 전체 프로젝트 복사
COPY . .

# 개발 서버 실행
CMD ["npm", "start"]