// 결과 구독: /topic/room/{roomId}/travel/result
// 발행:     /app/room/{roomId}/travel/calc
// (coreSocket 어댑터 사용)

import {
  connectWebSocket,
  unsubscribeKeys,
  publishMessage,
} from "./coreSocket";

const HANDLER = "travel";

// 마지막 요청 모드 저장: `${roomId}|${day}` -> "driving" | "transit"
const _lastRequested = new Map();
const keyOf = (roomId, day) => `${roomId}|${day}`;

export function getLastRequestedTransport(roomId, day) {
  return _lastRequested.get(keyOf(roomId, day)) || null;
}

/**
 * /topic/room/{roomId}/travel/result 구독
 * @param {number|string} roomId
 * @param {(body:any)=>void} onMessage - 결과 payload만 전달
 * @param {{key?:string}} opts
 * @returns {()=>void} off
 */
export function subscribeTravel(roomId, onMessage, opts = {}) {
  if (!roomId || typeof onMessage !== "function") return () => {};
  const key = opts.key || `travel|${roomId}|${Date.now()}`;

  connectWebSocket(roomId, [
    { handler: HANDLER, action: "result", callback: onMessage, key },
  ]);

  return () => unsubscribeKeys([key]);
}

/**
 * /app/room/{roomId}/travel/calc 발행
 * 서버 호환을 위해 payload에 옛키 `transpot`(소문자)도 포함
 */
export function publishTravel(
  { roomId, nameId, day, date, transport, transpot, events = [] },
  extra = {}
) {
  if (!roomId || !day || !date) {
    console.warn("⚠️ [travel] 필수값 누락", { roomId, day, date });
    return;
  }

  const raw = transport ?? transpot;
  const clientTransport =
    String(raw || "transit").toLowerCase() === "driving"
      ? "driving"
      : "transit";
  const transportEnum = clientTransport.toUpperCase(); // "DRIVING" | "TRANSIT"

  _lastRequested.set(keyOf(roomId, day), clientTransport);

  const payload = {
    roomId,
    nameId,
    day,
    date,
    // 서버 호환: 구(old) + 신(new)
    transpot: clientTransport, // 과거 키(소문자)
    transport: transportEnum, // 신규 키(대문자 enum)
    events: events.map((e, i) => ({
      wantId: e.wantId,
      eventOrder: e.eventOrder ?? i + 1,
      endTime: e.endTime,
      ...(e.startTime ? { startTime: e.startTime } : {}),
    })),
    ...extra,
  };

  // /app/room/{roomId}/travel/calc
  publishMessage(roomId, HANDLER, "calc", payload);
}
