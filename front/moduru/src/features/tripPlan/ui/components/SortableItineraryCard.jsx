// src/features/itinerary/ui/components/SortableItineraryCard.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SharedPlaceCard from "../../../sharedPlace/ui/SharedPlaceCard";

export default function SortableItineraryCard({
  item,
  dateKey,
  onRemove,
  onConfirmTimes,
  cardWidth = 240,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.85 : 1,
    width: cardWidth,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
      data-entry="card"
      data-date={dateKey}
      {...attributes}
      {...listeners}
    >
      <SharedPlaceCard
        place={item}
        showVote={false}
        showAddress={false}
        isDraggable={false}
        enableTimePopover
        startTime={item?.startTime ?? ""}
        endTime={item?.endTime ?? ""}
        onConfirmTimes={(s, e) => onConfirmTimes?.(s, e)}
        onRemove={onRemove}
        cardWidth={cardWidth}
      />
    </div>
  );
}
