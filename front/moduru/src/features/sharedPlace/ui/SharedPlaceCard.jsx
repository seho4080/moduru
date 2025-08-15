// src/features/sharedPlace/ui/SharedPlaceCard.jsx
import React, { useState, useRef, useMemo, useEffect } from "react";
import { FaHeart, FaRegHeart, FaCheckCircle } from "react-icons/fa";

export default function SharedPlaceCard({
  place,
  onRemove,
  onHeartClick,
  showVote = true,
  showAddress = true,
  showTimeInputs = false,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  cardWidth,
  isDraggable = true,
  enableTimePopover = false,
  onConfirmTimes,
  /** ✅ 새로 추가: 일정에 이미 포함되었는지 */
  usedInItinerary = false,
}) {
  const { placeName, imgUrl, category, address, likeCount, voteCnt } =
    place ?? {};
  const count =
    typeof likeCount === "number"
      ? likeCount
      : typeof voteCnt === "number"
      ? voteCnt
      : 0;
  const hasLikes = count > 0;

  const [imgError, setImgError] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const dragPreviewRef = useRef(null);

  const validImgSrc = useMemo(() => {
    if (!imgUrl) return null;
    const s = String(imgUrl).trim();
    return s.length ? s : null;
  }, [imgUrl]);

  // 시간 팝오버 상태(보드에서만 사용)
  const [openTime, setOpenTime] = useState(false);
  const [localStart, setLocalStart] = useState(startTime ?? "");
  const [localEnd, setLocalEnd] = useState(endTime ?? "");
  const startInputRef = useRef(null);

  useEffect(() => {
    if (openTime) {
      setLocalStart(startTime ?? "");
      setLocalEnd(endTime ?? "");
      setTimeout(() => startInputRef.current?.focus(), 0);
    }
  }, [openTime, startTime, endTime]);

  const timeLabel =
    (startTime && endTime && `${startTime} - ${endTime}`) ||
    (startTime && `${startTime} - ?`) ||
    (endTime && `? - ${endTime}`) ||
    "시간 미정";

  const confirmTimes = () => {
    onConfirmTimes?.(localStart, localEnd);
    setOpenTime(false);
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmTimes();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpenTime(false);
    }
  };

  // 네이티브 드래그(외부→보드)
  const handleDragStart = (e) => {
    const payload = { type: "PLACE", place };
    const body = JSON.stringify(payload);
    e.dataTransfer.setData("application/json", body);
    e.dataTransfer.setData("text/plain", body);
    e.dataTransfer.effectAllowed = "copy";

    if (dragPreviewRef.current && validImgSrc) {
      const ghost = dragPreviewRef.current;
      e.dataTransfer.setDragImage(ghost, ghost.width / 2, ghost.height / 2);
    }
    setGrabbed(true);
  };
  const handleDragEnd = () => setGrabbed(false);

  const dragProps = isDraggable
    ? {
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        "aria-grabbed": grabbed ? "true" : "false",
        role: "listitem",
      }
    : {};

  // ✅ 일정 포함 시 강조 스타일
  const usedClasses = usedInItinerary
    ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200"
    : "border-slate-200";

  return (
    <div
      className={`relative mb-3 flex h-[82px] items-center gap-3 rounded-xl border-[1.5px] bg-white p-2 ${usedClasses}
        ${isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      style={{ width: cardWidth ? `${cardWidth}px` : undefined }}
      {...dragProps}
      title={
        usedInItinerary
          ? "이미 일정에 포함된 장소입니다."
          : isDraggable
          ? "일정 보드로 드래그해 담을 수 있습니다."
          : undefined
      }
      aria-label={usedInItinerary ? "일정 포함됨" : undefined}
    >
      {/* 드래그 프리뷰용 투명 이미지 */}
      {isDraggable && validImgSrc && (
        <img
          ref={dragPreviewRef}
          src={validImgSrc}
          alt=""
          className="pointer-events-none absolute opacity-0"
          width={80}
          height={60}
        />
      )}

      {/* 좌상단 리본 배지: 일정 포함 */}
      {usedInItinerary && (
        <div className="absolute -left-1 -top-1 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-[2px] text-[10px] font-semibold text-white shadow">
          <FaCheckCircle className="h-3 w-3" />
          <span>일정 포함</span>
        </div>
      )}

      {/* 좋아요 */}
      {showVote && (
        <button
          type="button"
          onClick={() => onHeartClick?.(place)}
          className="absolute right-[8px] top-[6px] z-10 inline-flex h-5 w-5 items-center justify-center"
          aria-label="좋아요"
          title="좋아요"
          data-nodrag
        >
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            {hasLikes ? (
              <FaHeart className="absolute inset-0 m-auto h-5 w-5 text-red-500" />
            ) : (
              <FaRegHeart className="absolute inset-0 m-auto h-5 w-5 text-slate-400" />
            )}
            <span
              className={`relative text-[10px] font-semibold leading-none ${
                hasLikes ? "text-white" : "text-slate-400"
              }`}
              style={{ transform: "translateY(0.5px)" }}
            >
              {count}
            </span>
          </span>
        </button>
      )}

      {/* 썸네일 */}
      <div className="relative flex-shrink-0">
        {imgError || !validImgSrc ? (
          <div className="flex aspect-[4/3] w-[88px] items-center justify-center rounded-md bg-slate-100 text-[11px] text-slate-500">
            이미지 없음
          </div>
        ) : (
          <img
            src={validImgSrc}
            alt={placeName ? `${placeName} 이미지` : "장소 이미지"}
            className="aspect-[4/3] w-[88px] rounded-md object-cover"
            onError={() => setImgError(true)}
            draggable={false}
          />
        )}

        {/* 삭제 */}
        <button
          type="button"
          onClick={() => onRemove?.(place)}
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[11px] font-bold leading-none hover:bg-gray-50 border-gray-300 text-slate-600 opacity-90 hover:opacity-100"
          aria-label="삭제"
          title="삭제"
          data-nodrag
        >
          ×
        </button>
      </div>

      {/* 텍스트 + 메타 */}
      <div className="flex min-w-0 flex-1 flex-col justify-start pt-[8px]">
        <span className="text-[14px] font-semibold leading-[1.2] line-clamp-2 break-words">
          {placeName ?? "이름 없음"}
        </span>

        {/* 카테고리 + 시간 라벨(보드에서만) */}
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-600">
          {category && <span className="truncate">{category}</span>}
          {enableTimePopover && (
            <div className="relative inline-flex items-center" data-nodrag>
              <button
                type="button"
                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
                onClick={() => setOpenTime((v) => !v)}
                title="시간 편집"
              >
                {(startTime && endTime && `${startTime} - ${endTime}`) ||
                  (startTime && `${startTime} - ?`) ||
                  (endTime && `? - ${endTime}`) ||
                  "시간 미정"}
              </button>

              {openTime && (
                <div
                  className="absolute top-full right-0 z-10 mt-1 w-[220px] rounded-md border border-slate-200 bg-white p-2 shadow"
                  data-nodrag
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap">
                      <span>시작</span>
                      <input
                        ref={startInputRef}
                        type="time"
                        className="h-7 w-[96px] rounded border border-slate-300 px-2 text-[11px] leading-none"
                        value={localStart}
                        onChange={(e) => setLocalStart(e.target.value)}
                        onKeyDown={handleTimeKeyDown}
                        draggable={false}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap">
                      <span>종료</span>
                      <input
                        type="time"
                        className="h-7 w-[96px] rounded border border-slate-300 px-2 text-[11px] leading-none"
                        value={localEnd}
                        onChange={(e) => setLocalEnd(e.target.value)}
                        onKeyDown={handleTimeKeyDown}
                        draggable={false}
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                      onClick={() => setOpenTime(false)}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="rounded bg-indigo-600 px-2 py-1 text-[11px] text-white hover:bg-indigo-700"
                      onClick={confirmTimes}
                    >
                      확인(Enter)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 주소 */}
        {showAddress && (
          <div
            className="text-[11px] text-slate-500 mt-0.5 truncate"
            title={address || ""}
          >
            주소
          </div>
        )}

        {/* (옵션) 기존 인라인 시간 입력 */}
        {showTimeInputs && (
          <div className="mt-1 flex items-center gap-2" data-nodrag>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap">
              <span>시작</span>
              <input
                type="time"
                className="h-6 w-[84px] shrink-0 rounded border border-slate-300 px-2 text-[11px] leading-none"
                value={startTime || ""}
                onChange={(e) => onStartTimeChange?.(e.target.value)}
                draggable={false}
              />
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap">
              <span>종료</span>
              <input
                type="time"
                className="h-6 w-[84px] shrink-0 rounded border border-slate-300 px-2 text-[11px] leading-none"
                value={endTime || ""}
                onChange={(e) => onEndTimeChange?.(e.target.value)}
                draggable={false}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
