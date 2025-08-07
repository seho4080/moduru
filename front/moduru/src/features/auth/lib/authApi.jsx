// src/features/auth/lib/authApi.js
const base = import.meta.env.VITE_API_BASE;
// 로그인
export const login = async ({ email, password }) => {
  console.log("API_BASE:", base);
  try {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ 쿠키 포함
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    console.log('로그인 응답:', data);

    if (!res.ok) {
      throw new Error(data.message || '로그인 실패');
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error('로그인 실패:', err.message);
    return { success: false, message: err.message };
  }
};

// 토큰 재발급
export const reissueToken = async () => {
  try {
    const res = await fetch(`${base}/auth/reissue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
    });

    const raw = await res.text();

    console.log('토큰 재발급 응답 RAW:', raw);

    if (!res.ok) {
      throw new Error(raw || '토큰 재발급 실패');
    }

    const data = JSON.parse(raw);

    return {
      success: true,
      accessToken: data.accessToken, // NOTE: 필요 없을 수도 있음
    };
  } catch (err) {
    console.error('토큰 재발급 실패:', err.message);
    return { success: false, message: err.message };
  }
};

// 로그아웃
export const logout = async () => {
  try {
    const res = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const raw = await res.text();

    console.log('로그아웃 응답 RAW:', raw);

    if (!res.ok) {
      throw new Error(raw || '로그아웃 실패');
    }

    return { success: true };
  } catch (err) {
    console.error('로그아웃 실패:', err.message);
    return { success: false, message: err.message };
  }
};
