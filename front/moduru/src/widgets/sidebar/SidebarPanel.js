// src/SidebarPanel.js
import React, { useRef, useState } from 'react';

export default function SidebarPanel({ activeTab }) {
  const panelRef = useRef(null);
  const [width, setWidth] = useState(420);
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - panelRef.current.getBoundingClientRect().left;
    if (newWidth > 280 && newWidth < 720) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (!activeTab) return null;

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
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>{activeTab} 콘텐츠 영역</h2>
      </div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: '#ccc',
        }}
      ></div>
    </div>
  );
}
