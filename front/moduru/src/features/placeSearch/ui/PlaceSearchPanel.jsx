import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

import { usePlaceSearch } from "../model/usePlaceSearch";
import PlaceSearchList from "./PlaceSearchList";
import "./placeSearchPanel.css";

const PlaceSearchPanel = ({ roomId, region }) => {
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const categoryOptions = ['전체', '음식점', '명소', '축제', 'My 장소'];

  const handleCategoryClick = (label) => {
    setSelectedCategory(label);
  };

  const { places, loading } = usePlaceSearch(roomId, selectedCategory, region);

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

      {/* 카테고리 탭 (My 장소 포함) */}
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

      {/* 구분선: 탭 아래로 이동 */}
      <div className="category-divider-line" />

      {/* 장소 리스트 */}
      <div className="place-card-list">
        {loading ? (
          <p>장소 목록 불러오는 중...</p>
        ) : places.length === 0 ? (
          <p>해당 카테고리에 등록된 장소가 없어요.</p>
        ) : (
          <PlaceSearchList places={places} roomId={roomId} />
        )}
      </div>
    </div>
  );
};

export default PlaceSearchPanel;
