// src/features/tripCreate/lib/tripRoomApi.js
import { reissueToken } from '../../auth/lib/authApi';

// NOTE: 인증 토큰이 만료되었을 경우를 대비해, 401 응답 시 토큰을 재발급받고 재시도함
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('accessToken');

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const result = await reissueToken();
    if (!result.success) {
      throw new Error('토큰 만료. 다시 로그인 해주세요.');
    }

    token = localStorage.getItem('accessToken');
    return await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
}

// NOTE: 새로운 여행방을 생성함. 서버 응답은 travelRoomId를 포함
export async function createTripRoom() {
  const url = 'http://localhost:8080/rooms';

  const res = await fetchWithAuth(url, {
    method: 'POST',
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

// NOTE: 여행방 ID를 기반으로 상세 정보를 조회함
export async function getTripRoomInfo(roomId) {
  const url = `http://localhost:8080/rooms/${roomId}`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
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

// NOTE: 여행방 지역/제목/날짜 등의 정보를 업데이트함
export async function updateTripRoomRegion(roomId, { title, region, startDate, endDate }) {
  const url = `http://localhost:8080/rooms/${roomId}/update`;
  const bodyData = { title, region, startDate, endDate };

  const res = await fetchWithAuth(url, {
    method: 'PATCH',
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
