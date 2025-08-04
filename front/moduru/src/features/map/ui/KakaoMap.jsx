// ✅ src/features/map/ui/KakaoMap.jsx
import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import useMapInit from "../model/useMapInit";
import useMarkerMode from "../model/useMarkerMode";
import useMeasureMode from "../model/useMeasureMode";
import useHoverMarker from "../model/useHoverMarker";
import useRemoveMode from "../model/useRemoveMode";
import { getLatLngFromRegion } from "../lib/regionUtils";

/* global kakao */

const KakaoMap = forwardRef(
  (
    { mode, zoomable, region, removeMode, onSelectMarker, hoveredCoords },
    ref
  ) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markers = useRef([]);
    const selected = useRef(new Set());
    const hoverMarker = useRef(null);
    const clickLine = useRef(null);
    const moveLine = useRef(null);
    const overlay = useRef(null);
    const dots = useRef([]);
    const drawing = useRef(false);

    const modeRef = useRef(mode);
    const prevMode = useRef(mode);
    const removeModeRef = useRef(removeMode);

    useEffect(() => {
      modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
      removeModeRef.current = removeMode;
    }, [removeMode]);

    // ✅ 지도 초기화 및 각 모드 훅 연결
    useMapInit(mapRef, mapInstance);
    useMarkerMode({
      mapInstance,
      modeRef,
      removeModeRef,
      markers,
      selected,
      onSelectMarker,
    });
    useMeasureMode({
      mapInstance,
      modeRef,
      clickLine,
      moveLine,
      overlay,
      dots,
      drawing,
    });
    useHoverMarker({ mapInstance, hoveredCoords, hoverMarkerRef: hoverMarker });
    useRemoveMode({
      mapInstance,
      markers,
      removeModeRef,
      selected,
      onSelectMarker,
    });

    // ✅ 거리 측정 흔적 제거 함수
    const clearMeasure = () => {
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
      drawing.current = false;
    };

    // ✅ 모드 전환 감지: measure → 다른 모드 OR measure → measure 재진입 시
    useEffect(() => {
      const m = mapInstance.current;
      if (!m) return;

      const prev = prevMode.current;
      prevMode.current = mode;

      const isLeavingMeasure = prev === "measure" && mode !== "measure";
      const isReenteringMeasure = prev === "measure" && mode === "measure";

      if (isLeavingMeasure || isReenteringMeasure) {
        clearMeasure();
      }
    }, [mode]);

    // ✅ 외부에서 확대/축소 호출 가능하도록 expose
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

    // ✅ 줌 가능 여부 반영
    useEffect(() => {
      mapInstance.current?.setZoomable(zoomable);
    }, [zoomable]);

    // ✅ 지역 변경 시 중심 이동
    useEffect(() => {
      if (!region || !mapInstance.current) return;
      const coords = getLatLngFromRegion(region);
      if (!coords) return;
      mapInstance.current.setCenter(
        new kakao.maps.LatLng(coords.lat, coords.lng)
      );
      mapInstance.current.setLevel(7);
    }, [region]);

    return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
  }
);

export default KakaoMap;
