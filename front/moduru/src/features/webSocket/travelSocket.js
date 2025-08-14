// src/features/webSocket/travelSocket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let travelStomp = null;
let activeSub = null; // 물리 구독 1개
let currentDestination = null; // 현재 dest
const listeners = new Map(); // key -> callback

const TOPIC = (roomId) => `/topic/room/${roomId}/travel/result`;
const APP = (roomId) => `/app/room/${roomId}/travel/calc`;

function ensureClient() {
  if (travelStomp) return travelStomp;

  const socket = new SockJS("/api/ws-stomp", null, {
    withCredentials: true,
  });

  travelStomp = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      console.log("✅ [travel] connected");
      if (currentDestination) {
        console.log("🔁 [travel] onConnect → resubscribe:", currentDestination);
        resubscribe(currentDestination);
      }
    },
    onUnhandledMessage: (msg) => {
      console.warn(
        "🟡 [travel] onUnhandledMessage",
        msg.headers?.destination,
        msg.body
      );
    },
    onStompError: (f) => console.error("❌ [travel] STOMP 오류:", f),
    onWebSocketError: (e) => console.error("❌ [travel] WebSocket 오류:", e),
    onDisconnect: () => console.warn("⚠️ [travel] disconnected"),
  });

  console.log("🔌 [travel] activate STOMP client");
  travelStomp.activate();
  if (typeof window !== "undefined") window.travelStomp = travelStomp;
  return travelStomp;
}

function safeParse(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function resubscribe(destination) {
  if (!travelStomp?.connected) {
    console.log("⏸️ [travel] resubscribe skipped (not connected)");
    return;
  }

  try {
    activeSub?.unsubscribe();
  } catch {}
  activeSub = travelStomp.subscribe(destination, (message) => {
    const body = safeParse(message.body);
    // 🔍 수신 로그 (요약)
    console.log(
      "📥 [travel 수신]",
      message.headers?.destination,
      {
        hasBody: !!body,
        keys: body ? Object.keys(body) : [],
        body: body ? JSON.stringify(body, null, 2) : null, // 보기 좋게 들여쓰기
      }
    );

    // 🔍 body 세부 필드 개별 출력 (원하면)
    if (body) {
      console.log("📦 [travel body 전체]", body);
    }

    for (const fn of listeners.values()) {
      try {
       fn(body);
     } catch (e) {
       console.error("❌ [travel] listener 오류:", e);
     }
    }
  });

  console.log(
    "✅ [travel] 구독 시작:",
    destination,
    `(listenerCount: ${listeners.size})`
  );
}

/** 구독 — cleanup 반환 */
export function subscribeTravel(roomId, onMessage, opts = {}) {
  if (!roomId) return () => {};
  if (typeof onMessage !== "function") return () => {};

  const client = ensureClient();
  const dest = TOPIC(roomId);

  const key =
    opts.key || `__anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  listeners.set(key, onMessage);

  if (currentDestination !== dest) {
    currentDestination = dest;
    if (client.connected) {
      resubscribe(dest);
    } else {
      console.log("⏳ [travel] 연결 대기 → 연결 후 구독:", dest);
    }
  } else {
    if (client.connected && !activeSub) resubscribe(dest);
  }

  return () => {
    listeners.delete(key);
    // ✅ 구독 유지: 리스너 0명이 되어도 activeSub/unsubscribe 하지 않음
    console.log("↺ [travel] listener만 제거 (남은:", listeners.size, ")");
  };
}

/** 발행 */
export function publishTravel(
  { roomId, nameId, day, date, transpot, events = [] },
  extra = {}
) {
  if (!roomId || !day || !date) {
    console.warn("⚠️ [travel] 필수값 누락", { roomId, day, date });
    return;
  }
  ensureClient();
  const destination = APP(roomId);

 const rawPreview = events.slice(0, 10).map((e, i) => ({
    i,
    wantId: e?.wantId,
    eventOrder: e?.eventOrder,
    startTime: e?.startTime,
    endTime: e?.endTime,
  }));
  const missingOrders = events.filter((e) => e?.eventOrder == null).length;

  const payload = {
    roomId,
    nameId,
    day,
    date,
    transpot,
    transport: transpot, // TODO: 이후 오타 정리 권장 (transpot → transport)
    events: events.map((e) => ({
      wantId: e.wantId,
      eventOrder: e.eventOrder,
      endTime: e.endTime,
      ...(e.startTime ? { startTime: e.startTime } : {}),
    })),
    ...extra,
  };

  const publishNow = () => {
    console.log("📤 [travel 발행]", destination, {
      roomId,
      day,
      date,
      transport: payload.transport,
      eventsLen: payload.events.length,
    });
    if (rawPreview.length) {
      console.log("🧩 [travel 발행] events preview (원본 상위 10개):", rawPreview);
      if (missingOrders > 0) {
        console.warn(
          `⚠️ [travel 발행] eventOrder 누락 ${missingOrders}건 (총 ${events.length}건 중)`
        );
      }
    } else {
      console.log("🧩 [travel 발행] events preview: []");
    }

    // payload.events 도 프리뷰 (상위 10개)
    const payloadPreview = payload.events.slice(0, 10).map((e, i) => ({
      i,
      wantId: e.wantId,
      eventOrder: e.eventOrder,
      startTime: e.startTime,
      endTime: e.endTime,
    }));
    console.log("🧾 [travel 발행] payload.events preview:", payloadPreview);

    travelStomp.publish({ destination, body: JSON.stringify(payload) });
  };

  if (travelStomp.connected) {
    publishNow();
  } else {
    // 연결되면 1회 발행
    const original = travelStomp.onConnect;
    travelStomp.onConnect = (frame) => {
      try {
        original?.(frame);
      } catch {}
      console.log("🔁 [travel] onConnect → 지연발행");
      publishNow();
      travelStomp.onConnect = original;
    };
    console.log("⏳ [travel] 아직 미연결 → onConnect에 발행 예약");
  }
}

export function disconnectTravel() {
  // 완전 종료가 필요한 '페이지 이탈'에서만 호출
  try {
    activeSub?.unsubscribe();
  } catch {}
  activeSub = null;
  currentDestination = null;
  listeners.clear();

  if (travelStomp) {
    try {
      travelStomp.deactivate();
    } catch {}
    travelStomp = null;
  }
}

export function _debugTravel() {
  return {
    connected: !!travelStomp?.connected,
    destination: currentDestination,
    listenerCount: listeners.size,
    hasSub: !!activeSub,
  };
}
