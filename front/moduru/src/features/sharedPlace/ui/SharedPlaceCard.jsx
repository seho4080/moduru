import React, { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
/**
 * place: sharedPlaceSlice 요소 (최상위에 placeName/imgUrl/category/lat/lng/wantId 등)
 */
export default function SharedPlaceCard({ place, onRemove }) {
  const { placeName, imgUrl, category, likeCount, voteCnt } = place;
  const count = typeof likeCount === "number" ? likeCount : voteCnt ?? 0;
  const hasLikes = count > 0;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative mb-3 flex h-[90px] max-w-[300px] items-center gap-3 rounded-xl border-[1.5px] border-[#4169e1] bg-white p-2">
      <div className="relative">
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
          />
        )}

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

      <div className="relative flex flex-1 flex-col justify-end">
        <div className="absolute right-[10px] top-[6px] flex items-center gap-1">
          {hasLikes ? (
            <>
              <FaHeart className="text-[20px] text-red-500" />
              <span className="text-[13px] font-medium text-slate-800">
                {count}
              </span>
            </>
          ) : (
            <FaRegHeart className="text-[20px] text-slate-400" />
          )}
        </div>

        <div>
          <div className="mb-[2px] text-[13px] font-medium text-slate-600">
            {category}
          </div>
          <div className="max-w-[170px] truncate text-[16px] font-bold">
            {placeName}
          </div>
        </div>
      </div>
    </div>
  );
}
