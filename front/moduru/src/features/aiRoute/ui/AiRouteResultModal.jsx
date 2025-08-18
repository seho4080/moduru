// src/features/aiRoute/ui/AiRouteDayModalButton.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import useAiRoute from "../../aiRoute/model/useAiRoute";
import {
  selectAiRouteStatus,
  selectRouteByDay,
} from "../../../redux/slices/aiRouteSlice";
import { setOrderForDate } from "../../../redux/slices/itinerarySlice";
import { publishSchedule } from "../../webSocket/scheduleSocket";

// 단순 유틸
const byEventOrder = (a, b) =>
  (Number(a?.eventOrder) || 0) - (Number(b?.eventOrder) || 0);

export default function AiRouteDayModalButton({ day, dateKey }) {
  const dispatch = useDispatch();
  const roomId = useSelector((s) => s.tripRoom?.roomId);
  const aiStatus = useSelector(selectAiRouteStatus);
  const legs = useSelector(selectRouteByDay(day), shallowEqual); // [{wantId, eventOrder, ...}]
  const hasLegs = Array.isArray(legs) && legs.length > 0;

  // 해당 일자의 현재 placeId 리스트(최소 2개여야 요청 가능)
  const events = useSelector((s) => s.itinerary?.days?.[dateKey] || []);
  const placeList = useMemo(
    () =>
      (events || [])
        .filter((e) => e?.wantId != null)
        .map((e) => Number(e.wantId))
        .filter(Number.isFinite),
    [events]
  );

  const { preflightAndMaybeStart, runAiRoute } = useAiRoute(roomId);

  const [open, setOpen] = useState(false);
  const [busyLocal, setBusyLocal] = useState(false);
  const [preflightMode, setPreflightMode] = useState(null); // 'resumed-running'|'restored-done'|'started-new'|'idle'

  const openAndPreflight = useCallback(async () => {
    if (!roomId) return;
    if (!Number.isFinite(day)) return;

    // 모달 먼저 오픈 (상태 변화 시각적으로 보여주기)
    setOpen(true);
    setBusyLocal(true);
    try {
      // 스냅샷 보고: 진행중이면 이어받고, DONE이면 복원, 아니면 신규 시작
      const r = await preflightAndMaybeStart(day, placeList, {
        autoStartIfIdle: true,
      });
      setPreflightMode(r?.mode || null);

      if (!r?.ok && r?.error) {
        alert(r.error);
      }
    } finally {
      setBusyLocal(false);
    }
  }, [roomId, day, placeList, preflightAndMaybeStart]);

  const onApply = useCallback(() => {
    if (!hasLegs || !dateKey || !roomId) return;
    const orderWantIds = [...legs]
      .sort(byEventOrder)
      .map((l) => Number(l.wantId));

    dispatch(setOrderForDate({ dateKey, wantOrderIds: orderWantIds }));
    publishSchedule({
      roomId,
      type: "UPDATE_ORDER",
      dateKey,
      wantOrderIds: orderWantIds,
    });

    setOpen(false);
  }, [hasLegs, legs, dateKey, roomId, dispatch]);

  const onRestart = useCallback(async () => {
    if (!roomId) return;
    if (placeList.length < 2) {
      alert("이 일차에 최소 2개 장소가 있어야 경로를 추천할 수 있어요.");
      return;
    }
    setBusyLocal(true);
    try {
      const r = await runAiRoute(day, placeList);
      if (!r?.ok) {
        const msg = r?.message || "AI 경로 요청에 실패했습니다.";
        alert(msg);
      } else {
        setPreflightMode("started-new");
      }
    } finally {
      setBusyLocal(false);
    }
  }, [roomId, day, placeList, runAiRoute]);

  const isLoading =
    busyLocal || aiStatus === "STARTED" || aiStatus === "PROGRESS";

  return (
    <>
      <button
        type="button"
        className="text-xs rounded border px-2 py-1 bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
        onClick={openAndPreflight}
        disabled={placeList.length < 2}
        title={placeList.length < 2 ? "최소 2개 장소 필요" : "AI 경로 추천"}
      >
        AI 추천
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-semibold">
                Day {day} · {dateKey} · AI 경로
              </div>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setOpen(false)}
                aria-label="close"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* 바디 */}
            <div className="p-4 max-h-[70vh] overflow-auto">
              {/* 진행중 */}
              {(isLoading ||
                preflightMode === "resumed-running" ||
                preflightMode === "started-new") && (
                <div className="w-full flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <div className="text-sm text-slate-700 mt-3">
                    경로 생성 중...
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    완료되면 아래에 결과가 표시됩니다.
                  </div>
                </div>
              )}

              {/* 결과 리스트 */}
              {aiStatus === "DONE" && hasLegs && (
                <div className="space-y-3">
                  {[...legs].sort(byEventOrder).map((leg, idx) => (
                    <div
                      key={`${leg?.wantId ?? "w"}-${idx}`}
                      className="p-3 rounded border border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                          {leg?.eventOrder || idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {leg?.placeName || `#${leg?.wantId}`}
                          </div>
                          <div className="mt-1 text-xs text-slate-600 space-x-2">
                            {leg?.transport && <span>🧭 {leg.transport}</span>}
                            {Number.isFinite(leg?.nextTravelTime) && (
                              <span>⏱ 다음까지 {leg.nextTravelTime}분</span>
                            )}
                          </div>
                        </div>
                        {leg?.placeImg ? (
                          <img
                            src={leg.placeImg}
                            alt={leg.placeName || "place"}
                            className="w-12 h-12 rounded object-cover border border-slate-200"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DONE인데 결과가 없을 때(드물지만) */}
              {aiStatus === "DONE" && !hasLegs && (
                <div className="text-sm text-slate-600 text-center py-6">
                  결과가 비어 있어요. 다시 생성해 보세요.
                </div>
              )}

              {/* 스냅샷 DONE 복원 케이스 안내 */}
              {preflightMode === "restored-done" && (
                <div className="mt-3 text-xs text-slate-500">
                  이전에 완료된 결과를 불러왔어요.
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {isLoading ? "생성 중..." : aiStatus}
              </div>

              <div className="flex items-center gap-2">
                {/* 다시 생성(스냅샷이 DONE일 때 유용) */}
                {!isLoading && (
                  <button
                    type="button"
                    className="text-xs rounded border px-3 py-1 bg-white border-slate-300 hover:bg-slate-50"
                    onClick={onRestart}
                  >
                    다시 생성
                  </button>
                )}

                {/* 적용 버튼: DONE + 결과 있을 때만 */}
                {aiStatus === "DONE" && hasLegs && (
                  <button
                    type="button"
                    className="text-xs rounded border px-3 py-1 bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
                    onClick={onApply}
                  >
                    추천 적용
                  </button>
                )}

                <button
                  type="button"
                  className="text-xs rounded border px-3 py-1 bg-white border-slate-300 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
