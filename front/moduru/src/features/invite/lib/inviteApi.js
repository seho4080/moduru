// src/features/invite/lib/inviteApi.js
const base = import.meta.env.VITE_API_BASE;
// 초대 링크 생성
export async function createInviteLink(roomId) {
  try {
    const response = await fetch(`${base}/invites/link?roomId=${roomId}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`초대 링크 생성 실패 (status: ${response.status})`);
    }

    const data = await response.json();

    if (!data.inviteUrl) {
      throw new Error('초대 링크가 응답에 포함되지 않음');
    }

    return {
      success: true,
      inviteUrl: data.inviteUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 초대 토큰을 통한 여행방 참여
export async function joinRoomByToken(token) {
  try {
    const response = await fetch(`${base}/invites/join?token=${token}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`참여 실패 (status: ${response.status})`);
    }

    const data = await response.json();

    if (!data.roomId) {
      throw new Error('roomId가 응답에 포함되지 않음');
    }

    return {
      success: true,
      roomId: data.roomId,
      region: data.region, // ✅ region 포함
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
