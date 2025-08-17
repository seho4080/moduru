// ============================================================================
// 4. Socket: src/features/aiSchedule/lib/aiScheduleSocket.js
// ============================================================================

import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

const HANDLER = "ai-schedule";

/**
 * 단일 status 토픽과 result 토픽을 한 번에 구독
 * @param {string|number} roomId
 * @param {{ onStatus?:(msg:any)=>void, onResult?:(msg:any)=>void, keyPrefix?: string }} handlers
 * @returns {() => void} cleanup
 */
export function subscribeAiSchedule(roomId, handlers = {}) {
  console.log("🔌 [AI Socket] Starting subscription:", {
    roomId,
    handlers: Object.keys(handlers),
  });

  if (!roomId) {
    console.error("❌ [AI Socket] roomId is required for subscription");
    return () => {}; // 빈 cleanup 함수 반환
  }

  const subs = [];

  // coreSocket 내부의 기본 키 규칙: `${roomId}|${dest}`
  // dest: `/topic/room/${roomId}/${handler}/${action}`
  const statusKey = `${roomId}|/topic/room/${roomId}/${HANDLER}/status`;
  const resultKey = `${roomId}|/topic/room/${roomId}/${HANDLER}/result`;

  console.log("🔑 [AI Socket] Generated keys:", { statusKey, resultKey });

  if (handlers.onStatus) {
    const finalKey = handlers.keyPrefix
      ? `${handlers.keyPrefix}|${statusKey}`
      : statusKey;

    console.log(
      "📢 [AI Socket] Adding STATUS subscription with key:",
      finalKey
    );

    subs.push({
      handler: HANDLER,
      action: "status",
      callback: (msg) => {
        console.log("📨 [AI Socket] STATUS message received:", msg);
        try {
          handlers.onStatus(msg);
        } catch (error) {
          console.error("💥 [AI Socket] Error in onStatus handler:", error);
        }
      },
      key: finalKey,
    });
  }

  if (handlers.onResult) {
    const finalKey = handlers.keyPrefix
      ? `${handlers.keyPrefix}|${resultKey}`
      : resultKey;

    console.log(
      "📋 [AI Socket] Adding RESULT subscription with key:",
      finalKey
    );

    subs.push({
      handler: HANDLER,
      action: "result",
      callback: (msg) => {
        console.log("📨 [AI Socket] RESULT message received:", msg);
        try {
          handlers.onResult(msg);
        } catch (error) {
          console.error("💥 [AI Socket] Error in onResult handler:", error);
        }
      },
      key: finalKey,
    });
  }

  if (subs.length === 0) {
    console.warn("⚠️ [AI Socket] No handlers provided, skipping subscription");
    return () => {};
  }

  console.log(
    "🚀 [AI Socket] Connecting with subscriptions:",
    subs.map((s) => ({
      handler: s.handler,
      action: s.action,
      key: s.key,
    }))
  );

  try {
    connectWebSocket(roomId, subs);
    console.log("✅ [AI Socket] WebSocket connection initiated");
  } catch (error) {
    console.error("💥 [AI Socket] Failed to connect WebSocket:", error);
    return () => {};
  }

  // 실제 해제
  return () => {
    const keys = subs.map(
      (s) => s.key ?? `${roomId}|/topic/room/${roomId}/${HANDLER}/${s.action}`
    );
    console.log("🔌 [AI Socket] Unsubscribing keys:", keys);

    try {
      unsubscribeKeys(keys);
      console.log("✅ [AI Socket] Successfully unsubscribed");
    } catch (error) {
      console.error("💥 [AI Socket] Error during unsubscribe:", error);
    }
  };
}
