// src/features/aiRoute/ui/AiPlaceCard.jsx
import React from "react";
import SharedPlaceCard from "./SharedPlaceCard";

/**
 * 추천 결과의 leg 데이터를 SharedPlaceCard에서 사용할 수 있는 place 형태로 변환
 */
function transformLegToPlace(leg) {
  return {
    placeName: leg.placeName || "이름 없음",
    imgUrl: leg.placeImg || null,
    category: leg.category || null,
    address: leg.address || null,
         likeCount: 0, // 추천에서는 좋아요 수 없음
    voteCnt: 0,
         // 추천 고유 정보
    wantId: leg.wantId,
    eventOrder: leg.eventOrder,
    nextTravelTime: leg.nextTravelTime,
  };
}

export default function AiPlaceCard({
  leg,
  dayNumber,
  showOrder = true,
  showTravelTime = true,
  onAddToItinerary,
  usedInItinerary = false,
  responsive = true,
  ...sharedPlaceCardProps
}) {
  const place = transformLegToPlace(leg);

  return (
    <div className="relative">
             {/* 추천 전용 정보 표시 */}
      <div className="flex items-center gap-2 mb-2">
        {showOrder && (
          <div className="flex items-center gap-1.5">
            <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
              {leg.eventOrder || 1}
            </div>
            <span className="text-xs sm:text-sm text-slate-600 font-medium">
              {dayNumber}일차
            </span>
          </div>
        )}

        {/* 다음 장소까지 이동시간 */}
        {showTravelTime && leg.nextTravelTime && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>다음까지 {Math.round(leg.nextTravelTime)}분</span>
          </div>
        )}
      </div>

      {/* SharedPlaceCard 재사용 */}
      <SharedPlaceCard
        place={place}
                 showVote={false} // 추천에서는 좋아요 기능 비활성화
        showAddress={true}
        isDraggable={false} // 개별 카드는 드래그 비활성화
        usedInItinerary={usedInItinerary}
        responsive={responsive}
                 onRemove={null} // 추천에서는 삭제 버튼 비활성화
        {...sharedPlaceCardProps}
      />

      {/* 일정에 추가 버튼 (우하단) - X 표시 제거했으므로 삭제 */}
    </div>
  );
}
