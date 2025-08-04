/* src/features/map/hooks/useMapInit.js */
/* global kakao */
import { useEffect } from 'react';

export default function useMapInit(mapRef, mapInstance) {
  useEffect(() => {
    const { kakao } = window;
    if (!kakao?.maps) return;

    const m = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(33.450701, 126.570667),
      level: 3,
      draggable: true,
    });

    mapInstance.current = m;
  }, []);
}
