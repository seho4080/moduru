// src/features/tripPlan/ui/components/SortableColumn.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableColumn({ 
  id, 
  children, 
  width, 
  itemCount,
  onCardClick,
  selectedPinId,
  isSelected,
  onDaySelect
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: width || 'auto',
    minWidth: width || 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  // 카드 개수에 따라 높이 조정
  const getColumnHeight = () => {
    if (itemCount === 0) return 80;
    if (itemCount <= 2) return 120;
    if (itemCount <= 4) return 200;
    return 300;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex-shrink-0 rounded-lg border bg-white cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg' : ''
      } ${
        isSelected 
          ? 'border-blue-400 bg-blue-50/40 ring-2 ring-blue-200' 
          : 'border-slate-200'
      }`}
      style={{
        ...style,
        minHeight: getColumnHeight(),
      }}
      onClick={(e) => {
        // 드래그 중이 아닐 때만 클릭 이벤트 처리
        if (!isDragging && onDaySelect) {
          e.stopPropagation();
          onDaySelect();
        }
      }}
    >
      {children}
    </div>
  );
}
