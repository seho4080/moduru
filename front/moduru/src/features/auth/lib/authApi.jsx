// src/features/auth/lib/authApi.js
// axios 경로
import api from '../../../lib/axios';

// 로그인
export const login = async ({ email, password }) => {
  try {
    const res = await api.post('/auth/login', { email, password }, {
      withCredentials: true,   // 쿠키만
      useToken: false          // (기본 false라 생략 가능)
    });
    
    console.log(api.defaults.baseURL, api.defaults.withCredentials);
    console.log(res.data); // 응답 데이터 확인

    // axios는 res.ok 없음 → status로 확인
    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.data?.message || '로그인 실패');
    }

    // 응답에서 필요한 값 꺼내서 반환
    return { success: true, user: res.data.user ?? null, tokens: res.data };
  } catch (err) {
    console.error('로그인 실패:', err.response?.data || err.message);
    return { 
      success: false, 
      message: err.response?.data?.message || err.message 
    };
  }
};

// 토큰 재발급
export const reissueToken = async () => {
  try {
    const res = await api.post('/auth/reissue', null, { withCredentials: true });


    console.log('토큰 재발급 응답:', res.data);

    return {
      success: true,
      accessToken: res.data.accessToken, // 필요 시만 사용
    };
  } catch (err) {
    console.error(
      '토큰 재발급 실패:',
      err.response?.data || err.message
    );
    return {
      success: false,
      message: err.response?.data?.message || err.message,
    };
  }
};

// 로그아웃
export const logout = async () => {
  try {
    const res = await api.post('/auth/logout', {}, { withCredentials: true });

    console.log('로그아웃 응답:', res.data);

    return { success: true };
  } catch (err) {
    console.error('로그아웃 실패:', err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || err.message,
    };
  }
};
