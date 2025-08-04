import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import useMapInit from '../model/useMapInit';
// import useMarkerMode from '../model/useMarkerMode'; 핀 꽂기 모드 주석 처리
import useMeasureMode from '../model/useMeasureMode';
import useRemoveMode from '../model/useRemoveMode';
import { getLatLngFromRegion } from '../lib/regionUtils';

/* global kakao */

const KakaoMap = forwardRef(
  (
    { mode, zoomable, region, removeMode, onSelectMarker, pinCoords },
    ref
  ) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markers = useRef([]);
    const selectedMarkers = useRef(new Set());

    const clickLine = useRef(null);
    const moveLine = useRef(null);
    const overlay = useRef(null);
    const dots = useRef([]);
    const isDrawing = useRef(false);
    const singlePinMarker = useRef(null);

    const modeRef = useRef(mode);
    const prevMode = useRef(mode);
    const removeModeRef = useRef(removeMode);

    // 상태 동기화
    useEffect(() => {
      modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
      removeModeRef.current = removeMode;
    }, [removeMode]);

    // 지도 초기화
    useMapInit(mapRef, mapInstance);

    // 핀 꽂기 모드 주석 처리
    /*
    useMarkerMode({
      mapInstance,
      modeRef,
      removeModeRef,
      markers,
      selected: selectedMarkers,
      onSelectMarker,
    });
    */

    // 거리 측정 모드
    useMeasureMode({
      mapInstance,
      modeRef,
      clickLine,
      moveLine,
      overlay,
      dots,
      drawing: isDrawing,
    });

    // 핀 제거 모드
    useRemoveMode({
      mapInstance,
      markers,
      removeModeRef,
      selected: selectedMarkers,
      onSelectMarker,
    });

    // 측정 도구 초기화
    const clearMeasureTools = () => {
      clickLine.current?.setMap(null);
      moveLine.current?.setMap(null);
      overlay.current?.setMap(null);

      dots.current.forEach(({ circle, distance }) => {
        circle.setMap(null);
        distance?.setMap(null);
      });

      clickLine.current = null;
      moveLine.current = null;
      overlay.current = null;
      dots.current = [];
      isDrawing.current = false;
    };

    // 모드 전환 시 측정 도구 초기화
    useEffect(() => {
      const map = mapInstance.current;
      if (!map) return;

      const previous = prevMode.current;
      prevMode.current = mode;

      const exitedMeasure = previous === 'measure' && mode !== 'measure';
      const reenteredMeasure = previous === 'measure' && mode === 'measure';

      if (exitedMeasure || reenteredMeasure) {
        clearMeasureTools();
      }
    }, [mode]);

    // 외부에서 지도 줌 제어
    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () =>
          mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1),
        zoomOut: () =>
          mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1),
      }),
      []
    );

    // 줌 가능 여부 적용
    useEffect(() => {
      mapInstance.current?.setZoomable(zoomable);
    }, [zoomable]);

    // 지역 설정 시 지도 중심 이동
    useEffect(() => {
      if (!region || !mapInstance.current) return;

      const coords = getLatLngFromRegion(region);
      if (!coords) return;

      const center = new kakao.maps.LatLng(coords.lat, coords.lng);
      mapInstance.current.setCenter(center);
      mapInstance.current.setLevel(7);
    }, [region]);

    // 장소 클릭 시 핀 표시 및 중심 이동
    useEffect(() => {
      const map = mapInstance.current;
      if (!map) return;

      // 기존 마커 제거
      if (singlePinMarker.current) {
        singlePinMarker.current.setMap(null);
        singlePinMarker.current = null;
      }

      // 새 좌표가 있을 경우 마커 추가 및 중심 이동
      if (pinCoords) {
        const pos = new kakao.maps.LatLng(pinCoords.lat, pinCoords.lng);
        const marker = new kakao.maps.Marker({ position: pos });
        marker.setMap(map);
        singlePinMarker.current = marker;
        map.panTo(pos);
      }
    }, [pinCoords]);

    return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
  }
);

export default KakaoMap;
