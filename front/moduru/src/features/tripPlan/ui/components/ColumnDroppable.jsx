// src/features/itinerary/ui/components/ColumnDroppable.jsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";

export default function ColumnDroppable({ 
  dateKey, 
  children, 
  width, 
  itemCount,
  onDragOver,
  onDrop 
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${dateKey}` });
  
  // 카드 개수에 따라 높이 조정
  const getColumnHeight = () => {
    if (itemCount === 0) return 80; // 빈 컬럼 기본 높이
    if (itemCount <= 2) return 120; // 1-2개 카드
    if (itemCount <= 4) return 200; // 3-4개 카드
    return 300; // 5개 이상 카드
  };
  
  return (
    <div
      ref={setNodeRef}
      className={isOver ? "outline outline-2 outline-indigo-300" : ""}
      style={{ 
        minHeight: getColumnHeight(),
        width: width || 'auto',
        minWidth: width || 'auto'
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}
