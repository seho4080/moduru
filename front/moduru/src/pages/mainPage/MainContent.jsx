import React from "react";
import { useNavigate } from "react-router-dom";

import "./MainPage.css";

const MainContent = () => {
  const navigate = useNavigate();

  const handleStartTrip = async () => {
    try {
      // 1. 여행방 생성 API 호출
      const createRes = await fetch("http://localhost:8080/rooms", {
        method: "POST",
        credentials: "include", // ✅ 로그인 유저만 고려
      });

      if (!createRes.ok) throw new Error("여행방 생성 실패");

      const { travelRoomId } = await createRes.json();

      // 2. 여행방 접속 API 호출 (제목 받아오기)
      const infoRes = await fetch(`http://localhost:8080/rooms/${travelRoomId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!infoRes.ok) throw new Error("여행방 정보 조회 실패");

      const { title } = await infoRes.json();

      // 3. trip-room 페이지로 이동하면서 state 전달
      navigate("/trip-room", { state: { travelRoomId, title } });

    } catch (err) {
      console.error("여행 시작 중 오류:", err.message);
      alert("여행을 시작할 수 없습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="main-content">
      <div className="text-box">
        <h2>실시간으로 소통하며</h2>
        <h2>함께 만드는 여행 플랜</h2>
      </div>

      <button className="btn-start" onClick={handleStartTrip}>
        여행 시작하기
      </button>

      <img
        src="/src/assets/images/moduru-mainpage-image.png"
        alt="메인 이미지"
        className="main-image"
      />

      <button className="btn-list">내 여행방 목록</button>
    </div>
  );
};

export default MainContent;
