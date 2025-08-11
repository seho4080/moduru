// src/features/itinerary/ui/ItineraryModal.jsx
import { useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryModal.css";
import { openTripForm } from "../../../redux/slices/uiSlice";

/**
 * 일정 편집 모달(보드 버전)
 * - 헤더 드래그로 패널 이동 가능
 * - 본문에는 ItineraryBoard만 배치(날짜 열/드래그/시간편집 모두 보드가 담당)
 */
export default function ItineraryModal(props) {
  return createPortal(<ModalInner {...props} />, document.body);
}

function ModalInner({ onClose }) {
  const dispatch = useDispatch();
  const panelRef = useRef(null);
  const headerRef = useRef(null);

  // Esc로 닫기 + body 스크롤 잠금
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // 헤더 드래그로 패널 이동
  useEffect(() => {
    const panel = panelRef.current;
    const handle = headerRef.current;
    if (!panel || !handle) return;

    let dragging = false;
    let dx = 0,
      dy = 0;

    const down = (e) => {
      dragging = true;
      const r = panel.getBoundingClientRect();
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;
      panel.classList.add("dragging");
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };
    const move = (e) => {
      if (!dragging) return;
      panel.style.left = `${e.clientX - dx}px`;
      panel.style.top = `${e.clientY - dy}px`;
      panel.style.transform = "none";
      panel.style.position = "fixed";
    };
    const up = () => {
      dragging = false;
      panel.classList.remove("dragging");
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };

    handle.addEventListener("mousedown", down);
    return () => handle.removeEventListener("mousedown", down);
  }, []);

  return (
    <div
      className="itin-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="itin-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: "translate(-50%, -50%)",
          width: "920px",
          maxWidth: "98vw",
          maxHeight: "96vh",
        }}
      >
        <div className="itin-header" ref={headerRef} title="드래그해서 이동">
          <div className="itin-title">일정 편집</div>
          <div className="itin-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => dispatch(openTripForm())}
            >
              날짜 변경
            </button>
            <button
              type="button"
              className="btn icon"
              aria-label="닫기"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="itin-body">
          {/* 날짜 열/드래그/시간 편집/삭제는 보드가 모두 처리 */}
          <ItineraryBoard />
        </div>
      </div>
    </div>
  );
}
