// src/features/aiSchedule/lib/aiScheduleSocket.js
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

const HANDLER = "ai-schedule";

/**
 * 단일 status 토픽과 result 토픽을 한 번에 구독
 * @param {string|number} roomId
 * @param {{ onStatus?:(msg:any)=>void, onResult?:(msg:any)=>void, keyPrefix?: string }} handlers
 * @returns {() => void} cleanup
 */
export function subscribeAiSchedule(roomId, handlers = {}) {
  const subs = [];

  // coreSocket 내부의 기본 키 규칙: `${roomId}|${dest}`
  // dest: `/topic/room/${roomId}/${handler}/${action}`
  const statusKey = `${roomId}|/topic/room/${roomId}/${HANDLER}/status`;
  const resultKey = `${roomId}|/topic/room/${roomId}/${HANDLER}/result`;

  if (handlers.onStatus) {
    subs.push({
      handler: HANDLER,
      action: "status",
      callback: handlers.onStatus,
      // 필요 시 custom key 사용 가능(여러 구독자가 같은 dest를 쓰는 경우 구분)
      key: handlers.keyPrefix
        ? `${handlers.keyPrefix}|${statusKey}`
        : statusKey,
    });
  }

  if (handlers.onResult) {
    subs.push({
      handler: HANDLER,
      action: "result",
      callback: handlers.onResult,
      key: handlers.keyPrefix
        ? `${handlers.keyPrefix}|${resultKey}`
        : resultKey,
    });
  }

  if (subs.length) connectWebSocket(roomId, subs);

  // 실제 해제
  return () => {
    const keys = subs.map(
      (s) => s.key ?? `${roomId}|/topic/room/${roomId}/${HANDLER}/${s.action}`
    );
    unsubscribeKeys(keys);
  };
}
