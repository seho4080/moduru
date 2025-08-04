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
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken.trim()}`,
      },
    });

    const raw = await res.text();
    if (!res.ok) {
      throw new Error(raw || '토큰 재발급 실패');
    }

    const data = JSON.parse(raw);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    console.log('[accessToken 재발급 성공] 새로운 토큰으로 교체됨');

    return {
      success: true,
      accessToken: data.accessToken,
    };
  } catch (err) {
    console.warn('[accessToken 재발급 실패]', err.message);
    return { success: false, message: err.message };
  }
};
