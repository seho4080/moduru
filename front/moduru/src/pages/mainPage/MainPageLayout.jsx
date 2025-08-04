import React, { useState } from "react";
import Header from "../../widgets/header";
import Footer from "../../widgets/footer";
import MainContent from "./MainContent";
import LoginForm from "../../features/auth/ui/LoginForm";
import { useAuth } from "../../shared/model/useAuth";

const MainPageLayout = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      alert("✅ 프로필 화면으로 이동 (추후 구현 예정)");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f5faff] relative">
      {/* 상단바 */}
      <div className="w-[90%] py-5 flex justify-between items-center">
        <div className="w-[100px]">
          <img src="/src/assets/images/moduru-logo.png" alt="로고" />
        </div>
        <div
          className="w-[70px] h-[70px] mr-5 mt-5 cursor-pointer"
          onClick={handleProfileClick}
        >
          <img src="/src/assets/icons/login-icon.png" alt="로그인" />
        </div>
      </div>

      <MainContent />

      <footer className="mt-10 text-sm text-gray-500 text-center">
        © 2025 에잇(스파). All rights reserved
      </footer>

      {/* 로그인 모달 */}
      {isLoginModalOpen && (
        <LoginForm onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
};

export default MainPageLayout;
