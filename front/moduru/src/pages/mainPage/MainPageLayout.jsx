import React, { useState } from "react";
import MainContent from "./MainContent";
import LoginForm from "../../features/auth/ui/LoginForm";
import { useAuth } from "../../shared/model/useAuth"; // ✅ 추가
import "./mainPage.css";

const MainPageLayout = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth(); // ✅ 로그인 상태 가져오기

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true); // ✅ 로그인 안 됐으면 모달 열기
    } else {
      alert("✅ 프로필 화면으로 이동 (추후 구현 예정)"); // ✅ 로그인 상태라면 다른 동작
    }
  };

  return (
    <div className="main-page-layout">
      <div className="top-bar">
        <div className="logo">
          <img src="/src/assets/images/moduru-logo.png" alt="로고" />
        </div>

        <div className="login-icon" onClick={handleProfileClick}>
          <img src="/src/assets/icons/login-icon.png" alt="로그인" />
        </div>
      </div>

      <MainContent />

      {/*  LoginForm 모달 조건부 렌더링 */}
      {isLoginModalOpen && (
        <LoginForm onClose={() => setIsLoginModalOpen(false)} />
      )}

      <footer className="footer">© 2025 에잇(스파). All rights reserved</footer>
    </div>
  );
};

export default MainPageLayout;
