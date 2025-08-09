// src/features/sharedPlace/model/useSharedToggle.js

import { sendSocketMessage } from "../../webSocket/socket";

/**
 * 공유 장소 토글 함수 (WebSocket 전용)
 * @param {object} place - 공유할 장소 정보 객체
 * @param {number} roomId - 여행방 ID
 * @param {boolean} isAlreadyShared - 이미 공유된 장소인지 여부
 */
export const toggleSharedPlace = async (place, roomId, isAlreadyShared) => {
  try {
    if (!place || !place.placeId) {
      console.warn("place 또는 placeId가 없음:", place);
      return;
    }

    const placeId =
      typeof place.placeId === "object" ? place.placeId.placeId : place.placeId;

    const payload = isAlreadyShared
      ? {
          action: "remove",
          wantId: place.wantId, // 백엔드에서 공유된 장소 응답 시 포함
        }
      : {
          action: "add",
          type: "place",
          id: Number(placeId),
          roomId,
        };

    console.log(
      `[WebSocket] 공유 ${isAlreadyShared ? "취소" : "요청"}`,
      payload
    );

    await sendSocketMessage("place-want", payload); // WebSocket으로 전송
  } catch (error) {
    console.error("WebSocket 공유 처리 실패:", error);
  }
};
