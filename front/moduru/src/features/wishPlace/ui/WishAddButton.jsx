// src/features/wishPlace/ui/WishAddButton.jsx
import { useSelector } from "react-redux";
import { useAddWishPlace } from "../model/useWishToggle";
import "./wishAddButton.css";
import store from "../../../redux/store";

export default function WishAddButton({ place, roomId }) {
  const { addWishPlace } = useAddWishPlace();
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  const placeIdToCompare =
    typeof place.placeId === "object" ? place.placeId.placeId : place.placeId;

  const isAlreadyWished = wishPlaces.some(
    (p) => Number(p.placeId.placeId) === Number(placeIdToCompare)
  );

  const handleClick = async () => {
    if (isAlreadyWished) {
      alert("이미 공유된 장소입니다.");
      return;
    }

    const { success, message } = await addWishPlace(roomId, place);

    if (success) {
      alert(`'${place.placeName}'이 희망 장소에 추가되었어요.`);
      console.log("[현재 wishPlace 상태]", store.getState().wishPlace.places);
    } else {
      alert(`추가 실패: ${message}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`wish-add-btn ${isAlreadyWished ? "disabled" : ""}`}
      disabled={isAlreadyWished}
    >
      {isAlreadyWished ? "공유됨" : "공유"}
    </button>
  );
}
