// 상태 구독: /topic/room/{roomId}/travel/status (단일 토픽)
import { connectWebSocket, unsubscribeKeys } from "./coreSocket";

<<<<<<< HEAD
/**
 * 서버 본문(body)에 status가 들어온다고 가정
 * (예: STARTED / ALREADY_RUNNING / DONE / FAILED)
 *
 * onMessage({ status, body })
 */
=======
export const TRAVEL_STATUSES = ["STARTED", "ALREADY_RUNNING", "DONE", "FAILED"];

let statusStomp = null;
let currentRoomId = null;
const subs = new Map(); // status -> subscription
const listeners = new Map(); // key -> (packet) => void

const TOPIC = (roomId, status) => `/topic/room/${roomId}/travel/${status}`;
const APP = (roomId) => `/app/room/${roomId}/travel/calc`;

function ensureClient() {
  if (statusStomp) return statusStomp;

  const socket = new SockJS("http://localhost:8080/ws-stomp", null, {
    withCredentials: true,
  });

  statusStomp = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      console.log("✅ [travel-status] connected");
      if (currentRoomId) resubscribeAll(currentRoomId);
    },
    onUnhandledMessage: (msg) => {
      console.warn(
        "🟡 [travel-status] onUnhandledMessage",
        msg.headers?.destination,
        msg.body
      );
    },
    onStompError: (f) => console.error("❌ [travel-status] STOMP 오류:", f),
    onWebSocketError: (e) =>
      console.error("❌ [travel-status] WebSocket 오류:", e),
    onDisconnect: () => console.warn("⚠️ [travel-status] disconnected"),
  });

  statusStomp.activate();
  if (typeof window !== "undefined") window.travelStatusStomp = statusStomp;
  return statusStomp;
}

function safeParse(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function resubscribeAll(roomId) {
  if (!statusStomp?.connected) return;

  try {
    for (const s of subs.values()) s?.unsubscribe();
  } catch {}
  subs.clear();

  TRAVEL_STATUSES.forEach((st) => {
    const destination = TOPIC(roomId, st);
    const sub = statusStomp.subscribe(destination, (message) => {
      const body = safeParse(message.body);
      const packet = { status: st, body };
      for (const fn of listeners.values()) {
        try {
          fn(packet);
        } catch (e) {
          console.error("❌ [travel-status] listener 오류:", e);
        }
      }
    });
    subs.set(st, sub);
  });

  console.log(
    "✅ [travel-status] 구독 시작:",
    TRAVEL_STATUSES.map((s) => TOPIC(roomId, s)).join(", "),
    `(listenerCount: ${listeners.size})`
  );
}

/** 구독 – 4개 토픽 모두 팬아웃 */
>>>>>>> feature/337-마이페이지
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
