import React from "react";
import SideMenuBox from "./SideMenuBox";
import Map from "./Map";
import "./myLikePlace.css";

export default function MyLikeSpace() {
  return (
    <div className="like-page">
      {/* 가운데 정렬 + 최대폭 제한 래퍼 */}
      <div className="like-content">
        {/* 좌측 사이드 메뉴 */}
        <SideMenuBox />

        {/* 우측 지도 카드 */}
        <section className="map-card">
          <div className="map-viewport">
            <Map />
          </div>
        </section>
      </div>
    </div>
  );
}
