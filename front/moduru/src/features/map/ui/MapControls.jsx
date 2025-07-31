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
    setMode(prev => (prev === targetMode ? '' : targetMode));
    setRemoveMode(false);
  };

  return (
    <div className="controls-container">

      {/* ✅ 줌 버튼 (오른쪽 정렬) */}
      <div className="zoom-btn-wrapper">
        <button className="zoom-btn" onClick={zoomIn}>+</button>
        <button className="zoom-btn" onClick={zoomOut}>–</button>
      </div>

      {/* ✅ 핀 추가 모드 */}
      <button
        className={mode === 'marker' && !removeMode ? 'selected_btn' : 'btn'}
        onClick={() => toggleMode('marker')}
        disabled={removeMode}
      >
        핀 추가 모드
      </button>

      {/* ✅ 거리 측정 모드 */}
      <button
        className={mode === 'measure' && !removeMode ? 'selected_btn' : 'btn'}
        onClick={() => toggleMode('measure')}
        disabled={removeMode}
      >
        거리 측정 모드
      </button>

      {/* ✅ 핀 제거 모드 */}
      {!removeMode ? (
        <button
          className="btn"
          onClick={() => {
            setRemoveMode(true);
            setMode('');
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
              setMode('');
            }}
          >
            취소
          </button>
        </>
      )}

      {/* ✅ 지역 설정 (서울, 대전, 부산) */}
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
