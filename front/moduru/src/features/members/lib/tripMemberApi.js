// src/features/members/lib/tripMemberApi.js
import api from '../../../lib/axios';

/* ------------------- 방 멤버 관련 ------------------- */

// 방 멤버 조회
export async function getTripMembers(roomId) {
  const idNum = Number(roomId);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    console.warn('[getTripMembers] roomId가 올바르지 않습니다:', roomId);
    return { success: false, status: 400, error: '유효한 roomId가 필요합니다.' };
  }
  const url = `/rooms/${idNum}/members`;
  try {
    const res = await api.get(url, { withCredentials: true, useToken: true });

    let list =
      (Array.isArray(res?.data?.members) && res.data.members) ||
      (Array.isArray(res?.data?.data?.members) && res.data.data.members) ||
      (Array.isArray(res?.data) && res.data) ||
      [];

    if (!Array.isArray(list)) list = [];

    const members = list.map((m) => ({
      userId: Number.isFinite(Number(m.userId)) ? Number(m.userId) : null,
      nickname: m.nickname ?? '',
      email: m.email ?? '',
      profileImg: m.profileImg ?? '',
      owner: Boolean(m.owner),
      friend: Boolean(m.friend),
    }));

    return { success: true, members };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    return {
      success: false,
      status,
      error: `멤버 조회 실패(status: ${status})`,
      detail: err?.response?.data ?? null,
    };
  }
}

/* ------------------- 친구 관련 ------------------- */

// 친구 추가
export async function addFriend(friendId) {
  const idNum = Number(friendId);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { success: false, status: 400, error: '유효한 friendId가 필요합니다.' };
  }
  try {
    const res = await api.post('/friends', { friendId: idNum }, { withCredentials: true, useToken: true });
    return {
      success: true,
      status: res?.status ?? 200,
      code: res?.data?.code ?? '',
      message: res?.data?.message ?? '',
      data: res?.data ?? null,
    };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    return { success: false, status, error: `친구 추가 실패(status: ${status})`, detail: err?.response?.data ?? null };
  }
}

// 친구 삭제
export async function removeFriend(friendId) {
  const idNum = Number(friendId);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { success: false, status: 400, error: '유효한 friendId가 필요합니다.' };
  }
  try {
    const res = await api.delete('/friends', {
      data: { friendId: idNum },
      withCredentials: true,
      useToken: true,
    });
    return {
      success: true,
      status: res?.status ?? 200,
      code: res?.data?.code ?? '',
      message: res?.data?.message ?? '',
      data: res?.data ?? null,
    };
  } catch (err) {
    const status = err?.response?.status ?? 0;
    return { success: false, status, error: `친구 삭제 실패(status: ${status})`, detail: err?.response?.data ?? null };
  }
}
