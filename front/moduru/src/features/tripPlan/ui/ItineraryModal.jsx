import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import ItineraryDayCard from "./ItineraryDayCard";
import "./ItineraryModal.css";
import { openTripForm } from "../../../redux/slices/uiSlice";

// NOTE: 날짜 유틸
const toDate = (x) => (x instanceof Date ? x : new Date(x));
const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const rangeInclusive = (sISO, eISO) => {
  if (!sISO && !eISO) return [new Date()];
  const s = sISO ? toDate(sISO) : new Date();
  const e = eISO ? toDate(eISO) : s;
  const out = [];
  for (let d = new Date(s); d <= e; d = addDays(d, 1)) out.push(new Date(d));
  return out;
};
const yymmdd = (d) =>
  `${String(d.getFullYear()).slice(-2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
const yyyy_mm_dd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function ItineraryModal(props) {
  return createPortal(<ModalInner {...props} />, document.body);
}

function ModalInner({ onClose }) {
  const dispatch = useDispatch();
  const { startDate, endDate } = useSelector((s) => s.tripRoom ?? {});
  const daysMap = useSelector((s) => s.itinerary?.days || {}); // NOTE: { [dateKey]: Place[] }

  const panelRef = useRef(null);
  const headerRef = useRef(null);

  const days = useMemo(
    () =>
      rangeInclusive(startDate, endDate).map((d) => ({
        label: yymmdd(d),        // 화면 표시용: 25.07.18
        key: yyyy_mm_dd(d),      // 상태 키: 2025-07-18
        dateObj: d,
      })),
    [startDate, endDate]
  );

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

  useEffect(() => {
    const panel = panelRef.current;
    const handle = headerRef.current;
    if (!panel || !handle) return;
    let dragging = false, dx = 0, dy = 0;

    const down = (e) => {
      dragging = true;
      const r = panel.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
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

  const trackWidth = days.length * 460 + Math.max(0, days.length - 1) * 24;

  return (
    <div className="itin-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="itin-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: "translate(-50%, -50%)", width: "920px", maxWidth: "98vw", maxHeight: "96vh" }}
      >
        <div className="itin-header" ref={headerRef} title="드래그해서 이동">
          <div className="itin-title">일정 편집</div>
          <div className="itin-actions">
            {/* NOTE: 날짜 변경은 기존 전역 TripCreateForm 열기만 */}
            <button type="button" className="btn ghost" onClick={() => dispatch(openTripForm())}>
              날짜 변경
            </button>
            <button type="button" className="btn icon" aria-label="닫기" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="itin-body">
          <div className="cards-shell">
            <div className="cards-track" style={{ width: `${trackWidth}px` }}>
              {days.map((d, i) => (
                <div className="day-wrap" key={d.key}>
                  <div className="day-label">{d.label}</div>
                  <ItineraryDayCard
                    dateKey={d.key}
                    dateLabel={d.label}
                    items={daysMap[d.key] || []}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
