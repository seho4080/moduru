import React, { useState, useRef, useEffect } from 'react';
import './sidebarTabs.css';
import logo from '../../assets/moduru-logo.png';
import { FaUser, FaCalendarAlt, FaMicrophone } from 'react-icons/fa';
import { useAuth } from '../../shared/model/useAuth';
import UserMenu from './UserMenu';

export default function SidebarTabs({ activeTab, onTabChange, onProfileClick }) {
  const { userId } = useAuth();  // userId를 가져옴
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

const handleClickVoice = async (roomId) => {
  // userId를 사용
  if (!userId) {
    console.log('사용자 ID가 없습니다.');
    return;
  }
  // 토글: 연결되어 있으면 끊기
  if (voiceConnected) {
    try {
      roomRef.current?.disconnect();
    } finally {
      roomRef.current = null;
      setVoiceConnected(false);
    }
    return;
  }

  try {
    // 토큰 받기 (백엔드에서 쿠키로 JWT 토큰이 포함됨)
    const res = await fetch(`/api/livekit/token?roomId=${roomId}&userId=${userId}`, {
      method: 'POST',
      credentials: 'include',  // 쿠키를 자동으로 포함
    });

    if (!res.ok) throw new Error('token api failed');
    const data = await res.json();  // 서버에서 받은 JSON 응답
    const token = data.token;  // 서버에서 받은 JWT 토큰
    // const token = await res.text();  // 토큰은 쿠키로 보내지므로 이 부분이 필요 없을 수 있음.

    // Room 생성 및 연결
    const room = new Room({ adaptiveStream: true, autoSubscribe: true });
    roomRef.current = room;

    await room.connect(WS_URL, token);  // 서버에서 보내는 토큰이 쿠키에 포함되므로, 기본적으로 쿠키가 사용될 것

    // 로컬 마이크 publish
    const mic = await createLocalAudioTrack({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
    await room.localParticipant.publishTrack(mic);

    setVoiceConnected(true);
  } catch (e) {
    console.error('[voice] connect error:', e);
    // 실패 시 잔여 리소스 정리
    try { roomRef.current?.disconnect(); } catch {}
    roomRef.current = null;
    setVoiceConnected(false);
    }
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
        {/* 연결 상태에 따라 active 클래스 토글 */}
        <div className={`round-icon ${voiceConnected ? 'active' : ''}`} onClick={handleClickVoice}>
          <FaMicrophone />
        </div>
      </div>
    </div>
  );
}