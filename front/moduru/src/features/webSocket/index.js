// src/websocket/socket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (onMessage) => {
  const socket = new SockJS("http://localhost:8080/ws-stomp"); // 백엔드 설정 경로와 동일해야 함

  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("STOMP 연결됨");

      // 특정 주제 구독
      stompClient.subscribe("/topic/pins", (message) => {
        const body = JSON.parse(message.body);
        onMessage?.(body);
      });
    },
    onStompError: (frame) => {
      console.error("STOMP 오류", frame);
    },
  });

  stompClient.activate();
};

export const sendMessage = (payload) => {
  if (stompClient && stompClient.connected) {
    const roomId = payload.roomId;
    if (!roomId) {
      console.warn("roomId가 없습니다. 메시지를 전송할 수 없습니다.");
      return;
    }

    stompClient.publish({
      destination: `/room/${roomId}/place-want`,
      body: JSON.stringify(payload),
    });
  } else {
    console.warn("STOMP가 연결되지 않음");
  }
};
