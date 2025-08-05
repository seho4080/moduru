// src/features/LikedPlace/model/useLikedToggle.js
import { useDispatch, useSelector } from 'react-redux';
import { toggleLike } from './likedPlaceSlice';

export default function useLikedToggle() {
  const dispatch = useDispatch();
  const likedPlaceIds = useSelector((state) => state.likedPlace.likedPlaceIds);

  // NOTE: 이미 좋아요한 장소인지 판단하고, 서버에 반영 후 전역 상태 업데이트
  const toggleLikedPlace = async (placeId) => {
    const isLiked = likedPlaceIds.includes(placeId);

    try {
      const res = await fetch(
        `http://localhost:8080/places/like/${placeId}`,
        {
          method: isLiked ? 'DELETE' : 'POST',
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error(`좋아요 ${isLiked ? '취소' : '등록'} 실패`);
      }

      dispatch(toggleLike(placeId));
    } catch (err) {
      console.error('좋아요 토글 요청 실패:', err);
    }
  };

  return { toggleLikedPlace };
}
