// src/features/map/ui/MapControls.jsx
import React, { useState, useCallback } from 'react';
import './mapControls.css';
import {
  FaClipboard,
  FaMapMarkerAlt,
  FaCircle,
  FaRuler,
  FaPlus,
  FaMinus
} from 'react-icons/fa';

import CustomSelectModal from './CustomSelectModal';
import CustomPlace from './CustomPlace';   

export default function Controls({
  mode, setMode,
  zoomIn, zoomOut,
  removeMode, setRemoveMode,
  onDeleteConfirm
}) {
  const [choiceOpen, setChoiceOpen] = useState(false);     // 선택 모달
  const [customPlaceOpen, setCustomPlaceOpen] = useState(false); // ★ 주소 등록 모달

  const clearDistanceMode = () => {
    if (window.kakao?.maps) {
      const overlays = document.querySelectorAll('.dot, .dotOverlay');
      overlays.forEach(el => el.remove());
    }
  };

  const toggleMode = (targetMode) => {
    if (removeMode) return;
    if (mode === 'measure' && targetMode === 'measure') clearDistanceMode();
    setMode(prev => (prev === targetMode ? '' : targetMode));
    setRemoveMode(false);
  };

  const handleRemoveToggle = () => {
    setRemoveMode(true);
    setMode('');
  };

  const handleRemoveCancel = () => {
    setRemoveMode(false);
    setMode('');
  };

  // 장소(핀) 버튼 → 선택 모달 열기
  const openChoice = useCallback(() => {
    if (removeMode) return;
    setChoiceOpen(true);
  }, [removeMode]);

  // 선택 모달: 핀 등록
  const handleChoosePin = useCallback(() => {
    setRemoveMode(false);
    setMode('marker');
    setChoiceOpen(false);
  }, [setMode, setRemoveMode]);

  // 선택 모달: 주소 등록 → CustomPlace 모달 오픈
  const handleChooseAddress = useCallback(() => {
    setChoiceOpen(false);
    setCustomPlaceOpen(true);          // ★ 열기
  }, []);

  return (
    <>
      <div className="controls-container">
        <button className="map-btn" onClick={zoomIn}><FaPlus className="map-icon" /></button>
        <button className="map-btn" onClick={zoomOut}><FaMinus className="map-icon" /></button>

        <div style={{ height: '20px' }} />

        <button className="map-btn">
          <FaClipboard className="map-icon" />
          <span>테마</span>
        </button>

        <button
          className={`map-btn ${mode === 'circle' ? 'selected' : ''}`}
          onClick={() => toggleMode('circle')}
        >
          <FaCircle className="map-icon" />
          <span>반경</span>
        </button>

        <button
          className={`map-btn ${mode === 'measure' ? 'selected' : ''}`}
          onClick={() => toggleMode('measure')}
        >
          <FaRuler className="map-icon" />
          <span>거리</span>
        </button>

        <button
          className={`map-btn ${mode === 'marker' && !removeMode ? 'selected' : ''}`}
          onClick={openChoice}
          disabled={removeMode}
        >
          <FaMapMarkerAlt className="map-icon" />
          <span>장소</span>
        </button>

        {!removeMode ? (
          <button className="map-btn" onClick={handleRemoveToggle}><span>제거</span></button>
        ) : (
          <>
            <button className="map-btn selected" onClick={onDeleteConfirm}><span>삭제</span></button>
            <button className="map-btn" onClick={handleRemoveCancel}><span>취소</span></button>
          </>
        )}
      </div>

      {/* 주소/핀 선택 모달 */}
      <CustomSelectModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onChooseAddress={handleChooseAddress}
        onChoosePin={handleChoosePin}
      />

      {/* ★ 주소 등록 모달 */}
      {customPlaceOpen && (
        <CustomPlace
          open={customPlaceOpen}
          onClose={() => setCustomPlaceOpen(false)}
          // onSearch={async (q) => { ... 실제 검색 API 연결해도 됨 }}
        />
      )}
    </>
  );
}
