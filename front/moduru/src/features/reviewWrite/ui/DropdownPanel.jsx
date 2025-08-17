// src/features/reviewWrite/ui/DropdownPanel.jsx
import React from "react";

export default function DropdownPanel({ children, loading, error, emptyMessage }) {
  return (
    <div className="mt-3 rounded-xl border bg-white">
      {loading && <div className="px-4 py-6 text-sm text-gray-500">불러오는 중...</div>}
      {!loading && error && <div className="px-4 py-6 text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="max-h-64 overflow-y-auto">
          {React.Children.count(children) > 0 ? (
            children
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
