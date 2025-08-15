import React from "react";
import { useDispatch, useSelector } from "react-redux";
import useAiRoute from "../model/useAiRoute";

/**
 * Props:
 * - roomId: string|number
 * - day: number           // 몇 일차 버튼인지
 * - placeList: number[]   // 해당 일차의 wantId 배열
 * - onApply?: (legs) => void  // 결과 적용(일정표 갱신) 콜백 (선택)
 *
 * 사용: 일차 카드 헤더에 이 버튼을 꽂아주세요.
 */
export default function AiRouteDayButton({ roomId, day, placeList, onApply }) {
  const dispatch = useDispatch();
  const { runAiRoute } = useAiRoute(roomId);

  const routeState = useSelector((s) => s.aiRoute);
  const legsForDay = useSelector((s) => s.aiRoute.routesByDay?.[day] ?? []);
  const isBusy =
    routeState.status === "STARTED" || routeState.status === "PROGRESS";

  const handleClick = async () => {
    if (!Array.isArray(placeList) || placeList.length === 0) {
      alert("해당 일차에 장소가 없습니다.");
      return;
    }
    await runAiRoute(day, placeList);
  };

  const handleApply = () => {
    // 🔧 여기서 실제 일정표(다른 slice)에 반영하도록 연결하세요.
    // 예) dispatch(tripPlanSlice.setDayOrder({ day, legs: legsForDay }));
    // 혹은 콜백으로 외부에서 처리:
    onApply?.(legsForDay);
  };

  return (
    <div className="flex items-center gap-8">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white ${
          isBusy
            ? "bg-slate-400 cursor-not-allowed"
            : "bg-black hover:brightness-95 active:brightness-90"
        }`}
        title="이 일차의 장소들로 AI 경로를 추천합니다"
      >
        {isBusy ? "경로 추천 중..." : `AI 경로 추천 (${day}일차)`}
      </button>

      {/* 상태/결과 요약 */}
      {routeState.status === "ERROR" && (
        <span className="text-red-600 text-sm">
          {routeState.message || "오류"}
        </span>
      )}
      {routeState.status === "INVALIDATED" && (
        <span className="text-amber-600 text-sm">
          {routeState.message || "무효화됨"}
        </span>
      )}
      {routeState.status === "DONE" && legsForDay.length > 0 && (
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
          title="추천 결과를 이 일차에 적용"
        >
          이 경로 적용
        </button>
      )}
    </div>
  );
}
