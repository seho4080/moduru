import React, { useState } from "react";
import MainContent from "./MainContent";
import LoginForm from "../../features/auth/ui/LoginForm";
import "./MainPage.css";

const MainPageLayout = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="main-page-layout">
      <div className="top-bar">
        <div className="logo">
          <img src="/src/assets/images/moduru-logo.png" alt="로고" />
        </div>

        <div className="login-icon" onClick={() => setIsLoginModalOpen(true)}>
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
