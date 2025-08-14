import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTripRoom,
  getTripRoomInfo,
} from "../../features/tripCreate/lib/tripRoomApi";
import MainImage from "../../assets/images/moduru-mainpage-image.png";
/**
 * MainContent
 * - 로그인 모달/상태는 관리하지 않는다.
 * - 상위에서 내려주는 requireLogin(cb)만 사용한다.
 */
const MainContent = ({ requireLogin }) => {
  const navigate = useNavigate();
  // React 18 StrictMode 중복 호출 가드
  const startGuardRef = useRef(false);

  const doStartTrip = async () => {
    if (startGuardRef.current) return;
    startGuardRef.current = true;

    try {
      const travelRoomId = await createTripRoom();
      const travelRoomInfo = await getTripRoomInfo(travelRoomId);

      // NOTE: travelRoomId를 포함한 경로로 이동해야 정상 작동
      navigate(`/trip-room/${travelRoomId}`, { state: travelRoomInfo, replace: true });
    } catch (err) {
      console.error("여행 시작 중 오류:", err?.message || err);
      alert("여행을 시작할 수 없습니다. 다시 시도해주세요.");
    } finally {
      startGuardRef.current = false;
    }
  };

  const handleStartTrip = () => {
    // 비로그인 시 모달을 띄우고, 로그인 성공하면 doStartTrip 실행
    requireLogin(() => doStartTrip());
  };

  const handleViewList = () => {
    requireLogin(() => navigate("/my-page"));
  };

  return (
    <div className="bg-white rounded-[40px] shadow-md w-full flex flex-col items-center px-8 py-16">
      <div className="text-center text-xl font-semibold mb-6">
        <p>실시간으로 소통하며</p>
        <p>함께 만드는 여행 플랜</p>
      </div>

      <button
        type="button"
        className="bg-[#3c5dc0] text-white px-6 py-2 rounded-full font-semibold mb-8"
        onClick={handleStartTrip}
      >
        여행 시작하기
      </button>

      <img
        src={MainImage}
        alt="메인 이미지"
        className="w-[300px] h-auto mb-10"
      />

      <button
        type="button"
        className="border border-[#3c5dc0] text-[#3c5dc0] px-6 py-2 rounded-full font-semibold"
        onClick={handleViewList}
      >
        내 여행방 목록
      </button>
    </div>
  );
};

export default MainContent;
