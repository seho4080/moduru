// src/features/aiRoute/ui/AiRouteDayModalButton.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAiRoute from "../model/useAiRoute";
import {
  resetAiRouteTransient,
  selectAiRouteStatus,
  selectAiRouteProgress,
  selectRouteByDay,
  makeSelectAiRouteBusyForDay,
  selectAiRoute,
} from "../../../redux/slices/aiRouteSlice";

/**
 * Props:
 * - roomId: string|number
 * - day: number           // 몇 일차 버튼인지 (1-based)
 * - placeList: number[]   // 해당 일차의 wantId 배열
 * - onApply?: (legs) => void  // 결과 적용(일정표 갱신) 콜백
 */
export default function AiRouteDayModalButton({
  roomId,
  day,
  placeList,
  onApply,
}) {
  const dispatch = useDispatch();
  const { runAiRoute } = useAiRoute(roomId);

  const aiStatus = useSelector(selectAiRouteStatus); // "IDLE" | "STARTED" | "PROGRESS" | "DONE"...
  const progress = useSelector(selectAiRouteProgress);
  const legsForDay = useSelector(selectRouteByDay(day));
  const busyForDay = useSelector(makeSelectAiRouteBusyForDay(day));
  
  // 다른 사람이 계산 중인지 확인 (전체 busy 상태에서 현재 사용자가 요청한 것이 아닌 경우)
  const aiRoute = useSelector(selectAiRoute);
  const isOtherUserCalculating = (aiStatus === "STARTED" || aiStatus === "PROGRESS") && 
    aiRoute?.lastRequestedDay !== day;
  
  // 디버깅용 로그
  console.log('AI Route Debug:', {
    day,
    aiStatus,
    lastRequestedDay: aiRoute?.lastRequestedDay,
    lastStatusDay: aiRoute?.lastStatusDay,
    isOtherUserCalculating,
    busyForDay
  });

  const [open, setOpen] = useState(false);

  // 버튼 클릭 → 모달 열고 즉시 실행
  const handleOpenAndRun = async () => {
    console.log('AI Route button clicked:', { roomId, day, placeList });
    if (!Array.isArray(placeList) || placeList.length < 2) {
      alert("이 일차에 최소 2개 장소가 있어야 경로를 추천할 수 있어요.");
      return;
    }
    setOpen(true);
    const result = await runAiRoute(day, placeList);
    console.log('AI Route result:', result);
  };

  // 모달 닫기(취소): 상태만 리셋
  const handleClose = () => {
    dispatch(resetAiRouteTransient());
    setOpen(false);
  };

  // 적용: 부모에 legs 전달 → 상태 리셋 → 닫기
  const handleApply = () => {
    if (Array.isArray(legsForDay) && legsForDay.length > 0) {
      onApply?.(legsForDay, day);
    }
    dispatch(resetAiRouteTransient());
    setOpen(false);
  };

  // DONE인데 결과 없음 → 대기/정리 상태 표기용
  const noResultYet =
    aiStatus === "DONE" && (!legsForDay || legsForDay.length === 0);

  // 버튼 라벨/상태
  const buttonLabel = busyForDay
    ? `경로 추천 중...`
    : isOtherUserCalculating
    ? `다른 사용자 계산 중...`
         : `경로 추천`;

  return (
    <>
      <button
        type="button"
        onClick={handleOpenAndRun}
        disabled={busyForDay || isOtherUserCalculating}
        className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white ${
          busyForDay
            ? "bg-slate-400 cursor-not-allowed"
            : isOtherUserCalculating
            ? "bg-orange-500 cursor-not-allowed"
            : "bg-black hover:brightness-95 active:brightness-90"
        }`}
                 title={
           busyForDay
             ? "경로 추천이 진행 중입니다"
             : isOtherUserCalculating
             ? "다른 사용자가 경로 추천을 진행 중입니다"
             : "이 일차의 장소들로 경로를 추천합니다"
         }
      >
        {buttonLabel}
      </button>

      <AiRouteResultModal
        open={open}
        day={day}
        status={aiStatus}
        progress={progress}
        legs={legsForDay}
        noResultYet={noResultYet}
        onClose={handleClose}
        onApply={handleApply}
        isOtherUserCalculating={isOtherUserCalculating}
      />
    </>
  );
}

/* ───────────────────── 모달 컴포넌트 ───────────────────── */

function AiRouteResultModal({
  open,
  day,
  status,
  progress,
  legs,
  noResultYet,
  onClose,
  onApply,
  isOtherUserCalculating,
}) {
  // 접근성: ESC close 등은 상위에서 처리해도 되고 여기서 간단히만
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isLoading = status === "STARTED" || status === "PROGRESS";
  const isError = status === "ERROR" || status === "FAILED";
  const isInvalid = status === "INVALIDATED";
  const isDone = status === "DONE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
                         <h3 className="text-base font-semibold text-slate-900">
               경로 추천 · {day}일차
             </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
              aria-label="닫기"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[70vh] overflow-auto">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-9 h-9 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="w-full max-w-sm">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, progress || 0))}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-700">
                {status === "STARTED" ? "경로 생성 시작" : "경로 구성 중"} (
                {Math.round(progress || 0)}%)
              </div>
              <div className="text-xs text-slate-500">잠시만 기다려주세요…</div>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm font-medium text-red-800 mb-1">
                경로 생성 실패
              </div>
              <div className="text-xs text-red-700">
                잠시 후 다시 시도해주세요.
              </div>
            </div>
          )}

          {isInvalid && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm font-medium text-amber-800 mb-1">
                작업이 무효화됨
              </div>
              <div className="text-xs text-amber-700">
                다른 요청으로 작업이 대체되었습니다. 다시 실행해주세요.
              </div>

            </div>
          )}

          {isOtherUserCalculating && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-sm font-medium text-orange-800 mb-1">
                다른 사용자가 계산 중
              </div>
                             <div className="text-xs text-orange-700">
                 다른 사용자가 경로 추천을 진행 중입니다. 완료될 때까지 기다려주세요.
               </div>
            </div>
          )}

          {isDone && noResultYet && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800 mb-1">
                결과 정리 중
              </div>
              <div className="text-xs text-blue-700">
                최종 결과를 정리 중입니다. 잠시 후 결과가 표시됩니다.
              </div>
            </div>
          )}

          {isDone && Array.isArray(legs) && legs.length > 0 && (
            <div className="space-y-3">
              {/* 총 이동 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-blue-800 mb-2">
                  📍 총 이동 정보
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-blue-700">
                  {(() => {
                    const totalTime = legs
                      .filter(leg => leg?.nextTravelTime && typeof leg.nextTravelTime === 'string')
                      .reduce((sum, leg) => {
                        const timeStr = leg.nextTravelTime;
                        const minutes = parseInt(timeStr.match(/(\d+)분/)?.[1] || '0');
                        return sum + minutes;
                      }, 0);
                    const totalDistance = legs
                      .filter(leg => leg?.nextTravelDistance && typeof leg.nextTravelDistance === 'string')
                      .reduce((sum, leg) => {
                        const distanceStr = leg.nextTravelDistance;
                        const km = parseFloat(distanceStr.match(/(\d+\.?\d*)km/)?.[1] || '0');
                        return sum + km;
                      }, 0);
                    
                    return (
                      <>
                        <span>총 이동시간: {totalTime > 0 ? `${totalTime}분` : '정보 없음'}</span>
                        <span>총 이동거리: {totalDistance > 0 ? `${totalDistance.toFixed(1)}km` : '정보 없음'}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              {legs.map((leg, idx) => (
                <div
                  key={`${leg?.wantId ?? "want"}-${idx}`}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      {leg?.eventOrder ?? idx + 1}
                    </div>
                    <div className="flex-shrink-0">
                      {leg?.placeImg ? (
                        <img
                          src={leg.placeImg}
                          alt={leg?.placeName || "place"}
                          className="w-12 h-12 rounded-md object-cover border border-slate-200"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-md" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {leg?.placeName || "이름 없음"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                        {leg?.transport && <span>🚗 {leg.transport}</span>}
                        {leg?.nextTravelTime && (
                          <span>⏱️ {leg.nextTravelTime}</span>
                        )}
                        {leg?.nextTravelDistance && (
                          <span>📏 {leg.nextTravelDistance}</span>
                        )}
                        {leg?.lat && leg?.lng && (
                          <span className="text-slate-500">
                            📍 {leg.lat}, {leg.lng}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 초기/결과 없음 */}
                     {!isLoading && !isError && !isInvalid && !isDone && (
             <div className="text-sm text-slate-600 py-2">
               경로 추천을 시작합니다…
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-100"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onApply}
            disabled={
              !(status === "DONE" && Array.isArray(legs) && legs.length > 0)
            }
            className={`px-3 py-1.5 text-sm rounded text-white ${
              status === "DONE" && Array.isArray(legs) && legs.length > 0
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-slate-400 cursor-not-allowed"
            }`}
            title="추천 경로를 이 일차 일정에 적용합니다"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
