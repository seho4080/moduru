// src/features/wishPlace/ui/WishAddButton.jsx

import { useSelector } from 'react-redux';
import { useAddWishPlace } from '../model/useWishToggle';
import './wishAddButton.css';
import store from '../../../redux/store';

export default function WishAddButton({ place, roomId }) {
  const { addWishPlace } = useAddWishPlace();
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  // NOTE: 저장된 placeId는 객체이므로 .id로 비교
  const isAlreadyWished = wishPlaces.some(
    (p) => Number(p.placeId.id) === Number(place.placeId)
  );

  const handleClick = async () => {
    if (isAlreadyWished) {
      alert('이미 공유된 장소입니다.');
      return;
    }

    // NOTE: place 객체 전체를 addWishPlace에 넘김
    const { success, message } = await addWishPlace(roomId, place);

    if (success) {
      alert(`'${place.placeName}'이 희망 장소에 추가되었어요.`);

      // NOTE: 디버깅용 상태 확인
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
      {isAlreadyWished ? '공유됨' : '공유'}
    </button>
  );
}
