// src/features/map/ui/KakaoMap.jsx

import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import useMapInit from "../model/useMapInit";
import useMeasureMode from "../model/useMeasureMode";
import useRemoveMode from "../model/useRemoveMode";

/* global kakao */

const KakaoMap = forwardRef(
  (
    { mode, zoomable, region, center, removeMode, onSelectMarker, pinCoords },
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

    useEffect(() => {
      modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
      removeModeRef.current = removeMode;
    }, [removeMode]);

    useMapInit(mapRef, mapInstance);

    useMeasureMode({
      mapInstance,
      modeRef,
      clickLine,
      moveLine,
      overlay,
      dots,
      drawing: isDrawing,
    });

    useRemoveMode({
      mapInstance,
      markers,
      removeModeRef,
      selected: selectedMarkers,
      onSelectMarker,
    });

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

    useEffect(() => {
      const map = mapInstance.current;
      if (!map) return;

      const previous = prevMode.current;
      prevMode.current = mode;

      const exitedMeasure = previous === "measure" && mode !== "measure";
      const reenteredMeasure = previous === "measure" && mode === "measure";

      if (exitedMeasure || reenteredMeasure) {
        clearMeasureTools();
      }
    }, [mode]);

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

    useEffect(() => {
      mapInstance.current?.setZoomable(zoomable);
    }, [zoomable]);

    // 중심 좌표가 주어졌을 때 이동
    useEffect(() => {
      if (!center || !mapInstance.current) return;

      const centerLatLng = new kakao.maps.LatLng(center.lat, center.lng);
      mapInstance.current.setCenter(centerLatLng);
      mapInstance.current.setLevel(7);
    }, [center]);

    // 핀 클릭 시 마커 및 중심 이동
    useEffect(() => {
      const map = mapInstance.current;
      if (!map) return;

      if (singlePinMarker.current) {
        singlePinMarker.current.setMap(null);
        singlePinMarker.current = null;
      }

      if (pinCoords) {
        const pos = new kakao.maps.LatLng(pinCoords.lat, pinCoords.lng);
        const marker = new kakao.maps.Marker({ position: pos });
        marker.setMap(map);
        singlePinMarker.current = marker;
        map.panTo(pos);
      }
    }, [pinCoords]);

    return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
  }
);

export default KakaoMap;
