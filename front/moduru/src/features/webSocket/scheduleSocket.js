// src/features/webSocket/scheduleSocket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let scheduleStomp = null;
let sub = null;
let currentDest = null;
const listeners = new Map();

const WS_URL = "/api/ws-stomp";
const DEST = (roomId) => `/topic/room/${roomId}/schedule`;

function ensureClient() {
  if (scheduleStomp) return scheduleStomp;
  const socket = new SockJS(WS_URL, null, { withCredentials: true });

  scheduleStomp = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 3000,
    debug: () => {},
    onConnect: () => {
      console.log("✅ [schedule] connected");
      if (currentDest) resubscribe(currentDest);
    },
    onUnhandledMessage: (msg) => {
      console.warn(
        "🟡 [schedule] onUnhandledMessage",
        msg.headers?.destination,
        msg.body
      );
    },
    onStompError: (f) => console.error("❌ [schedule] STOMP 오류:", f),
    onWebSocketError: (e) => console.error("❌ [schedule] WebSocket 오류:", e),
  });

  scheduleStomp.activate();
  return scheduleStomp;
}

function safeParse(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function resubscribe(dest) {
  if (!scheduleStomp?.connected) return;
  try {
    sub?.unsubscribe();
  } catch {}
  sub = scheduleStomp.subscribe(dest, (message) => {
    const body = safeParse(message.body);
    console.log("📥 [schedule 수신]", dest, body);
    for (const fn of listeners.values()) {
      try {
        fn(body);
      } catch (e) {
        console.error("❌ listener 오류:", e);
      }
    }
  });
  console.log(
    "✅ [schedule] 구독 시작:",
    dest,
    `(listenerCount: ${listeners.size})`
  );
}

export function subscribeSchedule(roomId, onMessage, opts = {}) {
  if (!roomId || typeof onMessage !== "function") return () => {};
  const client = ensureClient();
  const dest = DEST(roomId);

  const key =
    opts.key || `k_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  listeners.set(key, onMessage);

  if (currentDest !== dest) {
    currentDest = dest;
    if (client.connected) resubscribe(dest);
    else console.log("⏳ [schedule] 연결 대기 → 연결 후 구독:", dest);
  } else if (client.connected && !sub) {
    resubscribe(dest);
  }

  return () => {
    listeners.delete(key);
    if (listeners.size === 0) {
      try {
        sub?.unsubscribe();
      } catch {}
      sub = null;
      currentDest = null;
      console.log("🛑 [schedule] 구독 해제");
    }
  };
}

// ✅ 발행 함수 추가 (named export)
export function publishSchedule(payload) {
  const client = ensureClient();
  const destination = `/app/room/${payload.roomId}/schedule`;

  if (!client.connected) {
    console.warn("⏳ [schedule] 아직 연결 전. 연결되면 발행:", destination);
    const originalOnConnect = client.onConnect;
    client.onConnect = (frame) => {
      originalOnConnect?.(frame);
      try {
        client.publish({ destination, body: JSON.stringify(payload) });
        console.log("📤 [schedule 발행:연결후]", destination, payload);
      } finally {
        client.onConnect = originalOnConnect;
      }
    };
    return;
  }

  client.publish({ destination, body: JSON.stringify(payload) });
  console.log("📤 [schedule 발행]", destination, payload);
}
