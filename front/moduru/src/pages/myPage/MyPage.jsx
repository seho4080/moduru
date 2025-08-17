// src/pages/myPage/MyPage.jsx
import React, { useState } from "react";
import MyProfile from "../../features/profile/ui/MyProfile";
import MyLikeSpace from "./ui/MyLikePlaceContent";
import MyReviewsList from "../../features/myReview/ui/MyReviewsList";
import MyTravelSpacePage from "../myTravelSpacePage/MyTravelSpacePage";
import "./css/MyPage.css";

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("profile"); // travel, profile, liked, reviews

  const renderContent = () => {
    switch (activeTab) {
      case "travel":
        return <MyTravelSpacePage />;
      case "profile":
        return <MyProfile />;
      case "liked":
        return <MyLikeSpace />;
      case "reviews":
        return <MyReviewsList />;
      default:
        return <MyProfile />;
    }
  };

  return (
    <div className="mypage-container">
      <div className="mypage-content">
        {/* 사이드 탭 메뉴 */}
        <aside className="mypage-sidebar">
          <div className="sidebar-header">
            <h2>MODURU</h2>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "travel" ? "active" : ""}`}
              onClick={() => setActiveTab("travel")}
            >
              내 여행 방
            </button>
            <button
              className={`nav-item ${activeTab === "liked" ? "active" : ""}`}
              onClick={() => setActiveTab("liked")}
            >
              찜한 장소
            </button>
            <button
              className={`nav-item ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              작성한 리뷰
            </button>
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              내 정보
            </button>
          </nav>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <main className={`mypage-main ${activeTab === "liked" ? "is-liked" : ""}`}>
          {/* ✅ 영역 정렬/높이 맞춤을 위한 공통 랩퍼 */}
          <div className="main-scroll">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
