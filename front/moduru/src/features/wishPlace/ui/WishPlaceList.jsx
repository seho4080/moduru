// src/features/wishPlace/ui/WishPlaceList.jsx
import { useSelector } from 'react-redux';
import WishPlaceCard from './WishPlaceCard';

export default function WishPlaceList() {
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  if (!wishPlaces.length) {
    return (
      <div className="text-sm text-slate-500 p-4 text-center">
        희망장소가 없습니다.
      </div>
    );
  }

  return (
    <div>
      {wishPlaces.map((place) => (
        <WishPlaceCard key={place.wantId} place={place} />
      ))}
    </div>
  );
}
