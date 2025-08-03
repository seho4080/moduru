import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTripRoom, getTripRoomInfo } from "../../features/tripCreate/lib/tripRoomApi";
import LoginForm from "../../features/auth/ui/LoginForm";
import { useAuth } from '../../shared/model/useAuth';

import "./MainPage.css";

const MainContent = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingStartTrip, setPendingStartTrip] = useState(false);
  const { isLoggedIn } = useAuth(); // ✅ 최상단에서 한 번만 사용

  // ✅ 로그인 이후 여행 시작 재시도
  useEffect(() => {
    if (isLoggedIn && pendingStartTrip) {
      console.log("[🔥 로그인 이후 여행 시작 재시도]");
      setPendingStartTrip(false);
      doStartTrip();
    }
  }, [isLoggedIn]);

  const doStartTrip = async () => {
    try {
      const travelRoomId = await createTripRoom();
      const travelRoomInfo = await getTripRoomInfo(travelRoomId);
      console.log('[✅ 여행방 정보]', travelRoomInfo);

      navigate("/trip-room", {
        state: travelRoomInfo,
      });
    } catch (err) {
      console.error("🚨 여행 시작 중 오류:", err.message);
      alert("여행을 시작할 수 없습니다. 다시 시도해주세요.");
    }
  };

  const handleStartTrip = () => {
    if (!isLoggedIn) {
      console.warn("🔒 로그인 필요");
      setShowLoginModal(true);
      setPendingStartTrip(true);
      return;
    }

    doStartTrip();
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    alert('✅ 프로필 화면으로 이동 (추후 구현)');
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

      <button className="btn-list" onClick={handleProfileClick}>
        내 여행방 목록
      </button>

      {showLoginModal && (
        <LoginForm
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

export default MainContent;
