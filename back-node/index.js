// 📦 기본 모듈 불러오기
const express = require('express');        // Express 웹 서버 프레임워크
const cors = require('cors');              // CORS 설정 (다른 도메인 요청 허용)
require('dotenv').config();                // .env 환경변수 로딩


const redis   = require('./redis');      // ← 여기서 초기화된 클라이언트 불러오기
// 📌 라우터 모듈 불러오기
const tokenRouter = require('./routes/token');       // /get-token 경로 처리 라우터
const webhookRouter = require('./routes/webhook');   // /webhook/livekit 경로 처리 라우터

// 🌐 Express 앱 생성
const app = express();

// 🔧 미들웨어 설정
app.use(cors({
  origin: 'https://moduru.co.kr', // 프론트 도메인
  credentials: true
}));           // CORS 미들웨어 (모든 도메인 허용)
app.use(express.json());       // JSON 요청 바디 파싱 미들웨어
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 📍 라우터 등록
app.use('/get-token', tokenRouter);            // 토큰 발급 요청 (GET)
app.use('/livekit/webhook', webhookRouter);    // LiveKit Webhook 처리 요청 (POST)

// 🚀 서버 실행 (포트: 4000)
app.listen(4000, () => {
  console.log('✅ 서버 실행 중: http://node-backend:4000');
});
