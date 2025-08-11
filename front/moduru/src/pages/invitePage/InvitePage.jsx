// src/pages/invitePage/InvitePage.jsx

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../shared/model/useAuth';
import { joinRoomByToken } from '../../features/invite/lib/inviteApi';

export default function InvitePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const tryJoin = async () => {
      if (!isLoggedIn) {
        // NOTE: 로그인 안 된 경우 → TripRoomPage로 이동 + 로그인 모달 띄우기
        navigate(`/trip-room/unknown?from=invite&token=${inviteToken}`);
        return;
      }

      const result = await joinRoomByToken(inviteToken);

      if (result.success) {
        const roomId = result.roomId;
        const region = result.region;

        // NOTE: region도 함께 쿼리로 넘김
        navigate(`/trip-room/${roomId}?from=invite&region=${region}`);
      } else {
        alert(result.error || '초대 참여 실패');
        navigate('/');
      }
    };

    tryJoin();
  }, [inviteToken, isLoggedIn, navigate]);

  return <div>초대 처리 중...</div>;
}
