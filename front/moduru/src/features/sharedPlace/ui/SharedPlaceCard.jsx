// src/features/sharedPlace/ui/SharedPlaceCard.jsx
import React, { useState, useRef } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

export default function SharedPlaceCard({ place, onRemove, onHeartClick }) {
  const { placeName, imgUrl, category, address, likeCount, voteCnt } = place;

  const count = typeof likeCount === "number" ? likeCount : voteCnt ?? 0;
  const hasLikes = count > 0;

  const [imgError, setImgError] = useState(false);
  const dragPreviewRef = useRef(null);

  // NOTE: 드래그 시작 시 카드 데이터를 dataTransfer(application/json)로 전달
  const handleDragStart = (e) => {
    const payload = { type: "PLACE", place };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";

    // NOTE: 깔끔한 드래그 프리뷰(선택) - 작은 고스트 이미지 사용
    if (dragPreviewRef.current) {
      const { current } = dragPreviewRef;
      e.dataTransfer.setDragImage(current, current.width / 2, current.height / 2);
    }
  };

  return (
    <div
      className="relative mb-3 flex h-[90px] max-w-[300px] items-center gap-3 rounded-xl border-[1.5px] border-[#3399CC] bg-white p-2 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      aria-grabbed="false"
      role="listitem"
      title="이 카드를 일정으로 드래그해 담을 수 있습니다."
    >
      {/* NOTE: 드래그 프리뷰용 투명 이미지(접근성 영향 없음) */}
      <img
        ref={dragPreviewRef}
        src={imgUrl || ""}
        alt=""
        className="pointer-events-none absolute opacity-0"
        width={80}
        height={60}
      />

      {/* 하트 버튼 */}
      <button
        type="button"
        onClick={() => onHeartClick?.(place)}
        className="absolute right-[10px] top-[8px] z-10 inline-flex h-5 w-5 items-center justify-center"
        aria-label="좋아요"
        title="좋아요"
      >
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          {hasLikes ? (
            <FaHeart className="absolute inset-0 m-auto h-5 w-5 text-red-500" />
          ) : (
            <FaRegHeart className="absolute inset-0 m-auto h-5 w-5 text-slate-400" />
          )}
          <span
            className={`relative text-[11px] font-semibold leading-none ${
              hasLikes ? "text-white" : "text-slate-400"
            }`}
            style={{ transform: "translateY(0.5px)" }}
          >
            {count}
          </span>
        </span>
      </button>

      {/* 이미지 영역 */}
      <div className="relative flex-shrink-0">
        {imgError || !imgUrl ? (
          <div className="flex aspect-[4/3] w-[100px] items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500">
            이미지 없음
          </div>
        ) : (
          <img
            src={imgUrl}
            alt="장소 이미지"
            className="aspect-[4/3] w-[100px] rounded-md object-cover"
            onError={() => setImgError(true)}
            draggable={false} // NOTE: 내부 이미지가 드래그 되지 않게 고정
          />
        )}

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => onRemove?.(place)}
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-[12px] font-bold leading-none hover:bg-gray-50"
          aria-label="공유 취소"
          title="공유 취소"
        >
          ×
        </button>
      </div>

      {/* 텍스트 영역 */}
      <div className="flex min-w-0 flex-1 flex-col justify-start pt-[12px]">
        {/* 장소명 + 카테고리 */}
        <div className="flex flex-wrap gap-x-1 items-baseline">
          <span className="text-[16px] font-bold break-words">{placeName}</span>
          <span className="text-[13px] font-medium text-slate-600 break-words">
            {category}
          </span>
        </div>

        {/* 주소 */}
        {address && (
          <div className="truncate text-[12px] text-slate-500">{address}</div>
        )}
      </div>
    </div>
  );
}
