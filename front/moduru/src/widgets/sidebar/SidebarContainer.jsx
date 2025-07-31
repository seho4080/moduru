import React from 'react';
import SidebarTabs from './SidebarTabs';
import SidebarPanel from './SidebarPanel';

export default function SidebarContainer({ activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarTabs activeTab={activeTab} onTabChange={onTabChange} />
      <SidebarPanel activeTab={activeTab} />
    </div>
  );
}

