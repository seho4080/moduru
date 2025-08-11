import { fetchWithAuth } from "../../tripCreate/lib/tripRoomApi";
import api from '../../../lib/axios';

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

// export const getUserTravelRooms = async () => {
//   try {
//     const res = await api.get("/users/travel-rooms", {
//       withCredentials: true, // 쿠키 포함
//       useToken: true,        // 토큰 필요 시
//     });

//     // axios는 자동으로 JSON 파싱
//     return Array.isArray(res.data) ? res.data : [];
//   } catch (err) {
//     const status = err.response?.status;
//     const message =
//       err.response?.data?.message ||
//       err.message ||
//       `여행방 목록 조회 실패 (status: ${status || "unknown"})`;
//     throw new Error(message);
//   }
// };