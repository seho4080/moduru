// src/features/likedPlace/model/useLikedToggle.js
import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../lib/axios";
import {
  toggleLike,
  selectLikedPlaceIds,
} from "../../../redux/slices/likedPlaceSlice";

export default function useLikedToggle() {
  const dispatch = useDispatch();
  const likedIds = useSelector(selectLikedPlaceIds);
  const inFlight = useRef(new Set()); // 중복 클릭 방지

  const isLiked = useCallback(
    (placeId) => likedIds.includes(Number(placeId)),
    [likedIds]
  );

  const toggleLikedPlace = useCallback(
    async (place) => {
      const id = Number(place?.placeId ?? place?.id);
      if (!Number.isFinite(id) || inFlight.current.has(id)) return false;

      inFlight.current.add(id);
      const wasLiked = isLiked(id);

      // 1) 낙관적 업데이트
      dispatch(toggleLike(place));

      try {
        // 2) 서버 토글
        const res = await api.post(`/my-places/${id}`, null, {
          withCredentials: true,
        });
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

        // 3) 성공 → 그대로 유지
        return true;
      } catch (err) {
        // 4) 실패 → 롤백
        dispatch(toggleLike(place));
        console.error("좋아요 토글 실패:", err);
        return false;
      } finally {
        inFlight.current.delete(id);
      }
    },
    [dispatch, isLiked]
  );

  return { isLiked, toggleLikedPlace };
}
