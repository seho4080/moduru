// src/features/sharedPlace/ui/SharedPlacePanel.jsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import SharedPlaceList from "./SharedPlaceList";
import { useRemoveSharedPlace } from "../model/useRemoveSharedPlace";

// AI 추천 상태/요청
import {
  startNewRecommendation,
  applyAiStarted,
} from "../../../redux/slices/aiScheduleSlice";
import { requestAiSchedule } from "../../aiSchedule/lib/aiScheduleApi";

// AI 소켓 구독
import useAiSchedule from "../../aiSchedule/model/useAiSchedule";

// 결과 리스트
import AiResultList from "./AiResultList";

// 보드 반영에 필요한 액션과 발행
import {
  addPlaceToDay,
  setOrderForDate,
  removeItem,
} from "../../../redux/slices/itinerarySlice";
import { publishSchedule } from "../../webSocket/scheduleSocket";
import { publishMessage } from "../../webSocket/coreSocket";

// 일정창 열기/닫기 액션
import {
  openItineraryPanel,
  closeItineraryPanel,
} from "../../../redux/slices/uiSlice";
import DateSelectionModal from "../../tripPlan/ui/DateSelectionModal";

/** 날짜 키 포맷 변환 */
function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function SharedPlacePanel({ roomId, onCardClick }) {
  const dispatch = useDispatch();
  const { removeSharedPlace } = useRemoveSharedPlace();

  // 소켓 구독은 마운트 시 1회
  useAiSchedule(roomId);

  const sharedPlaces = useSelector((s) => s.sharedPlace.sharedPlaces) || [];
  const trip = useSelector((s) => s.tripRoom);
  const ai = useSelector((s) => s.aiSchedule);
  const { status } = ai;
  const daysMap = useSelector((s) => s.itinerary?.days || {});
  const groups = useSelector((s) => s.aiSchedule.groups || {});
  // 패널/모달 이름 혼용 대비: 우선 패널 키, 없으면 모달 키 사용
  const isItineraryOpen = useSelector(
    (s) => s.ui?.isItineraryPanelOpen ?? s.ui?.isItineraryModalOpen ?? false
  );

  // 화면 모드
  const [viewMode, setViewMode] = useState("shared"); // "shared" | "result" | "newSelection"

  // 날짜 선택 모달 상태
  const [showDateModal, setShowDateModal] = useState(false);

  // 여행일수
  const travelDays = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const s = new Date(trip.startDate);
    const e = new Date(trip.endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.max(1, Math.floor((e - s) / 86400000) + 1);
  }, [trip?.startDate, trip?.endDate]);

  // 새 추천 선택 상태
  const [selectedWantIds, setSelectedWantIds] = useState([]);
  const minCount = travelDays * 1;
  const maxCount = travelDays * 10;
  const count = selectedWantIds.length;
  const inRange = count >= minCount && count <= maxCount;

  // 기존 결과 존재 여부 및 통계
  const hasAiResults = useMemo(() => Object.keys(groups).length > 0, [groups]);
  const totalAiPlaces = useMemo(
    () =>
      Object.values(groups).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      ),
    [groups]
  );

  // 진행 시작되면 결과 화면을 보여주되, 오버레이는 AiResultList에서 띄운다
  useEffect(() => {
    if (status === "STARTED" || status === "PROGRESS") {
      setViewMode("result");
    }
  }, [status]);

  // 제거
  const handleRemove = (place) => {
    if (place?.wantId) removeSharedPlace(roomId, place.wantId);
  };

  // 희망장소 → 새 추천
  const handleStartSelect = () => {
    setViewMode("newSelection");
    setSelectedWantIds([]);
  };

  // 새 추천 화면에서 취소
  const handleCancelSelect = () => {
    setSelectedWantIds([]);
    setViewMode("shared");
  };

  // 새 추천 실행
  const handleRunAi = async () => {
    if (!roomId || !inRange) return;

    dispatch(startNewRecommendation());
    dispatch(
      applyAiStarted({
        msg: {
          jobId: null,
          days: travelDays,
          updatedAt: new Date().toISOString(),
        },
      })
    );

    setViewMode("result"); // 결과 화면으로 전환, 오버레이는 내부에서 표시

    try {
      await requestAiSchedule(roomId, selectedWantIds, travelDays);
    } catch (e) {
      console.error("[AI Schedule] request error", e);
    }
  };

  // 결과 헤더의 다시 받기 버튼
  const handleRetryFromResult = () => {
    setSelectedWantIds([]);
    setViewMode("newSelection");
  };

  // 기존 AI 결과 보기 버튼
  const handleViewExistingResults = () => {
    setViewMode("result");
  };

  // 진행 오버레이의 취소
  const handleCancelFromOverlay = () => {
    if (!roomId) return;
    publishMessage(roomId, "ai-schedule", "cancel", { roomId });
    // 취소 후 희망장소 화면으로 복귀
    setViewMode("shared");
  };

  // Day 번호를 dateKey로
  const getDateKeyForDay = useCallback(
    (dayNumber) => {
      const d = Number(dayNumber);
      if (!Number.isFinite(d) || d < 1) return null;

      if (trip?.startDate) {
        const base = new Date(trip.startDate);
        base.setDate(base.getDate() + (d - 1));
        return toDateKey(base);
      }

      const keys = Object.keys(daysMap || {}).sort((a, b) =>
        String(a).localeCompare(String(b))
      );
      return keys[d - 1] || null;
    },
    [trip?.startDate, daysMap]
  );

  // Day 적용 버튼 콜백 - 기존 장소 모두 제거 후 AI 추천으로 교체
  const handleApplyDaySchedule = useCallback(
    (dayNumber, legs) => {
      if (!roomId) return;
      if (!Array.isArray(legs) || legs.length === 0) return;

      const dateKey = getDateKeyForDay(dayNumber);
      if (!dateKey) {
        alert("적용할 날짜를 찾을 수 없습니다. 여행 날짜를 먼저 설정하세요.");
        return;
      }

      const current = daysMap[dateKey] || [];

      // 1. 기존 장소들 모두 제거
      for (let i = current.length - 1; i >= 0; i--) {
        const entryId = current[i]?.entryId;
        if (entryId != null) {
          dispatch(removeItem({ dateKey, entryId }));
        }
      }

      // 2. AI 추천 장소들 순서대로 추가
      const ordered = [...legs].sort(
        (a, b) => (a?.eventOrder ?? 0) - (b?.eventOrder ?? 0)
      );

      ordered.forEach((leg, i) => {
        const placePayload = {
          wantId: leg.wantId,
          placeName: leg.placeName || "",
          imgUrl: leg.placeImg || undefined,
          category: leg.category || "",
          address: leg.address || "",
        };
        dispatch(
          addPlaceToDay({
            dateKey, // ✅ dateKey로 통일
            place: placePayload,
            index: i,
          })
        );
      });

      // 3. 순서 확정 및 웹소켓 브로드캐스트
      const wantOrderIds = ordered
        .map((l) => Number(l.wantId))
        .filter((n) => Number.isFinite(n));

      if (wantOrderIds.length > 0) {
        dispatch(setOrderForDate({ dateKey, wantOrderIds }));

        // 웹소켓으로 다른 사용자들에게 전체 교체 알림
        publishSchedule({
          roomId,
          type: "REPLACE_DAY",
          dateKey,
          events: wantOrderIds.map((id, idx) => ({
            wantId: id,
            eventOrder: idx + 1,
          })),
        });
      }

      if (window?.toast?.success) {
        window.toast.success(
          `Day ${dayNumber} 일정을 AI 추천으로 교체했습니다.`
        );
      }
    },
    [roomId, daysMap, getDateKeyForDay, dispatch]
  );

  // 헤더 타이틀
  const headerTitle =
    viewMode === "shared"
      ? "희망장소"
      : viewMode === "result"
      ? "AI 추천 결과"
      : "새 AI 일정 추천";

  // 진행 중인지 확인
  const isLoading = status === "STARTED" || status === "PROGRESS";

  // 여행기간이 설정되어 있는지 확인
  const hasTravelDates = useMemo(() => {
    return !!(trip?.startDate && trip?.endDate);
  }, [trip?.startDate, trip?.endDate]);

  // 일정창 열기/닫기 핸들러
  const handleToggleItinerary = () => {
    if (isItineraryOpen) {
      dispatch(closeItineraryPanel());
    } else {
      if (!hasTravelDates) {
        setShowDateModal(true);
      } else {
        dispatch(openItineraryPanel());
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-slate-800 tracking-tight truncate">
              {headerTitle}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {viewMode === "shared" && `총 ${sharedPlaces.length}개`}
              {viewMode === "result" &&
                (hasAiResults
                  ? "추천받은 일정을 확인하세요"
                  : "추천 결과가 준비되는 동안 기다려주세요")}
              {viewMode === "newSelection" &&
                `선택 개수: ${count}개 · 최소 ${minCount}개, 최대 ${maxCount}개`}
            </div>
          </div>

          {/* 일정창 열기/닫기 버튼 */}
          {viewMode === "shared" && (
            <button
              type="button"
              onClick={handleToggleItinerary}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                isItineraryOpen
                  ? "border-red-300 text-red-700 hover:bg-red-50 bg-red-50/50"
                  : "border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/50"
              }`}
              title={
                isItineraryOpen
                  ? "일정 편집창을 닫습니다"
                  : "일정 편집창을 엽니다"
              }
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              {isItineraryOpen ? "일정 닫기" : "일정 열기"}
            </button>
          )}

          {viewMode === "result" && (
            <button
              type="button"
              onClick={handleRetryFromResult}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              title="장소를 선택해서 새 AI 일정을 추천받습니다"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 10-8 8"
                />
              </svg>
              AI 일정 추천 다시 받기
            </button>
          )}
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-30">
          <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="text-lg font-semibold text-slate-800">
                AI가 일정을 구성 중입니다
              </div>
            </div>

            <div className="mb-3">
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: "70%" }}
                />
              </div>
            </div>

            <div className="text-sm text-slate-600 text-center mb-4">
              최적의 여행 경로를 분석하고 있어요...
            </div>

            <button
              type="button"
              onClick={handleCancelFromOverlay}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 바디 */}
      <div className="flex-1 overflow-y-auto px-0">
        {viewMode === "shared" && (
          <SharedPlaceList
            selectMode={false}
            selectedWantIds={[]}
            onChangeSelected={() => {}}
            onRemove={handleRemove}
            onCardClick={onCardClick}
          />
        )}

        {viewMode === "result" && (
          <AiResultList
            onCancel={handleCancelFromOverlay}
            onApplyDaySchedule={handleApplyDaySchedule}
            onBackClick={() => setViewMode("shared")}
            onViewWishPlaces={() => setViewMode("shared")}
          />
        )}

        {viewMode === "newSelection" && (
          <SharedPlaceList
            selectMode={true}
            selectedWantIds={selectedWantIds}
            onChangeSelected={setSelectedWantIds}
            onRemove={handleRemove}
            onCardClick={onCardClick}
          />
        )}
      </div>

      {/* 풋터 */}
      <div className="border-t border-slate-200 px-3 py-3 sm:px-4 sm:py-4 bg-gradient-to-r from-slate-50 to-white">
        {viewMode === "shared" && (
          <div className="space-y-2">
            {/* 기존 AI 결과가 있는 경우 보기 버튼 추가 */}
            {hasAiResults && (
              <button
                type="button"
                onClick={handleViewExistingResults}
                className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white px-4 py-2.5 text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                title="이전에 받은 AI 추천 일정을 확인합니다"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>이전 AI 추천 일정 보기</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  {totalAiPlaces}곳
                </span>
              </button>
            )}

            {/* 새 AI 일정 추천 버튼 */}
            <button
              type="button"
              onClick={handleStartSelect}
              className="w-full rounded-lg bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-700 active:from-gray-900 active:to-gray-800 text-white px-4 py-3 text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              title="AI가 장소들을 분석해 일정을 추천합니다"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{hasAiResults ? "새 AI 일정 추천" : "AI 일정 추천"}</span>
              {hasAiResults && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </button>
          </div>
        )}

        {viewMode === "result" && (
          <button
            type="button"
            onClick={() => setViewMode("shared")}
            className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white px-4 py-3 text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            title="희망장소 목록으로 돌아갑니다"
          >
            희망장소 보기
          </button>
        )}

        {viewMode === "newSelection" && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancelSelect}
              className="rounded-lg border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-all duration-200"
              title="선택을 모두 취소하고 희망장소로 돌아갑니다"
            >
              선택 취소
            </button>

            <button
              type="button"
              onClick={handleRunAi}
              disabled={!inRange || !roomId}
              className="rounded-lg bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-700 active:from-gray-900 active:to-gray-800 text-white px-3 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              title={
                !inRange
                  ? `선택 개수는 최소 ${minCount}개, 최대 ${maxCount}개입니다`
                  : "선택한 장소로 AI 일정 추천을 시작합니다"
              }
            >
              <span>AI 추천</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                {count}개 선택
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 날짜 선택 모달 */}
      {showDateModal && (
        <DateSelectionModal
          roomId={roomId}
          onClose={() => setShowDateModal(false)}
        />
      )}
    </div>
  );
}
