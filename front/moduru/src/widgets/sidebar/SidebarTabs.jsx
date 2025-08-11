import React, { useCallback, useState, useRef, useEffect } from 'react';
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

  // RTC 관련
  const roomRef = useRef(null);
  const [connecting, setConnecting] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const WS_URL = import.meta.env?.VITE_LIVEKIT_WS || 'wss://moduru.co.kr/ws';
  const roomId = useSelector((state) => state.tripRoom.roomId);

  // ✅ 서버 알림 제거: 로컬 정리만 수행
  const disconnectVoice = useCallback(async () => {
    const r = roomRef.current;
    roomRef.current = null;

    try {
      if (r) {
        try { r?.localParticipant?.tracks?.forEach?.((pub) => pub?.track?.stop?.()); } catch {}
        try { await r.disconnect(); } catch {}
        if (typeof r?.release === 'function') {
          try { await r.release(true); } catch {}
        }
      }
    } finally {
      // no-op: 서버 통지 없음 (웹훅이 소스 오브 트루스)
    }
  }, []);

  const tabList = [
    { key: 'place', label: '검색' },
    { key: 'shared', label: '공유 장소' },
    { key: 'schedule', label: '일정 편집' },
  ];

  const handleClickTab = (tabKey) => onTabChange(tabKey);
  const handleClickCalendar = () => onTabChange('openTripModal');

  const handleClickVoice = async () => {
    if (connecting) return;
    if (!roomId) {
      console.warn('[voice] missing roomId');
      return;
    }

    // 연결됨 → 끊기
    if (voiceConnected) {
      setConnecting(true);
      try {
        await disconnectVoice(); // ✅ 서버 알림 없음
      } catch (e) {
        console.warn('[voice] disconnect err', e);
      } finally {
        setVoiceConnected(false);
        setConnecting(false);
      }
      return;
    }

    // 미연결 → 연결
    setConnecting(true);
    try {
      const res = await fetch('/api/signal/token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) throw new Error(`token failed: ${res.status}`);
      const { token, wsUrl } = await res.json();

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      await room.connect(wsUrl ?? WS_URL, token);

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
      try { await disconnectVoice(); } catch {}
      setVoiceConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  // ✅ 언마운트/탭 종료 시 로컬 정리만
  useEffect(() => {
    const onBeforeUnload = () => {
      try { /* 베스트에форт: sync 정리 */ } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      disconnectVoice();
    };
  }, [disconnectVoice]);

  const handleClickProfile = () => {
    if (!isLoggedIn) onProfileClick();
    else setShowDropdown((prev) => !prev);
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
      ) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

        <div
          className="round-icon"
          onClick={handleClickVoice}
          title={voiceConnected ? '끊기' : '음성 연결'}
        >
          <FaMicrophone />
        </div>
      </div>
    </div>
  );
}