import './placeSearchCard.css';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedPlace, setPinCoords } from '../../../redux/slices/mapSlice';
import LikedPlaceButton from '../../likedPlace/ui/LikedPlaceButton';
import WishAddButton from '../../wishPlace/ui/WishAddButton'; 

export default function PlaceSearchCard({ place, roomId }) {
  const dispatch = useDispatch();
  const { placeImg, placeName, category, latitude, longitude, placeId } = place;
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  const handleClick = () => {
    console.log('[선택된 장소 좌표]', latitude, longitude);
    dispatch(setSelectedPlace(place));
    dispatch(setPinCoords({ lat: latitude, lng: longitude }));
  };

  return (
    <div
      className="place-card"
      onClick={handleClick}
    >
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
          <LikedPlaceButton placeId={placeId} />
        </div>
      </div>
    </div>
  );
}
