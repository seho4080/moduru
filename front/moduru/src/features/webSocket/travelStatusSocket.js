// 상태 구독: /topic/room/{roomId}/travel/status (단일 토픽)
import { connectWebSocket, unsubscribeKeys } from "./coreSocket";

/**
 * 서버 본문(body)에 status가 들어온다고 가정
 * (예: STARTED / ALREADY_RUNNING / DONE / FAILED)
 *
 * onMessage({ status, body })
 */
export function subscribeTravelStatus(roomId, onMessage, opts = {}) {
  if (!roomId || typeof onMessage !== "function") return () => {};
  const key = opts.key || `travel|${roomId}|status|${Date.now()}`;

  const wrapped = (body) => {
    // 서버가 쓰는 필드에 맞춰 유연하게 추출
    const status =
      body?.status || body?.type || body?.state || "UNKNOWN_STATUS";
    onMessage({ status, body });
  };

  connectWebSocket(roomId, [
    { handler: "travel", action: "status", callback: wrapped, key },
  ]);

  return () => unsubscribeKeys([key]);
}
