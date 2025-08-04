// src/features/placeSearch/ui/PlaceSearchPanel.jsx
import React, { useState } from 'react';
import './PlaceSearchPanel.css';
import { FiSearch } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

import { usePlaceSearch } from '../../placeSearch/model/usePlaceSearch';
import PlaceSearchCard from './PlaceSearchCard';

export default function PlaceSearchPanel({ roomId, setHoveredCoords }) {
  const [selectedCategory, setSelectedCategory] = useState('음식점');
  const { places, loading } = usePlaceSearch(roomId, selectedCategory);

  const filterOptions = ['전체'];
  const categoryOptions = ['음식점', '카페', '명소', '숙소', '축제'];

  return (
    <div className="place-search-panel">
      {/* ✅ 검색바 */}
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

      {/* ✅ 필터 버튼 */}
      <div className="filter-buttons">
        {filterOptions.map((label) => (
          <button
            key={label}
            className={`filter-button ${selectedCategory === label ? 'active' : ''}`}
            onClick={() => setSelectedCategory(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="divider-line" />

      {/* ✅ 카테고리 탭 */}
      <div className="category-tabs">
        {categoryOptions.map((label) => (
          <button
            key={label}
            className={`category-tab ${selectedCategory === label ? 'active' : ''}`}
            onClick={() => setSelectedCategory(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ✅ 장소 카드 리스트 */}
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
                roomId={roomId} // ✅ 추가!
                onHover={() => setHoveredCoords({ lat: place.latitude, lng: place.longitude })}
                onHoverOut={() => setHoveredCoords(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
