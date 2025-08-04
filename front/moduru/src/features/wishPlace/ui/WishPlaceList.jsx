// src/features/wishPlace/ui/WishPlaceList.jsx
import { useSelector } from 'react-redux';
import WishPlaceCard from './WishPlaceCard';

export default function WishPlaceList() {
  const wishPlaces = useSelector((state) => state.wishPlace.places);

  return (
    <div>
      {wishPlaces.map((place) => (
        <WishPlaceCard key={place.wantId} place={place} />
      ))}
    </div>
  );
}
