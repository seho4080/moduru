// src/pages/myLikePlacePage/Map.jsx
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

import pinRed from "../../../assets/pins/pin_red.png";
import pinGreen from "../../../assets/pins/pin_green.png";
import pinNavy from "../../../assets/pins/pin_navy.png";
import pinBlue from "../../../assets/pins/pin_blue.png";

const KOREA_BOUNDS_COORDS = {
  sw: { lat: 33.0, lng: 124.6 },
  ne: { lat: 38.7, lng: 131.9 },
};

const KakaoMap = forwardRef(function KakaoMap(
  { zoomable = true, region },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const managedMarkersRef = useRef([]);
  const lastCenterRef = useRef(null);

  const fitKoreaBounds = () => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { LatLng, LatLngBounds } = kakao.maps;
    const b = new LatLngBounds();
    b.extend(new LatLng(KOREA_BOUNDS_COORDS.sw.lat, KOREA_BOUNDS_COORDS.sw.lng));
    b.extend(new LatLng(KOREA_BOUNDS_COORDS.ne.lat, KOREA_BOUNDS_COORDS.ne.lng));
    mapRef.current.setBounds(b);
    const lv = mapRef.current.getLevel();
    mapRef.current.setLevel(Math.max(1, lv - 2));
  };

  const getMarkerImageByCategory = (category, maps) => {
    const { Size, Point, MarkerImage } = maps;
    const key = String(category || "").trim().toLowerCase();
    const isFood =
      key.includes("음식") || key.includes("식당") || key.includes("food") || key.includes("restaurant");
    const isAttraction =
      key.includes("명소") || key.includes("관광") || key.includes("spot") || key.includes("place") || key.includes("attraction");
    const isFestival =
      key.includes("축제") || key.includes("festival") || key.includes("event");

    let src = pinBlue;
    if (isFood) src = pinRed;
    else if (isAttraction) src = pinGreen;
    else if (isFestival) src = pinNavy;

    const size = new Size(32, 32);
    const options = { offset: new Point(16, 32) };
    return new MarkerImage(src, size, options);
  };

  // 초기화
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!window.kakao?.maps) return;

    const initCenter = new kakao.maps.LatLng(36.5, 127.8);
    const map = new kakao.maps.Map(containerRef.current, {
      center: initCenter,
      level: 12,
    });
    map.setZoomable(!!zoomable);
    mapRef.current = map;
    lastCenterRef.current = initCenter;

    // 첫 페인트 직후 한 번 더 relayout (애니메이션/폰트 로딩 후 틀어짐 방지)
    requestAnimationFrame(() => {
      map.relayout();
      map.setCenter(lastCenterRef.current);
    });

    fitKoreaBounds();

    // 윈도우 리사이즈 대응
    const onWinResize = () => {
      const c = map.getCenter();
      map.relayout();
      map.setCenter(c);
      lastCenterRef.current = c;
    };
    window.addEventListener("resize", onWinResize);

    // 부모 사이즈 변화 대응(사이드바 열닫힘, 패널 리사이즈 등)
    const ro = new ResizeObserver(() => {
      const c = map.getCenter();
      map.relayout();
      map.setCenter(c);
      lastCenterRef.current = c;
    });
    ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", onWinResize);
      ro.disconnect();
    };
  }, [zoomable]);

  // 외부 API
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    relayout: () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      mapRef.current.relayout();
      mapRef.current.setCenter(c);
      lastCenterRef.current = c;
    },
    fitKorea: () => fitKoreaBounds(),
    addMarkerByCategory: ({ lat, lng, category }) => {
      if (!mapRef.current || !window.kakao?.maps) return null;
      const maps = kakao.maps;
      const pos = new maps.LatLng(Number(lat), Number(lng));
      const marker = new maps.Marker({
        map: mapRef.current,
        position: pos,
        image: getMarkerImageByCategory(category, maps),
      });
      managedMarkersRef.current.push(marker);
      mapRef.current.panTo(pos);
      lastCenterRef.current = pos;
      return marker;
    },
    addMarkersByCategory: (items = []) => {
      if (!mapRef.current || !window.kakao?.maps) return [];
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
          map: mapRef.current,
          position: pos,
          image: getMarkerImageByCategory(it?.category, maps),
        });
        created.push(marker);
        bounds.extend(pos);
        if (!firstPos) firstPos = pos;
      });

      managedMarkersRef.current.push(...created);
      if (created.length > 1) {
        mapRef.current.setBounds(bounds);
      } else if (firstPos) {
        mapRef.current.panTo(firstPos);
        lastCenterRef.current = firstPos;
      }
      return created;
    },
    clearMarkers: () => {
      managedMarkersRef.current.forEach((m) => m.setMap(null));
      managedMarkersRef.current = [];
    },
    setCenter: (latLngObj) => {
      if (!mapRef.current) return;
      const maps = kakao.maps;
      const ll =
        latLngObj instanceof maps.LatLng
          ? latLngObj
          : new maps.LatLng(latLngObj.lat, latLngObj.lng);
      mapRef.current.setCenter(ll);
      lastCenterRef.current = ll;
    },
    zoomIn: () => {
      if (!mapRef.current) return;
      mapRef.current.setLevel(Math.max(mapRef.current.getLevel() - 1, 1));
    },
    zoomOut: () => {
      if (!mapRef.current) return;
      mapRef.current.setLevel(mapRef.current.getLevel() + 1);
    },
  }), []);

  // region prop을 훅으로 쓸 계획이면 여기서 setCenter 등 연결할 수 있음
  useEffect(() => {
    if (!mapRef.current || !region) return;
    // 예: ref.current.setCenter(region)
  }, [region]);

  // ★ 지도 div: 100% 채움, padding/border 주지 말 것
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
});

export default KakaoMap;
