// src/features/wishPlace/ui/WishPlaceCard.jsx
import { FaThumbsUp } from 'react-icons/fa';
import './wishAddButton.css'; // 스타일 파일에서 공통 버튼 스타일 사용 가능

export default function WishPlaceCard({ place }) {
  const { placeName, placeImg, likeCount } = place;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1.5px solid royalblue',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '12px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#fff',
      }}
    >
      <img
        src={placeImg}
        alt={placeName}
        style={{
          width: '54px',
          height: '54px',
          objectFit: 'cover',
          borderRadius: '8px',
          marginRight: '10px',
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
          {placeName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#555' }}>
          <FaThumbsUp style={{ marginRight: '4px' }} />
          {likeCount}명이 추천했어요
        </div>
      </div>
    </div>
  );
}
