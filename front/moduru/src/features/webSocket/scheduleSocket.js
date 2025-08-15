// src/features/webSocket/scheduleSocket.js
// 기존 코드와의 호환을 위한 얇은 어댑터

import {
  connectWebSocket,
  unsubscribeKeys,
  publishMessage,
} from "./coreSocket";

/** 기존 subscribeSchedule API 호환 */
export function subscribeSchedule(roomId, onMessage, opts = {}) {
  if (!roomId || typeof onMessage !== "function") return () => {};
  const key = opts.key || `schedule|${roomId}|${Date.now()}`;

  // 서버 토픽: /topic/room/{roomId}/schedule  (action 없음)
  connectWebSocket(roomId, [
    { handler: "schedule", /* action: undefined, */ callback: onMessage, key },
  ]);

  return () => unsubscribeKeys([key]);
}

/** 기존 publishSchedule API 호환 */
export function publishSchedule(payload) {
  const roomId = payload?.roomId;
  if (!roomId) {
    console.warn("[scheduleSocket] roomId 누락으로 발행 생략", payload);
    return;
  }
  // 서버 엔드포인트: /app/room/{roomId}/schedule  (action 없음)
  publishMessage(roomId, "schedule", /* action */ undefined, payload);
}
