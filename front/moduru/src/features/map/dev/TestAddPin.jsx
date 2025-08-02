// src/features/map/dev/TestAddPin.jsx
import React from "react";
import { useDispatch } from "react-redux";
import { addPin } from "../../../redux/slices/mapSlice";
import { sendMessage } from "../../webSocket/index"; // 정확한 경로 확인

const TestAddPin = ({ roomId }) => {
  const dispatch = useDispatch();

  const handleAdd = () => {
    if (!roomId) {
      console.warn("roomId가 없습니다.");
      return;
    }

    const id = `fake-${Date.now()}`;
    const lat = 37.5665 + Math.random() * 0.01;
    const lng = 126.978 + Math.random() * 0.01;

    const pinData = {
      type: "pin:add", // 서버와 합의한 메시지 타입
      id,
      lat,
      lng,
      roomId,
    };

    sendMessage(pinData); // 백엔드로 전송
    dispatch(addPin(pinData)); // 로컬 상태도 반영
  };

  return (
    <button
      onClick={handleAdd}
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 1000,
        padding: "8px 12px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "6px",
      }}
    >
      📍 핀 추가 (가짜)
    </button>
  );
};

export default TestAddPin;
