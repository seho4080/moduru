import React, { useState, useRef, useEffect } from 'react';
import './sidebarTabs.css';
import logo from '../../assets/moduru-logo.png';
import { FaUser, FaCalendarAlt, FaMicrophone } from 'react-icons/fa';
import { useAuth } from '../../shared/model/useAuth';
import UserMenu from './UserMenu';
import { Room, createLocalAudioTrack } from 'livekit-client';
import { useSelector } from 'react-redux';

export default function SidebarTabs({ activeTab, onTabChange, onProfileClick }) {
  const { isLoggedIn, userId } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  
  // RTC서버 관련
  const roomRef = useRef(null);       
  const [connecting, setConnecting] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const WS_URL = import.meta.env?.VITE_LIVEKIT_WS || 'wss://moduru.co.kr/ws'; // Nginx와 동일 location
  const roomId = useSelector((state) => state.tripRoom.roomId); // room_id redux에서 가져옴
  console.log('[RTC] roomId=', roomId, 'userId=', userId);
  const tabList = [
    { key: 'place', label: '검색' },
    { key: 'shared', label: '공유 장소' },
    { key: 'schedule', label: '일정 편집' },
  ];
  

  const handleClickTab = (tabKey) => {
    onTabChange(tabKey);
  };

  const handleClickCalendar = () => {
    onTabChange('openTripModal');
  };

  const handleClickVoice = async () => {
    alert('음성 기능 실행');
    console.log('[RTC] roomId=', roomId, 'userId=', userId);
    if (connecting) return; // 더블클릭 방지
    // 토글: 연결되어 있으면 끊기
    if (voiceConnected) {
      setConnecting(true);
      try {
        const r = roomRef.current;
        roomRef.current = null;
        if (r) {
          r.localParticipant.tracks.forEach((pub) => pub.track?.stop());
          await r.disconnect();
          // @ts-ignore (버전에 따라 있음)
          if (typeof r.release === 'function') await r.release(true);
        }
      } catch (e) {
        console.warn('[voice] disconnect err', e);
      } finally {
        setVoiceConnected(false);
        setConnecting(false);
      }
      return;
    }
    
    if (!roomId) {                                     // ✅ 가드
      console.warn('[voice] missing roomId');
      return;
    }


    setConnecting(true);
    try {
      // ✅ 네가 만든 노드 시그널링 서버로부터 토큰 받기
      //    만약 기존 엔드포인트가 /api/livekit/token 이면 그걸로 교체
      const res = await fetch('/api/signal/token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) throw new Error(`token failed: ${res.status}`);
      const { token, wsUrl } = await res.json();

      // Room 생성 및 연결
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      await room.connect(wsUrl ?? WS_URL, token);
      
      // 로컬 마이크 publish
      const mic = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      await room.localParticipant.publishTrack(mic);
      try { await room.startAudio(); } catch {}

      setVoiceConnected(true);
    } catch (e) {
      console.error('[voice] connect error:', e);
      // 실패 시 정리
      try {
        const r = roomRef.current;
        roomRef.current = null;
        if (r) {
          r.localParticipant.tracks.forEach((pub) => pub.track?.stop());
          await r.disconnect();
          // @ts-ignore
          if (typeof r.release === 'function') await r.release(true);
        }
      } catch {}
      setVoiceConnected(false);
    } finally {
      setConnecting(false);
    }
  };
  // 언마운트 시 정리 ✅
  useEffect(() => {
    return () => {
      const r = roomRef.current;
      roomRef.current = null;
      if (r) {
        try {
          r.localParticipant.tracks.forEach((pub) => pub.track?.stop());
          r.disconnect();
          // optional: if (typeof r.release === 'function') r.release(true);
        } catch {}
      }
    };
  }, []);

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

        <div className="round-icon" onClick={handleClickVoice} title={voiceConnected ? '끊기' : '음성 연결'}>
          <FaMicrophone />
        </div>
      </div>
    </div>
  );
}