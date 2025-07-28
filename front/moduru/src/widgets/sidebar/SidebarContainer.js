// src/SidebarContainer.js
import React, { useState } from 'react';
import SidebarTabs from './SidebarTabs';
import SidebarPanel from './SidebarPanel';

export default function SidebarContainer() {
  const [activeTab, setActiveTab] = useState(null); // ✅ 타입 없이 선언

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarPanel activeTab={activeTab} />
    </div>
  );
}

