import { useSelector } from 'react-redux';
import { useAddWishPlace } from '../model/useWishToggle';
import './wishAddButton.css';

export default function WishAddButton({ place, roomId }) {
  const { addWishPlace } = useAddWishPlace();
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  const isAlreadyWished = wishPlaces.some(
    (p) => String(p.placeId) === String(place.placeId)
  );

  const handleClick = async () => {
    if (isAlreadyWished) {
      alert(`'${place.placeName}'은(는) 이미 공유된 장소입니다.`);
      return;
    }

    const { success, message } = await addWishPlace(roomId, place.placeId);

    if (success) {
      alert(`'${place.placeName}'이 희망 장소에 추가되었어요.`);
    } else {
      alert(`추가 실패: ${message}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      title="희망 장소에 추가"
      className="wish-add-btn"
    >
      공유
    </button>
  );
}
