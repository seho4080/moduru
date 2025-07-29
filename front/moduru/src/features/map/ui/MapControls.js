// src/features/map/ui/MapControls.js
import React from 'react';
import './MapControls.css'; // 👈 CSS 따로 분리해도 좋아

export default function Controls({
  mode, setMode,
  zoomable, setZoomable,
  zoomIn, zoomOut,
  region, setRegion,
  removeMode, setRemoveMode,
  onDeleteConfirm
}) {
  return (
    <div className="controls-container">
      <button className={mode==='marker' && !removeMode ? 'selected_btn':'btn'} onClick={()=>{ setRemoveMode(false); setMode('marker'); }} disabled={removeMode}>핀 추가 모드</button>
      <button className={mode==='measure' ? 'selected_btn':'btn'} onClick={()=>{ setRemoveMode(false); setMode('measure'); }} disabled={removeMode}>거리 측정 모드</button>
      <button className={zoomable ? 'selected_btn':'btn'} onClick={()=>setZoomable(z=>!z)}>줌 {zoomable?'ON':'OFF'}</button>
      <button className="btn" onClick={zoomIn}>+</button>
      <button className="btn" onClick={zoomOut}>–</button>

      {!removeMode ? (
        <button className="btn" onClick={() => { setRemoveMode(true); setMode('marker'); }}>핀 제거 모드</button>
      ) : (
        <>
          <button className="selected_btn" onClick={onDeleteConfirm}>삭제</button>
          <button className="btn" onClick={() => { setRemoveMode(false); setMode('marker'); }}>취소</button>
        </>
      )}

      <button className={region==='seoul'?'selected_btn':'btn'} onClick={()=>{ setRemoveMode(false); setRegion('seoul'); }}>서울</button>
      <button className={region==='daejeon'?'selected_btn':'btn'} onClick={()=>{ setRemoveMode(false); setRegion('daejeon'); }}>대전</button>
      <button className={region==='busan'?'selected_btn':'btn'} onClick={()=>{ setRemoveMode(false); setRegion('busan'); }}>부산</button>
    </div>
  );
}
