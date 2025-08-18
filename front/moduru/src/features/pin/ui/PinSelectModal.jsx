// src/features/pin/ui/PinSelectModal.jsx
import React from "react";
import "./pinSelectModal.css";

// NOTE: 자산 import (features/pin/ui → assets/pins 경로)
import pinRed    from "../../../assets/pins/pin_red.png";
import pinOrange from "../../../assets/pins/pin_orange.png";
import pinYellow from "../../../assets/pins/pin_yellow.png";
import pinGreen  from "../../../assets/pins/pin_green.png";
import pinNavy   from "../../../assets/pins/pin_navy.png";
import pinPurple from "../../../assets/pins/pin_purple.png";

// NOTE: navy는 제외
const PIN_ITEMS = [
  { key: "red",    src: pinRed },
  { key: "orange", src: pinOrange },
  { key: "yellow", src: pinYellow },
  { key: "green",  src: pinGreen },
  { key: "blue",   src: pinNavy },
  { key: "purple", src: pinPurple },
];

export default function PinSelectModal({ open, onClose, onSelect }) {
  if (!open) return null;

  const handleSelect = (item) => {
    onSelect?.(item); // { key, src }
    onClose?.();
  };

  return (
    <div
      className="pin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="pin-modal">
        <div className="pin-modal-header">
          <h3 className="pin-modal-title">핀 색상 선택</h3>
          <button
            className="pin-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="pin-grid">
          {PIN_ITEMS.map((it) => (
            <button
              key={it.key}
              className="pin-cell"
              onClick={() => handleSelect(it)}
            >
              <img className="pin-thumb" src={it.src} alt={`${it.key} 핀`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
