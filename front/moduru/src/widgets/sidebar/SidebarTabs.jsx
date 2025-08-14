import React, { useCallback, useState, useRef, useEffect } from 'react';
import './sidebarTabs.css';
import logo from '../../assets/moduru-logo.png';
import { FaUser, FaCalendarAlt, FaMicrophone } from 'react-icons/fa';
import { useAuth } from '../../shared/model/useAuth';
import UserMenu from './UserMenu';
import { Room, RoomEvent } from 'livekit-client';
import { useSelector } from 'react-redux';
import api from '../../lib/axios';


export default function SidebarTabs({ activeTab, onTabChange, onProfileClick }) {
  const { isLoggedIn } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  // RTC
  const roomRef = useRef(null);
  const [connecting, setConnecting] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const WS_URL = import.meta.env?.VITE_LIVEKIT_WS || 'wss://moduru.co.kr/ws';
  const roomId = useSelector((state) => state.tripRoom.roomId);

  // stats timers
  const voiceStatsSenderRef = useRef(null);
  const voiceStatsReceiverRef = useRef(null);

  // --- 송신 통계 (outbound) ---
  function watchAudioSender(room) {
    try {
      const pcPub = room.engine?.pcManager?.publisher?.peerConnection;
      if (!pcPub) return console.warn('[voice] no publisher pc');
      const sender = pcPub.getSenders().find(s => s.track?.kind === 'audio');
      if (!sender) return console.warn('[voice] no audio sender');

      let last = 0;
      clearInterval(voiceStatsSenderRef.current);
      voiceStatsSenderRef.current = setInterval(async () => {
        const stats = await sender.getStats();
        stats.forEach(r => {
          if (r.type === 'outbound-rtp' && r.kind === 'audio') {
            console.log('[voice] OUT bytesSent:', r.bytesSent, 'packetsSent:', r.packetsSent, 'audioLevel:', r.audioLevel);
            if (last && r.bytesSent === last) console.warn('[voice] OUT not increasing');
            last = r.bytesSent;
          }
        });
      }, 1000);
    } catch (e) {
      console.warn('[voice] watchAudioSender error', e);
    }
  }

  // --- 수신 통계 (inbound) ---
  function watchAudioReceiver(room) {
    try {
      const pcSub = room.engine?.pcManager?.subscriber?.peerConnection;
      if (!pcSub) return console.warn('[voice] no subscriber pc');
      const receiver = pcSub.getReceivers().find(r => r.track?.kind === 'audio');
      if (!receiver) return console.warn('[voice] no audio receiver');

      let last = 0;
      clearInterval(voiceStatsReceiverRef.current);
      voiceStatsReceiverRef.current = setInterval(async () => {
        const stats = await receiver.getStats();
        stats.forEach(r => {
          if (r.type === 'inbound-rtp' && r.kind === 'audio') {
            console.log('[voice] IN  bytesReceived:', r.bytesReceived, 'packetsReceived:', r.packetsReceived, 'jitter:', r.jitter);
            if (last && r.bytesReceived === last) console.warn('[voice] IN no incoming packets');
            last = r.bytesReceived;
          }
        });
      }, 1000);
    } catch (e) {
      console.warn('[voice] watchAudioReceiver error', e);
    }
  }

  // 정리
  const disconnectVoice = useCallback(async () => {
    const r = roomRef.current;
    roomRef.current = null;
    try {
      clearInterval(voiceStatsSenderRef.current);
      clearInterval(voiceStatsReceiverRef.current);

      if (r) {
        try { r?.localParticipant?.tracks?.forEach?.(pub => pub?.track?.stop?.()); } catch {}
        try { await r.disconnect(); } catch {}
        if (typeof r?.release === 'function') {
          try { await r.release(true); } catch {}
        }
      }
    } finally {
      // no-op
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
    if (!roomId) { console.warn('[voice] missing roomId'); return; }

    // 연결됨 → 끊기
    if (voiceConnected) {
      setConnecting(true);
      try { await disconnectVoice(); }
      catch (e) { console.warn('[voice] disconnect err', e); }
      finally { setVoiceConnected(false); setConnecting(false); }
      return;
    }

    // 미연결 → 연결
    setConnecting(true);
    try {
      const { data } = await api.post('/signal/token', { roomId }); // withCredentials 전역 ON
      const { token, wsUrl } = data;
      
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        // autoSubscribe: true, // 필요 시 명시
      });
      roomRef.current = room;

      // 이벤트 로그
      room.on(RoomEvent.Connected, () => console.log('[voice] Room Connected'));
      room.on(RoomEvent.Disconnected, () => console.log('[voice] Room Disconnected'));
      room.on(RoomEvent.ConnectionStateChanged, (state) => console.log('[voice] ConnState', state));
      room.on(RoomEvent.TrackSubscribed, async (track, pub, participant) => {
        console.log('[voice] TrackSubscribed', participant.identity, pub.kind, pub.source);
        if (track.kind === 'audio') {
          try {
            try { await room.startAudio(); } catch {}         // 재생 언락 재시도
            const el = track.attach();                        // 오디오 엘리먼트 부착
            el.autoplay = true;
            el.muted = false;
            el.playsInline = true;
            document.body.appendChild(el);
            await el.play().catch(err => console.warn('[voice] audio play blocked:', err));
            console.log('[voice] remote audio element attached & play() tried');
          } catch (e) {
            console.warn('[voice] attach/play error', e);
          }
        }
      });
      room.on(RoomEvent.TrackMuted, (_pub, p) => console.warn('[voice] Remote track muted by', p.identity));
      room.on(RoomEvent.TrackUnmuted, (_pub, p) => console.log('[voice] Remote track unmuted by', p.identity));

      // 브라우저 오디오 자동재생 정책 해제(가능한 빨리)
      try { await room.startAudio(); } catch (e) { console.warn('[voice] startAudio err (pre-connect)', e); }

      await room.connect(wsUrl ?? WS_URL, token);
      console.log('[voice] connected to room');

      // 마이크 enable (생성 + publish + unmute)
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log('[voice] mic enabled & published');

      // 통계 모니터링
      watchAudioSender(room);
      watchAudioReceiver(room);

      setVoiceConnected(true);
    } catch (e) {
      console.error('[voice] connect error:', e);
      try { await disconnectVoice(); } catch {}
      setVoiceConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    const onBeforeUnload = () => { try { /* best-effort cleanup */ } catch {} };
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
