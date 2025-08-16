// src/features/myTravelSpace/ui/MyTravelToolbar.jsx
import React from "react";

export default function MyTravelToolbar({
  q,
  onChangeQ,
  status,
  onChangeStatus,
}) {
  return (
    <div className="travel-toolbar">
      {/* <div className="toolbar-title">나의 여행 기록</div> */}

      <div className="toolbar-left">
        <input
          className="toolbar-search"
          type="text"
          value={q}
          onChange={(e) => onChangeQ(e.target.value)}
          aria-label="여행 검색"
        />
      </div>

      <div className="toolbar-right">
        <div className="select-wrap">
          <select
            className="toolbar-select"
            value={status}
            onChange={(e) => onChangeStatus(e.target.value)}
            aria-label="상태로 정렬"
          >
            <option value="all">전체</option>
            <option value="ongoing">진행중</option>
            <option value="done">완료</option>
          </select>
        </div>
      </div>
    </div>
  );
}
