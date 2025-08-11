// src/features/invite/lib/inviteApi.js
import api from '../../../lib/axios';

// 초대 링크 생성
export async function createInviteLink(roomId) {
  try {
    const res = await api.post('/invites/link', null, {
      params: { roomId },      // ?roomId=...
      withCredentials: true,   // 쿠키 기반 인증
      // useToken: true,       // 토큰 필요하면 주석 해제
    });

    if (!res.data?.inviteUrl) {
      throw new Error('초대 링크가 응답에 포함되지 않음');
    }

    return {
      success: true,
      inviteUrl: res.data.inviteUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.message || err.message,
    };
  }
}

// 초대 토큰을 통한 여행방 참여
export async function joinRoomByToken(token) {
  try {
    const res = await api.post('/invites/join', null, {
      params: { token },        // ?token=...
      withCredentials: true,    // 쿠키 인증 필요
      // useToken: true,        // 토큰 필요하면 켜기
    });

    if (!res.data?.roomId) {
      throw new Error('roomId가 응답에 포함되지 않음');
    }

    return {
      success: true,
      roomId: res.data.roomId,
      region: res.data.region, // ✅ region 포함
    };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.message || err.message,
    };
  }
}
