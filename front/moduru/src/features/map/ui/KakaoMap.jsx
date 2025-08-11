/* src/features/map/ui/KakaoMap.jsx */
/* global kakao */
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector } from "react-redux";
import useMarkerMode from "../../map/model/useMarkerMode";
import useMeasureMode from "../../map/model/useMeasureMode";

const KakaoMap = forwardRef(function KakaoMap(
  {
    mode, // 'marker' | 'measure' | ...
    zoomable = true,
    region,
    removeMode = false,
    onSelectMarker, // 핀 찍을 때 좌표 알림
    pinCoords, // 외부에서 특정 좌표 강제 표시(단일 마커)
    onPinPlaced, // 핀 모드에서 지도 클릭 직후 콜백
    onMeasureUpdate, // 측정 중 업데이트
    onMeasureComplete, // 측정 종료
  },
  ref
) {
  const containerRef = useRef(null);
  const mapObjRef = useRef(null);

  // 모드/삭제 모드 상태
  const modeRef = useRef("");
  const removeModeRef = useRef(false);

  // 단일 마커(상세 보기나 선택에 쓰는 슬롯 1개)
  const singlePinMarkers = useRef([]); // index 0만 사용

  // 공유 장소 마커들(여러 개 관리)
  const sharedMarkers = useRef([]);

  // 삭제/선택 모드에서 쓰는 선택 상태
  const selected = useRef(new Set());

  // 공유된 장소 목록 (리덕스)
  const sharedPlaces = useSelector(
    (state) => state.sharedPlace?.sharedPlaces ?? []
  );

  // 1) 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapObjRef.current) return;
    if (!window.kakao?.maps) return;

    const center = new kakao.maps.LatLng(37.5665, 126.978);
    const map = new kakao.maps.Map(containerRef.current, { center, level: 5 });
    map.setZoomable(!!zoomable);
    mapObjRef.current = map;
  }, [zoomable]);

  // 2) 외부 제어 메서드
  useImperativeHandle(
    ref,
    () => ({
      getMap: () => mapObjRef.current,

      // 외부에서 임의의 마커 하나 추가
      addMarker: ({ lat, lng }) => {
        if (!mapObjRef.current || !window.kakao?.maps) return null;
        const { Marker, LatLng } = kakao.maps;
        const pos = new LatLng(Number(lat), Number(lng));
        const marker = new Marker({ map: mapObjRef.current, position: pos });
        // 외부 유틸로 추가되는 마커는 공유 마커 배열에 넣어 관리
        sharedMarkers.current.push(marker);
        mapObjRef.current.panTo(pos);
        return marker;
      },

      // 외부에서 여러 개 한 번에 추가
      addMarkers: (items = []) => {
        if (!mapObjRef.current || !window.kakao?.maps) return [];
        const { Marker, LatLng, LatLngBounds } = kakao.maps;
        const created = [];
        const bounds = new LatLngBounds();
        let firstPos = null;

        items.forEach((it) => {
          const lat = Number(it?.lat ?? it?.latitude ?? it?.y);
          const lng = Number(it?.lng ?? it?.longitude ?? it?.x);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const pos = new LatLng(lat, lng);
          const m = new Marker({ map: mapObjRef.current, position: pos });
          created.push(m);
          bounds.extend(pos);
          if (!firstPos) firstPos = pos;
        });

        sharedMarkers.current.push(...created);
        if (created.length > 1) {
          mapObjRef.current.setBounds(bounds);
        } else if (firstPos) {
          mapObjRef.current.panTo(firstPos);
        }
        return created;
      },

      // 외부에서 공유 마커 전부 제거
      clearMarkers: () => {
        sharedMarkers.current.forEach((m) => m.setMap(null));
        sharedMarkers.current = [];
      },

      setCenter: (latLngObj) => {
        if (!mapObjRef.current) return;
        const ll =
          latLngObj instanceof kakao.maps.LatLng
            ? latLngObj
            : new kakao.maps.LatLng(latLngObj.lat, latLngObj.lng);
        mapObjRef.current.setCenter(ll);
      },

      zoomIn: () => {
        if (!mapObjRef.current) return;
        mapObjRef.current.setLevel(
          Math.max(mapObjRef.current.getLevel() - 1, 1)
        );
      },

      zoomOut: () => {
        if (!mapObjRef.current) return;
        mapObjRef.current.setLevel(mapObjRef.current.getLevel() + 1);
      },
    }),
    []
  );

  // 3) props → ref 동기화
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    removeModeRef.current = removeMode;
  }, [removeMode]);

  // 4) region 변경 시 이동(필요 시 구현)
  useEffect(() => {
    if (!mapObjRef.current || !region) return;
    // region 문자열에서 좌표로 이동하려면 상위에서 setCenter 호출
  }, [region]);

  // 5) 외부 좌표로 단일 마커 유지
  useEffect(() => {
    if (!mapObjRef.current || !pinCoords || !window.kakao?.maps) return;
    const pos = new kakao.maps.LatLng(
      Number(pinCoords.lat),
      Number(pinCoords.lng)
    );
    let marker = singlePinMarkers.current[0];
    if (marker) {
      marker.setPosition(pos);
      marker.setMap(mapObjRef.current);
    } else {
      marker = new kakao.maps.Marker({ position: pos });
      marker.setMap(mapObjRef.current);
      singlePinMarkers.current = [marker];
    }
    // 단일 마커는 화면 안으로 가져오기
    mapObjRef.current.panTo(pos);
  }, [pinCoords]);

  // 6) 공유 장소 마커 렌더링
  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !Array.isArray(sharedPlaces)) return;

    // 기존 공유 마커 제거
    sharedMarkers.current.forEach((m) => m.setMap(null));
    sharedMarkers.current = [];

    if (!window.kakao?.maps) return;
    const { LatLng, LatLngBounds } = kakao.maps;
    const bounds = new LatLngBounds();
    let firstPos = null;

    sharedPlaces.forEach((p) => {
      const lat = Number(p?.lat ?? p?.latitude ?? p?.y);
      const lng = Number(p?.lng ?? p?.longitude ?? p?.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pos = new LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position: pos });
      marker.setMap(map);
      sharedMarkers.current.push(marker);
      bounds.extend(pos);
      if (!firstPos) firstPos = pos;

      if (onSelectMarker) {
        kakao.maps.event.addListener(marker, "click", () => {
          onSelectMarker({ lat, lng, ...p });
        });
      }
    });

    if (sharedMarkers.current.length > 1) {
      map.setBounds(bounds);
    } else if (firstPos) {
      map.panTo(firstPos);
    }
  }, [sharedPlaces, onSelectMarker]);

  // 모드별 훅 연결
  useMarkerMode({
    mapInstance: mapObjRef,
    modeRef,
    removeModeRef,
    // 제거/선택 모드에서 관리할 마커 배열은 필요에 따라 교체 가능
    // 현재는 단일 마커 배열을 전달(프로젝트 요구에 맞게 sharedMarkers로 바꿀 수도 있음)
    markers: singlePinMarkers,
    selected,
    onSelectMarker: onSelectMarker || (() => {}),
    onPinPlaced,
  });

  useMeasureMode({
    mapInstance: mapObjRef,
    modeRef,
    onUpdate: onMeasureUpdate || (() => {}),
    onComplete: onMeasureComplete || (() => {}),
  });

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

export default KakaoMap;
