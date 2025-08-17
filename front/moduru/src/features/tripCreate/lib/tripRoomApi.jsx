// src/features/tripCreate/lib/tripRoomApi.jsx
import api from "../../../lib/axios";

/** 여행 방 생성: POST /rooms */
export async function createTripRoom() {
  const res = await api.post("/rooms");
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`여행방 생성 실패 (status: ${res.status})`);
  }
  return res.data?.travelRoomId; // TravelRoomCreateResponseDto { travelRoomId }
}

/** 여행 방 정보 조회: GET /rooms/{roomId} */
export async function getTripRoomInfo(roomId) {
  if (!roomId) throw new Error("roomId가 필요합니다.");
  const res = await api.get(`/rooms/${roomId}`);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`여행방 정보 조회 실패 (status: ${res.status})`);
  }
  return res.data; // TravelRoomResponseDto
}

/** 여행 방 정보 조회 (모달용): GET /rooms/{roomId}/info */
export async function getTripRoomInfoForModal(roomId) {
  if (!roomId) throw new Error("roomId가 필요합니다.");
  const res = await api.get(`/rooms/${roomId}/info`);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`여행방 정보 조회 실패 (status: ${res.status})`);
  }
  return res.data; // TravelRoomResponseDto
}

/**
 * 여행 방 정보 수정: PATCH /rooms/{roomId}/update
 * payload: { title?: string, region?: string, startDate?: string, endDate?: string }
 */
export async function updateTripRoomRegion(roomId, payload) {
  if (!roomId) throw new Error("roomId가 필요합니다.");
  const res = await api.patch(`/rooms/${roomId}/update`, payload);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`여행방 수정 실패 (status: ${res.status})`);
  }
  return res.data; // TravelRoomResponseDto
}
