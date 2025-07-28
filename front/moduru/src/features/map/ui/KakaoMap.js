import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const KakaoMap = forwardRef(({ mode, zoomable, region, removeMode, onSelectMarker }, ref) => {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const markers       = useRef([]);
  const selected      = useRef(new Set());
  const drawing       = useRef(false);
  const clickLine     = useRef(null);
  const moveLine      = useRef(null);
  const overlay       = useRef(null);
  const dots          = useRef([]);
  const modeRef       = useRef(mode);
  const removeModeRef = useRef(removeMode);

  // 동기화 효과
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { removeModeRef.current = removeMode; }, [removeMode]);

  // 취소 시 선택 복구 및 초기화
  useEffect(() => {
    if (!removeMode) {
      selected.current.forEach(mk => mk.setOpacity(1));  // 다시 불투명
      selected.current.clear();
      onSelectMarker(new Set());
    }
  }, [removeMode]);

  // 거리 측정 모드 벗어나면 초기화
  useEffect(() => {
    if (mode !== 'measure') {
      if (clickLine.current) { clickLine.current.setMap(null); clickLine.current = null; }
      dots.current.forEach(d => { d.circle.setMap(null); d.distance?.setMap(null); });
      dots.current = [];
      if (overlay.current) { overlay.current.setMap(null); overlay.current = null; }
      drawing.current = false;
    }
  }, [mode]);

  useEffect(() => {
    const { kakao } = window;
    if (!kakao?.maps) return;

    // 지도 생성
    const m = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(33.450701, 126.9780),
      level: 3,
      draggable: true
    });
    mapInstance.current = m;

    // 헬퍼
    const clearLine = () => { clickLine.current?.setMap(null); clickLine.current = null; };
    const clearDots = () => { dots.current.forEach(d => { d.circle.setMap(null); d.distance?.setMap(null); }); dots.current = []; };
    const clearOverlay = () => { overlay.current?.setMap(null); overlay.current = null; };
    const showDistance = (html, pos) => {
      if (overlay.current) {
        overlay.current.setPosition(pos);
        overlay.current.setContent(html);
      } else {
        overlay.current = new kakao.maps.CustomOverlay({ map: m, content: html, position: pos, xAnchor: 0, yAnchor: 0, zIndex: 3 });
      }
    };
    const displayDot = (pos, dist) => {
      const circle = new kakao.maps.CustomOverlay({ map: m, content: '<span class="dot"></span>', position: pos, zIndex: 1 });
      const distOv = dist > 0
        ? new kakao.maps.CustomOverlay({ map: m, content: `<div class="dotOverlay">거리 <span class="number">${dist}</span>m</div>`, position: pos, yAnchor: 1, zIndex: 2 })
        : null;
      dots.current.push({ circle, distance: distOv });
    };
    const getTimeHTML = distance => {
      const walk = Math.floor(distance / 67), wH = Math.floor(walk / 60), wM = walk % 60;
      const bike = Math.floor(distance / 227), bH = Math.floor(bike / 60), bM = bike % 60;
      return `<ul class="dotOverlay distanceInfo">
        <li><span class="label">총거리</span><span class="number">${distance}</span>m</li>
        <li><span class="label">도보</span>${wH?`<span class="number">${wH}</span>시간 `:''}<span class="number">${wM}</span>분</li>
        <li><span class="label">자전거</span>${bH?`<span class="number">${bH}</span>시간 `:''}<span class="number">${bM}</span>분</li>
      </ul>`;
    };

    // 마커 추가 및 제거 이벤트
    const addMarker = pos => {
      const mk = new kakao.maps.Marker({ position: pos });
      mk.setMap(m);
      markers.current.push(mk);

      kakao.maps.event.addListener(mk, 'click', () => {
        if (!removeModeRef.current) return;
        if (selected.current.has(mk)) {
          selected.current.delete(mk);
          mk.setOpacity(1);
        } else {
          selected.current.add(mk);
          mk.setOpacity(0.5);
        }
        onSelectMarker(new Set(selected.current));
      });
    };

    // 지도 클릭
    kakao.maps.event.addListener(m, 'click', e => {
      if (removeModeRef.current) return;
      const pos = e.latLng;
      if (modeRef.current === 'marker') {
        addMarker(pos);
      } else if (modeRef.current === 'measure') {
        if (!drawing.current) {
          drawing.current = true;
          clearLine(); clearOverlay(); clearDots();
          clickLine.current = new kakao.maps.Polyline({ map: m, path: [pos], strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1, strokeStyle: 'solid' });
          moveLine.current  = new kakao.maps.Polyline({ strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid' });
          displayDot(pos, 0);
        } else {
          const path = clickLine.current.getPath();
          path.push(pos);
          clickLine.current.setPath(path);
          const d = Math.round(clickLine.current.getLength());
          displayDot(pos, d);
        }
      }
    });

    // 마우스 이동
    kakao.maps.event.addListener(m, 'mousemove', e => {
      if (modeRef.current !== 'measure' || !drawing.current) return;
      const pos = e.latLng;
      const path = clickLine.current.getPath();
      moveLine.current.setPath([path[path.length - 1], pos]);
      moveLine.current.setMap(m);
      const total = Math.round(clickLine.current.getLength() + moveLine.current.getLength());
      showDistance(`<div class="dotOverlay distanceInfo">총거리 <span class="number">${total}</span>m</div>`, pos);
    });

    // 우클릭(측정 종료)
    kakao.maps.event.addListener(m, 'rightclick', e => {
      if (modeRef.current !== 'measure' || !drawing.current) return;
      moveLine.current.setMap(null);
      const path = clickLine.current.getPath();
      if (path.length > 1) {
        const last = dots.current[dots.current.length - 1];
        last.distance?.setMap(null);
        const fd = Math.round(clickLine.current.getLength());
        showDistance(getTimeHTML(fd), path[path.length - 1]);
      } else {
        clearLine(); clearDots(); clearOverlay();
      }
      drawing.current = false;
    });

    return () => { clearLine(); clearDots(); clearOverlay(); };
  }, []);

  // 줌 인/아웃
  useImperativeHandle(ref, () => ({
    zoomIn: () => { const m = mapInstance.current; if (m) m.setLevel(m.getLevel() - 1); },
    zoomOut: () => { const m = mapInstance.current; if (m) m.setLevel(m.getLevel() + 1); }
  }), []);

  // 지역 변경
  useEffect(() => {
    const m = mapInstance.current;
    if (!m || !region) return;
    const C = {
      seoul:   { lat:37.5665, lng:126.9780, lvl:8 },
      daejeon: { lat:36.3504, lng:127.3845, lvl:8 },
      busan:   { lat:35.1796, lng:129.0756, lvl:8 },
    };
    const { lat, lng, lvl } = C[region];
    m.setCenter(new window.kakao.maps.LatLng(lat, lng));
    m.setLevel(lvl);
  }, [region]);

  // 줌 토글
  useEffect(() => { mapInstance.current?.setZoomable(zoomable); }, [zoomable]);

  return <div id="map" ref={mapRef} style={{ width:'100%', height:'100vh' }}/>;
});

export default KakaoMap;
