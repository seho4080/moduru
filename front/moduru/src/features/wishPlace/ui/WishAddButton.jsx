// src/features/wishPlace/ui/WishAddButton.jsx
import { FiShare2 } from 'react-icons/fi';
import { useAddWishPlace } from '../model/useWishToggle';
import { useSelector } from 'react-redux';
import './WishAddButton.css';

export default function WishAddButton({ place, roomId }) {
  const { addWishPlace } = useAddWishPlace();

  const wishPlaces = useSelector((state) => state.wishPlace.places);

  // ✅ 콘솔 로그: 현재 상태와 place 정보 출력
  console.log('🟡 현재 wishPlaces:', wishPlaces);
  console.log('🟡 현재 클릭된 place:', place);

  const isAlreadyWished = wishPlaces.some(
    (p) => String(p.placeId) === String(place.placeId)
  );

  console.log('🟢 isAlreadyWished 결과:', isAlreadyWished);

  const handleAddWish = async () => {
    if (isAlreadyWished) {
      alert(`'${place.placeName}'은(는) 이미 공유된 장소입니다.`);
      return;
    }

    const { success, message } = await addWishPlace(roomId, place.placeId);

    if (success) {
      alert(`'${place.placeName}'이 희망장소에 추가되었어요!`);
    } else {
      alert(`추가 실패: ${message}`);
    }
  };

  return (
    <button
      onClick={handleAddWish}
      title="희망장소에 추가"
      className="wish-add-btn"
    >
      공유
    </button>
  );
}
