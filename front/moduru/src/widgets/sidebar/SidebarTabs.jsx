import React, { useState, useRef, useEffect } from 'react';
import './sidebarTabs.css';
import logo from '../../assets/moduru-logo.png';
import { FaUser, FaCalendarAlt, FaMicrophone } from 'react-icons/fa';
import { useAuth } from '../../shared/model/useAuth';
import UserMenu from './UserMenu';

export default function SidebarTabs({ activeTab, onTabChange, onProfileClick }) {
  const { isLoggedIn } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const tabList = [
    { key: 'place', label: '검색' },
    { key: 'pick', label: 'My 장소' },
    { key: 'schedule', label: '일정 편집' },
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

  const handleClickProfile = () => {
    if (!isLoggedIn) {
      onProfileClick();
    } else {
      setShowDropdown((prev) => !prev);
    }
  };

  const handleLogout = () => {
    setShowDropdown(false);
    console.log('[로그아웃]');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !profileRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="profile-wrapper" ref={profileRef}>
          <div className="round-icon" onClick={handleClickProfile}>
            <FaUser />
          </div>

          {showDropdown && isLoggedIn && (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <UserMenu
                onLogout={handleLogout}
                onMyPage={() => {
                  onTabChange('mypage');
                  setShowDropdown(false);
                }}
              />
            </div>
          )}
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