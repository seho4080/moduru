import React, { useState, useMemo, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

import { usePlaceSearch } from "../model/usePlaceSearch";
import useLocalPaging from "../model/useLocalPaging";
import PlaceSearchList from "./PlaceSearchList";
import "./placeSearchPanel.css";

// NOTE: 추가
import { useKeywordSearch } from "../../keyWordSearch/model/useKeywordSearch";

const PAGE_SIZE = 20;
const CATEGORY_OPTIONS = ["전체", "음식점", "명소", "축제", "My 장소"];

const PlaceSearchPanel = ({ roomId }) => {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const listRef = useRef(null);

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCategoryClick = (label) => {
    setSelectedCategory(label);
    scrollToTop();
  };

  // 카테고리 데이터
  const { places = [], loading: categoryLoading } = usePlaceSearch(roomId, selectedCategory);

  // 키워드 검색 훅
  const {
    keyword,
    isKeywordMode,
    loading: keywordLoading,
    results: keywordResults,
    error: keywordError,
    onChange,
    onSubmit,
    clear,
  } = useKeywordSearch(roomId);

  // 현재 표시할 원본 리스트 선택
  const rawList = isKeywordMode ? keywordResults : places;
  const loading = isKeywordMode ? keywordLoading : categoryLoading;

  // placeId 안정화
  const normalized = useMemo(
    () =>
      rawList.map((p, idx) => ({
        ...p,
        placeId: typeof p.placeId === "object" ? p.placeId?.placeId : p.placeId ?? p.id ?? idx,
      })),
    [rawList]
  );

  // 로컬 페이징
  const pager = useLocalPaging(normalized, PAGE_SIZE);
  const { slice, page, totalPages, total, hasPrev, hasNext, prev, next } = pager;

  const handlePrev = () => {
    prev();
    scrollToTop();
  };
  const handleNext = () => {
    next();
    scrollToTop();
  };

  // 엔터 제출
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit();
      scrollToTop();
    }
  };

  // 돋보기 클릭
  const handleSearchClick = () => {
    onSubmit();
    scrollToTop();
  };

  // 입력 지우기(탭 복귀)
  const handleClear = () => {
    clear();
    scrollToTop();
  };

  return (
    <div className="place-search-panel">
      {/* 검색창 */}
      <div className="search-wrapper">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="오른쪽 AI를 활용해 검색해보세요."
            value={keyword}
            onChange={onChange}
            onKeyDown={handleKeyDown}
          />
          {/* NOTE: X(지우기) 버튼을 왼쪽에 배치 */}
          {keyword && (
            <button
              className="clear-icon-inside"
              onClick={handleClear}
              type="button"
              aria-label="지우기"
            >
              ×
            </button>
          )}
          {/* NOTE: 🔍 검색 버튼을 맨 오른쪽에 배치 */}
          <button
            className="search-icon-inside"
            onClick={handleSearchClick}
            type="button"
            aria-label="검색"
          >
            <FiSearch />
          </button>
        </div>
        <button className="ai-robot-btn" title="AI 추천" type="button">
          <FaRobot />
        </button>
      </div>

      {/* 카테고리 탭: 키워드 모드일 땐 숨김 */}
      {!isKeywordMode && (
        <>
          <div className="category-tabs">
            {CATEGORY_OPTIONS.map((label) => (
              <button
                key={label}
                className={`category-tab ${selectedCategory === label ? "active" : ""}`}
                onClick={() => handleCategoryClick(label)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="category-divider-line" />
        </>
      )}

      {/* 리스트 */}
      <div className="place-card-list" ref={listRef}>
        {loading ? (
          <p>장소 목록 불러오는 중...</p>
        ) : normalized.length === 0 ? (
          <p>{isKeywordMode ? "검색 결과가 없습니다." : "해당 카테고리에 등록된 장소가 없어요."}</p>
        ) : (
          <>
            <PlaceSearchList places={slice} roomId={roomId} />
            <div className="pager">
              <button onClick={handlePrev} disabled={!hasPrev} type="button">
                이전
              </button>
              <span className="pager-info">
                {page} / {totalPages} (총 {total}개)
              </span>
              <button onClick={handleNext} disabled={!hasNext} type="button">
                다음
              </button>
            </div>
          </>
        )}
        {isKeywordMode && keywordError && <p className="error-text">{keywordError}</p>}
      </div>
    </div>
  );
};

export default PlaceSearchPanel;
