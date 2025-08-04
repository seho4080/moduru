// 📦 기본 모듈 및 라우터 객체 생성
const express = require('express');
const router = express.Router();

// 🔑 LiveKit 토큰 발급 관련 모듈
const { AccessToken } = require('livekit-server-sdk');

// 🛢️ PostgreSQL DB 연결 모듈
const db = require('../db');

// 🔐 환경 변수에서 API Key / Secret 가져오기 (.env 설정 필요)
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

/**
 * 🎟️ [GET] /get-token
 * 클라이언트에게 LiveKit 접속용 JWT 토큰을 발급
 * 쿼리 파라미터로 identity(유저 ID), room(방 ID)을 받아 처리
 */
router.get('/', async (req, res) => {
  // 🧍 유저 식별자 (없으면 랜덤 생성)
  const identity = req.query.identity || 'user-' + Math.floor(Math.random() * 1000);

  // 🏠 방 이름 (없으면 기본 방 사용)
  const room = req.query.room || 'default-room';

  try {
    // 📦 LiveKit AccessToken 생성
    const at = new AccessToken(apiKey, apiSecret, { identity });

    // 🛡️ 권한(Grant) 설정
    at.addGrant({
      roomJoin: true,         // 방 참가 허용
      room,                   // 참여할 방 이름
      canPublish: true,       // 오디오/비디오 송출 허용
      canSubscribe: true,     // 미디어 수신 허용
      canPublishData: true,   // 데이터 채널 송신 허용
    });

    // 🧾 JWT 토큰 생성 (서명 포함)
    const jwt = await at.toJwt();

    // 🗃️ 연결 이력 저장 또는 갱신
    await db.query(`
      INSERT INTO user_connections (user_id, room_id, connected_at, disconnected_at)
      VALUES ($1, $2, NOW(), NULL)
      ON CONFLICT (user_id, room_id)
      DO UPDATE SET connected_at = NOW(), disconnected_at = NULL
    `, [identity, room]);
    console.log(`[DB] user_connections 테이블 업데이트: user=${identity}, room=${room}`);

    // await redis.sadd(`room:${room}:connected`, identity);
    // await redis.expire(`room:${room}:connected`, 60 * 60);

    // 🔄 토큰 응답
    res.json({ token: jwt });

  } catch (err) {
    // ❌ 에러 처리
    console.error('❌ 토큰 생성 실패:', err);
    res.status(500).send('Token generation failed');
  }
});

// 📤 라우터 내보내기
module.exports = router;
