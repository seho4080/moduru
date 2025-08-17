// 초대 토큰 임시 보관/소비 유틸
const KEY = 'pendingInviteToken';

export const setPendingInviteToken = (t) => {
  try {
    if (typeof t === 'string' && t.length) localStorage.setItem(KEY, t);
  } catch {}
};

export const consumePendingInviteToken = () => {
  try {
    const t = localStorage.getItem(KEY);
    if (t) localStorage.removeItem(KEY);
    return t || null;
  } catch {
    return null;
  }
};

