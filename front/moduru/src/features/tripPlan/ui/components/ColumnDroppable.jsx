// src/features/itinerary/ui/components/ColumnDroppable.jsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";

export default function ColumnDroppable({ dateKey, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${dateKey}` });
  return (
    <div
      ref={setNodeRef}
      className={isOver ? "outline outline-2 outline-indigo-300" : ""}
      style={{ minHeight: 24 }}
    >
      {children}
    </div>
  );
}
