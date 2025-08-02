export async function login({ email, password }) {
  try {
    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '로그인 실패');
    }

    // ✅ 응답 데이터 콘솔에 출력
    console.log('[로그인 성공]', data);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}