// src/features/reviewWrite/ui/SelectBox.jsx
import React from "react";

export default function SelectBox({ id, label, description, onClick, disabled, isOpen }) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={
        "group w-full rounded-xl border px-4 text-left transition " +
        "focus:outline-none focus:ring-2 focus:ring-blue-300 " +
        (disabled ? "cursor-not-allowed border-gray-200 bg-gray-50" : "hover:border-gray-400")
      }
      style={{ minHeight: "3.75rem" }}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      <div className="flex items-center justify-between py-3">
        <div>
          <div className={`text-[15px] ${disabled ? "text-gray-400" : "text-gray-800"}`}>
            {label}
          </div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
        {/* ▼ / ▲ 아이콘 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 ${disabled ? "text-gray-300" : "text-gray-500"} transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </button>
  );
}
