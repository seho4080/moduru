// src/features/tripPlanOptimize/ui/RouteModal.jsx

import React, { useRef, useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./routeModal.css";

const RouteModal = ({ onClose }) => {
  const modalRef = useRef(null);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const modal = modalRef.current;
      modal.style.left = `${e.clientX - dragOffset.x}px`;
      modal.style.top = `${e.clientY - dragOffset.y}px`;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e) => {
    const modal = modalRef.current;
    const rect = modal.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="route-modal-overlay">
      <div
        className="route-modal"
        ref={modalRef}
        style={{
          position: "absolute",
          left: "calc(50% - 400px)",
          top: "calc(50% - 250px)",
        }}
      >
        {/* 드래그 영역 */}
        <div className="route-modal-header" onMouseDown={handleMouseDown}>
          <button className="route-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <p className="route-modal-text">장소를 선택해주세요.</p>
      </div>
    </div>
  );
};

export default RouteModal;
