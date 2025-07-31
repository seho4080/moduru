import React, { useState, useRef, useCallback } from 'react';
import SidebarContainer from '../../widgets/sidebar/SidebarContainer';
import Controls from '../../features/map/ui/MapControls';
import KakaoMap from '../../features/map/ui/KakaoMap';

export default function TripRoomPage() {
  const [mode, setMode] = useState('marker');
  const [zoomable, setZoomable] = useState(true);
  const [region, setRegion] = useState(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set());
  const mapRef = useRef();

  const handleDeleteConfirm = () => {
    if (toRemove.size === 0) {
      alert('삭제할 핀을 먼저 선택하세요.');
      return;
    }
    if (window.confirm('삭제하시겠습니까?')) {
      toRemove.forEach(mk => mk.setMap(null));
      setToRemove(new Set());
      setRemoveMode(false);
      setMode('marker');
    }
  };

  // ✅ useCallback으로 안정화
  const onSelectMarker = useCallback((selSet) => {
    setToRemove(new Set(selSet));
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarContainer />
      <div style={{ flex: 1, position: 'relative' }}>
        <Controls
          mode={mode} setMode={setMode}
          zoomable={zoomable} setZoomable={setZoomable}
          zoomIn={() => mapRef.current.zoomIn()}
          zoomOut={() => mapRef.current.zoomOut()}
          region={region} setRegion={setRegion}
          removeMode={removeMode} setRemoveMode={setRemoveMode}
          onDeleteConfirm={handleDeleteConfirm}
        />
        <KakaoMap
          ref={mapRef}
          mode={mode}
          zoomable={zoomable}
          region={region}
          removeMode={removeMode}
          onSelectMarker={onSelectMarker}
        />
      </div>
    </div>
  );
}
