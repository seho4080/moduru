// src/entities/place/ui/PlaceCard.jsx
import './PlaceCard.css';

export default function PlaceCard({ place }) {
  const { placeImg, placeName, category } = place;

  return (
    <div className="place-card">
      <img src={placeImg} alt={placeName} className="place-img" />
      <div className="place-info">
        <div className="place-name">{placeName}</div>
        <div className="place-category">{category}</div>
      </div>
    </div>
  );
}
