// src/features/wishPlace/ui/WishPlaceCard.jsx

import { FaHeart, FaRegHeart } from 'react-icons/fa';
import './wishAddButton.css';

export default function WishPlaceCard({ place, onRemove }) {
  const { placeName, placeImg, category, likeCount } = place.placeId;
  const hasLikes = likeCount > 0;

  return (
    <div
      style={{
        display: 'flex',
        border: '1.5px solid royalblue',
        borderRadius: '12px',
        padding: '8px',
        position: 'relative',
        backgroundColor: '#fff',
        maxWidth: '300px',
        height: '90px',
        marginBottom: '12px',
      }}
    >
      <div style={{ position: 'relative', marginRight: '12px' }}>
        <img
          src={placeImg}
          alt="장소 이미지"
          style={{
            width: '100px',
            aspectRatio: '4 / 3',
            objectFit: 'cover',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '';
            e.target.alt = '장소 이미지';
            e.target.style.fontSize = '12px';
            e.target.style.display = 'flex';
            e.target.style.alignItems = 'center';
            e.target.style.justifyContent = 'center';
            e.target.style.textAlign = 'center';
          }}
        />

        <button
          onClick={() => onRemove(place)}
          style={{
            position: 'absolute',
            top: '-6px',
            left: '-6px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {hasLikes ? (
            <>
              <FaHeart style={{ color: 'red', fontSize: '20px' }} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                {likeCount}
              </span>
            </>
          ) : (
            <FaRegHeart style={{ color: '#aaa', fontSize: '20px' }} />
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: '13px',
              color: '#555',
              fontWeight: '500',
              marginBottom: '2px',
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '170px',
            }}
          >
            {placeName}
          </div>
        </div>
      </div>
    </div>
  );
}

