import { reissueToken } from "../../auth/lib/authApi";

export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("accessToken");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const contentType = res.headers.get("content-type");
    let errorBody = "";

    try {
      if (contentType && contentType.includes("application/json")) {
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

    // NOTE: 재발급 받은 토큰으로 요청을 다시 시도
    token = result.accessToken;
    res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
}

export async function createTripRoom() {
  const url = "http://localhost:8080/rooms";

  const res = await fetchWithAuth(url, {
    method: "POST",
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`여행방 생성 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    return data.travelRoomId;
  } catch (err) {
    throw new Error("응답 파싱 실패");
  }
}

export async function getTripRoomInfo(roomId) {
  const url = `http://localhost:8080/rooms/${roomId}`;

  const res = await fetchWithAuth(url, {
    method: "GET",
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`여행방 정보 조회 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    return data;
  } catch (err) {
    throw new Error("응답 파싱 실패");
  }
}

export async function updateTripRoomRegion(
  roomId,
  { title, region, startDate, endDate }
) {
  const url = `http://localhost:8080/rooms/${roomId}/update`;
  const bodyData = { title, region, startDate, endDate };

  const res = await fetchWithAuth(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
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
    throw new Error("응답 파싱 실패");
  }
}
