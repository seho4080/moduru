// src/features/wishPlace/model/useWishToggle.js
import { useDispatch } from 'react-redux';
import { addWishPlace, removeWishPlace } from './wishPlaceSlice';

export const useWishToggle = () => {
  const dispatch = useDispatch();

  const toggleWishPlace = async ({ roomId, placeId, place, wantId }) => {
    const accessToken = localStorage.getItem('accessToken');

    // NOTE: wantId가 존재하면 기존 공유 장소이므로 삭제 요청
    if (wantId) {
      try {
        const response = await fetch(
          `http://localhost:8080/rooms/${roomId}/wants/${wantId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '삭제 실패');
        }

        dispatch(removeWishPlace(wantId));
        return { success: true, type: 'delete' };
      } catch (error) {
        console.error('공유 장소 삭제 실패:', error.message);
        return { success: false, message: error.message };
      }
    }

    // NOTE: wantId가 없으면 새로운 장소 추가 요청
    try {
      const response = await fetch(
        `http://localhost:8080/rooms/${roomId}/wants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ placeId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '추가 실패');
      }

      const result = await response.json();

      const newPlace = {
        ...place,
        wantId: result.wantId || Date.now(),
        isWanted: true,
      };

      dispatch(addWishPlace(newPlace));
      return { success: true, data: newPlace, type: 'add' };
    } catch (error) {
      console.error('공유 장소 추가 실패:', error.message);
      return { success: false, message: error.message };
    }
  };

  return { toggleWishPlace };
};

// src/features/wishPlace/model/useWishToggle.js

export const useAddWishPlace = () => {
  const { toggleWishPlace } = useWishToggle();

  const addWishPlace = async (roomId, place) => {
    return await toggleWishPlace({
      roomId,
      placeId: place.placeId,
      place: place, 
      wantId: null,
    });
  };

  return { addWishPlace };
};

