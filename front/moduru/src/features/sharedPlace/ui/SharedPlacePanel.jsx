// src/features/sharedPlace/ui/SharedPlacePanel.jsx
import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SharedPlaceList from "./SharedPlaceList";
import { useRemoveSharedPlace } from "../model/useRemoveSharedPlace";

// 일정표 패널 열기 → Sidebar가 2-칼럼로 렌더
import { openItineraryModal } from "../../../redux/slices/uiSlice";

// ✅ AI 일정 추천
import {
  openAiModal,
  applyAiStarted,
} from "../../../redux/slices/aiScheduleSlice";
import { requestAiSchedule } from "../../aiSchedule/lib/aiScheduleApi";

// ✅ 소켓 구독
import useAiSchedule from "@/features/aiSchedule/model/useAiSchedule";

// ✅ 항상 마운트
import AiScheduleModal from "@/features/aiSchedule/ui/AiScheduleModal";

const PANEL_WIDTH = 280; // SidebarPanel의 공유 패널 고정폭과 일치

export default function SharedPlacePanel({ roomId }) {
  const dispatch = useDispatch();
  const { removeSharedPlace } = useRemoveSharedPlace();

  // 🔔 여기서 단 한 번만 소켓 구독됨
  useAiSchedule(roomId);

  // 제목에 총 개수 표시용
  const sharedPlaces = useSelector((s) => s.sharedPlace.sharedPlaces) || [];

  // 여행 시작/종료일 (여행일수 계산용)
  const trip = useSelector((s) => s.tripRoom);
  const travelDays = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const s = new Date(trip.startDate);
    const e = new Date(trip.endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.max(1, Math.floor((e - s) / 86400000) + 1);
  }, [trip?.startDate, trip?.endDate]);

  // ✅ 선택 모드 토글 (버튼 눌러야 활성화)
  const [selectMode, setSelectMode] = useState(false);

  // 선택 상태는 패널이 소유(리스트는 Controlled)
  const [selectedWantIds, setSelectedWantIds] = useState([]);

  const minCount = travelDays * 1;
  const maxCount = travelDays * 10;
  const count = selectedWantIds.length;
  const inRange = count >= minCount && count <= maxCount;

  const handleRemove = (place) => {
    if (!place?.wantId) return;
    removeSharedPlace(roomId, place.wantId);
  };

  const handleRunAi = async () => {
    if (!roomId || !inRange) return;

    // ✅ 낙관적 STARTED 노출 + 모달 오픈
    dispatch(
      applyAiStarted({
        msg: {
          jobId: null,
          days: travelDays,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    dispatch(openAiModal());

    // ✅ 실제 추천 요청
    try {
      await requestAiSchedule(roomId, selectedWantIds, travelDays);
    } catch (e) {
      console.error("[AI Schedule] request error", e);
    }
  };

  // AI 버튼 클릭 동작
  const handleAiButtonClick = () => {
    // 선택 모드가 아니면 모드만 켬 (선택 시작)
    if (!selectMode) {
      setSelectMode(true);
      return;
    }
    // 선택 모드고, 개수 충족 시 실제 실행
    if (inRange) {
      handleRunAi();
    }
  };

  // 선택 취소
  const handleCancelSelect = () => {
    setSelectedWantIds([]);
    setSelectMode(false);
  };

  const aiButtonDisabled = selectMode ? !inRange || !roomId : false;

  return (
    <div
      className="flex h-full flex-col"
      style={{ width: PANEL_WIDTH, minWidth: PANEL_WIDTH }}
    >
      {/* ✅ 항상 마운트 → STARTED 수신 즉시 모달 노출 */}
      <AiScheduleModal />

      {/* ───────── 헤더 ───────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-slate-800 tracking-tight">
              희망장소
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              총 {sharedPlaces.length}개
            </div>
          </div>
        </div>

        {/* 선택 모드 안내 배너 */}
        {selectMode && (
          <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800 border border-amber-100">
            일정 추천에 포함할 장소를 선택하세요.
          </div>
        )}
      </div>

      {/* ───────── 리스트 영역 ───────── */}
      <div className="flex-1 overflow-y-auto px-0 pt-2">
        <SharedPlaceList
          selectMode={selectMode}
          selectedWantIds={selectedWantIds}
          onChangeSelected={setSelectedWantIds}
          onRemove={handleRemove}
        />
      </div>

      {/* ───────── 하단 액션 풋터 ───────── */}
      <div className="border-t border-slate-200 px-4 py-3 bg-white sticky bottom-0">
        {/* 선택 모드일 때만 카운트 표시 */}
        {selectMode && (
          <div className="mb-2 text-xs text-slate-700">
            선택: <b>{count}</b>개
            <div className="text-[11px] text-slate-500">
              (필요: {minCount}~{maxCount}개)
            </div>
          </div>
        )}

        <div
          className={`${
            selectMode ? "grid grid-cols-3" : "grid grid-cols-2"
          } gap-2`}
        >
          {/* 일정표 담기 (상시 노출) */}
          <button
            type="button"
            onClick={() => dispatch(openItineraryModal())}
            className="rounded-lg bg-[#4169e1] px-2 py-2 text-xs font-semibold text-white hover:brightness-95 active:brightness-90"
          >
            <span className="flex flex-col items-center leading-tight">
              <span>일정표</span>
              <span>담기</span>
            </span>
          </button>

          {selectMode ? (
            <>
              {/* 선택 취소 */}
              <button
                type="button"
                onClick={handleCancelSelect}
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                title="선택을 모두 취소하고 선택 모드를 종료합니다"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>선택</span>
                  <span>취소</span>
                </span>
              </button>

              {/* 일정 추천 시작 */}
              <button
                type="button"
                onClick={handleAiButtonClick}
                disabled={aiButtonDisabled}
                className="rounded-lg bg-black px-2 py-2 text-xs font-semibold text-white hover:brightness-95 active:brightness-90 disabled:opacity-50"
                title={
                  !inRange ? `선택 개수: ${minCount}~${maxCount}개` : undefined
                }
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>일정 추천</span>
                  <span>시작</span>
                </span>
              </button>
            </>
          ) : (
            // 평상시: AI 일정 추천
            <button
              type="button"
              onClick={handleAiButtonClick}
              className="rounded-lg bg-black px-2 py-2 text-xs font-semibold text-white hover:brightness-95 active:brightness-90"
            >
              <span className="flex flex-col items-center leading-tight">
                <span>AI 일정</span>
                <span>추천</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
