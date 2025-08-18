// src/pages/mainPage/MainPage.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTripRoom, getTripRoomInfo } from "../../features/tripCreate/lib/tripRoomApi";
import LoginForm from "../../features/auth/ui/LoginForm";
import "./MainPage.css";
import mainArt1 from "../../assets/mainPage.png";

/**
 * MainContent
 * - 로그인 모달/상태는 관리하지 않는다.
 * - 상위에서 내려주는 requireLogin(cb)만 사용한다.
 */
export default function MainPage({ requireLogin }) {
  const navigate = useNavigate();
  const startGuardRef = useRef(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pendingActionRef = useRef(null);
  const openLoginWith = (cb) => { pendingActionRef.current = cb; setIsLoginOpen(true); };
  const onLoginSuccess = () => {
    setIsLoginOpen(false);
    const cb = pendingActionRef.current;
    pendingActionRef.current = null;
    cb && cb();
  };

  const doStartTrip = async () => {
    if (startGuardRef.current) return;
    startGuardRef.current = true;
    try {
      const travelRoomId = await createTripRoom();
      const travelRoomInfo = await getTripRoomInfo(travelRoomId);
      navigate(`/trip-room/${travelRoomId}`, { state: travelRoomInfo, replace: true });
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 401 || status === 403) { openLoginWith(() => doStartTrip()); return; }
      console.error("여행 시작 중 오류:", err?.message || err);
      alert("여행을 시작할 수 없습니다. 다시 시도해주세요.");
    } finally {
      startGuardRef.current = false;
    }
  };

  const handleStartTrip = () => {
    if (typeof requireLogin === "function") requireLogin(() => doStartTrip());
    else openLoginWith(() => doStartTrip());
  };

  // ✅ “내 여행방 보기” 버튼 복구(바로 이동)
  const handleViewList = () => {
    navigate("/my-page");
  };

  return (
    <>
      <div className="main-page">
        <div className="main-card" role="region" aria-label="main-card">
          <div className="card-header">
            <div className="logo-text">MODURU</div>
            <div className="profile-circle" />
          </div>

          <div className="card-inner">
            <h1 className="hero-title">
              <span className="hero-en">duru</span>
              <span className="hero-ko"> 모아, 떠나 </span>
              <span className="hero-en">duru</span>
            </h1>

            <p className="hero-sub">도착보다 과정을 즐기며, 오늘의 지도를 펼치다.</p>

            <div className="btn-stack">
              <button className="main-btn primary-btn" onClick={handleStartTrip}>
                New 여행 시작하기
              </button>
              <button className="main-btn secondary-btn" onClick={handleViewList}>
                내 여행방 보기
              </button>
            </div>
          </div>

          <div className="art-row" aria-hidden>
            <div
              className="art art-single"
              style={{ WebkitMaskImage: `url(${mainArt1})`, maskImage: `url(${mainArt1})` }}
            />
          </div>
        </div>
      </div>

      {isLoginOpen && (
        <LoginForm onClose={() => setIsLoginOpen(false)} onSuccess={onLoginSuccess} />
      )}
    </>
  );
}
