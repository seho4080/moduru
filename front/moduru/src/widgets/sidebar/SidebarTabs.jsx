// src/widgets/sidebar/SidebarTabs.js
import React from 'react';
import './sidebarTabs.css';
import logo from '../../assets/moduru-logo.png';
import { FaUser, FaCalendarAlt, FaMicrophone } from 'react-icons/fa';

export default function SidebarTabs({ activeTab, onTabChange, onProfileClick }) {
  const tabList = [
    { key: 'place', step: 'STEP 2', label: '검색' },
    { key: 'pick', step: 'STEP 3', label: 'My 장소' },
    { key: 'schedule', step: 'STEP 4', label: '일정 편집' },
  ];

  const handleClickTab = (tabKey) => {
    onTabChange(tabKey);
  };

  const handleClickCalendar = () => {
    onTabChange('openTripModal');
  };

  const handleClickVoice = () => {
    alert('음성 기능 실행');
  };

  return (
    <div className="custom-sidebar">
      <div className="logo-space">
        <img src={logo} alt="로고" className="logo-img" />
      </div>

      <div className="step-container">
        {tabList.map(({ key, label }) => (
          <div
            key={key}
            className={`step-box ${activeTab === key ? 'active' : 'inactive'}`}
            onClick={() => handleClickTab(key)}
          >
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="bottom-actions">
        <div className="round-icon" onClick={onProfileClick}>
          <FaUser />
        </div>
        <div className="round-icon" onClick={handleClickCalendar}>
          <FaCalendarAlt />
        </div>
        <div className="round-icon" onClick={handleClickVoice}>
          <FaMicrophone />
        </div>
      </div>
    </div>
  );
}
