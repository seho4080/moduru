// src/shared/api/tripRoomApi.js
import { reissueToken } from '../../auth/lib/authApi';

/**
 * 공통 fetch wrapper
 * - Access Token이 만료되었을 때 자동 재발급 시도
 * - 쿠키 인증 방식 지원 (credentials: 'include')
 */
export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('accessToken');

  let res = await fetch(url, {
    ...options,
    credentials: 'include', // 쿠키 기반 인증 필수
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const contentType = res.headers.get('content-type');
    let errorBody = '';

    try {
      if (contentType?.includes('application/json')) {
        const json = await res.json();
        errorBody = JSON.stringify(json);
      } else {
        errorBody = await res.text();
      }
    } catch (err) {
      errorBody = '응답 파싱 실패';
    }

    const shouldReissue =
      errorBody.includes('Access Token') || errorBody.includes('access token');

    if (!shouldReissue) {
      throw new Error(`401 에러 발생 (재발급 조건 불충족): ${errorBody}`);
    }

    const result = await reissueToken();
    if (!result.success) {
      throw new Error('토큰 만료. 다시 로그인 해주세요.');
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
  const url = 'http://localhost:8080/rooms';

  const res = await fetchWithAuth(url, {
    method: 'POST',
    credentials: 'include', // 직접 호출 시도 시에도 필수
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`여행방 생성 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    return data.travelRoomId;
  } catch (err) {
    throw new Error('응답 파싱 실패');
  }
}

/**
 * 여행 방 정보 조회
 * - GET /rooms/{roomId}
 */
export async function getTripRoomInfo(roomId) {
  const url = `http://localhost:8080/rooms/${roomId}`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
    credentials: 'include',
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`여행방 정보 조회 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    return data;
  } catch (err) {
    throw new Error('응답 파싱 실패');
  }
}

/**
 * 여행 방 정보 수정 (제목, 지역, 날짜)
 * - PATCH /rooms/{roomId}/update
 */
export async function updateTripRoomRegion(roomId, { title, region, startDate, endDate }) {
  const url = `http://localhost:8080/rooms/${roomId}/update`;
  const bodyData = { title, region, startDate, endDate };

  const res = await fetchWithAuth(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`지역 업데이트 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    return data;
  } catch (err) {
    throw new Error('응답 파싱 실패');
  }
}
