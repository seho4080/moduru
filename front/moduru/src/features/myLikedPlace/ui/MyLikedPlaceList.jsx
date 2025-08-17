import React from "react";
import LikedPlaceCard from "./MyLikedPlaceCard";
import "../css/myLikedPlaceCard.css";

export default function MyLikedPlaceList({ items = [] }) {
  if (!items.length) {
    return <div className="mlp-empty">저장된 장소가 없습니다.</div>;
  }
  return (
    <div className="mlp-list">
      {items.map((p) => (
        <LikedPlaceCard key={p.placeId ?? `${p.placeName}-${Math.random()}`} place={p} />
      ))}
    </div>
  );
}
