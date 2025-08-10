// routes/token.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const { AccessToken } = require('livekit-server-sdk'); 
// LiveKit env
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
if (!apiKey || !apiSecret) throw new Error('LIVEKIT_API_KEY/SECRET missing at startup');

// (옵션) JWT를 검증 없이 디코드 — 오늘 급한 버전
function decodeJwtNoVerify(token) {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch { return null; }
}

router.post('/', async (req, res) => {
    console.log('📥 req.body:', req.body);
    console.log('📥 req.cookies:', req.cookies);
    console.log('📥 process.env.LIVEKIT_API_KEY:', process.env.LIVEKIT_API_KEY);
    console.log('📥 process.env.LIVEKIT_API_SECRET:', process.env.LIVEKIT_API_SECRET);

  try {
    // 1) roomId만 사용 (프론트는 userId 안 보냄)
    const room = String(req.body?.roomId || req.body?.room || '').trim() || 'default-room';
    if (!room) return res.status(400).json({ error: 'roomId required' });

    // 2) userId는 쿠키에서
    //    우선순위: (a) plain userId 쿠키 → (b) accessToken(JWT) 쿠키 디코드
    let identity = null;

    const cookieUserId = req.cookies?.userId;     // ex) plain cookie "userId"
    if (cookieUserId) identity = String(cookieUserId);
    console.log('➡️ cookieUserId:', cookieUserId);

    if (!identity) {
      const rawJwt = req.cookies?.accessToken || req.cookies?.access_token;    // ex) httpOnly JWT cookie "accessToken"
      if (!rawJwt) return res.status(401).json({ error: 'auth cookie missing' });
      const p = decodeJwtNoVerify(rawJwt);        // ★ 시크릿 없으니 decode-only (임시)
      identity = String(p?.sub || p?.userId || p?.id || '').trim();
      if (!identity) return res.status(401).json({ error: 'invalid auth token' });
    }

    // 3) LiveKit 토큰 생성
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 60 * 60 });
    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const lkJwt = await at.toJwt();

    // 4) 접속 기록 upsert
    // await db.query(`
    //   INSERT INTO user_connections (user_id, room_id, connected_at, disconnected_at)
    //   VALUES ($1, $2, NOW(), NULL)
    //   ON CONFLICT (user_id, room_id)
    //   DO UPDATE SET connected_at = NOW(), disconnected_at = NULL
    // `, [identity, room]);

    // 5) 응답 — 연결엔 JSON 토큰이 필요하므로 반드시 body로 반환
    //    (원하면 아래 쿠키도 유지 가능, 하지만 room.connect에는 JSON의 token을 쓰세요)
    // res.cookie('livekit_token', lkJwt, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60*60*1000 });
    console.log('📤 응답 데이터:', {
      token: lkJwt,
      wsUrl: process.env.LIVEKIT_WS_URL || 'wss://moduru.co.kr/livekit',
      identity,
      room,
    });

    res.json({
      token: lkJwt,
      wsUrl: process.env.LIVEKIT_WS_URL || 'wss://moduru.co.kr/livekit',
      identity,
      room,
    });
  } catch (err) {
    console.error('❌ 토큰 생성 실패:', { msg: err.message, stack: err.stack });
    res.status(500).json({ message: 'Token generation failed' });
  }
});

module.exports = router;
