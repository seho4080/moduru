// src/widgets/sidebar/SidebarPanel.js
import React, { useRef, useState, useEffect } from 'react';
import PlaceSearchPanel from '../../features/placeSearch/ui/PlaceSearchPanel';

export default function SidebarPanel({ activeTab, onClosePanel, onOpenPanel }) {
  const panelRef = useRef(null);
  const [width, setWidth] = useState(520);
  const [isOpen, setIsOpen] = useState(true);
  const isResizing = useRef(false);

  const handleClose = () => {
    setIsOpen(false);
    onClosePanel?.();
  };

  const handleOpen = () => {
    setIsOpen(true);
    onOpenPanel?.();
  };

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - panelRef.current.getBoundingClientRect().left;
    setWidth(Math.max(280, Math.min(720, newWidth)));
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    document.body.style.cursor = isResizing.current ? 'col-resize' : 'default';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isResizing.current]);

  const showPanel = isOpen && (activeTab === 'place' || activeTab === 'pick' || activeTab === 'schedule');

  if (!showPanel) {
    return (
      <div
        style={{
          width: '40px',
          height: '100vh',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '4px 0 10px rgba(0,0,0,0.08)',
        }}
        onClick={handleOpen}
      >
        <button
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#e6f0ff')}
          onMouseOut={e => (e.currentTarget.style.background = '#fff')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 5l6 5-6 5" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

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
        userSelect: isResizing.current ? 'none' : 'auto',
      }}
    >
      <div style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        {activeTab === 'place' && <PlaceSearchPanel />}
        {activeTab === 'pick' && <div>My 장소 패널 (추후 구현)</div>}
        {activeTab === 'schedule' && <div>일정 편집 패널 (추후 구현)</div>}
      </div>

      <div
        style={{
          width: '40px',
          backgroundColor: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={handleClose}
      >
        <button
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#e6f0ff')}
          onMouseOut={e => (e.currentTarget.style.background = '#fff')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 5l-6 5 6 5" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
