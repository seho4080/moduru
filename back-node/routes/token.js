// 모듈 및 라우터 생성
const express = require('express');
const router = express.Router();
// db 연결
const db = require('../db');
// 토큰 발급 관련 모듈
const { AccessToken, VideoGrant } = require('livekit-server-sdk');
// 환경 변수에서 API Key / Secret 가져오기
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

// api 키 확인
if (!apiKey || !apiSecret) {
  throw new Error('LIVEKIT_API_KEY/SECRET missing at startup');
}

router.post('/', async (req, res) => {

  // 식별자, 방
  const identity = req.body.identity || `user-${Math.floor(Math.random()*1000)}`;
  const room = req.body.room || 'default-room';

  try {
    // 토큰 생성
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 60 * 60 });
    // 권한 설정
    const grant = new VideoGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    at.addGrant(grant);
    // jwt 토큰 생성
    const jwt = await at.toJwt();

    // 만들어 질 때 db에 정보 갱신
    await db.query(`
      INSERT INTO user_connections (user_id, room_id, connected_at, disconnected_at)
      VALUES ($1, $2, NOW(), NULL)
      ON CONFLICT (user_id, room_id)
      DO UPDATE SET connected_at = NOW(), disconnected_at = NULL
    `, [identity, room]);
    
    // 토큰을 쿠키에 저장 (httpOnly, secure 설정)
    res.cookie('jwt', jwt, {
      httpOnly: true,   // JavaScript에서 접근할 수 없도록 설정
      secure: process.env.NODE_ENV === 'production',  // production 환경에서만 https를 사용
      maxAge: 60 * 60 * 1000,  // 1시간 동안 유효
    });
    // 토큰 응답 처리
    //res.json({ token: jwt });
    
    // 응답 처리 (로그인 성공 메시지)
    res.json({ message: 'Logged in successfully' });

    // 예외처리
  } catch (err) {
    console.error('❌ 토큰 생성 실패:', { msg: err.message, stack: err.stack });
    res.status(500).json({ message: 'Token generation failed' });
  }
});

module.exports = router;