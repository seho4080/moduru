// src/features/map/hooks/useMarkerMode.js
/* global kakao */
import { useEffect } from 'react';

export default function useMarkerMode({
  mapInstance,
  modeRef,
  removeModeRef,
  markers,
  selected,
  onSelectMarker,
  onPinPlaced,
}) {
  useEffect(() => {
    const m = mapInstance?.current;
    if (!m) return;

    const handleClick = (e) => {
      if (removeModeRef.current) return;
      if (modeRef.current !== 'marker') return;

      const marker = new kakao.maps.Marker({ position: e.latLng });
      marker.setMap(m);
      markers.current.push(marker);

      if (!marker.__selectHandlerBound) {
        const selectHandler = () => {
          if (!removeModeRef.current) return;
          if (selected.current.has(marker)) {
            selected.current.delete(marker);
            marker.setOpacity(1);
          } else {
            selected.current.add(marker);
            marker.setOpacity(0.5);
          }
          onSelectMarker?.(new Set(selected.current));
        };
        kakao.maps.event.addListener(marker, 'click', selectHandler);
        marker.__selectHandlerBound = true;
      }

      selected.current.clear();
      marker.setOpacity(1);
      onSelectMarker?.(new Set(selected.current));

      // ✅ 핀 찍은 직후 알림
      onPinPlaced?.({ latLng: e.latLng, marker });

      // 필요 시 즉시 모드 OFF
      modeRef.current = '';
    };

    kakao.maps.event.addListener(m, 'click', handleClick);
    return () => kakao.maps.event.removeListener(m, 'click', handleClick);
  }, [
    mapInstance?.current,
    modeRef,
    removeModeRef,
    markers,
    selected,
    onSelectMarker,
    onPinPlaced,
  ]);
}
