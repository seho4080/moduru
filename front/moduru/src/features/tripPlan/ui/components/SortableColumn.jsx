// src/features/tripPlan/ui/components/SortableColumn.jsx
import React, { useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableColumn({
  id,
  children,
  width, // ex) 280 또는 '280px'
  itemCount = 0,
  onCardClick, // (미사용) 기존 시그니처 보존
  selectedPinId, // (미사용) 기존 시그니처 보존
  isSelected = false,
  onDaySelect,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // 높이 가이드
  const minHeight =
    itemCount === 0 ? 80 : itemCount <= 2 ? 120 : itemCount <= 4 ? 200 : 300;

  const w = width ?? "auto";

  // 단일 style 객체(중복 style prop 제거)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: w,
    minWidth: w,
    minHeight,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: isDragging ? "none" : "auto",
    touchAction: "none", // 모바일 드래그 안정화
    background: isSelected ? "rgba(59,130,246,0.06)" : "#ffffff",
    border: `1px solid ${isSelected ? "#60a5fa" : "#e5e7eb"}`, // #60a5fa ~ blue-400, #e5e7eb ~ slate-200
    borderRadius: 12,
    boxShadow: isDragging
      ? "0 8px 24px rgba(0,0,0,0.12)"
      : isSelected
      ? "0 0 0 3px rgba(147,197,253,0.6)" // ring-ish
      : "none",
  };

  const handleClick = useCallback(
    (e) => {
      // 드래그 중 클릭 무시
      if (isDragging) return;
      if (onDaySelect) {
        e.stopPropagation();
        onDaySelect();
      }
    },
    [isDragging, onDaySelect]
  );

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      data-dragging={isDragging ? "true" : "false"}
      aria-pressed={isSelected}
    >
      {children}
    </div>
  );
}
