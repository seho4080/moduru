// src/features/wishPlace/model/useWishToggle.js
import { useDispatch } from 'react-redux';
import { addWishPlace, removeWishPlace } from './wishPlaceSlice';

export const useWishToggle = () => {
  const dispatch = useDispatch();

  const toggleWishPlace = async ({ roomId, placeId, place, wantId }) => {
    const accessToken = localStorage.getItem('accessToken');

    // NOTE: wantId가 있으면 이미 공유된 장소이므로 삭제 요청
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
          const errorResult = await response.json();
          throw new Error(errorResult.message || '삭제 실패');
        }

        dispatch(removeWishPlace(wantId));
        return { success: true, type: 'delete' };
      } catch (error) {
        console.error('희망 장소 삭제 실패:', error.message);
        return { success: false, message: error.message };
      }
    }

    // NOTE: wantId가 없으면 새로 공유하는 장소이므로 추가 요청
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
        const errorResult = await response.json();
        throw new Error(errorResult.message || '추가 실패');
      }

      const result = await response.json();

      const newPlace = {
        ...place,
        wantId: Date.now(), // NOTE: 서버에서 wantId를 주지 않는 경우 대비
        isWanted: true,
      };

      dispatch(addWishPlace(newPlace));
      return { success: true, data: newPlace, type: 'add' };
    } catch (error) {
      console.error('희망 장소 추가 실패:', error.message);
      return { success: false, message: error.message };
    }
  };

  return { toggleWishPlace };
};
