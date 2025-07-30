// src/features/map/ui/MapControls.js
import React from 'react';
import './MapControls.css';

export default function Controls({
  mode, setMode,
  zoomable, setZoomable,
  zoomIn, zoomOut,
  region, setRegion,
  removeMode, setRemoveMode,
  onDeleteConfirm
}) {
  const toggleMode = (targetMode) => {
    if (removeMode) return;
    setMode(prev => (prev === targetMode ? '' : targetMode)); // 누르면 토글됨
    setRemoveMode(false);
  };

  return (
    <div className="controls-container">
      {/* 핀 추가 모드 */}
      <button
        className={mode === 'marker' && !removeMode ? 'selected_btn' : 'btn'}
        onClick={() => toggleMode('marker')}
        disabled={removeMode}
      >
        핀 추가 모드
      </button>

      {/* 거리 측정 모드 */}
      <button
        className={mode === 'measure' && !removeMode ? 'selected_btn' : 'btn'}
        onClick={() => toggleMode('measure')}
        disabled={removeMode}
      >
        거리 측정 모드
      </button>

      {/* 줌 ON/OFF */}
      <button
        className={zoomable ? 'selected_btn' : 'btn'}
        onClick={() => setZoomable(z => !z)}
      >
        줌 {zoomable ? 'ON' : 'OFF'}
      </button>

      <button className="btn" onClick={zoomIn}>+</button>
      <button className="btn" onClick={zoomOut}>–</button>

      {/* 핀 제거 모드 */}
      {!removeMode ? (
        <button
          className="btn"
          onClick={() => {
            setRemoveMode(true);
            setMode(''); // ❌ 'marker' 말고 빈 문자열로 초기화
          }}
        >
          핀 제거 모드
        </button>
      ) : (
        <>
          <button className="selected_btn" onClick={onDeleteConfirm}>삭제</button>
          <button
            className="btn"
            onClick={() => {
              setRemoveMode(false);
              setMode(''); // ❌ 해제 시에도 초기화
            }}
          >
            취소
          </button>
        </>
      )}

      {/* 지역 설정 */}
      <button
        className={region === 'seoul' ? 'selected_btn' : 'btn'}
        onClick={() => {
          setRemoveMode(false);
          setRegion('seoul');
        }}
      >
        서울
      </button>

      <button
        className={region === 'daejeon' ? 'selected_btn' : 'btn'}
        onClick={() => {
          setRemoveMode(false);
          setRegion('daejeon');
        }}
      >
        대전
      </button>

      <button
        className={region === 'busan' ? 'selected_btn' : 'btn'}
        onClick={() => {
          setRemoveMode(false);
          setRegion('busan');
        }}
      >
        부산
      </button>
    </div>
  );
}
