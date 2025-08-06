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

    // ✅ 토큰 저장
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    console.log('[🟢 로그인 응답]', data);
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
