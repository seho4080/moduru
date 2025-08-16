import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTripRoom, getTripRoomInfo } from "../../features/tripCreate/lib/tripRoomApi";
import { useAuth } from "../../shared/model/useAuth";
import { logout as apiLogout } from "../../features/auth/lib/authApi";
import LoginForm from "../../features/auth/ui/LoginForm";
import TravelRoomsModal from "./ui/TravelRoomsModal";
import "./css/MainPage.css";
import mainArt1 from "../../assets/mainPage.png";

export default function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, logout: logoutFromHook } = useAuth();
  const startGuardRef = useRef(false);

  // 로그인 모달
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pendingActionRef = useRef(null);
  const openLoginWith = (cb) => { pendingActionRef.current = cb; setIsLoginOpen(true); };
  const onLoginSuccess = () => {
    setIsLoginOpen(false);
    const cb = pendingActionRef.current;
    pendingActionRef.current = null;
    cb && cb();
  };

  // 방 목록 모달
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false);

  // 프로필 드롭다운
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  const handleProfileClick = () => {
    if (isLoggedIn) setIsProfileDropdownOpen((v) => !v);
    else openLoginWith(() => {});
  };

  const handleMyPage = () => {
    setIsProfileDropdownOpen(false);
    navigate("/my-page");
  };

  const handleLogout = async () => {
    try {
      if (typeof logoutFromHook === "function") {
        await logoutFromHook();
      } else {
        await apiLogout();
        localStorage.removeItem("accessToken");
      }
    } finally {
      setIsProfileDropdownOpen(false);
      navigate(0);
    }
  };

  // 바깥 클릭/ESC 닫기
  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const onKeyDown = (e) => e.key === "Escape" && setIsProfileDropdownOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // 여행 시작
  const doStartTrip = async () => {
    if (startGuardRef.current) return;
    startGuardRef.current = true;
    try {
      const travelRoomId = await createTripRoom();
      const travelRoomInfo = await getTripRoomInfo(travelRoomId);
      navigate(`/trip-room/${travelRoomId}`, { state: travelRoomInfo, replace: true });
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 401 || status === 403) {
        openLoginWith(() => doStartTrip());
        return;
      }
      console.error("여행 시작 중 오류:", err?.message || err);
      alert("여행을 시작할 수 없습니다. 다시 시도해주세요.");
    } finally {
      startGuardRef.current = false;
    }
  };

  const handleStartTrip = () => {
    if (isLoggedIn) doStartTrip();
    else openLoginWith(() => doStartTrip());
  };

  const handleViewList = () => {
    if (isLoggedIn) setIsRoomsModalOpen(true);
    else openLoginWith(() => setIsRoomsModalOpen(true));
  };

  return (
    <>
      <div className="main-page">
        <div className="main-card" role="region" aria-label="main-card">
          {/* 상단 바 */}
          <div className="card-header">
            <div className="logo-text">MODURU</div>

            {/* 프로필 아이콘 + 드롭다운 */}
            <div className="profile-container" ref={profileRef}>
              <div
                className="profile-circle"
                onClick={handleProfileClick}
                role="button"
                aria-haspopup="menu"
                aria-expanded={isProfileDropdownOpen}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3" fill="none" stroke="#6d87db" strokeWidth="2" />
                  <path d="M4.5 19c0-3 3.5-5.5 7.5-5.5S19.5 16 19.5 19" fill="none" stroke="#6d87db" strokeWidth="2" />
                </svg>
              </div>

              {isLoggedIn && isProfileDropdownOpen && (
                <div className="profile-dropdown" role="menu">
                  <button className="dropdown-item" onClick={handleMyPage} role="menuitem">
                    마이페이지
                  </button>
                  <button className="dropdown-item" onClick={handleLogout} role="menuitem">
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 문구 + 버튼(세로 배치) */}
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
                참여 중인 방 목록
              </button>
            </div>
          </div>

          {/* 하단 라인 아트 */}
          <div className="art-row" aria-hidden>
            <div
              className="art art-single"
              style={{ WebkitMaskImage: `url(${mainArt1})`, maskImage: `url(${mainArt1})` }}
            />
          </div>
        </div>
      </div>

      {/* 로그인 모달 */}
      {isLoginOpen && (
        <LoginForm onClose={() => setIsLoginOpen(false)} onSuccess={onLoginSuccess} />
      )}

      {/* 여행 방 목록 모달 */}
      <TravelRoomsModal
        isOpen={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
      />
    </>
  );
}
