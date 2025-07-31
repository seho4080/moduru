import React, { useState } from 'react';
import './PlaceSearchPanel.css';
import { FiSearch } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

export default function PlaceSearchPanel() {
  const [selectedCategory, setSelectedCategory] = useState('음식점');
  const filterOptions = ['전체'];
  const categoryOptions = ['음식점', '카페', '명소', '숙소', '축제'];

  return (
    <div className="place-search-panel">
      {/* ✅ 검색바 전체 묶기 */}
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
    </div>
  );
}
