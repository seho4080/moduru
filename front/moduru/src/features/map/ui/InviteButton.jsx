// src/features/map/ui/InviteButton.jsx
import React from 'react';
import './MapControls.css';
import { LuLink } from 'react-icons/lu'; // ✅ 새 아이콘 (클립 아이콘)

export default function InviteButton({ onClick }) {
  return (
    <button className="map-btn" onClick={onClick}>
      <LuLink className="map-icon" />
      <span>초대</span>
    </button>
  );
}
