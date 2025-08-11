import React, { useState } from "react";
import SidebarTabs from "./SidebarTabs";
import SidebarPanel from "./SidebarPanel";
import LoginForm from "../../features/auth/ui/LoginForm";

export default function SidebarContainer({
  activeTab,
  onTabChange,
  roomId,
  setHoveredCoords,
}) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleOpenPanel = () => {
    setIsPanelOpen(true);
  };

  const handleTabClick = (tabKey) => {
    if (!isPanelOpen) {
      setIsPanelOpen(true); // NOTE: 패널이 닫힌 경우 탭 클릭 시 열어줌
    }
    onTabChange(tabKey);
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      alert("프로필 화면으로 이동 (추후 구현)");
    }
  };

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        <SidebarTabs
          activeTab={activeTab}
          onTabChange={handleTabClick}
          onProfileClick={handleProfileClick}
        />
        <SidebarPanel
          activeTab={activeTab}
          isOpen={isPanelOpen}
          onClosePanel={handleClosePanel}
          onOpenPanel={handleOpenPanel}
          roomId={roomId}
          setHoveredCoords={setHoveredCoords}
        />
      </div>

      {isLoginModalOpen && (
        <LoginForm onClose={() => setIsLoginModalOpen(false)} />
      )}
    </>
  );
}
