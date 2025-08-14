// src/features/itinerary/ui/ItineraryItemCard.jsx
import { useDispatch } from "react-redux";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  setTimes as setTimesAction,
  removeItem as removeItemAction,
} from "../../../redux/slices/itinerarySlice";
import TimeEditor from "./TimeEditor";
import "./ItineraryItemCard.css";

/**
 * ItineraryItemCard
 * - 시간 편집(시작/종료), 삭제 UI를 제공하는 카드
 * - onSetTimes/onRemove 콜백을 전달하면 제어형으로 동작
 * - 콜백이 없으면 내부에서 리덕스 디스패치를 사용(fallback)
 */
export default function ItineraryItemCard({
  item,
  dateKey,
  index,
  onSetTimes, // (startTime, endTime) => void
  onRemove, // () => void
  disabled = false,
}) {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const popRef = useRef(null);

  const displayName =
    item?.placeName || item?.name || item?.title || "이름 없음";
  const badge = typeof index === "number" ? index + 1 : undefined;

  const timeLabel = useMemo(() => {
    const s = item?.startTime;
    const e = item?.endTime;
    if (s && e) return `${s} - ${e}`;
    if (s) return `${s} - ?`;
    if (e) return `? - ${e}`;
    return "시간 미정";
  }, [item?.startTime, item?.endTime]);

  // 팝오버 바깥 클릭 시 닫기
  useEffect(() => {
    const onDocClick = (e) => {
      if (!timeOpen) return;
      if (popRef.current && !popRef.current.contains(e.target))
        setTimeOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [timeOpen]);

  // Esc로 팝오버 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setTimeOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const applyTimes = ({ startTime, endTime }) => {
    if (disabled) return;
    if (typeof onSetTimes === "function") {
      onSetTimes(startTime, endTime);
    } else {
      dispatch(
        setTimesAction({ dateKey, entryId: item.entryId, startTime, endTime })
      );
    }
    setTimeOpen(false);
    setMenuOpen(false);
  };

  const removeThis = () => {
    if (disabled) return;
    if (typeof onRemove === "function") {
      onRemove();
    } else {
      dispatch(removeItemAction({ dateKey, entryId: item.entryId }));
    }
    setMenuOpen(false);
  };

  return (
    <div
      className={`itin-item relative ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
      role="group"
      aria-label={displayName}
    >
      <div className="itin-item__left">
        {badge != null && <span className="itin-item__badge">{badge}</span>}

        <div className="itin-item__content">
          <div className="itin-item__title" title={displayName}>
            {displayName}
          </div>

          <div className="itin-item__meta">
            {item?.category && (
              <span className="itin-item__category">{item.category}</span>
            )}
            {item?.category && (
              <span className="itin-item__dot" aria-hidden>
                ·
              </span>
            )}
            <button
              type="button"
              className="itin-item__timebtn"
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                setTimeOpen((v) => !v);
                setMenuOpen(false);
              }}
              title="시간 편집"
            >
              {timeLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="itin-item__right">
        <button
          className="itin-item__menuBtn"
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) return;
            setMenuOpen((v) => !v);
            setTimeOpen(false);
          }}
          aria-label="메뉴"
        >
          ⋮
        </button>

        {menuOpen && !disabled && (
          <div className="itin-item__menu" onClick={(e) => e.stopPropagation()}>
            <div className="itin-menu-list">
              <button
                className="itin-menu-item"
                onClick={() => {
                  setTimeOpen(true);
                  setMenuOpen(false);
                }}
              >
                시간 편집
              </button>
              <button className="itin-menu-item danger" onClick={removeThis}>
                삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {timeOpen && !disabled && (
        <div
          ref={popRef}
          className="absolute right-0 top-8 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <TimeEditor
            initialStart={item?.startTime ?? ""}
            initialEnd={item?.endTime ?? ""}
            onConfirm={applyTimes}
            onCancel={() => setTimeOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
