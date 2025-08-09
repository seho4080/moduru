// src/lib/axios.js
import axios from "axios";

// 공통 Axios 인스턴스 생성
const instance = axios.create({
  baseURL: "http://localhost:8080", // 백엔드 API 기본 주소
  withCredentials: true, // 쿠키 자동 포함
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 (토큰 삽입 필요 없음 — 쿠키로 인증)
instance.interceptors.request.use(
  (config) => {
    // 요청 전에 필요한 설정 추가 가능 (예: 로딩 상태 등)
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (에러 처리 공통화 가능)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 🔐 인증 오류 발생 시 처리 예시
    if (status === 401 || status === 403) {
      console.warn("🔐 인증 오류 발생. 로그인 필요.");
      // TODO: 여기서 logout 처리 or 로그인 페이지 이동 로직 추가 가능
      // 예: window.location.href = "/login";
    }

    console.error("❌ Axios 응답 에러:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default instance;
