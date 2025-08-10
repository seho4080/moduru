// src/features/map/ui/Controls.jsx
import React from 'react';
import './mapControls.css';
import {
  FaClipboard,
  FaMapMarkerAlt,
  FaCircle,
  FaRuler,
  FaPlus,
  FaMinus
} from 'react-icons/fa';

export default function Controls({
  mode, setMode,
  zoomIn, zoomOut,
  removeMode, setRemoveMode,
  onDeleteConfirm
}) {
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

  return (
    <div className="controls-container">
      <button className="map-btn" onClick={zoomIn}>
        <FaPlus className="map-icon" />
      </button>

      <button className="map-btn" onClick={zoomOut}>
        <FaMinus className="map-icon" />
      </button>

      <div style={{ height: '20px' }}></div>

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
        onClick={() => toggleMode('marker')}
        disabled={removeMode}
      >
        <FaMapMarkerAlt className="map-icon" />
        <span>장소</span>
      </button>

      {!removeMode ? (
        <button className="map-btn" onClick={handleRemoveToggle}>
          <span>제거</span>
        </button>
      ) : (
        <>
          <button className="map-btn selected" onClick={onDeleteConfirm}>
            <span>삭제</span>
          </button>
          <button className="map-btn" onClick={handleRemoveCancel}>
            <span>취소</span>
          </button>
        </>
      )}
    </div>
  );
}
