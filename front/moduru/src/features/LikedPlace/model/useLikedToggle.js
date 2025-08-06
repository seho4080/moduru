// src/features/LikedPlace/model/useLikedToggle.js
import { useDispatch, useSelector } from 'react-redux';
import { toggleLike } from './likedPlaceSlice';

export default function useLikedToggle() {
  const dispatch = useDispatch();
  const likedPlaceIds = useSelector(state => state.likedPlace.likedPlaceIds);

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
        throw new Error(`서버 좋아요 ${isLiked ? '취소' : '등록'} 실패`);
      }

      dispatch(toggleLike(placeId));
    } catch (err) {
      console.error('좋아요 토글 실패:', err);
    }
  };

  return { toggleLikedPlace };
}
