import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setWishPlaces } from './wishPlaceSlice';
import api from '../../../lib/axios';

export default function useWishPlaceList(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    const fetchWishPlaces = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}/wants`, {
          withCredentials: true, // 쿠키 인증
          // useToken: true, // 필요 시 토큰 인증
        });

        dispatch(setWishPlaces(res.data.placesWant || []));
      } catch (err) {
        console.error(
          '전체 희망 장소 조회 실패:',
          err.response?.data?.message || err.message
        );
      }
    };

    fetchWishPlaces();
  }, [roomId, dispatch]);
}
