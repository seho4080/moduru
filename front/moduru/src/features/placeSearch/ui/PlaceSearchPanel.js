import React, { useState } from 'react';
import './PlaceSearchPanel.css';
import { FiSearch } from 'react-icons/fi';

export default function PlaceSearchPanel() {
  const [selectedCategory, setSelectedCategory] = useState('음식점');

  return (
    <div className="place-search-panel">
      <div className="search-bar">
        <input
          type="text"
          placeholder="장소 검색 또는 오른쪽 AI를 활용해 검색해보세요."
        />
        <div className="search-controls">
          <span className="ai-circle">AI</span>
          <FiSearch className="search-icon" size={18} />
        </div>
      </div>

      <div className="filter-buttons">
        <button className="filter-button">전체</button>
        <button className="filter-button">My 장소</button>
      </div>

      <div className="divider-line"></div>

      <div className="category-tabs">
        {['음식점', '카페', '명소', '숙소', '축제'].map((label) => (
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
