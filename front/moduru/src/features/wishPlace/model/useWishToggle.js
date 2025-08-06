// src/features/wishPlace/model/useWishToggle.js
import { useDispatch } from 'react-redux';
import { addWishPlace } from '../../../redux/slices/wishPlaceSlice';

export const useWishToggle = () => {
  const dispatch = useDispatch();

  const toggleWishPlace = async ({ roomId, placeId, place }) => {
    const accessToken = localStorage.getItem('accessToken');

    try {
      const response = await fetch(
        `http://localhost:8080/rooms/${roomId}/wants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include', // ✅ 쿠키 인증 추가
          body: JSON.stringify({
            placeId: Number(placeId), // ✅ 반드시 숫자로
          }),
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

export const useAddWishPlace = () => {
  const { toggleWishPlace } = useWishToggle();

  const addWishPlace = async (roomId, placeId) => {
    return await toggleWishPlace({
      roomId,
      placeId,
      place: { placeId },
    });
  };

  return { addWishPlace };
};
