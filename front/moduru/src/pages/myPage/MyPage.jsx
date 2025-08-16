import React, { useState } from "react";
import MyProfile from "../../features/profile/ui/MyProfile";
import MyLikeSpace from "./ui/MyLikePlaceContent";  
import MyReviewsList from "../../features/myReview/ui/MyReviewsList";
import "./css/MyPage.css"; 

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("profile"); // profile, liked, reviews
  const [isExpanded, setIsExpanded] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
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
    <div className={`mypage-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="mypage-content">
        {/* 사이드 탭 메뉴 */}
        <aside className={`mypage-sidebar ${isExpanded ? 'hidden' : ''}`}>
          <div className="sidebar-header">
            <h2>마이페이지</h2>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              내 정보
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
          </nav>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <main className={`mypage-main ${isExpanded ? 'full-width' : ''}`}>
          {/* 사이드바 토글 버튼 */}
          <div className="sidebar-toggle">
            <button 
              className="toggle-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "사이드바 열기" : "사이드바 닫기"}
            >
              <span className={`arrow ${isExpanded ? 'right' : 'left'}`}>
                {isExpanded ? '▶' : '◀'}
              </span>
            </button>
          </div>
          
          {renderContent()}
        </main>
      </div>
    </div>
  );
}