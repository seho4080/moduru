// NOTE: 래퍼 카드 제거 → 흰색 칸 사라짐
import DayDropZone from "../dnd/DayDropZone";
import ItineraryItemCard from "./ItineraryItemCard";

export default function ItineraryDayCard({ dateKey, items }) {
  return (
    <DayDropZone
      date={dateKey}
      items={items}
      className="h-full min-h-0 w-full"
      // ...renderItem 등 기타 props...
    />
  );
}
