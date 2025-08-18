// // 📦 기본 모듈 불러오기
// const express = require('express');        // Express 웹 서버 프레임워크
// const cors = require('cors');              // CORS 설정 (다른 도메인 요청 허용)
// require('dotenv').config();                // .env 환경변수 로딩


// const redis   = require('./redis');      // ← 여기서 초기화된 클라이언트 불러오기
// // 📌 라우터 모듈 불러오기
// const tokenRouter = require('./routes/token');       // /get-token 경로 처리 라우터
// const webhookRouter = require('./routes/webhook');   // /webhook/livekit 경로 처리 라우터

// const cookieParser = require('cookie-parser');
// // 🌐 Express 앱 생성
// const app = express();

// // 🔧 미들웨어 설정
// app.use(cors({
//   origin: 'https://moduru.co.kr', // 프론트 도메인
//   credentials: true
// }));           // CORS 미들웨어 (모든 도메인 허용)
// app.use(express.json());       // JSON 요청 바디 파싱 미들웨어
// app.use(cookieParser());

// // 📍 라우터 등록
// app.use('/get-token', tokenRouter);            // 토큰 발급 요청 (GET)
// app.use('/livekit/webhook', webhookRouter);    // LiveKit Webhook 처리 요청 (POST)

// // 🚀 서버 실행 (포트: 4000)
// app.listen(4000, () => {
//   console.log('✅ 서버 실행 중: http://node-backend:4000');
// });

// 📦 기본 모듈 불러오기
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const cookieParser = require('cookie-parser');
const redis = require('./redis');
const tokenRouter = require('./routes/token');
const webhookRouter = require('./routes/webhook');

// ⬇️ 하드코딩 제거: ENV 사용
const { NODE_PORT = 4000, NODE_CORS = '' } = process.env;

const app = express();

// ⬇️ CORS allowlist (콤마 구분: https://a.com,https://b.com)
const allowlist = NODE_CORS.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowlist.some(a => origin.startsWith(a))) return cb(null, true);
    return cb(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ⬇️ 경로 통일: Node는 /livekit/* 로 노출 (Nginx가 /api/livekit/* → 여기로 프록시)
app.use('/get-token', tokenRouter);
app.use('/livekit/webhook', webhookRouter);

// ⬇️ 헬스체크
app.get('/healthz', (_, res) => res.json({ ok: true }));

// 🚀 서버 실행
app.listen(NODE_PORT, () => {
  console.log(`✅ 서버 실행 중: http://node-backend:${NODE_PORT}  (CORS: ${allowlist.join(',') || 'none'})`);
});
