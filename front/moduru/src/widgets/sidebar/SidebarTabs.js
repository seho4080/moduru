// src/SidebarTabs.js
import React from 'react';

const tabs = [
  { key: 'title', label: '여행방 제목' },
  { key: 'location', label: '여행 장소' },
  { key: 'date', label: '여행 일정' },
  { key: 'place', label: '장소 검색' },
  { key: 'schedule', label: '일정 편집' },
];

export default function SidebarTabs({ activeTab, onTabChange }) {
  return (
    <div style={{
      width: '220px',
      backgroundColor: '#2d4d9f',
      color: 'white',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            backgroundColor: activeTab === tab.key ? 'white' : 'transparent',
            color: activeTab === tab.key ? '#2d4d9f' : 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: activeTab === tab.key ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
