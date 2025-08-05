import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

import { usePlaceSearch } from '../model/usePlaceSearch';
import PlaceSearchList from './PlaceSearchList';
import './placeSearchPanel.css';

const PlaceSearchPanel = ({ roomId, region }) => {
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // NOTE: 선택된 카테고리 또는 지역이 바뀔 때마다 검색 요청
  const { places, loading } = usePlaceSearch(roomId, selectedCategory, region);

  const categoryOptions = ['전체', '음식점', '명소', '축제'];

  const handleCategoryClick = (label) => {
    setSelectedCategory(label);
  };

  return (
    <div className="place-search-panel">
      <div className="search-wrapper">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="오른쪽 AI를 활용해 검색해보세요."
          />
          <span className="search-icon-inside">
            <FiSearch />
          </span>
        </div>
        <button className="ai-robot-btn" title="AI 추천">
          <FaRobot />
        </button>
      </div>

      <div className="category-tabs">
        {categoryOptions.map((label) => (
          <button
            key={label}
            className={`category-tab ${selectedCategory === label ? 'active' : ''}`}
            onClick={() => handleCategoryClick(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="category-divider-line" />

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
