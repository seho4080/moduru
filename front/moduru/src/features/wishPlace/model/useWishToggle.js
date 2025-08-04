// src/features/wishPlace/model/useWishToggle.js
import { useDispatch } from 'react-redux';
import { addWishPlace, removeWishPlace } from './wishPlaceSlice';

export const useWishToggle = () => {
  const dispatch = useDispatch();

  const toggleWishPlace = async ({ roomId, placeId, place, wantId }) => {
    const accessToken = localStorage.getItem('accessToken');

    // ❌ 삭제 요청
    if (wantId) {
      try {
        const res = await fetch(
          `http://localhost:8080/rooms/${roomId}/wants/${wantId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const errMsg = await res.json();
          throw new Error(errMsg.message || '삭제 실패');
        }

        dispatch(removeWishPlace(wantId));
        return { success: true, type: 'delete' };
      } catch (err) {
        console.error('🚨 희망장소 삭제 오류:', err.message);
        return { success: false, message: err.message };
      }
    }

    // ✅ 추가 요청
    try {
      const res = await fetch(`http://localhost:8080/rooms/${roomId}/wants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ placeId }),
      });

      if (!res.ok) {
        const errMsg = await res.json();
        throw new Error(errMsg.message || '추가 실패');
      }

      const result = await res.json(); // { code, message } 형태

      const fullPlace = {
        ...place,
        wantId: Date.now(), // 서버가 wantId를 안 주는 경우를 대비
        isWanted: true,
      };

      dispatch(addWishPlace(fullPlace));
      return { success: true, data: fullPlace, type: 'add' };
    } catch (err) {
      console.error('🚨 희망장소 추가 오류:', err.message);
      return { success: false, message: err.message };
    }
  };

  return { toggleWishPlace };
};
