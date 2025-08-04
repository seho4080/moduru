import React, { useState } from 'react';
import SidebarTabs from './SidebarTabs';
import SidebarPanel from './SidebarPanel';
import LoginForm from '../../features/auth/ui/LoginForm';

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
      onTabChange('place');
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
