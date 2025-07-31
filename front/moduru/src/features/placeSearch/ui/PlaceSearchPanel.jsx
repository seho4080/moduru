import React, { useState } from 'react';
import './PlaceSearchPanel.css';
import { FiSearch } from 'react-icons/fi';

export default function PlaceSearchPanel() {
  const [selectedCategory, setSelectedCategory] = useState('음식점');

  const filterOptions = ['전체'];
  const categoryOptions = ['음식점', '카페', '명소', '숙소', '축제'];

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

      {/* ✅ 위쪽 필터 버튼 (전체) */}
      <div className="filter-buttons">
        {filterOptions.map((label) => (
          <button
            key={label}
            className={`category-tab ${selectedCategory === label ? 'active' : ''}`}
            onClick={() => setSelectedCategory(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="divider-line"></div>

      {/* ✅ 아래 카테고리 */}
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
