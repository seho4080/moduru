// src/features/pin/ui/EditButton.jsx
import React from "react";
import "./editButton.css"; // 버튼 스타일

export default function EditButton({ onClick }) {
  return (
    <button
      className="edit-location-btn"
      onClick={onClick}
    >
      편집
    </button>
  );
}
