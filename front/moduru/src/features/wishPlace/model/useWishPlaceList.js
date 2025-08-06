// src/features/wishPlace/model/useWishPlaceList.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setWishPlaces } from './wishPlaceSlice';

export default function useWishPlaceList(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchWishPlaces = async () => {
      try {
        const res = await fetch(`http://localhost:8080/rooms/${roomId}/wants`, {
          credentials: 'include',
        });

        const data = await res.json();
        console.log('[🔄 희망 장소 리스트]', data);
        dispatch(setWishPlaces(data.placesWant));
      } catch (err) {
        console.error('🚨 전체 희망 장소 조회 실패:', err);
      }
    };

    if (roomId) fetchWishPlaces();
  }, [roomId, dispatch]);
}
