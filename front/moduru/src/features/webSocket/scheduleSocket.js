// 기존 코드와의 호환을 위한 얇은 어댑터
import {
  connectWebSocket,
  unsubscribeKeys,
  publishMessage,
} from "./coreSocket";

/** 구독: /topic/room/{roomId}/schedule (action 없음) */
export function subscribeSchedule(roomId, onMessage, opts = {}) {
  if (!roomId || typeof onMessage !== "function") return () => {};
  const key = opts.key || `schedule|${roomId}|${Date.now()}`;

  connectWebSocket(roomId, [{ handler: "schedule", callback: onMessage, key }]);

  return () => unsubscribeKeys([key]);
}

/** 발행: /app/room/{roomId}/schedule (action 없음) */
export function publishSchedule(payload) {
  const roomId = payload?.roomId;
  if (!roomId) {
    console.warn("[scheduleSocket] roomId 누락으로 발행 생략", payload);
    return;
  }
  publishMessage(roomId, "schedule", undefined, payload);
}
