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

function subscribeOne(key) {
  if (!stompClient?.connected) return;
  if (subs.has(key)) return;

  const reg = handlers.get(key);
  if (!reg) return;

  const sub = stompClient.subscribe(reg.dest, (message) => {
    try {
      const body = JSON.parse(message.body);
      console.log(`📥 [WS 수신] ${reg.dest}`, body);
      reg.cb(body);
    } catch (err) {
      console.error("❌ 메시지 파싱 오류:", err);
    }
  });

  subs.set(key, sub);
}

function resubscribeAll() {
  if (!stompClient?.connected) return;
  for (const key of handlers.keys()) {
    subscribeOne(key);
  }
}

function unsubscribeAll() {
  for (const sub of subs.values()) {
    try {
      sub?.unsubscribe();
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
    console.log("📤 [WS 발행:큐플러시]", destination, payload);
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
      console.log("✅ STOMP 연결 성공");
      resubscribeAll();
      flushPendingPublishes(); // ✅ 연결되면 대기 큐 플러시
    },
    onStompError: (frame) => console.error("❌ STOMP 오류:", frame),
    onWebSocketError: (err) => console.error("❌ WebSocket 오류:", err),
    onDisconnect: (frame) => console.warn("⚠️ STOMP 연결 종료:", frame),
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

  // ✅ 미연결이면 큐에 저장하고, 연결되면 onConnect에서 자동 발행
  if (!client.connected) {
    pendingPublishes.push({ destination, payload });
    console.warn("⏳ STOMP 연결 전 → 큐 대기:", destination, payload);
    return;
  }

  client.publish({ destination, body: JSON.stringify(payload ?? {}) });
  console.log("📤 [WS 발행]", destination, payload);
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
}
