// src/features/placeSearch/ui/PlaceSearchCard.jsx
import "./placeSearchCard.css";
import { useDispatch } from "react-redux";
import { setSelectedPlace, setPinCoords } from "../../../redux/slices/mapSlice";
import LikedPlaceButton from "../../likedPlace/ui/LikedPlaceButton";
import SharedToggleButton from "../../sharedPlace/ui/SharedToggleButton";
import { useMemo, useState } from "react";

/*
NOTE: 썸네일이 없거나 로딩 실패 시 플레이스홀더를 중앙 정렬로 노출해 레이아웃 안정성을 유지한다.
*/
export default function PlaceSearchCard({ place, roomId }) {
  const dispatch = useDispatch();
  const { placeImg, placeName, category, latitude, longitude } = place;

  const [imgError, setImgError] = useState(false);

  // NOTE: 다양한 형태의 이미지 소스 대응
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
    <div className="place-card" onClick={handleClick}>
      <div className="place-card-img-wrapper">
        {(!imgUrl || imgError) ? (
          <div className="place-detail-modal-img-empty">이미지 없음</div>
        ) : (
          <img
            src={imgUrl}
            alt={placeName}
            className="place-img"
            onError={() => setImgError(true)}
          />
        )}

        <div
          className="wish-button-wrapper"
          onClick={(e) => e.stopPropagation()}
        >
          <SharedToggleButton
            roomId={roomId}
            placeId={
              typeof place.placeId === "object"
                ? place.placeId.placeId
                : place.placeId
            }
            placeName={place.placeName || place.name}
          />
        </div>
      </div>

      <div className="place-info">
        <div className="place-name-line">
          <span className="place-name">{placeName}</span>
          <span className="place-category-inline">{category}</span>
        </div>

        <div
          className="liked-button-wrapper"
          onClick={(e) => e.stopPropagation()}
        >
          <LikedPlaceButton place={place} />
        </div>
      </div>
    </div>
  );
}
