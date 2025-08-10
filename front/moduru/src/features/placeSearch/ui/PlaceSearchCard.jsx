// src/features/placeSearch/ui/PlaceSearchCard.jsx
import "./placeSearchCard.css";
import { useDispatch } from "react-redux";
import { setSelectedPlace, setPinCoords } from "../../../redux/slices/mapSlice";
import LikedPlaceButton from "../../likedPlace/ui/LikedPlaceButton";
import SharedToggleButton from "../../sharedPlace/ui/SharedToggleButton";
import { useMemo, useState } from "react";

export default function PlaceSearchCard({ place, roomId }) {
  const dispatch = useDispatch();
  const { placeImg, placeName, category, latitude, longitude } = place;
  const [imgError, setImgError] = useState(false);

  const imgUrl = useMemo(() => {
    const cand =
      placeImg ??
      place.placeImg ??
      (Array.isArray(place.placeImages) && place.placeImages[0]) ??
      "";
    if (typeof cand === "string") return cand;
    return cand?.url || cand?.imageUrl || "";
  }, [placeImg, place.placeImg, place.placeImages]);

  const handleClick = () => {
    dispatch(setSelectedPlace(place));
    dispatch(setPinCoords({ lat: latitude, lng: longitude }));
  };

  return (
    <div
      className="place-card relative" // relative 추가
      onClick={handleClick}
    >
      <div className="place-card-img-wrapper relative">
        {!imgUrl || imgError ? (
          <div className="place-detail-modal-img-empty">이미지 없음</div>
        ) : (
          <img
            src={imgUrl}
            alt={placeName}
            className="place-img"
            onError={() => setImgError(true)}
          />
        )}

        {/* 공유 + 별 버튼 묶어서 항상 오른쪽 상단 */}
        <div
          className="absolute top-2 right-2 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 공유 토글 버튼 */}
          <SharedToggleButton
            roomId={roomId}
            placeId={
              typeof place.placeId === "object"
                ? place.placeId.placeId
                : place.placeId
            }
            placeName={place.placeName || place.name}
          />

          {/* 별 버튼 */}
          <LikedPlaceButton place={place} />
        </div>
      </div>

      <div className="place-info">
        <div className="place-name-line">
          <span className="place-name">{placeName}</span>
          <span className="place-category-inline">{category}</span>
        </div>
      </div>
    </div>
  );
}
