// src/features/invite/lib/inviteApi.js
import api from '../../../lib/axios';

/**
 * NOTE: 초대 가능한 친구 목록 조회
 * GET /invites/friends/{roomId}
 * - 응답 데이터에서 필요한 필드만 추출해 friends 배열로 반환한다.
 */
export async function getInvitableFriends(roomId) {
  if (!roomId && roomId !== 0) {
    return { success: false, status: 400, error: 'roomId가 필요합니다.' };
  }

  try {
    const res = await api.get(`/invites/friends/${roomId}`, {
      withCredentials: true, // 쿠키 포함
      useToken: true,        // Authorization 헤더에 Bearer 토큰 포함
    });

    const lists = Array.isArray(res.data?.friendLists) ? res.data.friendLists : [];
    const friends = lists.map((f) => ({
      userId: f.userId,
      nickName: f.nickName ?? '',
      email: f.email ?? '',
      alreadyInvited: Boolean(f.alreadyInvited),
    }));

    return { success: true, friends };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    let message = '요청 중 오류가 발생했습니다.';
    if (status === 401) message = '인증 실패(AccessToken 누락/유효하지 않음/만료됨).';
    else if (status === 404) message = '여행방 정보를 찾을 수 없습니다.';
    else if (status === 500) message = '서버 내부 오류입니다.';

    return { success: false, status, error: message, detail: err?.response?.data ?? null };
  }
}

/**
 * NOTE: 초대 링크 생성
 * POST /invites/link?roomId={roomId}
 * - 특정 여행방(roomId)에 참여할 수 있는 초대 링크를 생성한다.
 * - 성공 시 inviteUrl을 반환한다.
 */
export async function createInviteLink(roomId) {
  try {
    const res = await api.post(
      '/invites/link',
      null,
      {
        params: { roomId },
        withCredentials: true,
        useToken: true,
      }
    );

    const inviteUrl = res.data?.inviteUrl;
    if (!inviteUrl) {
      return { success: false, error: '초대 링크가 응답에 포함되지 않음' };
    }

    return { success: true, inviteUrl };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    return {
      success: false,
      status,
      error: `초대 링크 생성 실패 (status: ${status})`,
      detail: err?.response?.data ?? null,
    };
  }
}

/**
 * NOTE: 초대 토큰으로 여행방 참여
 * POST /invites/join?token={token}
 * - 초대 링크에 포함된 token을 사용해 여행방에 참여한다.
 * - 이미 멤버이면 해당 roomId만 반환되고, 신규 참여자는 region 정보도 함께 받을 수 있다.
 */
export async function joinRoomByToken(token) {
  console.log("inviteAPI token",token)
  try {
    const res = await api.post(
      '/invites/join',
      null,
      {
        params: { token },
        withCredentials: true,
        useToken: true,
      }
    );

    const roomId = res.data?.roomId;
    if (!roomId) {
      return { success: false, error: 'roomId가 응답에 포함되지 않음' };
    }
    console.log("region",res.data.region)
    console.log("region",res.data)
    
    return {
      success: true,
      roomId,
      region: res.data?.region ?? null,
    };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    return {
      success: false,
      status,
      error: `참여 실패 (status: ${status})`,
      detail: err?.response?.data ?? null,
    };
  }
}

/**
 * NOTE: 친구 직접 초대
 * POST /invites/invite/friends
 * - 선택한 친구(friendIds)를 여행방(roomId)에 직접 초대한다.
 * - friendIds는 숫자 배열이어야 하며, 빈 배열이면 요청하지 않는다.
 */
export async function inviteFriends(roomId, friendIds) {
  if (!roomId || !Array.isArray(friendIds) || friendIds.length === 0) {
    return { success: false, error: 'roomId 또는 friendIds가 유효하지 않습니다.' };
  }

  try {
    const res = await api.post(
      '/invites/invite/friends',
      { roomId, friendIds },
      { withCredentials: true, useToken: true }
    );
    return { success: true, data: res.data };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    return {
      success: false,
      status,
      error: `친구 초대 실패 (status: ${status})`,
      detail: err?.response?.data ?? null,
    };
  }
}

/**
 * NOTE: 맴버 강퇴
 * DEL /rooms/${roomId}/kick/${targetUserId}
 * - 선택한 맴버를 강퇴한다. 
 * - friendIds는 숫자 배열이어야 하며, 빈 배열이면 요청하지 않는다.
 */
export async function kickMember(roomId, targetUserId) {
  if (!roomId && roomId !== 0) {
    return { success: false, status: 400, error: 'roomId가 필요합니다.' };
  }
  if (typeof targetUserId !== 'number') {
    return { success: false, status: 400, error: 'targetUserId가 필요합니다.' };
  }

  try {
    const res = await api.delete(`/rooms/${roomId}/kick/${targetUserId}`, {
      withCredentials: true,
      useToken: true,
    });
    return { success: true, data: res?.data ?? null };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    let message = '요청 중 오류가 발생했습니다.';
    if (status === 401) message = '인증 실패(AccessToken 누락/유효하지 않음/만료됨).';
    else if (status === 403) message = '권한이 없습니다(방장만 가능).';
    else if (status === 404) message = '사용자 또는 방을 찾을 수 없습니다.';
    else if (status === 409) message = '강퇴 불가한 상태입니다.';
    else if (status === 500) message = '서버 내부 오류입니다.';

    return { success: false, status, error: message, detail: err?.response?.data ?? null };
  }
}