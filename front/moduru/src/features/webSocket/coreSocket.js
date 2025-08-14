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

const WS_URL = "/api/ws-stomp";
const topic = (roomId, handler, action) =>
  `/topic/room/${roomId}/${handler}/${action}`;

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
  // 모든 물리 구독 해제
  for (const sub of subs.values()) {
    try {
      sub?.unsubscribe();
    } catch {}
  }
  subs.clear();
}

function ensureClient() {
  if (stompClient) return stompClient;

  const socket = new SockJS(WS_URL, null, { withCredentials: true });

  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      console.log("✅ STOMP 연결 성공");
      resubscribeAll();
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
 * @param {Array<{ handler: string, action: string, callback: (body:any)=>void, key?: string }>} subscriptions
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
    if (!handler || !action || typeof callback !== "function") return;

    const dest = topic(roomId, handler, action);
    const mapKey = key ?? `${roomId}|${dest}`; // key가 있으면 그걸로 덮어쓰기

    // 레지스트리에 목적지와 콜백을 함께 저장
    handlers.set(mapKey, { dest, cb: callback });

    // 연결돼 있으면 즉시 물리 구독
    if (!subs.has(mapKey)) subscribeOne(mapKey);
  });
}

/** 발행(공용) */
export function publishMessage(roomId, handler, action, payload) {
  if (!stompClient || !stompClient.connected) {
    console.warn("⚠️ STOMP 미연결 상태");
    return;
  }
  if (!roomId || !handler || !action) {
    console.warn("⚠️ roomId/handler/action 누락");
    return;
  }

  const destination = `/app/room/${roomId}/${handler}/${action}`;
  console.log("📍 destination:", destination);
  console.log("📦 payload:", payload);

  stompClient.publish({ destination, body: JSON.stringify(payload ?? {}) });
}

/** (선택) 예전 API 호환용 래퍼 */
export function sendSocketMessage({ roomId, handler, action, ...payload }) {
  publishMessage(roomId, handler, action, { roomId, action, ...payload });
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
