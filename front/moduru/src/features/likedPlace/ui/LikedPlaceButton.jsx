import { useSelector, useDispatch } from 'react-redux';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { toggleLike } from '../../../redux/slices/likedPlaceSlice';
import useLikedToggle from '../model/useLikedToggle';
import './likedPlaceButton.css';

export default function LikedPlaceButton({ place }) {
  const dispatch = useDispatch();
  const isLiked = useSelector((state) =>
    state.likedPlace?.likedPlaceIds?.includes(place.placeId)
  );

  const { toggleLikedPlace } = useLikedToggle();

  const handleClick = async () => {
    const success = await toggleLikedPlace(place, isLiked); // ✅ isLiked 전달
    if (success) {
      dispatch(toggleLike(place.placeId));
    }
  };

  return (
    <button
      onClick={handleClick}
      className="liked-star-btn"
      title={isLiked ? '좋아요 취소' : '좋아요'}
    >
      {isLiked ? (
        <FaStar className="star-icon liked" />
      ) : (
        <FaRegStar className="star-icon" />
      )}
    </button>
  );
}
