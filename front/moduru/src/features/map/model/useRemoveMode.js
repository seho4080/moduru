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
    if (!removeModeRef.current) return; // removeMode가 아닐 때 이벤트 등록 X

    // 타입 방어 코드
    if (!Array.isArray(markers.current)) return;
    if (!(selected.current instanceof Set)) selected.current = new Set();

    const handlerList = [];

    markers.current.forEach((mk) => {
      if (!mk || typeof mk.setOpacity !== "function") return; // 마커 객체 체크

      const handler = () => {
        if (!removeModeRef.current) return;

        if (selected.current.has(mk)) {
          selected.current.delete(mk);
          mk.setOpacity(1);
        } else {
          selected.current.add(mk);
          mk.setOpacity(0.5);
        }

        if (typeof onSelectMarker === "function") {
          onSelectMarker(new Set(selected.current));
        }
      };

      kakao.maps.event.addListener(mk, 'click', handler);
      handlerList.push({ mk, handler });
    });

    return () => {
      handlerList.forEach(({ mk, handler }) => {
        kakao.maps.event.removeListener(mk, 'click', handler);
      });
    };
  }, [mapInstance, markers, removeModeRef.current, selected, onSelectMarker]);
}
