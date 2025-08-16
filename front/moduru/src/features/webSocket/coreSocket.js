// src/features/webSocket/coreSocket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

/** 싱글톤 STOMP + 구독/콜백 레지스트리 */
let stompClient = null;
let currentRoomId = null;

// key -> STOMP Subscription
const subs = new Map(); // Map<string, IStompSubscription>
// key -> { dest: string, cb: (body:any)=>void }
const handlers = new Map(); // Map<string, { dest, cb }>

// ✅ 연결 전/재연결 중 발행을 보관할 큐
const pendingPublishes = []; // [{ destination, payload }]

const WS_URL = "http://localhost:8080/ws-stomp";

// action이 없으면 생략된 경로를 반환
const topic = (roomId, handler, action) =>
  action
    ? `/topic/room/${roomId}/${handler}/${action}`
    : `/topic/room/${roomId}/${handler}`;

const appDest = (roomId, handler, action) =>
  action
    ? `/app/room/${roomId}/${handler}/${action}`
    : `/app/room/${roomId}/${handler}`;

// ✅ JSON 파싱 안전화(문자열이면 그대로 전달)
function safeParse(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function subscribeOne(key) {
  if (!stompClient?.connected) return;
  if (subs.has(key)) return;

  const reg = handlers.get(key);
  if (!reg) return;

  const sub = stompClient.subscribe(reg.dest, (message) => {
    const body = safeParse(message.body);
    // 통일된 수신 로그
    console.log("📥 [WS recv]", reg.dest, body);
    try {
      reg.cb(body);
    } catch (err) {
      console.error("❌ [WS handler error]", err);
    }
  });

  subs.set(key, sub);
}

// ✅ 재연결 시 강제 재구독(예전 subs 무효화)
function resubscribeAll() {
  if (!stompClient?.connected) return;
  // 예전 구독 모두 해제/삭제
  for (const [key, s] of subs.entries()) {
    try {
      s?.unsubscribe();
    } catch {}
    subs.delete(key);
  }
  // handlers 기준으로 재구독
  for (const key of handlers.keys()) {
    subscribeOne(key);
  }
}

function unsubscribeAll() {
  for (const s of subs.values()) {
    try {
      s?.unsubscribe();
    } catch {}
  }
  subs.clear();
}

function flushPendingPublishes() {
  if (!stompClient?.connected || pendingPublishes.length === 0) return;
  for (const { destination, payload } of pendingPublishes.splice(0)) {
    stompClient.publish({
      destination,
      body: JSON.stringify(payload ?? {}),
    });
    console.log("📤 [WS send:flush]", destination, payload);
  }
}

function ensureClient() {
  if (stompClient) return stompClient;

  // ✅ 재연결 때마다 새 SockJS 인스턴스를 써야 안정적
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL, null, { withCredentials: true }),
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      console.log("✅ WS connected");
      resubscribeAll(); // ✅ 강제 재구독
      flushPendingPublishes();
    },
    onStompError: (frame) => console.error("❌ STOMP error:", frame),
    onWebSocketError: (err) => console.error("❌ WS error:", err),
    onDisconnect: () => {
      console.warn("⚠️ WS disconnected");
      // ✅ 끊길 때 예전 구독 레지스트리만 정리(handlers는 유지 → 재연결 시 재구독)
      subs.clear();
    },
  });

  stompClient.activate();
  if (typeof window !== "undefined") window.stompClient = stompClient;
  return stompClient;
}

/**
 * WebSocket 연결 및 구독 추가 (중복 방지)
 * @param {string|number} roomId
 * @param {Array<{ handler: string, action?: string, callback: (body:any)=>void, key?: string }>} subscriptions
 */
export function connectWebSocket(roomId, subscriptions = []) {
  if (!roomId) {
    console.warn("⚠️ roomId 누락");
    return;
  }

  ensureClient();

  // 방이 바뀌면 모든 구독 리셋
  if (currentRoomId !== roomId) {
    unsubscribeAll();
    handlers.clear();
    currentRoomId = roomId;
  }

  subscriptions.forEach(({ handler, action, callback, key }) => {
    if (!handler || typeof callback !== "function") return;

    const dest = topic(roomId, handler, action);
    const mapKey = key ?? `${roomId}|${dest}`; // dest 자체로 유니크 보장

    handlers.set(mapKey, { dest, cb: callback });
    // 연결되어 있으면 즉시 구독, 아니면 onConnect에서 재구독됨
    if (!subs.has(mapKey)) subscribeOne(mapKey);
  });
}

/** 발행(공용) — action 없으면 `/app/room/{roomId}/{handler}` */
export function publishMessage(roomId, handler, action, payload) {
  const client = ensureClient();
  if (!roomId || !handler) {
    console.warn("⚠️ roomId/handler 누락");
    return;
  }
  const destination = appDest(roomId, handler, action);

  if (!client.connected) {
    pendingPublishes.push({ destination, payload });
    console.warn("⏳ WS not connected → queued:", destination, payload);
    return;
  }

  client.publish({ destination, body: JSON.stringify(payload ?? {}) });
  console.log("📤 [WS send]", destination, payload);
}

/** (선택) 예전 API 호환용 래퍼 */
export function sendSocketMessage({ roomId, handler, action, ...payload }) {
  publishMessage(roomId, handler, action, { roomId, action, ...payload });
}

/** 부분 구독 해제 (keys로 지정한 것만) */
export function unsubscribeKeys(keys = []) {
  for (const key of keys) {
    const sub = subs.get(key);
    try {
      sub?.unsubscribe?.();
    } catch {}
    subs.delete(key);
    handlers.delete(key);
  }
}

/** 연결 해제(모든 구독 정리 포함) */
export function disconnectWebSocket() {
  unsubscribeAll();
  handlers.clear();
  currentRoomId = null;
  if (stompClient) {
    try {
      stompClient.deactivate();
    } catch {}
    stompClient = null;
  }
  console.log("🛑 WS deactivated");
}

// ✅ 디버깅용 상태 노출(선택)
export function _debugWs() {
  return {
    connected: !!stompClient?.connected,
    roomId: currentRoomId,
    subs: Array.from(subs.keys()),
    handlers: Array.from(handlers.keys()),
    pendingCount: pendingPublishes.length,
  };
}
