// 로그인
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

    console.log('로그인 응답:', data);

    if (!res.ok) {
      throw new Error(data.message || '로그인 실패');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return { success: true, user: data.user };
  } catch (err) {
    console.error('로그인 실패:', err.message);
    return { success: false, message: err.message };
  }
};

// 토큰 재발급
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

    console.log('토큰 재발급 응답 RAW:', raw);

    if (!res.ok) {
      throw new Error(raw || '토큰 재발급 실패');
    }

    const data = JSON.parse(raw);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return {
      success: true,
      accessToken: data.accessToken,
    };
  } catch (err) {
    console.error('토큰 재발급 실패:', err.message);
    return { success: false, message: err.message };
  }
};

// 로그아웃
export const logout = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error('Access Token이 없습니다.');

    const res = await fetch('http://localhost:8080/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });

    const raw = await res.text();

    console.log('로그아웃 응답 RAW:', raw);

    if (!res.ok) {
      throw new Error(raw || '로그아웃 실패');
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    return { success: true };
  } catch (err) {
    console.error('로그아웃 실패:', err.message);
    return { success: false, message: err.message };
  }
};
