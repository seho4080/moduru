// src/features/sharedPlace/ui/SharedPlaceCard.jsx
import React, { useState, useRef, useMemo } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

export default function SharedPlaceCard({ place, onRemove, onHeartClick }) {
  const { placeName, imgUrl, category, address, likeCount, voteCnt } =
    place ?? {};

  // 좋아요/투표 수 집계
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

  /**
   * 이미지 src 정규화
   * - 빈 문자열("")은 null로 처리하여 <img src=""> 경고를 방지한다.
   */
  const validImgSrc = useMemo(() => {
    if (!imgUrl) return null;
    const s = String(imgUrl).trim();
    return s.length ? s : null;
  }, [imgUrl]);

  /**
   * 드래그 시작: dataTransfer에 카드 데이터를 JSON으로 담는다.
   * - application/json이 비어 나가는 환경을 대비하여 text/plain에도 동일 내용 설정
   * - effectAllowed는 copy (외부로 복사/추가하는 UX)
   */
  const handleDragStart = (e) => {
    const payload = { type: "PLACE", place };
    const body = JSON.stringify(payload);

    // 호환성 확보: 두 타입 모두 설정
    e.dataTransfer.setData("application/json", body);
    e.dataTransfer.setData("text/plain", body);
    e.dataTransfer.effectAllowed = "copy";

    // 프리뷰 이미지 설정(있을 때만)
    if (dragPreviewRef.current && validImgSrc) {
      const ghost = dragPreviewRef.current;
      e.dataTransfer.setDragImage(ghost, ghost.width / 2, ghost.height / 2);
    }
    setGrabbed(true);
  };

  /** 드래그 종료 시 aria-grabbed 리셋 */
  const handleDragEnd = () => setGrabbed(false);

  /** 하트/삭제 버튼: 드래그 제스처와 충돌 방지 */
  const stop = (e) => e.stopPropagation();

  const handleHeartClick = (e) => {
    stop(e);
    onHeartClick?.(place);
  };

  const handleRemoveClick = (e) => {
    stop(e);
    onRemove?.(place);
  };

  return (
    <div
      className="relative mb-3 flex h-[90px] max-w-[300px] items-center gap-3 rounded-xl border-[1.5px] border-[#3399CC] bg-white p-2 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-grabbed={grabbed ? "true" : "false"}
      role="listitem"
      title="이 카드를 일정으로 드래그해 담을 수 있습니다."
    >
      {/* 드래그 프리뷰용 투명 이미지: 유효 src가 있을 때만 렌더 */}
      {validImgSrc && (
        <img
          ref={dragPreviewRef}
          src={validImgSrc}
          alt=""
          className="pointer-events-none absolute opacity-0"
          width={80}
          height={60}
        />
      )}

      {/* 하트 버튼 */}
      <button
        type="button"
        onMouseDown={stop}
        onClick={handleHeartClick}
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
        {imgError || !validImgSrc ? (
          <div
            className="flex aspect-[4/3] w-[100px] items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500"
            aria-label="이미지 없음"
          >
            이미지 없음
          </div>
        ) : (
          <img
            src={validImgSrc}
            alt={placeName ? `${placeName} 이미지` : "장소 이미지"}
            className="aspect-[4/3] w-[100px] rounded-md object-cover"
            onError={() => setImgError(true)}
            draggable={false} // 내부 이미지가 드래그를 가로채지 않도록
          />
        )}

        {/* 삭제 버튼 */}
        <button
          type="button"
          onMouseDown={stop}
          onClick={handleRemoveClick}
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-[12px] font-bold leading-none hover:bg-gray-50"
          aria-label="공유 취소"
          title="공유 취소"
        >
          ×
        </button>
      </div>

      {/* 텍스트 영역 */}
      <div className="flex min-w-0 flex-1 flex-col justify-start pt-[12px]">
        <div className="flex flex-wrap gap-x-1 items-baseline">
          <span className="text-[16px] font-bold break-words">
            {placeName ?? "이름 없음"}
          </span>
          {category && (
            <span className="text-[13px] font-medium text-slate-600 break-words">
              {category}
            </span>
          )}
        </div>

        {address && (
          <div className="truncate text-[12px] text-slate-500">{address}</div>
        )}
      </div>
    </div>
  );
}
