import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../widgets/header";
import Footer from "../../widgets/footer";
import MainContent from "./MainContent";
import LoginForm from "../../features/auth/ui/LoginForm";
import { useAuth } from "../../shared/model/useAuth";

/**
 * MainPageLayout
 * - 로그인 모달은 여기서만 렌더(전역/중복 오버레이 방지)
 * - requireLogin(action)으로 로그인 요구 동작을 일관 처리
 */
const MainPageLayout = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  // 로그인 모달 on/off
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // 로그인 후 실행할 보류 작업 저장소
  const pendingActionRef = useRef(null);

  /**
   * 로그인 게이트
   * - 로그인 상태면 즉시 action 실행
   * - 비로그인이면 모달을 띄우고, 성공 시 저장된 action 실행
   */
  const requireLogin = (action) => {
    if (isLoggedIn) {
      action?.();
      return;
    }
    pendingActionRef.current = action;
    setIsLoginModalOpen(true);
  };

  // 헤더의 프로필/로그인 아이콘 클릭 → 마이페이지로
  const handleProfileClick = () => {
    requireLogin(() => navigate("/my-page"));
  };

  // LoginForm이 onSuccess를 제공하면 즉시 실행
  const handleLoginSuccess = () => {
    const fn = pendingActionRef.current;
    pendingActionRef.current = null;
    setIsLoginModalOpen(false);
    fn?.();
  };

  // 혹시 onSuccess가 없어도, 로그인 상태 변화를 감지해 실행(이중 안전장치)
  useEffect(() => {
    if (!isLoginModalOpen || !isLoggedIn) return;
    const fn = pendingActionRef.current;
    pendingActionRef.current = null;
    setIsLoginModalOpen(false);
    fn?.();
  }, [isLoggedIn, isLoginModalOpen]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f5faff]">
      {/* 공통 Header */}
      <Header
        isLoggedIn={isLoggedIn}
        nickname={user?.nickname || "모두루"}
        onLoginIconClick={handleProfileClick}
        // 선택: Header 내부에서도 필요하면 requireLogin을 활용 가능
        requireLogin={requireLogin}
      />

      {/* 가운데 정렬된 메인 콘텐츠 */}
      <main className="flex justify-center px-4 py-12 w-full">
        <div className="w-full max-w-[1000px]">
          <MainContent requireLogin={requireLogin} />
        </div>
      </main>

      {/* 공통 Footer */}
      <Footer />

      {/* 로그인 모달 — 레이아웃 단 한 곳에서만 렌더 */}
      {isLoginModalOpen && (
        <LoginForm
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={handleLoginSuccess} // 지원하지 않아도 위 useEffect가 커버
        />
      )}
    </div>
  );
};

export default MainPageLayout;
