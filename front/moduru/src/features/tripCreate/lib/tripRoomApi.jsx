// src/shared/api/tripRoomApi.js
import { reissueToken } from '../../auth/lib/authApi';
import api from '../../../lib/axios';
/**
 * 공통 fetch wrapper
 * - Access Token이 만료되었을 때 자동 재발급 시도
 * - 쿠키 인증 방식 지원 (credentials: 'include')
 */
export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("accessToken");

  let res = await fetch(url, {
    ...options,
    credentials: 'include', // 쿠키 기반 인증 필수
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const contentType = res.headers.get("content-type");
    let errorBody = "";

    try {
      if (contentType?.includes('application/json')) {
        const json = await res.json();
        errorBody = JSON.stringify(json);
      } else {
        errorBody = await res.text();
      }
    } catch (err) {
      errorBody = "응답 파싱 실패";
    }

    const shouldReissue =
      errorBody.includes("Access Token") || errorBody.includes("access token");

    if (!shouldReissue) {
      throw new Error(`401 에러 발생 (재발급 조건 불충족): ${errorBody}`);
    }

    const result = await reissueToken();
    if (!result.success) {
      throw new Error("토큰 만료. 다시 로그인 해주세요.");
    }

    token = result.accessToken;
    console.log('[fetchWithAuth] accessToken 재적용 후 재요청', token);

    res = await fetch(url, {
      ...options,
      credentials: 'include', // 다시 한 번 명시
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
}

/**
 * 여행 방 생성 API 호출
 * - POST /rooms
 */
export async function createTripRoom() {
  try {
    const res = await api.post('/rooms', null, { withCredentials: true }); 
    // axios는 body 없으면 null로 전달 가능, credentials는 여기서 켬

    return res.data.travelRoomId;
  } catch (err) {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.message ||
      `여행방 생성 실패 (status: ${status || 'unknown'})`;
    throw new Error(message);
  }
}

/**
 * 여행 방 정보 조회
 * - GET /rooms/{roomId}
 */
export async function getTripRoomInfo(roomId) {
  try {
    const res = await api.get(`/rooms/${roomId}`, {
      withCredentials: true // 쿠키 기반 인증 필요 시
    });
    return res.data; // axios 자동 JSON 파싱
  } catch (err) {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.message ||
      `여행방 정보 조회 실패 (status: ${status || 'unknown'})`;
    throw new Error(message);
  }
}

/**
 * 여행 방 정보 수정 (제목, 지역, 날짜)
 * - PATCH /rooms/{roomId}/update
 */
export async function updateTripRoomRegion(
  roomId,
  { title, region, startDate, endDate }
) {
  try {
    const res = await api.patch(
      `/rooms/${roomId}/update`,
      { title, region, startDate, endDate },
      { withCredentials: true } // 쿠키 인증 필요 시
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.message ||
      `지역 업데이트 실패 (status: ${status || 'unknown'})`;
    throw new Error(message);
  }
}

