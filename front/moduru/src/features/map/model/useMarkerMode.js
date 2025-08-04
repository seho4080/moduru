/* src/features/map/hooks/useMarkerMode.js */
/* global kakao */
import { useEffect } from 'react';

export default function useMarkerMode({
  mapInstance,
  modeRef,
  removeModeRef,
  markers,
  selected,
  onSelectMarker,
}) {
  useEffect(() => {
    // ✅ 지도 인스턴스가 준비되지 않았다면 실행하지 않음
    const m = mapInstance?.current;
    if (!m) return;

    // ✅ 지도 클릭 시 마커 추가
    const handleClick = (e) => {
      if (removeModeRef.current) return;
      if (modeRef.current !== 'marker') return;

      const marker = new kakao.maps.Marker({ position: e.latLng });
      marker.setMap(m);
      markers.current.push(marker);

      // ✅ 마커 클릭 시 선택/해제 토글
      kakao.maps.event.addListener(marker, 'click', () => {
        if (!removeModeRef.current) return;

        if (selected.current.has(marker)) {
          selected.current.delete(marker);
          marker.setOpacity(1);
        } else {
          selected.current.add(marker);
          marker.setOpacity(0.5);
        }

        // ✅ 외부 상태 업데이트
        onSelectMarker(new Set(selected.current));
      });
    };

    // ✅ 지도에 클릭 이벤트 등록
    kakao.maps.event.addListener(m, 'click', handleClick);

    // ✅ cleanup
    return () => {
      kakao.maps.event.removeListener(m, 'click', handleClick);
    };
  }, [
    mapInstance?.current,  // ✅ mapInstance가 준비된 후에만 실행
    modeRef,
    removeModeRef,
    markers,
    selected,
    onSelectMarker,
  ]);
}
