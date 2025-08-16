// src/pages/myLikePlacePage/Map.jsx   ← 현재 위치 기준
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

// 핀 아이콘(프로젝트 구조 기준)
import pinRed from "../../../assets/pins/pin_red.png";
import pinGreen from "../../../assets/pins/pin_green.png";
import pinNavy from "../../../assets/pins/pin_navy.png";
// 필요 시 예비 색상
import pinBlue from "../../../assets/pins/pin_blue.png"; 

const KOREA_BOUNDS_COORDS = {
  sw: { lat: 33.0, lng: 124.6 },
  ne: { lat: 38.7, lng: 131.9 },
};

const KakaoMap = forwardRef(function KakaoMap(
  {
    zoomable = true,
    region, // 문자열일 경우 상위에서 좌표로 변환하여 setCenter 사용 권장
  },
  ref
) {
  const containerRef = useRef(null);
  const mapObjRef = useRef(null);

  // 외부에서 추가한 마커를 수동 관리
  const managedMarkersRef = useRef([]);

  // ---- 유틸: 전국 보기
  const fitKoreaBounds = () => {
    if (!mapObjRef.current || !window.kakao?.maps) return;
    const { LatLng, LatLngBounds } = kakao.maps;
    const bounds = new LatLngBounds();
    bounds.extend(new LatLng(KOREA_BOUNDS_COORDS.sw.lat, KOREA_BOUNDS_COORDS.sw.lng));
    bounds.extend(new LatLng(KOREA_BOUNDS_COORDS.ne.lat, KOREA_BOUNDS_COORDS.ne.lng));
    mapObjRef.current.setBounds(bounds);
    const lv = mapObjRef.current.getLevel();
    mapObjRef.current.setLevel(Math.max(1, lv - 2));
  };

  // ---- 아이콘 매핑
  const getMarkerImageByCategory = (category, maps) => {
    const { Size, Point, MarkerImage } = maps;

    // 이름 정규화
    const key = String(category || "")
      .trim()
      .toLowerCase();

    // 음식점
    const isFood =
      key.includes("음식") ||
      key.includes("식당") ||
      key.includes("food") ||
      key.includes("restaurant");

    // 명소(관광지/스팟)
    const isAttraction =
      key.includes("명소") ||
      key.includes("관광") ||
      key.includes("spot") ||
      key.includes("place") ||
      key.includes("attraction");

    // 축제/이벤트
    const isFestival =
      key.includes("축제") ||
      key.includes("festival") ||
      key.includes("event");

    let src = pinBlue; // 기본
    if (isFood) src = pinRed;
    else if (isAttraction) src = pinGreen;
    else if (isFestival) src = pinNavy;

    // 아이콘 사이즈/앵커(하단 중앙)
    const size = new Size(32, 32);
    const options = { offset: new Point(16, 32) };
    return new MarkerImage(src, size, options);
  };

  // 1) 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapObjRef.current) return;
    if (!window.kakao?.maps) return;

    const initCenter = new kakao.maps.LatLng(36.5, 127.8);
    const map = new kakao.maps.Map(containerRef.current, {
      center: initCenter,
      level: 12,
    });
    map.setZoomable(!!zoomable);
    mapObjRef.current = map;

    fitKoreaBounds();
  }, [zoomable]);

  // 2) 외부 제어 메서드
  useImperativeHandle(
    ref,
    () => ({
      getMap: () => mapObjRef.current,
      fitKorea: () => fitKoreaBounds(),

      // 단일 마커(카테고리 지원)
      addMarkerByCategory: ({ lat, lng, category }) => {
        if (!mapObjRef.current || !window.kakao?.maps) return null;
        const maps = kakao.maps;
        const pos = new maps.LatLng(Number(lat), Number(lng));
        const marker = new maps.Marker({
          map: mapObjRef.current,
          position: pos,
          image: getMarkerImageByCategory(category, maps),
        });
        managedMarkersRef.current.push(marker);
        mapObjRef.current.panTo(pos);
        return marker;
      },

      // 여러 개 마커(카테고리 지원)
      addMarkersByCategory: (items = []) => {
        if (!mapObjRef.current || !window.kakao?.maps) return [];
        const maps = kakao.maps;
        const created = [];
        const bounds = new maps.LatLngBounds();
        let firstPos = null;

        items.forEach((it) => {
          const lat = Number(it?.lat ?? it?.latitude ?? it?.y);
          const lng = Number(it?.lng ?? it?.longitude ?? it?.x);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const pos = new maps.LatLng(lat, lng);
          const marker = new maps.Marker({
            map: mapObjRef.current,
            position: pos,
            image: getMarkerImageByCategory(it?.category, maps),
          });
          created.push(marker);
          bounds.extend(pos);
          if (!firstPos) firstPos = pos;
        });

        managedMarkersRef.current.push(...created);
        if (created.length > 1) mapObjRef.current.setBounds(bounds);
        else if (firstPos) mapObjRef.current.panTo(firstPos);

        return created;
      },

      clearMarkers: () => {
        managedMarkersRef.current.forEach((m) => m.setMap(null));
        managedMarkersRef.current = [];
      },

      setCenter: (latLngObj) => {
        if (!mapObjRef.current) return;
        const maps = kakao.maps;
        const ll =
          latLngObj instanceof maps.LatLng
            ? latLngObj
            : new maps.LatLng(latLngObj.lat, latLngObj.lng);
        mapObjRef.current.setCenter(ll);
      },

      zoomIn: () => {
        if (!mapObjRef.current) return;
        mapObjRef.current.setLevel(Math.max(mapObjRef.current.getLevel() - 1, 1));
      },

      zoomOut: () => {
        if (!mapObjRef.current) return;
        mapObjRef.current.setLevel(mapObjRef.current.getLevel() + 1);
      },
    }),
    []
  );

  useEffect(() => {
    if (!mapObjRef.current || !region) return;
    // 필요 시 상위에서 ref.current.setCenter(...) 호출
  }, [region]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

export default KakaoMap;
