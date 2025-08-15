// src/pages/myLikePlacePage/MyLikeSpace.jsx
import React, { useRef, useState } from "react";
import SideMenuBox from "./SideMenuBox";
import Map from "./Map";
import "./myLikePlacePage.css";

// 추가: 지도에 핀 꽂기 전용 컴포넌트
import MyLikedPlaceMarkers from "../../features/myLikedPlace/ui/MyLikedPlaceMarkers";

export default function MyLikeSpace() {
  const mapRef = useRef(null);
  const [regionId, setRegionId] = useState(undefined); // 선택적 지역 필터

  return (
    <div className="like-page">
      {/* 가운데 정렬 + 최대폭 제한 래퍼 */}
      <div className="like-content">
        {/* 좌측 사이드 메뉴 (지역 선택 시 setRegionId 호출해주면 됨) */}
        <SideMenuBox onChangeRegion={setRegionId} />

        {/* 우측 지도 카드 */}
        <section className="map-card">
          <div className="map-viewport">
            <Map ref={mapRef} />
            {/* 추가: 좋아요 장소를 지도에 마커로 표시 */}
            <MyLikedPlaceMarkers regionId={regionId} mapRef={mapRef} />
          </div>
        </section>
      </div>
    </div>
  );
}
