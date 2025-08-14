// src/features/likedPlace/ui/LikedPlaceButton.jsx
import { FaStar, FaRegStar } from "react-icons/fa";
import useLikedToggle from "../model/useLikedToggle";

export default function LikedPlaceButton({ place }) {
  const { isLiked, toggleLikedPlace } = useLikedToggle();
  const liked = isLiked(place.placeId);

  const onClick = async (e) => {
    e.stopPropagation();
    await toggleLikedPlace(place); // 낙관적 업데이트+롤백 포함
  };

  return (
    <button
      onClick={onClick}
      className="bg-transparent border-none cursor-pointer p-0 text-lg"
    >
      {liked ? (
        <FaStar className="text-yellow-400" />
      ) : (
        <FaRegStar className="text-white" />
      )}
    </button>
  );
}
