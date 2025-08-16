// src/features/myLikedPlace/ui/MyLikedPlaceMarkers.jsx
import { useEffect, useRef } from "react";
import { fetchMyLikedPlacesApi } from "../lib/likedPlaceApi";

import pinRed from "../../../assets/pins/pin_red.png";
import pinGreen from "../../../assets/pins/pin_green.png";
import pinNavy from "../../../assets/pins/pin_navy.png";
import pinBlue from "../../../assets/pins/pin_blue.png";

// 카테고리 → 핀 이미지
function getPinByCategory(category) {
  const key = String(category || "").toLowerCase();
  if (key.includes("축제") || key.includes("festival") || key.includes("event")) return pinNavy;
  if (key.includes("명소") || key.includes("관광") || key.includes("spot") || key.includes("place") || key.includes("attraction")) return pinGreen;
  if (key.includes("음식") || key.includes("식당") || key.includes("food") || key.includes("restaurant")) return pinRed;
  return pinBlue;
}

// 세션 억제 리스트(삭제 직후 서버 반영 지연 시, 같은 세션 동안 재등장 방지)
const SUPPRESS_KEY = "LIKED_SUPPRESS_IDS_V1";
function loadSuppressSet() {
  try {
    const arr = JSON.parse(sessionStorage.getItem(SUPPRESS_KEY) || "[]");
    return new Set(arr.map((n) => Number(n)).filter(Number.isFinite));
  } catch {
    return new Set();
  }
}
function saveSuppressSet(set) {
  sessionStorage.setItem(SUPPRESS_KEY, JSON.stringify(Array.from(set)));
}

export default function MyLikedPlaceMarkers({ regionId, mapRef }) {
  const markersByIdRef = useRef(new Map()); // placeId -> Marker
  const clustererRef = useRef(null);        // kakao.maps.MarkerClusterer
  const suppressIdsRef = useRef(loadSuppressSet());

  // 공통 유틸: 클러스터러 재빌드
  const rebuildClusterer = () => {
    const maps = window.kakao?.maps;
    const map = mapRef?.current?.getMap?.();
    if (!maps || !map || !clustererRef.current) return;

    // 남아있는 마커로 재구성
    const remain = Array.from(markersByIdRef.current.values());
    clustererRef.current.clear();
    if (remain.length > 0) clustererRef.current.addMarkers(remain);
  };

  // 카드 클릭 → 지도 포커스
  useEffect(() => {
    const handler = (e) => {
      const p = e?.detail;
      if (!p || !mapRef?.current || !window.kakao?.maps) return;

      const maps = kakao.maps;
      const map = mapRef.current.getMap?.();

      const marker = markersByIdRef.current.get(Number(p.placeId ?? p.id));
      let pos = null;
      if (marker?.getPosition) pos = marker.getPosition();
      else if (Number.isFinite(+p.latitude) && Number.isFinite(+p.longitude)) {
        pos = new maps.LatLng(+p.latitude, +p.longitude);
      }
      if (!map || !pos) return;

      const lv = Math.max(map.getLevel() - 2, 3);
      map.setLevel(lv);
      map.panTo(pos);
    };

    window.addEventListener("liked-place:focus", handler);
    return () => window.removeEventListener("liked-place:focus", handler);
  }, [mapRef]);

  // 삭제 이벤트 → 즉시 마커 제거 + 억제 등록 + 클러스터 갱신
  useEffect(() => {
    const onRemove = (e) => {
      const id = Number(e?.detail?.placeId);
      if (!Number.isFinite(id)) return;

      // 억제 목록에 추가(세션 동안 재등장 방지)
      suppressIdsRef.current.add(id);
      saveSuppressSet(suppressIdsRef.current);

      const marker = markersByIdRef.current.get(id);
      if (!marker) return;

      // 맵/클러스터에서 제거
      if (clustererRef.current?.removeMarker) {
        clustererRef.current.removeMarker(marker);
        markersByIdRef.current.delete(id);
        rebuildClusterer();
      } else {
        marker.setMap(null);
        markersByIdRef.current.delete(id);
      }
    };

    window.addEventListener("liked-place:remove", onRemove);
    return () => window.removeEventListener("liked-place:remove", onRemove);
  }, []);

  // 초기/region 변경 시 그리기
  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const list = await fetchMyLikedPlacesApi({
        region: regionId == null ? undefined : Number(regionId),
        useToken: true,
      });
      if (cancelled || !mapRef?.current || !window.kakao?.maps) return;

      const maps = kakao.maps;
      const map = mapRef.current.getMap?.();
      if (!map) return;

      // 초기화
      markersByIdRef.current.forEach((m) => m.setMap?.(null));
      markersByIdRef.current.clear();
      if (clustererRef.current) clustererRef.current.clear();
      mapRef.current.clearMarkers?.();

      // 억제된 ID 제외 + 좌표 유효한 것만
      const valid = (list || []).filter((it) => {
        const id = Number(it.placeId ?? it.id);
        return (
          Number.isFinite(+it.latitude) &&
          Number.isFinite(+it.longitude) &&
          Number.isFinite(id) &&
          !suppressIdsRef.current.has(id)
        );
      });

      // 클러스터러 준비(있으면 사용)
      if (maps.MarkerClusterer && !clustererRef.current) {
        clustererRef.current = new maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 6,
          disableClickZoom: false,
          calculator: [10, 30, 50, 100],
          styles: [
            { width: "40px", height: "40px", background: "rgba(244,67,54,.85)", color: "#fff", textAlign: "center", lineHeight: "40px", borderRadius: "20px", fontWeight: 700 },
            { width: "48px", height: "48px", background: "rgba(76,175,80,.85)", color: "#fff", textAlign: "center", lineHeight: "48px", borderRadius: "24px", fontWeight: 700 },
            { width: "56px", height: "56px", background: "rgba(33,150,243,.85)", color: "#fff", textAlign: "center", lineHeight: "56px", borderRadius: "28px", fontWeight: 700 },
            { width: "64px", height: "64px", background: "rgba(63,81,181,.85)", color: "#fff", textAlign: "center", lineHeight: "64px", borderRadius: "32px", fontWeight: 700 },
          ],
        });
      }

      const markers = valid.map((it) => {
        const id = Number(it.placeId ?? it.id);
        const pos = new maps.LatLng(+it.latitude, +it.longitude);
        const image = new maps.MarkerImage(
          getPinByCategory(it.category),
          new maps.Size(32, 32),
          { offset: new maps.Point(16, 32) }
        );
        const m = new maps.Marker({ position: pos, image });
        markersByIdRef.current.set(id, m);
        return m;
      });

      if (clustererRef.current) {
        clustererRef.current.addMarkers(markers);
      } else {
        markers.forEach((m) => m.setMap(map));
      }

      // 화면 맞춤
      if (markers.length > 1) {
        const b = new maps.LatLngBounds();
        markers.forEach((m) => b.extend(m.getPosition()));
        map.setBounds(b);
      } else if (markers.length === 1) {
        map.panTo(markers[0].getPosition());
      }
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [regionId, mapRef]);

  return null;
}
