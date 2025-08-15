// WebSocket topics (소문자):
// /topic/room/{roomId}/ai-route/status  (payload: { roomId, status: "STARTED"|"PROGRESS"|"DONE"|"ERROR"|"INVALIDATED", ... })
// /topic/room/{roomId}/ai-route/result  (payload: { roomId, jobId, schedule: ... })

import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

const HANDLER = "ai-route";

/**
 * @param {string|number} roomId
 * @param {{ onStatus?:(msg:any)=>void, onResult?:(msg:any)=>void, keyPrefix?: string }} handlers
 * @returns {() => void} cleanup
 */
export function subscribeAiRoute(roomId, handlers = {}) {
  const subs = [];

  const statusKey = `${roomId}|/topic/room/${roomId}/${HANDLER}/status`;
  const resultKey = `${roomId}|/topic/room/${roomId}/${HANDLER}/result`;

  if (handlers.onStatus) {
    subs.push({
      handler: HANDLER,
      action: "status",
      callback: handlers.onStatus,
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

  // cleanup
  return () => {
    const keys = subs.map(
      (s) => s.key ?? `${roomId}|/topic/room/${roomId}/${HANDLER}/${s.action}`
    );
    unsubscribeKeys(keys);
  };
}
