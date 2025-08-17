// 결과 구독: /topic/room/{roomId}/travel/result
// 발행:     /app/room/{roomId}/travel/calc
import {
  connectWebSocket,
  unsubscribeKeys,
  publishMessage,
} from "./coreSocket";

const HANDLER = "travel";

// 최근 요청 모드 캐시: `${roomId}|${day}` -> "driving" | "transit"
const _lastRequested = new Map();
const keyOf = (roomId, day) => `${roomId}|${day}`;
export function getLastRequestedTransport(roomId, day) {
  return _lastRequested.get(keyOf(roomId, day)) || null;
}

/** 결과 구독 */
export function subscribeTravel(roomId, onMessage, opts = {}) {
  if (!roomId || typeof onMessage !== "function") return () => {};
  const key = opts.key || `travel|${roomId}|result|${Date.now()}`;

  // coreSocket가 JSON 파싱/로그를 이미 해주므로 바로 연결
  connectWebSocket(roomId, [
    { handler: HANDLER, action: "result", callback: onMessage, key },
  ]);

  return () => unsubscribeKeys([key]);
}

/** 경로 계산 발행 */
export function publishTravel(
  { roomId, nameId, day, date, transport, transpot, events = [] },
  extra = {}
) {
  if (!roomId || !day || !date) {
    console.warn("⚠️ [travel] 필수값 누락", { roomId, day, date });
    return;
  }

  // driving/transit만 허용 (driver -> driving은 수신측에서도 폴백 처리)
  const raw = (transport ?? transpot ?? "transit").toString().toLowerCase();
  const clientTransport =
    raw === "driving" || raw === "driver" ? "driving" : "transit";
  const transportEnum = clientTransport.toUpperCase(); // "DRIVING" | "TRANSIT"

  // 최근 요청 모드 저장(서버가 transport를 비워 보낼 때 폴백용)
  _lastRequested.set(keyOf(roomId, day), clientTransport);

  const payload = {
    roomId,
    nameId,
    day,
    date,
    transpot: clientTransport, // 레거시 호환(소문자)
    transport: transportEnum, // 신규(대문자 enum)
    events: events.map((e, i) => ({
      wantId: e.wantId,
      eventOrder: e.eventOrder ?? i + 1,
      endTime: e.endTime,
      ...(e.startTime ? { startTime: e.startTime } : {}),
    })),
    ...extra,
  };

  publishMessage(roomId, HANDLER, "calc", payload);
}
