import React, { useRef, useState, useEffect } from 'react';
import PlaceSearchPanel from '../../features/placeSearch/ui/PlaceSearchPanel';

export default function SidebarPanel({ activeTab }) {
  const panelRef = useRef(null);
  const [width, setWidth] = useState(420);
  const isResizing = useRef(false);

  // ✅ 사용자 선택 방지 클래스 적용
  useEffect(() => {
    if (isResizing.current) {
      document.body.classList.add('resizing');
    } else {
      document.body.classList.remove('resizing');
    }
  }, [isResizing.current]);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - panelRef.current.getBoundingClientRect().left;
    setWidth(Math.max(280, Math.min(720, newWidth))); // 🔹 범위 안쪽에서 계속 동작함
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const isOpenTab = activeTab === 'place' || activeTab === 'schedule';
  if (!isOpenTab) return null;

  return (
    <div
      ref={panelRef}
      style={{
        width: `${width}px`,
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden', // ✅ 스크롤 제거
        userSelect: isResizing.current ? 'none' : 'auto',
      }}
    >
      <div style={{ flex: 1, padding: '20px', overflow: 'hidden' }}> {/* 내부 스크롤 제거 */}
        {activeTab === 'place' && <PlaceSearchPanel />}
        {activeTab === 'schedule' && <div>일정 편집 패널 (추후 구현)</div>}
      </div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: '#ccc',
        }}
      />
    </div>
  );
}
