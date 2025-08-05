import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../widgets/header";
import Footer from "../../widgets/footer";
import MainContent from "./MainContent";
import LoginForm from "../../features/auth/ui/LoginForm";
import { useAuth } from "../../shared/model/useAuth";

const MainPageLayout = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      navigate("/my-page");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f5faff]">
      {/* NOTE: 공통 Header */}
      <Header
        isLoggedIn={isLoggedIn}
        nickname={user?.nickname || "모두루"}
        onLoginIconClick={handleProfileClick}
      />

      {/* NOTE: 가운데 정렬된 메인 콘텐츠 */}
      <main className="flex justify-center px-4 py-12 w-full">
        <div className="w-full max-w-[1000px]">
          <MainContent onLoginModal={() => setIsLoginModalOpen(true)} />
        </div>
      </main>

      {/* NOTE: 공통 Footer */}
      <Footer />

      {isLoginModalOpen && (
        <LoginForm onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
};

export default MainPageLayout;
