// src/features/wishPlace/ui/WishPlacePanel.jsx
import WishPlaceList from './WishPlaceList';

export default function WishPlacePanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>나의 희망 장소</h2>
      <WishPlaceList />
    </div>
  );
}
