// src/features/map/ui/PlaceChoiceModal.jsx
import React from 'react';
import './customSelectModal.css';

export default function CustomSelectModal({
  open,
  onClose,
  onChooseAddress,
  onChoosePin,
}) {
  if (!open) return null;

  // 오버레이 클릭 시 모달 닫기 (단, 내부 클릭은 닫히지 않음)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="choice-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="choice-modal">
        {/* X 버튼 제거됨 */}
        <div className="choice-actions">
          <button className="choice-action" onClick={onChooseAddress}>
            주소 등록
          </button>
          <button className="choice-action primary" onClick={onChoosePin}>
            핀 등록
          </button>
        </div>
      </div>
    </div>
  );
}
