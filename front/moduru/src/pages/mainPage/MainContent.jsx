import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTripRoom,
  getTripRoomInfo,
} from "../../features/tripCreate/lib/tripRoomApi";
import LoginForm from "../../features/auth/ui/LoginForm";
import { useAuth } from "../../shared/model/useAuth";

const MainContent = ({ onLoginModal }) => {
  const navigate = useNavigate();
  const [pendingStartTrip, setPendingStartTrip] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn && pendingStartTrip) {
      setPendingStartTrip(false);
      doStartTrip();
    }
  }, [isLoggedIn]);

  const doStartTrip = async () => {
    try {
      const travelRoomId = await createTripRoom();
      const travelRoomInfo = await getTripRoomInfo(travelRoomId);

      // NOTE: travelRoomId를 포함한 경로로 이동해야 정상 작동함
      navigate(`/trip-room/${travelRoomId}`, { state: travelRoomInfo });
    } catch (err) {
      console.error("여행 시작 중 오류:", err.message);
      alert("여행을 시작할 수 없습니다. 다시 시도해주세요.");
    }
  };

  const handleStartTrip = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      setPendingStartTrip(true);
    } else {
      doStartTrip();
    }
  };

  const handleViewList = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      navigate("/my-page");
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-md w-full flex flex-col items-center px-8 py-16">
      <div className="text-center text-xl font-semibold mb-6">
        <p>실시간으로 소통하며</p>
        <p>함께 만드는 여행 플랜</p>
      </div>

      <button
        className="bg-[#3c5dc0] text-white px-6 py-2 rounded-full font-semibold mb-8"
        onClick={handleStartTrip}
      >
        여행 시작하기
      </button>

      <img
        src="/src/assets/images/moduru-mainpage-image.png"
        alt="메인 이미지"
        className="w-[300px] h-auto mb-10"
      />

      <button
        className="border border-[#3c5dc0] text-[#3c5dc0] px-6 py-2 rounded-full font-semibold"
        onClick={handleViewList}
      >
        내 여행방 목록
      </button>

      {showLoginModal && <LoginForm onClose={() => setShowLoginModal(false)} />}
    </div>
  );
};

export default MainContent;
