// src/features/map/ui/KakaoMap.jsx
import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { useSelector } from "react-redux";
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

    // 🔹 Redux에서 "공유된 장소" 읽기
    //    (reducer 키가 다르면 여기만 맞춰주면 됨)
    const sharedPlaces = useSelector((state) => state.sharedPlace.sharedPlaces);

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

        setCenter: (latlng) => {
          if (!mapInstance.current) {
            console.warn("[setCenter 실패] mapInstance 없음");
            return;
          }
          const { lat, lng } = latlng;
          const center = new kakao.maps.LatLng(lat, lng);
          mapInstance.current.setCenter(center);
        },
      }),
      []
    );

    useEffect(() => {
      mapInstance.current?.setZoomable(zoomable);
    }, [zoomable]);

    useEffect(() => {
      if (!center || !mapInstance.current) return;
      const centerLatLng = new kakao.maps.LatLng(center.lat, center.lng);
      mapInstance.current.setCenter(centerLatLng);
      mapInstance.current.setLevel(7);
    }, [center]);

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

    // sharedPlaces 기반 마커 렌더링
    useEffect(() => {
      const map = mapInstance.current;
      if (!map || !Array.isArray(sharedPlaces)) return;

      // 이전 마커 제거
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];

      // 새 마커 생성
      sharedPlaces.forEach((p) => {
        if (!p?.lat || !p?.lng) return;
        const pos = new kakao.maps.LatLng(p.lat, p.lng);
        const marker = new kakao.maps.Marker({ position: pos });

        marker.setMap(map);
        markers.current.push(marker);
      });
    }, [sharedPlaces]);

    return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
  }
);

export default KakaoMap;
