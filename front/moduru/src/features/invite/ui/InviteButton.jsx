import React from 'react';
import "../../map/ui/mapControls.css";
import { LuLink } from 'react-icons/lu';

export default function InviteButton({ onClick }) {
  // NOTE: 사용자에게 초대 링크 공유 기능을 제공하기 위한 버튼
  return (
    <button className="map-btn" onClick={onClick}>
      <LuLink className="map-icon" />
      <span>초대</span>
    </button>
  );
}
