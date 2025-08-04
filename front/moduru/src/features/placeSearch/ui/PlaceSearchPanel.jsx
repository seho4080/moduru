import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

import { usePlaceSearch } from '../model/usePlaceSearch';
import PlaceSearchCard from './PlaceSearchCard';
import './placeSearchPanel.css';

const PlaceSearchPanel = ({ roomId, setHoveredCoords }) => {
  const [selectedCategory, setSelectedCategory] = useState('음식점');
  const { places, loading } = usePlaceSearch(roomId, selectedCategory);

  const categoryOptions = ['음식점', '명소', '축제', '카페'];

  const handleCategoryClick = (label) => {
    setSelectedCategory(label);
  };

  const handleHover = (lat, lng) => {
    setHoveredCoords({ lat, lng });
  };

  const handleHoverOut = () => {
    setHoveredCoords(null);
  };

  return (
    <div className="place-search-panel">
      {/* 검색 바 */}
      <div className="search-wrapper">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="장소 검색 또는 오른쪽 AI를 활용해 검색해보세요."
          />
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
            className={`category-tab ${selectedCategory === label ? 'active' : ''}`}
            onClick={() => handleCategoryClick(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="category-divider-line" />

      {/* 장소 카드 리스트 */}
      <div className="place-card-list">
        {loading ? (
          <p>장소 목록 불러오는 중...</p>
        ) : places.length === 0 ? (
          <p>해당 카테고리에 등록된 장소가 없어요.</p>
        ) : (
          <div className="card-grid">
            {places.map((place) => (
              <PlaceSearchCard
                key={place.placeId}
                place={place}
                roomId={roomId}
                onHover={() => handleHover(place.latitude, place.longitude)}
                onHoverOut={handleHoverOut}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceSearchPanel;
