// src/features/room/lib/roomApi.jsx
import api from "../../../lib/axios";

/**
 * 로그인한 유저의 여행방 목록을 조회
 */
export const getUserTravelRooms = async () => {
  try {
    const res = await api.get("/users/travel-rooms");

    if (res.status !== 200) {
      throw new Error(`여행방 목록 조회 실패 (status: ${res.status})`);
    }

    // 응답 데이터가 배열인지 확인 후 반환
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    throw new Error(err.message || "여행방 목록 조회 중 오류 발생");
  }
};
