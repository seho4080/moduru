import React, { useEffect, useRef, useState } from "react";
import SideMenuBox from "../../../features/myLikedPlace/ui/SideMenuBox";
import Map from "../../../features/myLikedPlace/ui/Map";
import "../../../pages/myPage/css/myLikePlaceContent.css";

// 좋아요 장소 마커 렌더러
import MyLikedPlaceMarkers from "../../../features/myLikedPlace/ui/MyLikedPlaceMarkers";

export default function MyLikeSpace({ isExpanded, onToggleExpand }) {
  const mapRef = useRef(null);           // Map.jsx forwardRef
  const cardRef = useRef(null);          // .map-card
  const viewportRef = useRef(null);      // .map-viewport
  const [regionId, setRegionId] = useState(undefined);

  // NOTE: 안전한 relayout 호출(센터 유지)
  const safeRelayout = () => {
    const api = mapRef.current;
    if (!api) return;
    // Map.jsx에서 useImperativeHandle로 노출한 relayout() 사용
    if (typeof api.relayout === "function") {
      api.relayout();
      return;
    }
    // 혹시 예전 버전이라면 fallback
    const mapObj = api.getMap?.();
    if (mapObj) {
      const c = mapObj.getCenter();
      mapObj.relayout();
      mapObj.setCenter(c);
    }
  };

  // NOTE: 최초 페인트 직후 한 번 더 relayout (폰트/레이아웃 딜레이 대비)
  useEffect(() => {
    const id = requestAnimationFrame(() => safeRelayout());
    return () => cancelAnimationFrame(id);
    // 의존성 비움: 최초 1회
  }, []);

  // NOTE: 윈도우 리사이즈 대응
  useEffect(() => {
    const onResize = () => safeRelayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // NOTE: 부모 크기 변화 대응(사이드바 토글, 패널 리사이즈 등)
  useEffect(() => {
    const ro = new ResizeObserver(() => safeRelayout());
    if (cardRef.current) ro.observe(cardRef.current);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  // NOTE: 탭/모달 등으로 보였다 숨겼다 하는 경우를 대비해 가시성 변화에도 반응
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        // 다음 페인트 직후 호출
        requestAnimationFrame(() => safeRelayout());
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // NOTE: 확대/축소 상태 변화 시 relayout
  useEffect(() => {
    if (onToggleExpand) {
      // 상태 변화 후 레이아웃 재조정
      const timer = setTimeout(() => safeRelayout(), 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div className={`like-content ${isExpanded ? "expanded" : ""}`}>
      {/* 좌측 사이드 메뉴 (지역 선택 시 setRegionId 호출) - 확대 시 숨김 */}
      {!isExpanded && <SideMenuBox onChangeRegion={setRegionId} />}

      {/* 우측 지도 카드 */}
      <section className={`map-card ${isExpanded ? "expanded" : ""}`} ref={cardRef}>
        {/* 지도 우상단에 "확대" 버튼 */}
        <div style={{
          position: "absolute",
          top: "18px",
          right: "18px",
          zIndex: 10,
          pointerEvents: "auto"
        }}>
          {onToggleExpand && !isExpanded && (
            <button
              className="expand-button"
              onClick={onToggleExpand}
              title="지도 확대"
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer"
              }}
            >
              확대
            </button>
          )}
        </div>
        <div className="map-viewport" ref={viewportRef}>
          <Map ref={mapRef} />
          {/* 좋아요 장소를 지도에 마커로 표시 */}
          <MyLikedPlaceMarkers regionId={regionId} mapRef={mapRef} />
        </div>
      </section>
    </div>
  );
}