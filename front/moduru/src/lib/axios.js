// src/lib/axios.js
import axios from "axios";
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
  withCredentials: true, // ✅ 전역 쿠키 전송 (쿠키 인증 기본값)
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
      const token = localStorage.getItem("accessToken");
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



const refreshClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

async function reissueToken() {
  console.log('[REISSUE] /auth/reissue call');
  const res = await refreshClient.post('/auth/reissue', null, { withCredentials: true });
  // 바디에 accessToken이 오면 필요할 때만 저장(혼용 전략일 때)
  if (res?.data?.accessToken) localStorage.setItem('accessToken', res.data.accessToken);
  console.log('토큰 재발급 응답:', res.status, res.data);
  return { success: res.status >= 200 && res.status < 300 ,accessToken: res?.data?.accessToken,};
}
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
  // 📌 정상 응답은 그대로 반환
  (res) => res,
  
  // 📌 에러 응답 처리
  async (error) => {
    const { response, config } = error;
    const status = response?.status || 0;
    console.warn('[AXIOS-INT]', error.config?.method?.toUpperCase(), error.config?.url, '→', error.response?.status);
    /**
     * 🔒 재시도 불가 조건
     *
     * 1) config 자체가 없으면 (요청이 없거나 네트워크 취소)
     * 2) 이미 _retry 플래그가 true면 (무한루프 방지)
     * 3) 요청 URL이 /auth/reissue면 (재발급 호출 자체에서 또 재발급 안 함)
     */
    const isReissueCall = (config?.url || '').includes('/auth/reissue');
    if (!config || config._retry || isReissueCall) {
      return Promise.reject(error);
    }

    /**
     * 🛠 403을 '인증 없음' 케이스로 간주하는 조건
     *
     * - 보통 Access Token 부재/만료 시 401을 내려야 하지만,
     *   현재 백엔드가 403을 내려서 재발급 로직이 안 타는 상황을 대비
     *
     * - 다음 조건 중 하나라도 맞으면 403을 '인증 없음'으로 처리:
     *   1) 응답 데이터 code 값이 'ACCESS_TOKEN_REQUIRED'
     *   2) 응답 메시지에 '권한' 문구 포함 (ex: "권한 부족(403): 접근 권한 확인 필요")
     *   3) WWW-Authenticate 헤더에 Bearer 포함 (토큰 기반 인증임을 의미)
     */

    // ✅ 임시: 401 이거나 403 이면 1회 재발급 시도 (RBAC 403도 1번만 시도 후 종료)
    const shouldReissue = (status === 401 || status === 403) && !isReissueCall;
    if (shouldReissue) {
      config._retry = true; // 무한루프 방지 플래그 설정
      try {
        /**
         * 🔄 토큰 재발급 요청
         * - reissueToken 내부에서 withCredentials:true로 쿠키를 포함해야 함
         * - 성공 시 { success: true } 형태로 반환된다고 가정
         */
        const r = await reissueToken();

        if (r?.success) {
          // 💡 쿠키 기반 인증이면 Authorization 헤더를 갱신할 필요 없음
          //    (HttpOnly 쿠키는 자동으로 요청에 포함됨)
          //    만약 Bearer 토큰 방식이면 여기서 config.headers.Authorization 갱신 필요
          config.withCredentials = true;
          if (config.headers?.Authorization) { // 혹시 이전에 붙인 게 있으면 제거
            delete config.headers.Authorization;
          }
          // 원래 요청을 재시도
          return api(config);
        }
      } catch (e) {
        // 재발급 중 예외 발생 → 그대로 실패 처리
        /* no-op */
      }
    }

    // 📌 재발급 불가/조건 불충족 → 그대로 에러 반환
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
