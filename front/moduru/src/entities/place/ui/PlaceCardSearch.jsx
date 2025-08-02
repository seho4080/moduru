// src/entities/place/ui/PlaceCardSearch.jsx
import './PlaceCard.css';

export default function PlaceCardSearch({ place, onHover, onHoverOut }) {
  const { placeImg, placeName, category, latitude, longitude } = place;

  const handleMouseEnter = () => {
    if (onHover) {
      onHover({ lat: latitude, lng: longitude });
    }
  };

  const handleMouseLeave = () => {
    if (onHoverOut) {
      onHoverOut();
    }
  };

  return (
    <div
      className="place-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img src={placeImg} alt={placeName} className="place-img" />
      <div className="place-info">
        <div className="place-name">{placeName}</div>
        <div className="place-category">{category}</div>
      </div>
    </div>
  );
}
