// src/features/wishPlace/ui/WishPlacePanel.jsx
import LikedPlaceList from './LikedPlaceList';

export default function LikedPlacePanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>My 장소</h2>
      <LikedPlaceList />
    </div>
  );
}