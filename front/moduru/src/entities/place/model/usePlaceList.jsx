// src/entities/place/model/usePlaceList.jsx
import { useState, useEffect } from 'react';

// ✅ 탭 이름(한글) → API 코드 매핑
const categoryMap = {
  전체: 'all',
  음식점: 'restaurant',
  카페: 'cafe',
  명소: 'attraction',
  숙소: 'stay',
  축제: 'etc',
};

export const usePlaceList = (roomId, selectedCategory) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!roomId || !selectedCategory) return;

      setLoading(true);

      try {
        const categoryCode = categoryMap[selectedCategory];
        const res = await fetch(
          `http://localhost:8080/places/${roomId}?category=${categoryCode}`
        );

        if (!res.ok) {
          throw new Error(`API 요청 실패 (status ${res.status})`);
        }

        const data = await res.json();
        const rawPlaces = Array.isArray(data.places) ? data.places : [];

        // ✅ 프론트에서 category 기준으로 강제 필터링
        const filteredPlaces =
          categoryCode === 'all'
            ? rawPlaces
            : rawPlaces.filter(
                (place) => place.category?.trim() === selectedCategory
              );

        setPlaces(filteredPlaces);
        console.log(`📍 [${selectedCategory}] 필터링된 장소:`, filteredPlaces);
      } catch (err) {
        console.error('🚨 장소 API 호출 실패:', err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [roomId, selectedCategory]);

  return { places, loading };
};
