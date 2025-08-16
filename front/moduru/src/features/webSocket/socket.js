// external
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

/**
 * WebSocket 연결을 설정하고 STOMP 구독을 시작합니다.
 * @param {string} roomId - 참여 중인 여행방 ID
 * @param {Array<{ handler: string, action: "add" | "remove", callback: function }>} subscriptions
 */
export const connectWebSocket = (roomId, subscriptions = []) => {
  const socket = new SockJS("http://localhost:8080/ws-stomp", null, {
    withCredentials: true,
  });

  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,

    onConnect: () => {
      console.log("✅ STOMP 연결 성공");

      subscriptions.forEach(({ handler, action, callback }) => {
        const destination = `/topic/room/${roomId}/${handler}/${action}`;

        stompClient.subscribe(destination, (message) => {
          try {
            const body = JSON.parse(message.body);
            console.log(`📥 [WebSocket 수신] ${destination}`, body);
            callback?.(body);
          } catch (err) {
            console.error("❌ 메시지 파싱 오류:", err);
          }
        });
      });
    },

    onStompError: (frame) => {
      console.error("❌ STOMP 오류:", frame);
    },

    onWebSocketError: (err) => {
      console.error("❌ WebSocket 오류:", err);
    },

    onDisconnect: (frame) => {
      console.warn("⚠️ STOMP 연결 종료:", frame);
    },
  });

  stompClient.activate();
  window.stompClient = stompClient;
};

/**
 * 서버에 메시지를 전송합니다.
 * @param {string} roomId - 방 ID
 * @param {string} handler - 핸들러 이름 (예: place-want)
 * @param {string} action - 동작 종류 (예: add, remove)
 * @param {object} payload - 전송할 메시지
 */
export const publishMessage = (roomId, handler, action, payload) => {
  if (stompClient && stompClient.connected) {
    if (!roomId || !handler || !action) {
      console.warn("⚠️ roomId 또는 handler 또는 action이 누락되었습니다.");
      return;
    }

    const destination = `/app/room/${roomId}/${handler}/${action}`;
    console.log("📍 destination:", destination);
    console.log("📦 payload:", payload);

    stompClient.publish({
      destination,
      body: JSON.stringify(payload),
    });
  } else {
    console.warn("⚠️ STOMP 연결 상태가 아닙니다.");
  }
};

/**
 * 장소 공유/공유취소 메시지를 서버로 전송합니다.
 * 다양한 핸들러에서 재사용 가능.
 * @param {object} params
 * @param {string} params.handler - 핸들러 이름 (예: place-want)
 * @param {"add" | "remove"} params.action - 동작 종류
 * @param {string} [params.type] - 장소 타입 (place/custom) - add 전용
 * @param {number} [params.id] - 장소 ID 또는 custom 핀 ID - add 전용
 * @param {number} params.roomId - 방 ID
 * @param {number} [params.wantId] - 제거할 wantId - remove 전용
 */
export const sendSocketMessage = ({
  handler,
  action,
  type,
  id,
  roomId,
  wantId,
}) => {
  if (!roomId || !handler || !action) {
    console.warn("⚠️ roomId, handler, action 중 누락");
    return;
  }

  const payload =
    action === "add"
      ? { type, id, roomId }
      : action === "remove"
      ? { wantId, roomId }
      : null;

  if (!payload) {
    console.warn("⚠️ payload 생성 실패");
    return;
  }

  publishMessage(roomId, handler, action, payload);
};
