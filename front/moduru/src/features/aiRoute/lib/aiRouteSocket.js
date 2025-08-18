// src/features/aiRoute/lib/aiRouteApi.js (subscribe 부분)
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

const HANDLER = "ai-route";

/**
 * AI Route WS 구독
 * @param {string|number} roomId
 * @param {{
 *   onStatus?:(msg:any)=>void,
 *   onResult?:(msg:any)=>void,
 *   keyPrefix?: string
 * }} handlers
 * @returns {() => void} cleanup
 */
export function subscribeAiRoute(roomId, handlers = {}) {
  if (!roomId) return () => {};
  const { onStatus, onResult, keyPrefix = "" } = handlers;

  const makeTopic = (action) => `/topic/room/${roomId}/${HANDLER}/${action}`;
  const makeKey = (action) =>
    (keyPrefix ? `${keyPrefix}|` : "") + `${roomId}|${makeTopic(action)}`;

  const subs = [];

  if (typeof onStatus === "function") {
    subs.push({
      handler: HANDLER,
      action: "status",
      topic: makeTopic("status"), // topic 명시 (핸들러/액션 조합과 함께 안전)
      callback: onStatus,
      key: makeKey("status"),
    });
  }

  if (typeof onResult === "function") {
    subs.push({
      handler: HANDLER,
      action: "result",
      topic: makeTopic("result"),
      callback: onResult,
      key: makeKey("result"),
    });
  }

  if (subs.length > 0) {
    // coreSocket는 동일 key 중복 등록을 무시(또는 대체)하도록 되어 있다고 가정
    connectWebSocket(roomId, subs);
  }

  return () => {
    if (subs.length > 0) {
      unsubscribeKeys(subs.map((s) => s.key));
    }
  };
}
