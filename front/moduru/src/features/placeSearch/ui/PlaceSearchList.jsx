// src/features/placeSearch/ui/PlaceSearchList.jsx
import PlaceSearchCard from "./PlaceSearchCard";
import "./placeSearchList.css";

export default function PlaceSearchList({ places = [], roomId }) {
  if (!Array.isArray(places) || places.length === 0) {
    return <div className="empty">표시할 장소가 없습니다.</div>;
  }

  return (
    <div className="card-grid">
      {places.map((place) => (
        <PlaceSearchCard
          key={place.placeId} // 서버가 int placeId 보장
          place={place}
          roomId={roomId}
        />
      ))}
    </div>
  );
}
