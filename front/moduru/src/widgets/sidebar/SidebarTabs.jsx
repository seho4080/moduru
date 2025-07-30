// src/widgets/sidebar/SidebarTabs.js
import React from 'react';
import './SidebarTabs.css';

const SidebarTabs = ({ activeTab, onTabChange }) => {
  const steps = [
    { key: 'date', step: 'STEP 1', label: '여행 일정' },
    { key: 'place', step: 'STEP 2', label: '장소 검색' },
    { key: 'schedule', step: 'STEP 3', label: '일정 편집' },
  ];

  const handleExit = () => {
    onTabChange('exit');
  };

  return (
    <div className="custom-sidebar">
      <div className="logo-space"></div>

      <div className="step-container">
        {steps.map(({ key, step, label }) => (
          <div
            key={key}
            className={`step-box ${activeTab === key ? 'active' : 'inactive'}`}
            onClick={() => onTabChange(key)}
          >
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      <button className="exit-button" onClick={handleExit}>
        나가기
      </button>
    </div>
  );
};

export default SidebarTabs;
