// src/lib/axios.js
import axios from 'axios';
// ⬇️ 토큰 재발급 API (쿠키 기반으로 동작해야 함: withCredentials:true)
// import { reissueToken } from '@/features/auth/lib/authApi'; // 경로는 프로젝트에 맞게

/**
 * 공통 Axios 인스턴스
 *
 * - baseURL: '/api' (Nginx/Vite 프록시 전제)
 * - 기본은 쿠키를 안 보냄(withCredentials:false) → "요청별"로 선택해서 켬
 * - 토큰 사용도 "요청별"로 선택 (config.useToken === true 인 경우만 Authorization 헤더 주입)
 *
 * 사용 예)
 *  - 쿠키만: api.get('/me', { withCredentials: true })
 *  - 토큰만: api.get('/secure', { useToken: true })
 *  - 둘 다 : api.post('/both', data, { withCredentials: true, useToken: true })
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false, // ✅ 기본은 쿠키 미포함(요청별로 켜기)
});

/**
 * 요청 인터셉터
 *
 * 목적:
 *  1) 요청별 옵션으로 토큰을 "선택적"으로 붙인다. (config.useToken)
 *  2) 쿠키는 axios 표준옵션인 withCredentials 로 요청마다 켠다. (기본 false)
 *
 * 주의:
 *  - Authorization 헤더는 "필요한 요청"에만 넣는다. (백엔드 정책에 따라 쿠키/토큰 혼용)
 *  - headers 객체가 없을 수 있으니 항상 보장해준다.
 */
api.interceptors.request.use(
  (config) => {
    // 커스텀 플래그(useToken)가 true면 로컬 저장 토큰을 Authorization에 주입
    if (config.useToken) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // ⚠️ 여기서 withCredentials를 강제하지 않음.
    //     각 호출부에서 { withCredentials:true }로 "요청별" 선택.
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 응답 인터셉터
 *
 * 목적:
 *  1) 401(Unauthorized) 발생 시 Access Token 만료로 판단되면 "자동 재발급" 수행
 *  2) 재발급 성공 시 원래 요청을 토큰 갱신하여 "1회 재시도"
 *
 * 구현 포인트:
 *  - 무한루프 방지: originalRequest._retry 플래그로 재시도 1회 제한
 *  - 재발급 요청(/auth/reissue) 자체에서 또 401 나면 중단
 *  - reissueToken은 "쿠키 기반" 호출이어야 하므로 withCredentials:true 필요
 *
 * 보안/정책 참고:
 *  - 403(Forbidden)은 권한문제이므로 보통 재발급 대상이 아님 → 여기서는 로그만 남김
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    // 원요청 정보가 없거나(취소/네트워크) 재시도 플래그가 이미 켜져 있으면 패스
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 재발급 엔드포인트에서 401이 반복되면 루프에 빠질 수 있으니 즉시 중단
    const isReissueCall =
      typeof originalRequest.url === 'string' &&
      originalRequest.url.includes('/auth/reissue');

    // 401만 재발급 시도 대상 (403은 권한 문제로 보통 재발급과 무관)
    if (status === 401 && !isReissueCall) {
      originalRequest._retry = true; // 🔒 재시도 1회 제한

      try {
        // ⬇️ 토큰 재발급: 백엔드가 "쿠키"를 보고 새 accessToken을 내려줘야 함
        //    구현 예시) const result = await reissueToken();
        //    반드시 withCredentials:true로 호출되도록 reissueToken 내부에 옵션 포함 필요
        const result = await reissueToken(); // <-- 실제 import 필요

        if (result?.success && result.accessToken) {
          // 새 토큰 저장
          localStorage.setItem('accessToken', result.accessToken);

          // 원요청에 새 토큰 주입 후 재시도
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;

          // 원요청의 쿠키 사용 여부(withCredentials)는 원래 값 유지
          return api(originalRequest);
        }

        // 재발급 실패: 로그인 화면 등으로 유도(프로덕트 정책에 맞춰 처리)
        console.warn('토큰 재발급 실패 → 로그인 필요');
        // window.location.href = '/login';
        return Promise.reject(error);
      } catch (e) {
        // 재발급 도중 예외 발생: 동일하게 사용자 흐름 정리
        console.warn('토큰 재발급 예외 → 로그인 필요');
        return Promise.reject(e);
      }
    }

    // 그 외 에러는 그대로 전달 (필요 시 공통 로깅)
    if (status === 403) {
      console.warn('권한 부족(403): 접근 권한 확인 필요');
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * ─────────────────────────────────────────────────────────
 * 사용 예시
 * ─────────────────────────────────────────────────────────
 *
 * // 1) 쿠키만(세션 기반)
 * await api.get('/auth/me', { withCredentials: true });
 *
 * // 2) 토큰만(JWT 기반)
 * await api.get('/secure/data', { useToken: true });
 *
 * // 3) 둘 다(백엔드가 둘 다 확인하는 정책)
 * await api.post('/rooms', {}, { withCredentials: true, useToken: true });
 *
 * // 4) GET + 쿼리스트링
 * await api.get('/rooms/search', {
 *   params: { q: '서울', page: 1 },
 *   withCredentials: true, // 필요 시
 *   useToken: true         // 필요 시
 * });
//  *
//  * ─────────────────────────────────────────────────────────
//  * TypeScript 사용 시 팁
//  * ─────────────────────────────────────────────────────────
//  * declare module 'axios' {
//  *   export interface AxiosRequestConfig {
//  *     useToken?: boolean; // 커스텀 플래그 타입 확장
//  *   }
//  * }
//  */
