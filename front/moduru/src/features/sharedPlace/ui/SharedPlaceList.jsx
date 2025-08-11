// src/features/sharedPlace/ui/SharedPlaceList.jsx
import { useSelector } from "react-redux";
import SharedPlaceCard from "./SharedPlaceCard";

export default function SharedPlaceList({ onRemove }) {
  const sharedPlaces = useSelector((s) => s.sharedPlace.sharedPlaces);
  console.log(
    "[SharedPlaceList] sharedPlaces:",
    sharedPlaces?.length,
    sharedPlaces
  );

  if (!sharedPlaces?.length) {
    return (
      <div className="text-sm text-slate-500">공유된 장소가 없습니다.</div>
    );
  }

  return (
    <div className="space-y-3">
      {sharedPlaces.map((place) => (
        <SharedPlaceCard
          key={place.wantId ?? `${place.placeId}-${place.lat}-${place.lng}`}
          place={place}
          onRemove={() => onRemove?.(place)}
        />
      ))}
    </div>
  );
}
