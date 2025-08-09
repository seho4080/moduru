import { fetchWithAuth } from "../../tripCreate/lib/tripRoomApi";

/**
 * 로그인한 유저의 여행방 목록을 조회
 */
export const getUserTravelRooms = async () => {
  const url = "http://localhost:8080/users/travel-rooms";

  const res = await fetchWithAuth(url, {
    method: "GET",
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`여행방 목록 조회 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error("응답 파싱 실패");
  }
};
