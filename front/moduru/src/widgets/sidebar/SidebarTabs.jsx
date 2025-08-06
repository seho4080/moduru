// src/widgets/sidebar/SidebarTabs.js
import React from 'react';
import './SidebarTabs.css';
import logo from '../../assets/moduru-logo.png';
import { FaUser, FaCalendarAlt, FaMicrophone } from 'react-icons/fa';

const SidebarTabs = ({ activeTab, onTabChange, onProfileClick }) => {
  const steps = [
    { key: 'place', step: 'STEP 2', label: '검색' },
    { key: 'pick', step: 'STEP 3', label: 'My 장소' },
    { key: 'schedule', step: 'STEP 4', label: '일정 편집' },
  ];

  const handleExit = () => onTabChange('exit');

  return (
    <div className="custom-sidebar">
      <div className="logo-space">
        <img src={logo} alt="로고" className="logo-img" />
      </div>

      <div className="step-container">
        {steps.map(({ key, label }) => (
          <div
            key={key}
            className={`step-box ${activeTab === key ? 'active' : 'inactive'}`}
            onClick={() => onTabChange(key)}
          >
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="bottom-actions">
        <div className="round-icon" onClick={onProfileClick}>
          <FaUser />
        </div>
        <div className="round-icon" onClick={() => onTabChange('openTripModal')}>
          <FaCalendarAlt />
        </div>
        <div className="round-icon" onClick={() => alert('음성 기능 실행')}>
          <FaMicrophone />
        </div>
      </div>
    </div>
  );
};

export default SidebarTabs;
