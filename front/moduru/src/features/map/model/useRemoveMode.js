/* src/features/map/hooks/useRemoveMode.js */
/* global kakao */
import { useEffect } from 'react';

export default function useRemoveMode({
  mapInstance,
  markers,
  removeModeRef,
  selected,
  onSelectMarker,
}) {
  useEffect(() => {
    const m = mapInstance.current;
    if (!m) return;

    const handlerList = [];

    markers.current.forEach((mk) => {
      const handler = () => {
        if (!removeModeRef.current) return;

        if (selected.current.has(mk)) {
          selected.current.delete(mk);
          mk.setOpacity(1); // 원래대로 복원
        } else {
          selected.current.add(mk);
          mk.setOpacity(0.5); // 선택된 핀은 흐리게
        }

        onSelectMarker(new Set(selected.current)); // 선택 목록 전달
      };

      kakao.maps.event.addListener(mk, 'click', handler);
      handlerList.push({ mk, handler });
    });

    return () => {
      // ✅ cleanup 시 핸들러 제거
      handlerList.forEach(({ mk, handler }) => {
        kakao.maps.event.removeListener(mk, 'click', handler);
      });
    };
  }, [mapInstance, markers, removeModeRef, selected, onSelectMarker]);
}
