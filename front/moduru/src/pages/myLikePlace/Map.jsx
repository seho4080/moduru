/* src/pages/myLikePlace/Map.jsx */
/* global kakao */
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector } from "react-redux";
import useMarkerMode from "../../features/map/model/useMarkerMode";
import useMeasureMode from "../../features/map/model/useMeasureMode";

// NOTE: 전역 보기용 대한민국 경계(대략치)
// - 서남단(제주 서쪽 바다쪽 살짝 여유), 동북단(독도 포함 여유)
const KOREA_BOUNDS_COORDS = {
  sw: { lat: 33.0, lng: 124.6 },
  ne: { lat: 38.7, lng: 131.9 },
};

const KakaoMap = forwardRef(function KakaoMap(
  {
    mode, // 'marker' | 'measure' | ...
    zoomable = true,
    region,
    removeMode = false,
    onSelectMarker,   // 핀 찍을 때 좌표 알림
    pinCoords,        // 외부에서 특정 좌표 강제 표시(단일 마커)
    onPinPlaced,      // 핀 모드에서 지도 클릭 직후 콜백
    onMeasureUpdate,  // 측정 중 업데이트
    onMeasureComplete // 측정 종료
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

  // 공유된 장소 목록 (리덕스에서 가져오되, mapSlice는 사용하지 않음)
  const sharedPlaces = useSelector(
    (state) => state.sharedPlace?.sharedPlaces ?? []
  );

  // --- Util: 전국 보기로 맞추기
  // --- Util: 전국 보기로 맞추기 (조금 더 확대)
// --- Util: 전국 보기로 맞추기 (조금 더 확대)
const fitKoreaBounds = () => {
  if (!mapObjRef.current || !window.kakao?.maps) return;
  const { LatLng, LatLngBounds } = kakao.maps;

  const bounds = new LatLngBounds();
  bounds.extend(new LatLng(KOREA_BOUNDS_COORDS.sw.lat, KOREA_BOUNDS_COORDS.sw.lng));
  bounds.extend(new LatLng(KOREA_BOUNDS_COORDS.ne.lat, KOREA_BOUNDS_COORDS.ne.lng));

  // 전국이 보이게 맞춘 뒤
  mapObjRef.current.setBounds(bounds);

  // 확대 정도: 기존 -1 → -2 (한 단계 더 확대)
  const lv = mapObjRef.current.getLevel();
  mapObjRef.current.setLevel(Math.max(1, lv - 2));
};



  // 1) 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapObjRef.current) return;
    if (!window.kakao?.maps) return;

    // 초기 중심은 전국의 대략 중심, 하지만 바로 아래에서 bounds로 맞춘다
    const initCenter = new kakao.maps.LatLng(36.5, 127.8);
    const map = new kakao.maps.Map(containerRef.current, {
      center: initCenter,
      level: 12, // 임시 레벨(곧 bounds로 덮어씀)
    });
    map.setZoomable(!!zoomable);
    mapObjRef.current = map;

    // 초기 진입 시 전국이 보이도록
    fitKoreaBounds();
  }, [zoomable]);

  // 2) 외부 제어 메서드
  useImperativeHandle(
    ref,
    () => ({
      getMap: () => mapObjRef.current,

      fitKorea: () => fitKoreaBounds(),

      // 외부에서 임의의 마커 하나 추가
      addMarker: ({ lat, lng }) => {
        if (!mapObjRef.current || !window.kakao?.maps) return null;
        const { Marker, LatLng } = kakao.maps;
        const pos = new LatLng(Number(lat), Number(lng));
        const marker = new Marker({ map: mapObjRef.current, position: pos });
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

  // 4) region 변경 시 이동(문자열이면 상위에서 좌표 변환 후 setCenter 호출 권장)
  useEffect(() => {
    if (!mapObjRef.current || !region) return;
    // region 사용처가 생기면 상위에서 ref.setCenter(...) 또는 ref.fitKorea() 호출
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
    } else {
      // 마커가 하나도 없으면 전국 보기 유지
      fitKoreaBounds();
    }
  }, [sharedPlaces, onSelectMarker]);

  // 모드별 훅 연결
  useMarkerMode({
    mapInstance: mapObjRef,
    modeRef,
    removeModeRef,
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
