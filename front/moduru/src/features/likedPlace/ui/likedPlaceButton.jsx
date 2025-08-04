// src/features/LikedPlace/ui/LikedPlaceButton.jsx
import { useSelector } from 'react-redux';
import { FaStar, FaRegStar } from 'react-icons/fa';
import useLikedToggle from '../model/useLikedToggle';
import './likedPlaceButton.css';

export default function LikedPlaceButton({ placeId }) {
  const isLiked = useSelector((state) =>
    state.likedPlace.likedPlaceIds.includes(placeId)
  );
  const { toggleLikedPlace } = useLikedToggle();

  // NOTE: 좋아요 여부에 따라 버튼 UI와 기능을 전환함
  return (
    <button
      onClick={() => toggleLikedPlace(placeId)}
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
