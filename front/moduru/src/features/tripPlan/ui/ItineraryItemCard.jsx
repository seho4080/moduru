// src/features/itinerary/ui/ItineraryItemCard.jsx
import { useDispatch } from "react-redux";
import { useMemo, useState } from "react";
import { setStayMinutes, removeItem } from "../../../redux/slices/itinerarySlice";
import "./ItineraryItemCard.css";
import { nanoid } from "@reduxjs/toolkit";

/**
 * props:
 * - item: {
 *     entryId?, id?, placeId?,
 *     placeName?, name?, title?,
 *     category?, startTime?, endTime?, stayMinutes?
 *   }
 * - dateKey: 'YYYY-MM-DD'
 * - index: 0-based
 */
export default function ItineraryItemCard({ item, dateKey, index }) {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stayOpen, setStayOpen] = useState(false); // 사용 중이면 유지

  // 시간 지정용 식별자(네 코드 그대로)
  const targetId = item.entryId ?? item.id ?? item.placeId;

  // 표시용 이름: placeName 우선
  const displayName = item.placeName || item.name || item.title || "이름 없음";

  const badge = index + 1;

  const timeLabel = useMemo(() => {
    if (item.startTime && item.endTime) return `${fmt(item.startTime)}-${fmt(item.endTime)}`;
    if (typeof item.stayMinutes === "number") return `머무는 시간: ${item.stayMinutes}분`;
    return "시간 미정";
  }, [item.startTime, item.endTime, item.stayMinutes]);

  const onPickStay = (minutes) => {
    dispatch(setStayMinutes({ dateKey, itemId: targetId, minutes })); // number | null
    setStayOpen(false);
    setMenuOpen(false);
  };

  // ✅ 삭제는 placeId 우선
  const handleRemove = () => {
    dispatch(removeItem({ dateKey, entryId: item.entryId }));
    setMenuOpen(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      const place = JSON.parse(data);
      // 항상 고유한 entryId 생성
      place.entryId = nanoid();
      dispatch(addPlaceToDay({ date, place }));
    }
  };

  return (
    <div className="itin-item">
      <div className="itin-item__left">
        <span className="itin-item__badge">{badge}</span>

        {/* 내용 컨테이너 */}
        <div className="itin-item__content">
          <div className="itin-item__title" title={displayName}>{displayName}</div>

          {/* 메타: 카테고리(파랑) + 시간(회색) 한 줄 */}
          <div className="itin-item__meta">
            {item.category && <span className="itin-item__category">{item.category}</span>}
            {item.category && <span className="itin-item__dot" aria-hidden>·</span>}
            <span className="itin-item__time">{timeLabel}</span>
          </div>
        </div>
      </div>

      <div className="itin-item__right">
        <button
          className="itin-item__menuBtn"
          onClick={() => { setMenuOpen(v => !v); setStayOpen(false); }}
          aria-label="메뉴"
        >⋮</button>

        {menuOpen && (
          <div className="itin-item__menu">
            <div className="itin-menu-list">
              <button className="itin-menu-item" onClick={() => setStayOpen(v => !v)}>시간</button>
              <button className="itin-menu-item danger" onClick={handleRemove}>삭제</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(t) {
  if (typeof t === "string") return t;
  const h = String(t.getHours()).padStart(2, "0");
  const m = String(t.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
