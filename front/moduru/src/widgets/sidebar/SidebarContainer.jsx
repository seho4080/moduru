import React, { useState } from 'react';
import SidebarTabs from './SidebarTabs';
import SidebarPanel from './SidebarPanel';
import LoginForm from '../../features/auth/ui/LoginForm';

// ✅ TripRoomPage에서 roomId, setHoveredCoords를 props로 전달받도록 수정
export default function SidebarContainer({ activeTab, onTabChange, roomId, setHoveredCoords }) {
  const [lastTab, setLastTab] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isLoggedIn = !!localStorage.getItem('accessToken');

  const handleClosePanel = () => {
    setLastTab(activeTab);
    onTabChange(null);
  };

  const handleOpenPanel = () => {
    if (lastTab) {
      onTabChange(lastTab);
    } else {
      onTabChange('place'); // 기본 탭 fallback
    }
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      alert('프로필 화면으로 이동 (추후 구현)');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh' }}>
        <SidebarTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          onProfileClick={handleProfileClick}
        />
        <SidebarPanel
          activeTab={activeTab}
          onClosePanel={handleClosePanel}
          onOpenPanel={handleOpenPanel}
          roomId={roomId} // ✅ 추가된 부분: SidebarPanel로 roomId 전달
          setHoveredCoords={setHoveredCoords} // ✅ 추가된 부분
        />
      </div>

      {isLoginModalOpen && (
        <LoginForm onClose={() => setIsLoginModalOpen(false)} />
      )}
    </>
  );
}