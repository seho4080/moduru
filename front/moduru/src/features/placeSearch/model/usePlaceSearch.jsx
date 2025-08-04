import { useState, useEffect } from 'react';

const categoryMap = {
  전체: 'all',
  음식점: 'restaurant',
  명소: 'spot',
  축제: 'festival',
};

// NOTE: 여행방 ID와 선택된 카테고리를 기반으로 장소 목록을 불러오고, 필요 시 필터링함
export const usePlaceSearch = (roomId, selectedCategory) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!roomId || !selectedCategory) return;

      setLoading(true);

      try {
        const categoryCode = categoryMap[selectedCategory];
        const url = `http://localhost:8080/places/${roomId}?category=${categoryCode}`;
        console.log(`[GET] 장소 목록 요청: ${url}`);

        const res = await fetch(url);
        const raw = await res.text();
        console.log(`[응답 상태] ${res.status}`);
        console.log(`[응답 원문]`, raw);

        // NOTE: 서버에서 해당 카테고리 데이터가 없는 경우 빈 배열 처리
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

        // NOTE: 전체 보기인 경우 그대로, 특정 카테고리는 필터링 적용
        const filteredPlaces =
          categoryCode === 'all'
            ? rawPlaces
            : rawPlaces.filter(
                (place) => place.category?.trim() === selectedCategory
              );

        setPlaces(filteredPlaces);
        console.log(`[${selectedCategory}] 필터링된 장소 수:`, filteredPlaces.length);
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
