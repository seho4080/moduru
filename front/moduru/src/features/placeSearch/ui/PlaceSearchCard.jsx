// src/features/placeSearch/ui/PlaceSearchCard.jsx

import './placeSearchCard.css';
import { useDispatch } from 'react-redux';
import { setSelectedPlace, setPinCoords } from '../../../redux/slices/mapSlice';
import LikedPlaceButton from '../../likedPlace/ui/LikedPlaceButton';
import WishAddButton from '../../wishPlace/ui/WishAddButton';

export default function PlaceSearchCard({ place, roomId }) {
  const dispatch = useDispatch();
  const { placeImg, placeName, category, latitude, longitude } = place;

  const handleClick = () => {
    dispatch(setSelectedPlace(place));
    dispatch(setPinCoords({ lat: latitude, lng: longitude }));
  };

  return (
    <div className="place-card" onClick={handleClick}>
      <div className="place-card-img-wrapper">
        <img src={placeImg} alt={placeName} className="place-img" />
        <div className="wish-button-wrapper">
          <WishAddButton place={place} roomId={roomId} />
        </div>
      </div>

      <div className="place-info">
        <div className="place-name-line">
          <span className="place-name">{placeName}</span>
          <span className="place-category-inline">{category}</span>
        </div>

        <div className="liked-button-wrapper">
          <LikedPlaceButton place={place} />
        </div>
      </div>
    </div>
  );
}
