// src/features/placeSearch/ui/PlaceSearchPanel.jsx
import React, { useState, useEffect } from 'react';
import './PlaceSearchPanel.css';
import { FiSearch } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

export default function PlaceSearchPanel({ roomId }) {
  const [selectedCategory, setSelectedCategory] = useState('음식점');
  const filterOptions = ['전체'];
  const categoryOptions = ['음식점', '카페', '명소', '숙소', '축제'];

  // ✅ 카테고리 이름(한글) → API 키(영문) 매핑
  const categoryMap = {
    전체: 'all',
    음식점: 'restaurant',
    카페: 'cafe',
    명소: 'attraction',
    숙소: 'stay',
    축제: 'etc',
  };

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const categoryKey = categoryMap[selectedCategory]; // ✅ 한글 → 영문 변환
        const res = await fetch(`http://localhost:8080/places/${roomId}?category=${categoryKey}`);
        const data = await res.json();
        console.log('📍 장소 목록:', data); // ✅ 콘솔에 출력
      } catch (err) {
        console.error('🚨 API 오류: 장소 불러오기 실패', err);
      }
    };

    if (roomId && selectedCategory) {
      fetchPlaces();
    }
  }, [selectedCategory, roomId]);

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
    </div>
  );
}
