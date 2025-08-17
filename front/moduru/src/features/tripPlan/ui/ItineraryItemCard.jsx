// src/features/tripPlan/ui/ItineraryItemCard.jsx
import React, { useState } from "react";
import SharedPlaceCard from "../../sharedPlace/ui/SharedPlaceCard";
import { useDispatch } from "react-redux";
import { removeItem, updateMemo, updateTime } from "../../../redux/slices/itinerarySlice";

export default function ItineraryItemCard({ item, day, index, onCardClick }) {
  const dispatch = useDispatch();
  const [memo, setMemo] = useState(item.memo || "");

  /** 메모 저장 */
  const handleMemoChange = (e) => {
    const value = e.target.value;
    setMemo(value);
    dispatch(updateMemo({ day, index, memo: value }));
  };

  /** 시작 시간 변경 */
  const handleStartTimeChange = (value) => {
    dispatch(updateTime({ day, index, startTime: value }));
  };

  /** 종료 시간 변경 */
  const handleEndTimeChange = (value) => {
    dispatch(updateTime({ day, index, endTime: value }));
  };

  /** 아이템 삭제 */
  const handleRemove = () => {
    dispatch(removeItem({ day, index }));
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "8px",
        overflow: "hidden",
      }}
    >
      <SharedPlaceCard
        place={item}
        startTime={item.startTime || ""}
        endTime={item.endTime || ""}
        onStartTimeChange={handleStartTimeChange}
        onEndTimeChange={handleEndTimeChange}
        onCardClick={onCardClick}
        showVote={false} // 투표 버튼 숨김
        showAddress={false} // 주소 숨김
        showTimeInputs={true} // 시간 입력 활성화
      />

      {/* 메모 입력 영역 */}
      <div style={{ padding: "8px" }}>
        <textarea
          placeholder="메모를 입력하세요"
          value={memo}
          onChange={handleMemoChange}
          style={{
            width: "100%",
            minHeight: "40px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "13px",
            resize: "vertical",
          }}
        />
      </div>

      {/* 삭제 버튼 */}
      <div style={{ textAlign: "right", padding: "0 8px 8px" }}>
        <button
          onClick={handleRemove}
          style={{
            backgroundColor: "#f87171",
            border: "none",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
