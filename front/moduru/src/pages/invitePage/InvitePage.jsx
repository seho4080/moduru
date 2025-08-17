// src/pages/invitePage/InvitePage.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../shared/model/useAuth';
import { joinRoomByToken } from '../../features/invite/lib/inviteApi';
import { setPendingInviteToken, consumePendingInviteToken } from '../../features/invite/model/pendingInvite';
import LoginForm from '../../features/auth/ui/LoginForm';
import api from '../../lib/axios';
import { setTripRoom } from '../../redux/slices/tripRoomSlice';    // ✅ 추가
import { fetchTripMembers } from '../../redux/slices/tripMemberSlice'; // ✅ 추가
import { useDispatch } from 'react-redux';                         // ✅ 추가

export default function InvitePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const dispatch = useDispatch();                                  // ✅ 추가
  const [showLogin, setShowLogin] = useState(false);
  const runningRef = useRef(false);   // join 중복 호출 가드
  const promptedRef = useRef(false);  // 모달 중복 오픈 가드

  // 공통: 초대 참여 시도
const attemptJoin = async (token) => {
  console.log('[attemptJoin] called with token:', token);
  if (!token) {
    console.warn('[attemptJoin] no token, abort.');
    return;
  }
  if (runningRef.current) {
    console.warn('[attemptJoin] already running, skip.');
    return;
  }

  runningRef.current = true;
  try {
    const r = await joinRoomByToken(token);
    console.log('[joinRoomByToken] resp:', r);

    if (r?.success) {
      // 방 상세 조회
      let detail;
      try {
        const res = await api.get(`/rooms/${r.roomId}`, {
          withCredentials: true,
          useToken: true,
        });
        // 백엔드가 data/data.data/members 등으로 감싸는 경우 대비
        detail = res?.data ?? {};
      } catch (e) {
        console.error('[rooms/{id}] request failed:', e);
        alert('방 정보를 불러오지 못했습니다.');
        return;
      }

      const payload = {
        roomId: detail.travelRoomId ?? null,
        title: detail.title ?? '',
        region: detail.region ?? '',
        startDate: detail.startDate?.slice(0, 10) ?? '',
        endDate: detail.endDate?.slice(0, 10) ?? '',
      };
      console.log("방정보",payload)
      dispatch(setTripRoom(payload));
      if (payload.roomId != null) {
          dispatch(fetchTripMembers(payload.roomId));
      }
      window.__afterJoin = { t: Date.now(), note: 'before navigate' };
      navigate(`/trip-room/${payload.roomId}`, {
        replace: true,
        state: { from: 'invite', token, region: payload.region || null }, // ✅ 상세값 사용
      });
      return;
    }

    // 상태코드별 분기
    const status = r?.status;
    if (status === 401 || status === 403) {
      setPendingInviteToken(token);
      promptedRef.current = false;
      setShowLogin(true);
      return;
    }
    if (status === 404 || status === 410) {
      navigate(`/trip-room/unknown?from=invite&token=${token}`, { replace: true });
      return;
    }

    alert(r?.error ?? '초대 참여에 실패했습니다.');
    navigate('/', { replace: true });
      } catch (err) {
        console.error('[attemptJoin] unexpected error', err);
        alert('오류가 발생했습니다.');
      } finally {
        runningRef.current = false;
      }
  };

  // 초기 진입/상태 변동 처리
  useEffect(() => {
    if (!inviteToken) {
      navigate('/', { replace: true });
      return;
    }
    if (runningRef.current) return;

    // A) 비로그인 → 토큰 저장 + 로그인 모달 1회 오픈
    if (!isLoggedIn) {
      setPendingInviteToken(inviteToken);
      if (!promptedRef.current) {
        promptedRef.current = true;
        setShowLogin(true);
      }
      return;
    }

    // B) 로그인 상태 → 즉시 합류 시도 (URL 토큰 우선, 없으면 보류 토큰)
    const token = inviteToken || consumePendingInviteToken();
    attemptJoin(token);
  }, [inviteToken, isLoggedIn, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // 모달 닫기
  const handleClose = () => {
    setShowLogin(false);
    navigate('/', { replace: true });
  };

  // 로그인 성공 → 보류 토큰으로 재시도
  const handleSuccess = async () => {
    setShowLogin(false);
    const token = consumePendingInviteToken() || inviteToken;
    await attemptJoin(token);
  };

  return (
    <>
      {showLogin && <LoginForm onClose={handleClose} onSuccess={handleSuccess} />}
    </>
  );
}
