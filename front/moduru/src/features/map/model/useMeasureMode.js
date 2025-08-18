/* global kakao */
import { useEffect } from 'react';

export default function useMeasureMode({ mapInstance, mode, onUpdate, onComplete }) {
  useEffect(() => {
    const m = mapInstance?.current;
    if (!m) return;

    if (mode !== 'measure') return; // 모드가 measure일 때만 동작

    // 👉 정리 함수들
    const clearLine = () => {
      clickLine.current?.setMap(null);
      clickLine.current = null;
    };

    const clearDots = () => {
      dots.current.forEach(({ circle, distance }) => {
        circle.setMap(null);
        distance?.setMap(null);
      });
      dots.current = [];
    };

    const clearOverlay = () => {
      overlay.current?.setMap(null);
      overlay.current = null;
    };

    const showDistance = (html, pos) => {
      if (overlay.current) {
        overlay.current.setPosition(pos);
        overlay.current.setContent(html);
      } else {
        overlay.current = new kakao.maps.CustomOverlay({
          map: m,
          content: html,
          position: pos,
          xAnchor: 0,
          yAnchor: 0,
          zIndex: 3,
        });
      }
    };

    const displayDot = (pos, dist) => {
      const circle = new kakao.maps.CustomOverlay({
        map: m,
        position: pos,
        content: '<span class="dot"></span>',
        zIndex: 1,
      });

      const distance = dist > 0 ? new kakao.maps.CustomOverlay({
        map: m,
        position: pos,
        yAnchor: 1,
        zIndex: 2,
        content: `<div class="dotOverlay">거리 <span class="number">${dist}</span>m</div>`,
      }) : null;

      dots.current.push({ circle, distance });
    };

    const getTimeHTML = (distance) => {
      const walk = Math.floor(distance / 67);
      const bike = Math.floor(distance / 227);
      const [wH, wM] = [Math.floor(walk / 60), walk % 60];
      const [bH, bM] = [Math.floor(bike / 60), bike % 60];

      return `
        <ul class="dotOverlay distanceInfo">
          <li><span class="label">총거리</span><span class="number">${distance}</span>m</li>
          <li><span class="label">도보</span>${wH ? `<span class="number">${wH}</span>시간 ` : ''}<span class="number">${wM}</span>분</li>
          <li><span class="label">자전거</span>${bH ? `<span class="number">${bH}</span>시간 ` : ''}<span class="number">${bM}</span>분</li>
        </ul>`;
    };

    // ✅ 측정 모드일 때만 반응
    const handleClick = (e) => {
      if (modeRef.current !== 'measure') return;

      const pos = e.latLng;
      if (!drawing.current) {
        drawing.current = true;
        clearLine(); clearDots(); clearOverlay();

        clickLine.current = new kakao.maps.Polyline({
          map: m,
          path: [pos],
          strokeWeight: 3,
          strokeColor: '#db4040',
          strokeOpacity: 1,
          strokeStyle: 'solid',
        });

        moveLine.current = new kakao.maps.Polyline({
          strokeWeight: 3,
          strokeColor: '#db4040',
          strokeOpacity: 0.5,
          strokeStyle: 'solid',
        });

        displayDot(pos, 0);
      } else {
        const path = clickLine.current.getPath();
        path.push(pos);
        clickLine.current.setPath(path);
        displayDot(pos, Math.round(clickLine.current.getLength()));
      }

      onUpdate?.(/* 거리, 경로 등 */);
    };

    const handleMouseMove = (e) => {
      if (modeRef.current !== 'measure' || !drawing.current) return;

      const pos = e.latLng;
      const path = clickLine.current.getPath();
      const last = path[path.length - 1];

      moveLine.current.setPath([last, pos]);
      moveLine.current.setMap(m);

      const total = Math.round(clickLine.current.getLength() + moveLine.current.getLength());
      showDistance(`<div class="dotOverlay distanceInfo">총거리 <span class="number">${total}</span>m</div>`, pos);
    };

    const handleRightClick = () => {
      if (modeRef.current !== 'measure' || !drawing.current) return;

      moveLine.current.setMap(null);
      const path = clickLine.current.getPath();

      if (path.length > 1) {
        const dist = Math.round(clickLine.current.getLength());
        showDistance(getTimeHTML(dist), path[path.length - 1]);
      } else {
        clearLine(); clearDots(); clearOverlay();
      }

      drawing.current = false;
      onComplete?.(/* 최종 거리, 경로 등 */);
    };

    // ✅ 최초 이벤트 등록
    kakao.maps.event.addListener(m, 'click', handleClick);
    kakao.maps.event.addListener(m, 'mousemove', handleMouseMove);
    kakao.maps.event.addListener(m, 'rightclick', handleRightClick);

    // ✅ 모드 전환 시 측정 초기화
    return () => {
      kakao.maps.event.removeListener(m, 'click', handleClick);
      kakao.maps.event.removeListener(m, 'mousemove', handleMouseMove);
      kakao.maps.event.removeListener(m, 'rightclick', handleRightClick);

      // 🔁 모드 전환 시 측정 결과 제거
      clearLine(); clearDots(); clearOverlay();
      drawing.current = false;
    };
  }, [mapInstance, mode]);
}
