// src/features/sharedPlace/model/useRemoveSharedPlace.js

import { useDispatch } from "react-redux";
import { removeSharedPlace } from "../../../redux/slices/sharedPlaceSlice";
import { sendSocketMessage } from "../../webSocket/socket";

/**
 * 공유 장소 삭제 Hook (WebSocket 전송)
 * - 기본은 낙관적(optimistic) 업데이트: 즉시 Redux에서 제거 후 소켓 전송
 * - 실패 시 간단히 로그만 남김 (필요하면 롤백 로직 추가 가능)
 */
export const useRemoveSharedPlace = (options = { optimistic: true }) => {
  const dispatch = useDispatch();
  const { optimistic } = options;

  const removeByWantId = async (roomId, wantId) => {
    if (!roomId || !wantId) {
      const message = "roomId 또는 wantId가 누락되었습니다.";
      console.error(message);
      return { success: false, message };
    }

    try {
      // 낙관적 업데이트
      if (optimistic) {
        dispatch(removeSharedPlace(wantId));
      }

      // WebSocket 제거 메시지 전송
      sendSocketMessage({
        roomId,
        handler: "place-want",
        action: "remove",
        wantId: Number(wantId),
      });

      return { success: true };
    } catch (error) {
      const message = error?.message || "공유 장소 삭제 중 오류 발생";
      console.error("공유 장소 삭제 실패:", message);

      // 낙관적 업데이트를 롤백하려면 여기서 이전 상태 복구 로직을 추가
      return { success: false, message };
    }
  };

  return { removeSharedPlace: removeByWantId };
};

// import api from "@/lib/axios";

// try {
//   await api.delete(`/rooms/${roomId}/shared-places/${wantId}`);
//   dispatch(removeSharedPlace(wantId));
//   return { success: true };
// } catch (error) {
//   const message = error.response?.data?.message || "공유 장소 삭제 중 오류 발생";
//   console.error("공유 장소 삭제 실패:", message);
//   return { success: false, message };
// }
