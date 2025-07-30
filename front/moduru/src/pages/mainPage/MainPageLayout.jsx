import React, { useState } from 'react'; // ✅ useState 추가
import MainContent from './MainContent';
import './MainPage.css';

const MainPageLayout = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <div className="main-page-layout">
      <div className="top-bar">
        <div className="logo">
          <img src="/assets/images/moduru-logo.png" alt="로고" />
        </div>

        <div className="login-icon" onClick={handleLoginClick}>
          <img src="/assets/icons/login-icon.png" alt="로그인" />
        </div>
      </div>

      <MainContent />

      {/* ❗ 조건부 모달 렌더링 - 없으면 경고 뜸 */}
      {isLoginModalOpen && (
        <div className="login-modal">
          <p>로그인 모달 열림 (구현 예정)</p>
        </div>
      )}

      <footer className="footer">
        © 2025 에잇(스파). All rights reserved
      </footer>
    </div>
  );
};

export default MainPageLayout;
