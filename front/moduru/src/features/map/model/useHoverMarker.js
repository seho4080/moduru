/* src/features/map/hooks/useHoverMarker.js */
/* global kakao */
import { useEffect } from 'react';

export default function useHoverMarker({ mapInstance, hoveredCoords, hoverMarkerRef }) {
  useEffect(() => {
    if (!mapInstance || !mapInstance.current || !hoverMarkerRef) return;

    const m = mapInstance.current;

    // 이전 hover 마커 제거
    if (hoverMarkerRef.current) {
      hoverMarkerRef.current.setMap(null);
      hoverMarkerRef.current = null;
    }

    // 새 hover 마커 생성
    if (hoveredCoords) {
      const { lat, lng } = hoveredCoords;

      // ✅ 위도 경도 콘솔 출력
      console.log(`[Hover 마커 좌표] 위도: ${lat}, 경도: ${lng}`);

      const pos = new kakao.maps.LatLng(lat, lng);

      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
      const imageSize = new kakao.maps.Size(24, 35);
      const imageOption = { offset: new kakao.maps.Point(12, 35) };
      const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

      const marker = new kakao.maps.Marker({
        position: pos,
        image: markerImage,
        clickable: false,
        zIndex: 1000,
      });

      marker.setMap(m);
      hoverMarkerRef.current = marker;
    }
  }, [hoveredCoords, mapInstance, hoverMarkerRef]);
}
