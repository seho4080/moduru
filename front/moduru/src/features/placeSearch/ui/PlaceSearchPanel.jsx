// src/features/placeSearch/ui/PlaceSearchPanel.jsx
import React, { useState, useMemo, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

import { usePlaceSearch } from "../model/usePlaceSearch";
import useLocalPaging from "../model/useLocalPaging";
import PlaceSearchList from "./PlaceSearchList";
import "./placeSearchPanel.css";

const PAGE_SIZE = 20;

const PlaceSearchPanel = ({ roomId, region }) => {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const categoryOptions = ["전체", "음식점", "명소", "축제", "My 장소"];

  const handleCategoryClick = (label) => {
    setSelectedCategory(label);
    // 탭 전환 시에도 맨 위로
    if (listRef.current)
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { places = [], loading } = usePlaceSearch(
    roomId,
    selectedCategory,
    region
  );

  // placeId 누락/중첩 방어
  const normalized = useMemo(
    () =>
      places.map((p, idx) => ({
        ...p,
        placeId:
          typeof p.placeId === "object"
            ? p.placeId?.placeId
            : p.placeId ?? p.id ?? idx,
      })),
    [places]
  );

  const pager = useLocalPaging(normalized, PAGE_SIZE);
  const { slice, page, totalPages, total, hasPrev, hasNext, prev, next } =
    pager;

  // ✅ 리스트 컨테이너 ref
  const listRef = useRef(null);

  // ✅ 스크롤 헬퍼
  const scrollToTop = () => {
    if (listRef.current)
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    prev();
    scrollToTop();
  };

  const handleNext = () => {
    next();
    scrollToTop();
  };

  return (
    <div className="place-search-panel">
      {/* 검색창 */}
      <div className="search-wrapper">
        <div className="input-wrapper">
          <input type="text" placeholder="오른쪽 AI를 활용해 검색해보세요." />
          <span className="search-icon-inside">
            <FiSearch />
          </span>
        </div>
        <button className="ai-robot-btn" title="AI 추천">
          <FaRobot />
        </button>
      </div>

      {/* 카테고리 탭 */}
      <div className="category-tabs">
        {categoryOptions.map((label) => (
          <button
            key={label}
            className={`category-tab ${
              selectedCategory === label ? "active" : ""
            }`}
            onClick={() => handleCategoryClick(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 구분선 */}
      <div className="category-divider-line" />

      {/* 장소 리스트 + 페이지네이션 */}
      <div className="place-card-list" ref={listRef}>
        {loading ? (
          <p>장소 목록 불러오는 중...</p>
        ) : normalized.length === 0 ? (
          <p>해당 카테고리에 등록된 장소가 없어요.</p>
        ) : (
          <>
            <PlaceSearchList places={slice} roomId={roomId} />

            <div className="pager">
              <button onClick={handlePrev} disabled={!hasPrev}>
                이전
              </button>
              <span className="pager-info">
                {page} / {totalPages} (총 {total}개)
              </span>
              <button onClick={handleNext} disabled={!hasNext}>
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaceSearchPanel;
