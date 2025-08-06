// src/entities/place/ui/PlaceSearchCard.jsx
import './PlaceSearchCard.css';
import { useWishToggle } from '../../../features/wishPlace/model/useWishToggle';
import { useSelector } from 'react-redux';
import LikedPlaceButton from '../../../features/LikedPlace/ui/LikedPlaceButton';

export default function PlaceSearchCard({ place, roomId, onHover, onHoverOut }) {
  const { placeImg, placeName, category, latitude, longitude, placeId } = place;
  const { toggleWishPlace } = useWishToggle();

  const handleMouseEnter = () => {
    if (onHover) onHover({ lat: latitude, lng: longitude });
  };

  const handleMouseLeave = () => {
    if (onHoverOut) onHoverOut();
  };

  const wishPlaces = useSelector((state) => state.wishPlace.places);

  // 공유 여부 확인
  const wishedPlace = wishPlaces.find((p) => String(p.placeId) === String(placeId));
  const isAlreadyWished = Boolean(wishedPlace);

  const handleWishClick = async () => {
    if (isAlreadyWished) {
      // 삭제 요청
      const { success } = await toggleWishPlace({
        roomId,
        placeId,
        wantId: wishedPlace.wantId,
      });

      if (success) {
        alert(`'${placeName}'은(는) 공유 목록에서 삭제되었습니다.`);
      }
      return;
    }

    // 추가 요청
    const { success } = await toggleWishPlace({
      roomId,
      placeId,
      place,
      wantId: null,
    });

    if (success) {
      alert(`'${placeName}'이(가) 희망 장소로 공유되었습니다.`);
    }
  };

  return (
    <div
      className="place-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="place-card-img-wrapper">
        <img src={placeImg} alt={placeName} className="place-img" />
        <div className="wish-button-wrapper">
          <button className="wish-add-btn" onClick={handleWishClick}>
            {isAlreadyWished ? '삭제' : '공유'}
          </button>
        </div>
      </div>

      <div className="place-info">
        <div className="place-name-line">
          <span className="place-name">{placeName}</span>
          <span className="place-category-inline">{category}</span>
        </div>

        <div className="liked-button-wrapper">
          <LikedPlaceButton placeId={placeId} />
        </div>
      </div>
    </div>
  );
}
