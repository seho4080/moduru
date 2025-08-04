// src/features/auth/lib/authApi.js

export const login = async ({ email, password }) => {
  try {
    const res = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || '로그인 실패');
    }

    // NOTE: 이후 인증 요청을 위해 accessToken과 refreshToken을 localStorage에 저장함
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const reissueToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('Refresh Token이 없습니다.');

    const res = await fetch('http://localhost:8080/auth/reissue', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || '토큰 재발급 실패');
    }

    // NOTE: accessToken과 refreshToken을 갱신하여 저장함. 이후 요청에 사용됨
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
