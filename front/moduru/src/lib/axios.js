// src/lib/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // 쿠키 기본 전송
});

/** ── Helpers ─────────────────────────────────────────── */
function hasRefreshCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("refresh_token="));
}

// 백엔드가 내려주는 "만료" 신호를 최대한 보수적으로 판정
function isAccessExpired(response) {
  const code = response?.data?.code || response?.headers?.["x-error-code"];
  if (code === "TOKEN_EXPIRED") return true;
  // WWW-Authenticate: Bearer ... error="invalid_token"
  const www = response?.headers?.["www-authenticate"] || "";
  if (www.toLowerCase().includes("invalid_token")) return true;

  // (임시) 백엔드가 아직 코드 구분 안 되면 401만 만료로 간주
  return response?.status === 401;
}

// reissue 자체는 별도 클라이언트 (쿠키 기반)
const refreshClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let waitQueue = []; // {resolve, reject}

/** 쿠키 기반 재발급 */
async function reissueToken() {
  try {
    const res = await refreshClient.post("/auth/reissue", null, {
      withCredentials: true,
    });
    const access = res?.data?.accessToken;
    if (access) localStorage.setItem("accessToken", access);
    return { ok: res.status >= 200 && res.status < 300, access };
  } catch (e) {
    return { ok: false };
  }
}

/** ── Request 인터셉터 (그대로) ───────────────────────── */
api.interceptors.request.use(
  (config) => {
    if (config.useToken) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** ── Response 인터셉터 (핵심 교체) ───────────────────── */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    const status = response?.status ?? 0;
    const url = config?.url || "";

    console.warn("[AXIOS-INT]", config?.method?.toUpperCase(), url, "→", status);

    // 재시도 금지 조건
    if (!config || config._retry) return Promise.reject(error);
    if (url.includes("/auth/reissue")) return Promise.reject(error);

    // 인증/가입 과정의 공개 엔드포인트는 재발급 대상 아님
    const authOpen =
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/register") ||
      url.startsWith("/auth/email/") ||
      url.startsWith("/auth/verify") ||
      url.startsWith("/auth/has-refresh");

    if (authOpen) return Promise.reject(error);

    // 여기서부터 "만료로 판단되는 401" + "refresh 쿠키가 있을 때만" 재발급
    const expired = isAccessExpired(response);
    if (!(expired && hasRefreshCookie())) {
      return Promise.reject(error);
    }

    // 동시 재발급 방지: in-flight에 합류
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject });
      })
        .then((newAccess) => {
          // 쿠키 기반이면 Authorization이 필요 없을 수 있음
          if (newAccess) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${newAccess}`;
          } else {
            // 혹시 이전에 붙여둔 Authorization 제거 (쿠키만으로 가는 정책일 때)
            if (config.headers?.Authorization) delete config.headers.Authorization;
          }
          config._retry = true;
          return api(config);
        })
        .catch((e) => Promise.reject(e));
    }

    isRefreshing = true;
    try {
      const r = await reissueToken();
      // 대기중인 요청들 깨우기
      waitQueue.forEach((p) => (r.ok ? p.resolve(r.access) : p.reject(error)));
      waitQueue = [];
      isRefreshing = false;

      if (!r.ok) {
        // 재발급 실패 → 강제 로그아웃/초기화 필요 시 여기서 처리
        // store.dispatch(logout());
        return Promise.reject(error);
      }

      // 원요청 재시도
      if (r.access) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${r.access}`;
      } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      config._retry = true;
      return api(config);
    } catch (e) {
      waitQueue.forEach((p) => p.reject(e));
      waitQueue = [];
      isRefreshing = false;
      return Promise.reject(e);
    }
  }
);

export default api;
