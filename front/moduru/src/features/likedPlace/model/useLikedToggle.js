// src/features/likedPlace/model/useLikedToggle.js

import { useDispatch } from 'react-redux';
import { reissueToken } from '../../auth/lib/authApi';

export default function useLikedToggle() {
  const dispatch = useDispatch();

  const toggleLikedPlace = async (place) => {
    if (!place || !place.placeId) {
      console.error('잘못된 place 전달됨:', place);
      return;
    }

    const { placeId, placeName, category } = place;
    let accessToken = localStorage.getItem('accessToken');

    const request = async (token) => {
      return await fetch(`http://localhost:8080/my-places/${placeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
    };

    try {
      let res = await request(accessToken);

      if (res.status === 401) {
        const reissue = await reissueToken();
        if (!reissue.success) throw new Error('토큰 재발급 실패');

        accessToken = reissue.accessToken;
        res = await request(accessToken);
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error('서버 응답 상태:', res.status);
        console.error('서버 응답 내용:', errText);
        throw new Error('좋아요 요청 실패');
      }

      const result = await res.json();

      console.log({
        장소명: placeName,
        카테고리: category,
        상태: result.message.includes('등록') ? '좋아요 등록' : '좋아요 취소',
        응답: result.message,
      });

      // NOTE: 서버 동기화 목적의 요청이므로, Redux 상태는 외부에서 처리함
    } catch (err) {
      console.error('좋아요 토글 실패:', err.message);
    }
  };

  return { toggleLikedPlace };
}
