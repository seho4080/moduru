// builtin

// external
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// internal

// relative

let stompClient = null;

/**
 * WebSocket 연결을 설정하고 STOMP 구독을 시작합니다.
 * @param {string} roomId - 참여 중인 여행방 ID
 * @param {function} onMessage - 수신 메시지 콜백 함수
 */
export const connectWebSocket = (roomId, onMessage) => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.warn("접속 시도 실패: accessToken 없음");
    return;
  }

  const socket = new SockJS("http://localhost:8080/ws-stomp");

  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    reconnectDelay: 5000,

    // NOTE: STOMP 연결 성공 시
    onConnect: () => {
      console.log("STOMP 연결됨");

      stompClient.subscribe(`/topic/room/${roomId}/place-want`, (message) => {
        const body = JSON.parse(message.body);
        console.log("받은 메시지:", body);
        onMessage?.(body);
      });
    },

    // NOTE: STOMP 프로토콜 오류
    onStompError: (frame) => {
      console.error("STOMP 오류", frame);
    },

    // NOTE: WebSocket 전송 계층 오류
    onWebSocketError: (err) => {
      console.error("WebSocket 오류", err);
    },

    // NOTE: 연결 끊김 시점
    onDisconnect: (frame) => {
      console.warn("STOMP 연결 끊김", frame);
    },
  });

  stompClient.activate();

  // NOTE: 디버깅을 위한 전역 등록 (개발 환경 한정)
  window.stompClient = stompClient;
};

/**
 * 서버에 메시지를 전송합니다.
 * @param {object} payload - 전송할 메시지 객체. 반드시 roomId 포함해야 함
 */
export const sendMessage = (payload) => {
  if (stompClient && stompClient.connected) {
    const { roomId } = payload;

    if (!roomId) {
      console.warn("roomId가 없습니다. 메시지를 전송할 수 없습니다.");
      return;
    }

    stompClient.publish({
      destination: `/app/room/${roomId}/place-want`,
      body: JSON.stringify(payload),
    });
  } else {
    console.warn("STOMP가 연결되지 않음");
  }
};
