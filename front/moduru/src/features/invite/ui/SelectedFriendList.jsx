// src/features/invite/ui/SelectedFriendList.jsx
import React from 'react';
import './selectedFriendList.css';

export default function SelectedFriendList({ items = [], onRemove }) {
  if (!items.length) return null;

  return (
    <ul className="sel-friend-list">
      {items.map(({ id, email, nickName }) => {
        const name = (nickName ?? '').trim();
        const label = name ? `${name} (${email})` : email;

        return (
          <li key={id} className="sel-friend-item">
            <span className="sel-friend-email">{label}</span>
            <button
              type="button"
              className="sel-remove-btn"
              onClick={() => onRemove?.(id)}
              aria-label={`${label} 제거`}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
