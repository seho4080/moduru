import PlaceSearchCard from './PlaceSearchCard';
import './placeSearchList.css';

export default function PlaceSearchList({ places, roomId }) {
  return (
    <div className="card-grid">
      {places.map((place) => (
        <PlaceSearchCard
          key={place.placeId}
          place={place}
          roomId={roomId}
        />
      ))}
    </div>
  );
}
