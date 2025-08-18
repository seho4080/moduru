// src/features/map/lib/pinApi.js

import api from "@/lib/axios";

/**
 * 특정 방의 공유된 핀 목록을 조회합니다.
 * @param {number} roomId - 여행방 ID
 * @returns {Promise<Array>} - 핀 객체 배열 반환
 */
export const fetchSharedPlaces = async (roomId) => {
  try {
    const response = await api.get(`/rooms/${roomId}/shared-places`);
    return response.data;
  } catch (error) {
    console.error("공유된 장소 목록 조회 실패:", error);
    throw error;
  }
};

/**
 * 특정 핀(wantId)을 제거 요청합니다.
 * @param {number} roomId - 여행방 ID
 * @param {number} wantId - 제거할 핀 ID
 */
export const deleteSharedPlace = async (roomId, wantId) => {
  try {
    await api.delete(`/rooms/${roomId}/shared-places/${wantId}`);
  } catch (error) {
    console.error("공유 장소 제거 실패:", error);
    throw error;
  }
};
