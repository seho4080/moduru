// src/features/map/ui/ConfirmPlaceModal.jsx
import React from "react";
import "./customSelectModal.css";

export default function ConfirmPlaceModal({
  open,
  name,
  address,
  lat,
  lng,
  loading = false,
  onConfirm,  
  onReject,   
  onClose,   
}) {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleYes = () => {
    if (loading) return;
    onConfirm?.();
    onClose?.();   
  };

  const handleNo = () => {
    if (loading) return;
    onReject?.();  
    onClose?.();   
  };

  return (
    <div
      className="choice-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="choice-modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="choice-title"
          style={{ marginBottom: 8, fontWeight: 700 }}
        >
          공유 장소에 등록하시겠습니까?
        </div>

        {address ? <div className="choice-desc">주소: {address}</div> : null}


        <div className="choice-actions" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="choice-action"
            onClick={handleNo}
            disabled={loading}
          >
            아니오
          </button>
          <button
            type="button"
            className="choice-action primary"
            onClick={handleYes}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "처리 중…" : "예"}
          </button>
        </div>
      </div>
    </div>
  );
}
