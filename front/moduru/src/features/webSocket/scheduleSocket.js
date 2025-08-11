// src/features/schedule/lib/scheduleSocket.js

// external
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let scheduleStomp = null;
let activeSub = null; // 실제 STOMP 구독(1개)
let currentDestination = null; // 현재 구독 dest
const listeners = new Set(); // 리스너 팬아웃

// ✅ 백엔드 매핑에 맞춘 경로
const DEST = (roomId) => `/topic/room/${roomId}/schedule`;

function ensureClient() {
  if (scheduleStomp) return scheduleStomp;

  const socket = new SockJS("/api/ws-stomp", null, {
    withCredentials: true,
  });

  scheduleStomp = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      console.log("✅ [schedule] connected");
      // 연결/재연결 시 현재 dest 재구독
      if (currentDestination) resubscribe(currentDestination);
    },
    onUnhandledMessage: (msg) => {
      console.warn(
        "🟡 [schedule] onUnhandledMessage",
        "\n - destination:",
        msg.headers?.destination,
        "\n - body:",
        safeParse(msg.body)
      );
    },
    onStompError: (frame) => console.error("❌ [schedule] STOMP 오류:", frame),
    onWebSocketError: (err) =>
      console.error("❌ [schedule] WebSocket 오류:", err),
    onDisconnect: () => console.warn("⚠️ [schedule] disconnected"),
  });

  scheduleStomp.activate();
  if (typeof window !== "undefined") window.scheduleStomp = scheduleStomp;
  return scheduleStomp;
}

function safeParse(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/**
 * 구독 (동기) — cleanup 함수 반환
 */
export function subscribeSchedule(roomId, onMessage) {
  if (!roomId) {
    console.warn("[schedule] roomId 누락");
    return () => {};
  }

  const client = ensureClient();
  const dest = DEST(roomId);

  // 리스너 등록(중복 방지)
  listeners.add(onMessage);

  // destination 변경되면 기존 구독 해제 후 새로 세팅
  if (currentDestination !== dest) {
    currentDestination = dest;
    if (client.connected) {
      resubscribe(dest);
    } else {
      console.log("⏳ [schedule] 대기 중(미연결) → 연결되면 구독:", dest);
    }
  } else {
    // 동일 dest인데 구독이 없으면 복구
    if (client.connected && !activeSub) resubscribe(dest);
  }

  // 호출자 전용 언서브
  return () => {
    listeners.delete(onMessage);
    if (listeners.size === 0) {
      try {
        activeSub?.unsubscribe();
      } catch {}
      activeSub = null;
      console.log("🛑 [schedule] 구독 해제:", currentDestination);
      currentDestination = null;
    }
  };
}

function resubscribe(destination) {
  if (!scheduleStomp?.connected) return;

  try {
    activeSub?.unsubscribe();
  } catch {}
  activeSub = scheduleStomp.subscribe(destination, (message) => {
    const body = safeParse(message.body);
    console.log(
      "📥 [schedule 수신]",
      "\n - destination:",
      destination,
      "\n - body:",
      body
    );
    listeners.forEach((fn) => {
      try {
        fn(body);
      } catch (e) {
        console.error("❌ [schedule] listener 오류:", e);
      }
    });
  });
  console.log(
    "✅ [schedule] 구독 시작:",
    destination,
    `(listeners: ${listeners.size})`
  );
}

/**
 * 발행 (동기)
 */
export function publishSchedule(
  { roomId, day, date, events = [] },
  extra = {}
) {
  if (!roomId) return console.warn("⚠️ [schedule] roomId 누락");
  if (!day || !date) return console.warn("⚠️ [schedule] day/date 누락");

  ensureClient();
  const destination = `/app/room/${roomId}/schedule`;
  const payload = {
    roomId,
    day,
    date,
    events: events.map((e) => ({
      wantId: e.wantId,
      startTime: e.startTime,
      endTime: e.endTime,
      eventOrder: e.eventOrder,
    })),
    ...extra,
  };

  const publishNow = () => {
    console.log(
      "📤 [schedule 발행]",
      "\n - destination:",
      destination,
      "\n - payload:",
      payload
    );
    scheduleStomp.publish({ destination, body: JSON.stringify(payload) });
  };

  if (scheduleStomp.connected) {
    publishNow();
  } else {
    const original = scheduleStomp.onConnect;
    scheduleStomp.onConnect = (frame) => {
      try {
        original?.(frame);
      } catch {}
      publishNow();
      scheduleStomp.onConnect = original; // 1회만 지연 발행
    };
  }
}

export function disconnectSchedule() {
  try {
    activeSub?.unsubscribe();
  } catch {}
  activeSub = null;
  currentDestination = null;
  listeners.clear();

  if (scheduleStomp) {
    try {
      scheduleStomp.deactivate();
    } catch {}
    scheduleStomp = null;
  }
}
