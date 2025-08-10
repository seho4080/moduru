// src/features/auth/lib/authApi.js
// axios 경로
import api from '../../../lib/axios';




// 회원가입
export const signup = async ({
  email,
  password,
  provider = "LOCAL",
  nickname,
  gender,        // "M" | "F"
  birth,         // "YYYY-MM-DD"
  phone,
}) => {
  try {
    const res = await api.post("/users/signup", {
      email,
      password,
      provider,
      nickname,
      gender,
      birth,
      phone,
    });

    if (res.status === 201) {
      return { success: true, data: res.data };
    }
    return { success: true, data: res.data };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 409) {
      return { success: false, code: "EMAIL_DUPLICATED", message: data?.message || "이미 사용 중인 이메일입니다." };
    }
    if (status === 400) {
      return { success: false, code: "BAD_REQUEST", message: data?.message || "요청 형식이 올바르지 않습니다." };
    }
    return { success: false, code: status || "UNKNOWN", message: data?.message || error.message || "회원가입 실패" };
  }
};

// 이메일 인증 코드 전송
export const sendEmailCode = async (email) => {
  try {
    const res = await api.post("/auth/email/send", { email });

    if (res.status === 200) {
      return { success: true, data: res.data };
    }
    return { success: true, data: res.data };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 429) {
      return { success: false, code: "TOO_MANY_REQUESTS", message: data?.message || "요청 제한을 초과했습니다." };
    }
    return { success: false, code: status || "UNKNOWN", message: data?.message || error.message || "이메일 코드 전송 실패" };
  }
};

// 이메일 인증 코드 검증
export const verifyEmailCode = async (email, code) => {
  try {
    const res = await api.post("/auth/email/verify", { email, code });

    if (res.status === 200) {
      return { success: true, data: res.data };
    }
    return { success: true, data: res.data };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 400) {
      return { success: false, code: "INVALID_CODE", message: data?.message || "인증 코드가 올바르지 않습니다." };
    }
    return { success: false, code: status || "UNKNOWN", message: data?.message || error.message || "이메일 코드 검증 실패" };
  }
};


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
