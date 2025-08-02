// pages/mainPage/MainContent.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { createTripRoom, getTripRoomInfo } from "../../features/tripCreate/model/tripRoomApi";

import "./MainPage.css";

const MainContent = () => {
  const navigate = useNavigate();

  const handleStartTrip = async () => {
    try {
      const travelRoomId = await createTripRoom();
      const title = await getTripRoomInfo(travelRoomId);

      navigate("/trip-room", {
        state: { travelRoomId, title },
      });
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
