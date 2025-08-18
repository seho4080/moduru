// src/features/map/hooks/useMapInit.js
/* global kakao */
import { useEffect } from 'react';

export default function useMapInit(mapRef, mapInstance, center) {
  useEffect(() => {
    const { kakao } = window;
    if (!kakao?.maps || !mapRef.current) return;

    const latLng = center
      ? new kakao.maps.LatLng(center.lat, center.lng)
      : new kakao.maps.LatLng(33.450701, 126.570667); // fallback: 제주

    const m = new kakao.maps.Map(mapRef.current, {
      center: latLng,
      level: 3,
      draggable: true,
    });

    mapInstance.current = m;
  }, [center]); // ✅ center 변경 시에도 초기화 되도록
}
