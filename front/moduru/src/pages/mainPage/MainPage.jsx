import React from "react";
import "./MainPage.css";
import mainArt1 from "../../assets/mainPage.png";

export default function MainPage() {
  return (
    <div className="main-page">
      <div className="main-card" role="region" aria-label="main-card">
        {/* 상단 바 */}
        <div className="card-header">
          <div className="logo-text">MODURU</div>
          <div className="profile-circle" />
        </div>

        {/* 가운데 버튼 */}
        <div className="card-inner">
          <button className="main-btn primary-btn">New 여행방 시작하기</button>
          <button className="main-btn secondary-btn">여행방 목록</button>
        </div>

        {/* 하단 라인 아트: 단일 이미지 */}
        <div className="art-row" aria-hidden>
          <div
            className="art art-single"
            style={{ WebkitMaskImage: `url(${mainArt1})`, maskImage: `url(${mainArt1})` }}
          />
        </div>
      </div>
    </div>
  );
}
