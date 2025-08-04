import { useState, useRef, useEffect } from 'react';
import { Room, createLocalAudioTrack } from 'livekit-client';

export default function App() {
  // 🔗 연결 상태 플래그
  const [connected, setConnected] = useState(false);

  // 💾 Room 인스턴스를 유지하기 위한 ref
  const roomRef = useRef(null);

  // 💡 테스트용 identity (랜덤 생성)
  const [identity] = useState(() => 'user-' + Math.floor(Math.random() * 1000));

  // ⛵︎ 실제 사용할 room 이름 (DB와 일치시켜야 함)
  const ROOM_NAME = 'trip-jeju';

  // ▶︎ 방 참여 및 토큰 발급 + LiveKit 연결
  const joinRoom = async () => {
    try {
      console.log('🔄 서버에 토큰 요청 중...');
      // 1) Node.js 백엔드에서 LiveKit JWT 토큰 받아오기
      const res = await fetch(
        `http://localhost:3001/get-token?identity=${identity}&room=${ROOM_NAME}`
      );
      if (!res.ok) throw new Error('토큰 요청 실패');
      const { token } = await res.json();
      console.log('🎟️ 받은 토큰:', token.slice(0,20) + '...');

      // 2) LiveKit Room 인스턴스 생성
      const room = new Room({
        adaptiveStream: true,    // 뷰포트 최적화
        autoSubscribe: true,     // 자동 구독
      });
      roomRef.current = room;

      // 3) 핵심 이벤트 바인딩
      room.on('participantConnected', p =>
        console.log(`✅ 참가자 연결됨: ${p.identity}`)
      );
      room.on('participantDisconnected', p =>
        console.log(`❌ 참가자 퇴장: ${p.identity}`)
      );
      room.on('disconnected', reason => {
        console.warn('🔌 연결 끊김. 이유:', reason);
        setConnected(false);
      });
      room.on('reconnecting', () =>
        console.log('♻️ 재접속 시도 중...')
      );
      room.on('reconnected', () =>
        console.log('🔄 재접속 성공!')
      );

      // 4) LiveKit 서버에 WebSocket 연결
      console.log('🔗 LiveKit 서버에 연결 시도...');
      await room.connect('ws://localhost:7880', token, {
        autoReconnect: true,
        rtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // TURN 서버가 있으면 여기에 추가
          ],
        },
      });
      console.log('✅ LiveKit 연결 성공');

      // 5) 로컬 오디오 트랙 생성 및 publish
      const audioTrack = await createLocalAudioTrack({
        stopMicTrackOnMute: false,
        noiseSuppression: false,
        echoCancellation: false,
        autoGainControl: false,
      });
      const el = audioTrack.attach(); // <audio> 요소 생성
      document.body.appendChild(el);
      await room.localParticipant.publishTrack(audioTrack);
      console.log('🎙️ 오디오 트랙 전송 시작');

      // 6) 연결 완료 표시
      setConnected(true);
    } catch (e) {
      console.error('❗ 연결 에러:', e);
    }
  };

  // ▶︎ 방 나가기 (수동 종료) 버튼 핸들러
  const leaveRoom = () => {
    if (roomRef.current) {
      console.log('🚪 수동으로 연결 해제');
      roomRef.current.disconnect();
      document.querySelectorAll('audio').forEach(a => a.remove());
      setConnected(false);

      // LiveKit Webhook 핸들러에 그대로 던져주기
      fetch('http://localhost:3001/webhook/livekit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'participant_left',
          room: { name: ROOM_NAME },
          participant: { identity },
          timestamp: Math.floor(Date.now() / 1000),
        }),
      })
      .then(res => {
        if (!res.ok) throw new Error('Webhook 호출 실패');
        console.log('[CLIENT] webhook “participant_left” 전송 완료');
      })
      .catch(console.error);
    }
  };

  // ▶︎ 컴포넌트 언마운트 시에도 clean-up
  useEffect(() => {
    return () => {
      if (roomRef.current && connected) {
        roomRef.current.disconnect();
      }
    };
  }, [connected]);

  return (
    <div style={{ padding: 20 }}>
      <h1>🎧 LiveKit 음성 그룹콜 테스트</h1>
      <p>
        <strong>Identity:</strong> {identity}<br/>
        <strong>Room:</strong> {ROOM_NAME}
      </p>

      {/* 연결 상태에 따라 버튼 토글 */}
      {!connected ? (
        <button onClick={joinRoom}>
          🔌 연결하기
        </button>
      ) : (
        <button onClick={leaveRoom}>
          ❌ 연결 끊기
        </button>
      )}
    </div>
  );
}
