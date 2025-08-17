// src/features/aiRoute/ui/AiResultList.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import AiPlaceCard from "./AiPlaceCard";

/** 분 단위 시간을 보기 좋게 포맷 */
function formatMinutes(m) {
  const n = Number(m);
  if (!Number.isFinite(n) || n <= 0) return null;
  const h = Math.floor(n / 60);
  const mm = Math.round(n % 60);
  if (h > 0 && mm > 0) return `${h}시간 ${mm}분`;
  if (h > 0) return `${h}시간`;
  return `${mm}분`;
}

/** 미터 단위 거리를 km로 포맷 */
function formatKm(meters) {
  const m = Number(meters);
  if (!Number.isFinite(m) || m <= 0) return null;
  const km = m / 1000;
  return km >= 10 ? `${Math.round(km)}km` : `${km.toFixed(1)}km`;
}

/**
 * AI 결과 리스트
 * - 결과는 항상 렌더하고, 진행 중일 때는 로딩이 상위에서 처리됨
 * - 작은 플로팅 오버레이는 제거하고 상위 전체 로딩으로 통합
 */
export default function AiResultList({
  onAddToItinerary,
  usedPlaces = [],
  onApplyWholeSchedule,
  onApplyDaySchedule,
  onCancel, // 진행 취소 콜백(필수)
}) {
  const groups = useSelector((s) => s.aiSchedule.groups);
  const days = useSelector((s) => s.aiSchedule.days);
  const status = useSelector((s) => s.aiSchedule.status);
  const message = useSelector((s) => s.aiSchedule.message);

  // 이동시간 합계 배지용
  const etaTotals = useSelector((s) => s.eta?.totals || {});
  const getTotals = (day, transport) => etaTotals?.[day]?.[transport] || null;

  // 드래그 표시
  const [draggedDay, setDraggedDay] = useState(null);

  // 정렬된 Day 키
  const dayKeys = useMemo(
    () =>
      Object.keys(groups || {})
        .map(Number)
        .sort((a, b) => a - b),
    [groups]
  );

  // 이미 일정에 들어간 장소 여부
  const isPlaceUsed = (leg) => {
    return usedPlaces.some(
      (u) => u.wantId === leg.wantId || u.placeName === leg.placeName
    );
  };

  // 결과가 전혀 없을 때의 안내
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <div className="text-sm text-slate-600 font-medium mb-2">
        아직 추천받은 일정이 없습니다
      </div>
      <div className="text-xs text-slate-500">일정 추천을 받아보세요</div>
    </div>
  );

  return (
    <div className="w-full h-full relative">
      {/* 상단 전체 적용 버튼 */}
      {dayKeys.length > 0 && onApplyWholeSchedule && (
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-4">
          <button
            type="button"
            onClick={() => {
              onApplyWholeSchedule(groups);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            전체 일정 적용하기
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {dayKeys.length}일{" "}
              {dayKeys.reduce(
                (total, d) => total + (groups[d]?.length || 0),
                0
              )}
              곳
            </span>
          </button>
        </div>
      )}

      {/* 본문 */}
      <div className="p-4 space-y-4">
        {dayKeys.length === 0
          ? renderEmpty()
          : dayKeys.map((day) => {
            const legs = groups[day] ?? [];
            const driving = getTotals(day, "driving");
            const transit = getTotals(day, "transit");

            return (
              <div
                key={day}
                className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${draggedDay === day ? "opacity-50 scale-95 rotate-1" : ""
                  }`}
                draggable={true}
                onDragStart={(e) => {
                  setDraggedDay(day);
                  const payload = {
                    type: "DAY_SCHEDULE",
                    day: day,
                    places: legs.map((leg) => ({
                      type: "PLACE",
                      place: {
                        placeName: leg.placeName || "이름 없음",
                        imgUrl: leg.placeImg || null,
                        category: leg.category || null,
                        address: leg.address || null,
                        likeCount: 0,
                        voteCnt: 0,
                        wantId: leg.wantId,
                        eventOrder: leg.eventOrder,
                        nextTravelTime: leg.nextTravelTime,
                      },
                    })),
                  };
                  const body = JSON.stringify(payload);
                  e.dataTransfer.setData("application/json", body);
                  e.dataTransfer.setData("text/plain", body);
                  e.dataTransfer.effectAllowed = "copy";

                  const dragImage = e.currentTarget.cloneNode(true);
                  dragImage.style.transform = "rotate(2deg)";
                  dragImage.style.opacity = "0.8";
                  dragImage.style.pointerEvents = "none";
                  dragImage.style.position = "absolute";
                  dragImage.style.top = "-1000px";
                  dragImage.style.left = "-1000px";
                  dragImage.style.width = e.currentTarget.offsetWidth + "px";
                  document.body.appendChild(dragImage);

                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetX = rect.width / 2;
                  const offsetY = rect.height / 2;
                  e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

                  setTimeout(() => {
                    if (document.body.contains(dragImage)) {
                      document.body.removeChild(dragImage);
                    }
                  }, 0);
                }}
                onDragEnd={() => setDraggedDay(null)}
                title="일정 보드로 드래그해서 하루 전체 일정을 추가할 수 있습니다"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                      <h3 className="text-base font-semibold text-slate-800">
                        {day}일차
                      </h3>
                      <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded-full">
                        {legs.length}곳
                      </span>
                    </div>

                    {onApplyDaySchedule && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyDaySchedule(day, legs);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="이 날 일정만 적용"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        적용
                      </button>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {driving && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border border-slate-200">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 13l2-5.5A2 2 0 017 6h10a2 2 0 011.9 1.4L21 13m-2 4h-1a2 2 0 01-2-2v0H8v0a2 2 0 01-2 2H5m3-3h8"
                            />
                          </svg>
                          <span>
                            {formatMinutes(driving.totalDurationMinutes) ||
                              "-"}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span>
                            {formatKm(driving.totalDistanceMeters) || "-"}
                          </span>
                        </span>
                      )}
                      {transit && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border border-slate-200">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 16V6a3 3 0 013-3h6a3 3 0 013 3v10M6 12h12M7 19h2m6 0h2M6 16h12v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1z"
                            />
                          </svg>
                          <span>
                            {formatMinutes(transit.totalDurationMinutes) ||
                              "-"}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span>
                            {formatKm(transit.totalDistanceMeters) || "-"}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {legs.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-8">
                      이 날에는 추천된 장소가 없습니다
                    </div>
                  ) : (
                    legs.map((leg, idx) => (
                      <AiPlaceCard
                        key={`${leg?.wantId ?? "want"}-${idx}`}
                        leg={leg}
                        dayNumber={day}
                        showOrder={true}
                        showTravelTime={idx < legs.length - 1}
                        onAddToItinerary={onAddToItinerary}
                        usedInItinerary={isPlaceUsed(leg)}
                        responsive={true}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* 에러/무효화 표시는 결과가 전혀 없을 때만 중간 안내로 노출한다 */}
      {(status === "ERROR" || status === "FAILED") && dayKeys.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-red-800 mb-1">
              일정 생성 실패
            </div>
            <div className="text-xs text-red-700">
              {message || "오류가 발생했습니다."}
            </div>
          </div>
        </div>
      )}
      {status === "INVALIDATED" && dayKeys.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-amber-800 mb-1">
              작업이 무효화됨
            </div>
            <div className="text-xs text-amber-700">
              {message || "이전 작업이 무효화되었습니다. 다시 실행해주세요."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
