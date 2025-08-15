import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export const TRAVEL_STATUSES = ["STARTED", "ALREADY_RUNNING", "DONE", "FAILED"];

let statusStomp = null;
let currentRoomId = null;
const subs = new Map(); // status -> subscription
const listeners = new Map(); // key -> (packet) => void

const TOPIC = (roomId, status) => `/topic/room/${roomId}/travel/${status}`;
const APP = (roomId) => `/app/room/${roomId}/travel/calc`;

function ensureClient() {
  if (statusStomp) return statusStomp;

  const socket = new SockJS("/api/ws-stomp", null, {
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
export function subscribeTravelStatus(roomId, onMessage, opts = {}) {
  if (!roomId) return () => {};
  if (typeof onMessage !== "function") return () => {};

  const client = ensureClient();

  if (currentRoomId !== roomId) {
    try {
      for (const s of subs.values()) s?.unsubscribe();
    } catch {}
    subs.clear();
    listeners.clear();
    currentRoomId = roomId;
  }

  const key =
    opts.key || `__anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  listeners.set(key, onMessage);

  if (client.connected) {
    if (subs.size === 0) resubscribeAll(roomId);
  } else {
    console.log("⏳ [travel-status] 연결 대기 → 연결 후 4개 토픽 구독");
  }

  // 실제 리스너 해제 + 필요 시 구독 해제
  return () => {
    try {
      listeners.delete(key);
      if (listeners.size === 0) {
        for (const s of subs.values()) s?.unsubscribe();
        subs.clear();
        console.log("🛑 [travel-status] 모든 구독 해제");
      } else {
        console.log(
          "↺ [travel-status] listener만 제거 (남은:",
          listeners.size,
          ")"
        );
      }
    } catch (e) {
      console.warn("⚠️ [travel-status] off() 중 오류:", e);
    }
  };
}

export function publishTravelTrigger(payload) {
  const { roomId } = payload || {};
  if (!roomId) return console.warn("⚠️ [travel-status] roomId 누락");

  ensureClient();
  const destination = APP(roomId);

  const publishNow = () => {
    console.log("📤 [travel-status 발행]", destination, payload);
    statusStomp.publish({ destination, body: JSON.stringify(payload) });
  };

  if (statusStomp.connected) publishNow();
  else {
    const original = statusStomp.onConnect;
    statusStomp.onConnect = (frame) => {
      try {
        original?.(frame);
      } catch {}
      publishNow();
      statusStomp.onConnect = original;
    };
  }
}

export function disconnectTravelStatus() {
  try {
    for (const s of subs.values()) s?.unsubscribe();
  } catch {}
  subs.clear();
  listeners.clear();
  currentRoomId = null;

  if (statusStomp) {
    try {
      statusStomp.deactivate();
    } catch {}
    statusStomp = null;
  }
}

export function _debugTravelStatus() {
  return {
    connected: !!statusStomp?.connected,
    roomId: currentRoomId,
    subs: Array.from(subs.keys()),
    listenerCount: listeners.size,
  };
}
