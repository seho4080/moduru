import { useSelector } from 'react-redux';
import { useAddWishPlace } from '../model/useWishToggle';
import './wishAddButton.css';
import store from '../../../redux/store';

export default function WishAddButton({ place, roomId }) {
  const { addWishPlace } = useAddWishPlace();
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  const isAlreadyWished = wishPlaces.some(
    (p) => String(p.placeId) === String(place.placeId)
  );

  const handleClick = async () => {
    if (isAlreadyWished) return;

    const { success, message } = await addWishPlace(roomId, place); 

    if (success) {
      alert(`'${place.placeName}'이 희망 장소에 추가되었어요.`);
      const currentState = store.getState().wishPlace.places;
      console.log('[현재 wishPlace 상태]', currentState);
    } else {
      alert(`추가 실패: ${message}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`wish-add-btn ${isAlreadyWished ? 'disabled' : ''}`}
      disabled={isAlreadyWished}
    >
      {isAlreadyWished ? '공유' : '공유'}
    </button>
  );
}
