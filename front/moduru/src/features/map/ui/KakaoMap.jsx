// src/features/map/ui/KakaoMap.js
/* global kakao */
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { getLatLngFromRegion } from '../lib/regionUtils'; // ✅ 추가
import { useSelector } from 'react-redux';

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
  const pins = useSelector((state) => state.map.pins);  //pin 상태 가지고 오기

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { removeModeRef.current = removeMode; }, [removeMode]);

  useEffect(() => {
    if (!removeMode) {
      selected.current.forEach(mk => mk.setOpacity(1));
      selected.current.clear();
      onSelectMarker(new Set());
    }
  }, [removeMode, onSelectMarker]);

  useEffect(() => {
    if (mode !== 'measure') {
      clickLine.current?.setMap(null); clickLine.current = null;
      dots.current.forEach(d => { d.circle.setMap(null); d.distance?.setMap(null); });
      dots.current = [];
      overlay.current?.setMap(null); overlay.current = null;
      drawing.current = false;
    }
  }, [mode]);

  useEffect(() => {
    const { kakao } = window;
    if (!kakao?.maps) return;

    const m = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(33.450701, 126.9780),
      level: 3,
      draggable: true
    });
    mapInstance.current = m;

    const clearLine = () => { clickLine.current?.setMap(null); clickLine.current = null; };
    const clearDots = () => { dots.current.forEach(d => { d.circle.setMap(null); d.distance?.setMap(null); }); dots.current = []; };
    const clearOverlay = () => { overlay.current?.setMap(null); overlay.current = null; };

    const showDistance = (html, pos) => {
      if (overlay.current) {
        overlay.current.setPosition(pos);
        overlay.current.setContent(html);
      } else {
        overlay.current = new kakao.maps.CustomOverlay({
          map: m, content: html, position: pos,
          xAnchor: 0, yAnchor: 0, zIndex: 3
        });
      }
    };

    const displayDot = (pos, dist) => {
      const circle = new kakao.maps.CustomOverlay({
        map: m, content: '<span class="dot"></span>', position: pos, zIndex: 1
      });
      const distOv = dist > 0 ? new kakao.maps.CustomOverlay({
        map: m, content: `<div class="dotOverlay">거리 <span class="number">${dist}</span>m</div>`,
        position: pos, yAnchor: 1, zIndex: 2
      }) : null;
      dots.current.push({ circle, distance: distOv });
    };

    const getTimeHTML = d => {
      const walk = Math.floor(d / 67), wH = Math.floor(walk / 60), wM = walk % 60;
      const bike = Math.floor(d / 227), bH = Math.floor(bike / 60), bM = bike % 60;
      return `<ul class="dotOverlay distanceInfo">
        <li><span class="label">총거리</span><span class="number">${d}</span>m</li>
        <li><span class="label">도보</span>${wH ? `<span class="number">${wH}</span>시간 ` : ''}<span class="number">${wM}</span>분</li>
        <li><span class="label">자전거</span>${bH ? `<span class="number">${bH}</span>시간 ` : ''}<span class="number">${bM}</span>분</li>
      </ul>`;
    };

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

    kakao.maps.event.addListener(m, 'click', e => {
      if (removeModeRef.current) return;
      const pos = e.latLng;
      if (modeRef.current === 'marker') {
        addMarker(pos);
      } else if (modeRef.current === 'measure') {
        if (!drawing.current) {
          drawing.current = true;
          clearLine(); clearOverlay(); clearDots();
          clickLine.current = new kakao.maps.Polyline({
            map: m, path: [pos], strokeWeight: 3, strokeColor: '#db4040',
            strokeOpacity: 1, strokeStyle: 'solid'
          });
          moveLine.current = new kakao.maps.Polyline({
            strokeWeight: 3, strokeColor: '#db4040',
            strokeOpacity: 0.5, strokeStyle: 'solid'
          });
          displayDot(pos, 0);
        } else {
          const path = clickLine.current.getPath();
          path.push(pos);
          clickLine.current.setPath(path);
          displayDot(pos, Math.round(clickLine.current.getLength()));
        }
      }
    });

    kakao.maps.event.addListener(m, 'mousemove', e => {
      if (modeRef.current !== 'measure' || !drawing.current) return;
      const pos = e.latLng;
      const path = clickLine.current.getPath();
      moveLine.current.setPath([path[path.length - 1], pos]);
      moveLine.current.setMap(m);
      showDistance(`<div class="dotOverlay distanceInfo">총거리 <span class="number">${Math.round(clickLine.current.getLength() + moveLine.current.getLength())}</span>m</div>`, pos);
    });

    kakao.maps.event.addListener(m, 'rightclick', () => {
      if (modeRef.current !== 'measure' || !drawing.current) return;
      moveLine.current.setMap(null);
      const path = clickLine.current.getPath();
      if (path.length > 1) {
        const fd = Math.round(clickLine.current.getLength());
        showDistance(getTimeHTML(fd), path[path.length - 1]);
      } else {
        clearLine(); clearDots(); clearOverlay();
      }
      drawing.current = false;
    });

    return () => { clearLine(); clearDots(); clearOverlay(); };
  }, [onSelectMarker]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => { const m = mapInstance.current; if (m) m.setLevel(m.getLevel() - 1); },
    zoomOut: () => { const m = mapInstance.current; if (m) m.setLevel(m.getLevel() + 1); }
  }), []);

  useEffect(() => {
    const m = mapInstance.current;
    if (!m || !region) return;
    const coords = getLatLngFromRegion(region);
    if (!coords) return;
    const { lat, lng } = coords;
    m.setCenter(new kakao.maps.LatLng(lat, lng));
    m.setLevel(7);
  }, [region]);

  useEffect(() => {
    mapInstance.current?.setZoomable(zoomable);
  }, [zoomable]);


  useEffect(() => {
  const map = mapInstance.current;
  if (!map) return;

  // 1. 기존 마커 제거
  markers.current.forEach((marker) => marker.setMap(null));
  markers.current = [];

  // 2. 새 마커 그리기
  pins.forEach((pin) => {
    const pos = new kakao.maps.LatLng(pin.lat, pin.lng);
    const marker = new kakao.maps.Marker({ position: pos });
    marker.setMap(map);
    markers.current.push(marker);
  });
}, [pins]);



  return <div id="map" ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
});

export default KakaoMap;
