// src/features/sharedPlace/model/useAddSharedPlace.js

import { useSharedToggle } from "./useSharedToggle";

/**
 * 공유 장소 추가 로직을 담당하는 Hook
 */
export const useAddSharedPlace = () => {
  const { toggleSharedPlace } = useSharedToggle();

  /**
   * 공유 장소 추가 처리
   * @param {object} params
   * @param {number} params.roomId - 여행방 ID
   * @param {number} params.placeId - 장소 ID
   */
  const addSharedPlace = async ({ roomId, placeId }) => {
    const result = await toggleSharedPlace({ roomId, placeId });
    return result;
  };

  return { addSharedPlace };
};
