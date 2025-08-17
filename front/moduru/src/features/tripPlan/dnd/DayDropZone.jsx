import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addPlaceToDay, moveItem } from "../../../redux/slices/itinerarySlice";
import ItineraryItemCard from "../ui/ItineraryItemCard";   // ✅ 경로 주의
import "./DayDropZone.css";

export default function DayDropZone({ date, items = [], className = "" }) {
  const dispatch = useDispatch();
  const [isOver, setIsOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isOver) setIsOver(true);
  };
  const onDragLeave = () => setIsOver(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsOver(false);

    const json = e.dataTransfer.getData("application/json");
    if (!json) return;
    const data = JSON.parse(json);
    if (data?.type !== "PLACE" || !data.place) return;

    // placeId가 반드시 포함되어야 함
    dispatch(addPlaceToDay({ date, place: data.place }));
  };

  // 카드에서 드래그 시작
  const handleDragStart = (idx) => setDragIdx(idx);

  // 카드에서 드롭
  const handleDropOnItem = (toIdx) => {
    if (dragIdx !== null && dragIdx !== toIdx) {
      dispatch(moveItem({ dateKey: date, fromIdx: dragIdx, toIdx }));
    }
    setDragIdx(null);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`day-dropzone${isOver ? " dragover" : ""} ${className}`}  // ✅ 상위 className 반영
      aria-label={`${date} 드롭존`}
    >
      {items.length ? (
        <div className="day-dropzone-list">
          {items.map((item, idx) => (
            <div
              key={item.entryId || `${item.id}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={() => handleDropOnItem(idx)}
            >
              <ItineraryItemCard
                item={item}
                dateKey={date}
                index={idx}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="day-dropzone-empty">장소를 드래그해서 담아주세요.</div>
      )}
    </div>
  );
}
