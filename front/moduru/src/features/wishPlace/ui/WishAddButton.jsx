// src/features/wishPlace/ui/WishAddButton.jsx

import { useSelector } from 'react-redux';
import { useAddWishPlace } from '../model/useWishToggle';
import './wishAddButton.css';
import store from '../../../redux/store';

export default function WishAddButton({ place, roomId }) {
  const { addWishPlace } = useAddWishPlace();
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  // NOTE: 이미 공유된 장소인지 확인
  const isAlreadyWished = wishPlaces.some(
    (p) => String(p.placeId) === String(place.placeId)
  );

  const handleClick = async () => {
    if (isAlreadyWished) return;

    const { success, message } = await addWishPlace(roomId, place.placeId);

    if (success) {
      alert(`'${place.placeName}'이 희망 장소에 추가되었어요.`);

      // NOTE: 상태 디버깅용 로그 출력
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
