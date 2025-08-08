// 📦 기본 모듈 및 라우터 객체 생성
const express = require('express');
const router = express.Router();

// 🛢️ PostgreSQL DB 연결 모듈
const db = require('../db');

// 🔔 [POST] /webhook/livekit
// LiveKit 서버에서 발생한 이벤트를 수신하여 처리
router.post('/', async (req, res) => {
  const { event, room, participant } = req.body || {}; // req.body가 없으면 빈 객체로 초기화
  const roomName = room?.name;
  const userId = participant?.identity;
  if (!event) {
    console.error("❌ 이벤트가 제공되지 않았습니다.");
    return res.status(400).send('Event is required');
  }

  if (!userId || !roomName) {
    console.error('❌ userId 또는 roomName이 누락되었습니다.');
    return res.status(400).send('userId and roomName are required');
  }

  console.log(`📩 Webhook 수신: ${event} | user: ${userId} | room: ${room}`);

  try {
    switch (event) {
      case 'participant_left':
        // ⛔ 유저가 방을 떠난 경우 → 연결 종료 시각 기록
        if (!user || !room) throw new Error('user or room not provided');

        await db.query(`
          UPDATE user_connections
          SET disconnected_at = NOW()
          WHERE user_id = $1 AND room_id = $2 AND disconnected_at IS NULL
        `, [userId, room]);

        console.log(`⛔ 연결 종료 처리됨: ${userId} in ${room}`);
        break;

      case 'room_finished':
        // 🔴 방이 종료됨
        console.log(`🔴 방 종료됨: ${room}`);
        break;
    }

    // ✅ 처리 완료 응답 (LiveKit은 반드시 200 응답을 기대함)
    res.sendStatus(200);

  } catch (err) {
    console.error(`❌ Webhook 처리 중 오류: ${err.message}`);
    res.sendStatus(500);
  }
});

// 📤 라우터 모듈 내보내기
module.exports = router;
