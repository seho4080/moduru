import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setWishPlaces } from './wishPlaceSlice';

export default function useWishPlaceList(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    const fetchWishPlaces = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/rooms/${roomId}/wants`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error(`요청 실패: ${response.status}`);
        }

        const result = await response.json();
        dispatch(setWishPlaces(result.placesWant));
      } catch (error) {
        console.error('전체 희망 장소 조회 실패:', error);
      }
    };

    fetchWishPlaces();
  }, [roomId, dispatch]);
}
