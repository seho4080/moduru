// builtin
import React from "react";

// external
import { useNavigate } from "react-router-dom";

// styles
import "./MainPage.css";

// constants
const START_BUTTON_LABEL = "여행 시작하기";
const LIST_BUTTON_LABEL = "내 여행방 목록";

const MainContent = () => {
  const navigate = useNavigate();

  const handleStartTrip = () => {
    navigate("/trip-room");
  };

  return (
    <div className="main-content">
      <div className="text-box">
        <h2>실시간으로 소통하며</h2>
        <h2>함께 만드는 여행 플랜</h2>
      </div>

      {/* NOTE: 여행 시작 버튼 클릭 시 trip-room 페이지로 이동 */}
      <button className="btn-start" onClick={handleStartTrip}>
        {START_BUTTON_LABEL}
      </button>

      <img
        src="/src/assets/images/moduru-mainpage-image.png"
        alt="메인 이미지"
        className="main-image"
      />

      <button className="btn-list">{LIST_BUTTON_LABEL}</button>
    </div>
  );
};

export default MainContent;
