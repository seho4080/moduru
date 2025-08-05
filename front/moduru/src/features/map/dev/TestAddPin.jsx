// builtin

// external
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// internal
import { addPin } from "../../../redux/slices/mapSlice";
import { connectWebSocket, sendMessage } from "/src/features/webSocket/Socket";

// relative

/**
 * 테스트용 핀 추가 버튼 (WebSocket 테스트)
 * @param {object} props
 * @param {string} props.roomId - 현재 여행방 ID
 */
const TestAddPin = ({ roomId }) => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    connectWebSocket(roomId, (message) => {
      console.log("서버에서 수신한 메시지:", message);
      // TODO: 메시지 유형에 따라 분기 처리 가능
    });

    // NOTE: 0.5초마다 연결 상태 확인
    const interval = setInterval(() => {
      if (window.stompClient?.connected) {
        setIsConnected(true);
        clearInterval(interval);
        console.log("STOMP 연결 완료 후 버튼 활성화");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [roomId]);

  /**
   * 핀 추가 버튼 클릭 시 호출됨
   */
  const handleAdd = () => {
    if (!roomId || !isConnected) {
      alert("STOMP 연결되지 않았습니다.");
      return;
    }

    const id = `fake-${Date.now()}`;
    const lat = 37.5665 + Math.random() * 0.01;
    const lng = 126.978 + Math.random() * 0.01;

    const pinData = {
      type: "pin:add",
      id,
      lat,
      lng,
      roomId,
    };

    sendMessage(pinData); // 서버로 전송
    dispatch(addPin(pinData)); // 로컬 스토어 반영
  };

  return (
    <button
      onClick={handleAdd}
      disabled={!isConnected}
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 1000,
        padding: "8px 12px",
        backgroundColor: isConnected ? "#4caf50" : "#ccc",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: isConnected ? "pointer" : "not-allowed",
      }}
    >
      📍 핀 추가 (가짜)
    </button>
  );
};

export default TestAddPin;
