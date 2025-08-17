// src/features/sharedPlace/model/useRemoveSharedPlace.js
import { useDispatch } from "react-redux";
import { removeSharedPlace } from "../../../redux/slices/sharedPlaceSlice";
import { sendSharedPlaceRemove } from "../../sharedPlace/lib/sharedPlaceSocket"; // ← 여기 유지

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
      if (optimistic) dispatch(removeSharedPlace(wantId));
      // 코어 소켓 기반 래퍼 호출
      sendSharedPlaceRemove({ roomId, wantId: Number(wantId) });
      return { success: true };
    } catch (error) {
      const message = error?.message || "공유 장소 삭제 중 오류 발생";
      console.error("공유 장소 삭제 실패:", message);
      return { success: false, message };
    }
  };

  return { removeSharedPlace: removeByWantId };
};
