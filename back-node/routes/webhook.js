// routes/webhook.js
const express = require('express');
const router = express.Router();
// const redis = require('../redis'); // 필요하면 사용

// (선택) 보안: LiveKit Webhook 서명/토큰 검증 (권장)
// - Authorization: Bearer <jwt> (iss=API_KEY, secret=API_SECRET 로 서명)
// - 또는 별도 시그니처 헤더 검증
// 여기서는 빠르게 동작시키려 검증 생략 (운영에선 반드시 검증!)
function verifyWebhook(req) {
  // TODO: JWT 검증 또는 시그니처 검증 구현
  return true;
}

router.post('/', async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).send('invalid webhook signature');
    }

    const { event, room, participant } = req.body || {};
    const roomId = room?.name;                 // LiveKit에서 보낸 방 이름/ID
    const userId = participant?.identity;      // 참가자 식별자

    if (!event)  return res.status(400).send('event required');
    if (!roomId) return res.status(400).send('room.name required');

    // 빠른 ACK (LiveKit은 2xx를 기대)
    //   → 처리 오래 걸리면 먼저 res.sendStatus(200) 하고 비동기 처리해도 됨
    // 여기선 간단히 동기 처리 + 200
    switch (event) {
      case 'participant_left':
      case 'participant_disconnected': // 일부 배포에서 이렇게 옴
        console.log('⛔ webhook: participant left', { roomId, userId, event });

        // (옵션) Redis presence 갱신
        /*
        try {
          if (userId) {
            await redis.sRem(`room:${roomId}:members`, userId);
            await redis.publish('presence.events', JSON.stringify({
              type: 'voice_left',
              roomId,
              userId,
              ts: Date.now(),
            }));
          }
        } catch (re) {
          console.warn('⚠️ Redis presence update failed:', re.message);
        }
        */
        break;

      case 'room_finished':
        console.log('🔴 webhook: room finished', { roomId });
        // (옵션) 방 멤버셋 통째로 정리, 후처리 등
        break;

      // 필요하면 여기서 다른 이벤트도 케이스 분기
      // ex) 'participant_joined', 'track_published' ...
      default:
        // 디버깅용 로그만
        console.log('ℹ️ webhook:', event, { roomId, userId });
        break;
    }

    return res.sendStatus(200);
  } catch (e) {
    console.error('❌ /livekit/webhook error:', e);
    return res.sendStatus(500);
  }
});

module.exports = router;
