import { useState, useEffect } from 'react';

// NOTE: 서버에서 허용하는 카테고리 매핑
const categoryMap = {
  전체: 'all',
  음식점: 'restaurant',
  명소: 'spot',
  축제: 'festival',
};

export const usePlaceSearch = (roomId, selectedCategory) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!roomId || !selectedCategory) return;

      setLoading(true);

      try {
        const accessToken = localStorage.getItem('accessToken');
        const categoryCode = categoryMap[selectedCategory];
        const url = `http://localhost:8080/places/${roomId}?category=${categoryCode}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // ✅ 쿠키 인증을 위해 필수
        });

        const raw = await res.text();
        console.log('[응답 상태]', res.status);
        console.log('[응답 원문]', raw);

        if (res.status === 404) {
          console.warn('해당 카테고리에 매핑된 장소가 없습니다.');
          setPlaces([]);
          return;
        }

        if (!res.ok) {
          throw new Error(`API 요청 실패 (status ${res.status})`);
        }

        const data = JSON.parse(raw);
        const rawPlaces = Array.isArray(data.places) ? data.places : [];

        const filteredPlaces =
          categoryCode === 'all'
            ? rawPlaces
            : rawPlaces.filter(
                (place) => place.category?.trim() === selectedCategory
              );

        setPlaces(filteredPlaces);
      } catch (err) {
        console.error('장소 API 호출 실패:', err.message);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [roomId, selectedCategory]);

  return { places, loading };
};
