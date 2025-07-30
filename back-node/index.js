const express = require('express');
const cors = require('cors');
const LiveKitServer = require('livekit-server-sdk');
const AccessToken = LiveKitServer.AccessToken;

const app = express();
app.use(cors()); // 모든 도메인에 대해 CORS 허용 (프론트와 서버 분리되어 있을 경우 필수)

// ✅ 환경 변수 또는 설정 파일을 통해 분리 권장
const apiKey = 'devkey';
const apiSecret = 'secret';

/**
 * 🎟️ [GET] /get-token
 * 클라이언트에서 요청한 사용자에게 LiveKit 접속용 JWT 토큰을 발급해줌
 * 
 * 요청 쿼리 예시:
 *   /get-token?identity=user-123&room=my-room
 */
app.get('/get-token', async (req, res) => {
  // 🧍 사용자 고유 identity (없으면 랜덤)
  const identity = req.query.identity || 'user-' + Math.floor(Math.random() * 1000);

  // 🏠 방 이름 (기본은 'default-room' / 확장 시 필수값으로 변경 권장)
  const room = req.query.room || 'default-room';

  console.log('🟡 토큰 요청:', { identity, room });
  console.log('🔑 API Key:', apiKey);
  console.log('🔐 API Secret:', apiSecret);

  try {
    // 📦 AccessToken 객체 생성
    const at = new AccessToken(
      apiKey,       // string: API 키
      apiSecret,    // string: API 시크릿
      { identity }, // object: 사용자 ID 설정
    );

    // 🛡️ 권한(Grant) 설정
    at.addGrant({
      roomJoin: true,           // 방 입장 허용
      room,                     // 방 이름 지정 (방 구분 가능)
      canPublish: true,         // 미디어 송출 허용
      canSubscribe: true,       // 미디어 수신 허용
      canPublishData: true,     // 데이터 채널 전송 허용 (예: 채팅)
    });

    // 🧾 JWT 생성 (서버에서 서명)
    const jwt = await at.toJwt();

    // 🧪 디버깅 로그
    console.log('🪪 AccessToken.grants:', at.grants);
    console.log('🔑 JWT 발급 완료 (앞부분):', jwt.slice(0, 30) + '...');
    console.log('🌐 요청 IP:', req.ip);

    // 🔄 응답 반환
    res.json({ token: jwt });
  } catch (err) {
    console.error('❌ 토큰 생성 실패:', err);
    res.status(500).send('Token generation failed');
  }
});

/**
 * 🚀 서버 실행
 * 기본 포트: 3001
 * 프론트엔드에서 fetch('http://localhost:3001/get-token?...') 형태로 호출
 */
app.listen(3001, () => {
  console.log('✅ LiveKit 토큰 서버 실행 중: http://localhost:3001');
});
